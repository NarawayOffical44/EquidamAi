import { NextRequest, NextResponse } from "next/server";
import { StartupProfile, ValuationMethodResult } from "@/types";
import {
  ProfessionalValuationEngine,
  ProfessionalValuationResult,
  ValuationTimeoutError,
} from "@/lib/valuation/professional-engine";
import { generateProfessionalReport } from "@/lib/valuation/report-template";
import { logger } from "@/lib/utils/logger";
import { successResponse } from "@/lib/utils/response";
import { ValidationError } from "@/lib/utils/errors";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateStartupProfile } from "@/lib/valuation/data-validator";
import { buildInputEvidenceRows, buildMethodEvidenceRows } from "@/lib/valuation/evidence-builder";
import { generateStructuredReport } from "@/lib/valuation/report-structurer";
import { normalizePlanKey, type PlanKey } from "@/lib/plans/plan-limits";
import {
  getAiLimitMessage,
  getAiUsageAccess,
  recordAiUsageUseIfAvailable,
} from "@/lib/india-finance-ai/usage-limits";

const VALUATION_METHODOLOGY_VERSION = "professional-engine-2026.1";
const VALUATION_BURST_LIMITS_PER_MINUTE: Record<PlanKey, number> = {
  free: 2,
  startup: 6,
  agency: 20,
  enterprise: 60,
};

type MethodWithWeight = ValuationMethodResult & { weight: number | null };
type StartupSnapshot = Record<string, unknown> & { id: string };
type InputTraceEntry = {
  key: string;
  label: string;
  value: unknown;
  source: string;
  confidence: number;
  present: boolean;
  verificationStatus: string;
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let requestIdempotencyKey = "";

  try {
    const body = await request.json();
    const {
      startupProfile,
      userId,
      startupId,
      inputFingerprint,
      idempotencyKey,
      inputSnapshot,
      methodologyVersion = VALUATION_METHODOLOGY_VERSION,
    } = body;
    requestIdempotencyKey = String(
      request.headers.get("idempotency-key") || idempotencyKey || ""
    ).trim();

    // Validation
    if (!startupProfile || !userId || !startupId) {
      throw new ValidationError(
        "Missing required fields: startupProfile, userId, and startupId"
      );
    }

    const profile = startupProfile as StartupProfile;

    if (!profile.companyName) {
      throw new ValidationError("Company name is required");
    }

    if (!profile.stage) {
      throw new ValidationError("Company stage is required");
    }

    const validationInput = {
      ...profile,
      arr: profile.annualRecurringRevenue || 0,
      monthly_growth_rate: profile.monthlyGrowthRate || 0,
      team_size: profile.team?.length || 0,
      total_addressable_market: profile.totalAddressableMarket || 0,
    };
    const validation = validateStartupProfile(validationInput);
    if (!validation.valid) {
      throw new ValidationError(
        `Cannot generate defensible valuation. ${validation.errors
          .map((error) => error.message)
          .join(" ")}`
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: account, error: accountError } = await supabase
      .from("users")
      .select("plan, plan_active, subscription_end_date")
      .eq("id", user.id)
      .single();

    if (accountError || !account) {
      throw new ValidationError("Account profile not found.");
    }

    const planActive = Boolean(account.plan_active) && (
      !account.subscription_end_date || new Date(account.subscription_end_date) >= new Date()
    );
    const planKey = normalizePlanKey(account.plan, planActive);
    const isFreePlan = planKey === "free";

    if (user.id !== userId) {
      throw new ValidationError("Authenticated user does not match valuation user.");
    }

    const { data: startup, error: startupError } = await supabase
      .from("startups")
      .select("*")
      .eq("id", startupId)
      .single();

    if (startupError || !startup) {
      throw new ValidationError("Startup not found.");
    }

    if (startup.user_id !== user.id) {
      throw new ValidationError("Forbidden: startup does not belong to authenticated user.");
    }

    const adminClient = createAdminClient();
    const existingValuation = await findExistingValuation(adminClient, {
      startupId,
      userId: user.id,
      inputFingerprint,
      methodologyVersion,
      idempotencyKey: requestIdempotencyKey,
    });

    if (existingValuation) {
      const processingTime = Date.now() - startTime;
      logger.info("Evaldam: Reusing existing valuation for idempotent request", {
        startupId,
        valuationId: existingValuation.id,
        userId: user.id,
      });

      return successResponse(
        {
          valuation: {
            id: existingValuation.id,
            startupId,
            persisted: true,
            reused: true,
          },
          savedValuation: existingValuation,
          reportMarkdown: existingValuation.report_data?.reportMarkdown || "",
          validation: existingValuation.data_validation_result || null,
          usage: null,
          processingTime,
          reused: true,
        },
        200,
        processingTime
      );
    }

    // Check for required fields for accurate valuation
    const isPreRevenue = profile.stage === "pre-revenue";
    const requiredFields = [
      { name: "team", label: "Team information (size, background)" },
      ...(!isPreRevenue
        ? [
            { name: "annualRecurringRevenue", label: "Annual Recurring Revenue (ARR)" },
            { name: "monthlyGrowthRate", label: "Monthly Growth Rate (%)" },
          ]
        : []),
      { name: "totalAddressableMarket", label: "Total Addressable Market (TAM)" },
    ];

    const missingFields = requiredFields.filter((field) => {
      const value = getProfileField(profile, field.name);
      return value === null || value === undefined || value === "" || value === 0;
    });

    if (missingFields.length > 0) {
      const missingLabels = missingFields.map((f) => f.label).join(", ");
      throw new ValidationError(
        `Cannot generate accurate valuation with incomplete data. Missing: ${missingLabels}. Please provide all required information to ensure a comprehensive and accurate report.`
      );
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "authenticated";
    const usageAccess = await getAiUsageAccess({
      supabase,
      sessionToken: `valuation:${startupId}`,
      ip,
      feature: "valuation_preview",
      planOverride: planKey,
      usageKeyOverride: `workspace:${startup.user_id}`,
      userIdOverride: startup.user_id,
    });
    const usageReservation = await recordAiUsageUseIfAvailable(usageAccess.key, usageAccess.usage);

    if (!usageReservation.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Valuation limit reached",
          message: getAiLimitMessage(usageReservation.usage),
          usage: usageReservation.usage,
          upgradeUrl: "/pricing?plan=startup",
        },
        { status: 429 }
      );
    }

    const burstReservation = await reserveValuationBurstSlot(user.id, planKey);
    if (!burstReservation.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Valuation requests are temporarily limited",
          message: "Too many valuation runs were started at once. Please try again in a minute.",
          resetsAt: burstReservation.resetsAt,
        },
        { status: 429 }
      );
    }

    logger.info("Evaldam: Valuation request", {
      company: profile.companyName,
      stage: profile.stage,
      userId,
    });

    // Run professional valuation engine
    const engine = new ProfessionalValuationEngine(profile, userId, {
      includeEvaldamScore: !isFreePlan,
    });
    const valuation = await engine.execute();
    const effectiveValuation = isFreePlan ? removeProprietaryScore(valuation) : valuation;
    const methodsWithWeights = effectiveValuation.methods.map((method) => ({
      ...method,
      weight: effectiveValuation.blended.methodBreakdown?.[method.methodName]?.weight ?? null,
    }));

    // Generate professional report
    const reportMarkdown = generateProfessionalReport(
      { ...effectiveValuation, methods: methodsWithWeights },
      profile
    );

    const processingTime = Date.now() - startTime;
    const processingSeconds = Math.max(1, Math.round(processingTime / 1000));
    const reportData = buildReportData({
      valuation: effectiveValuation,
      profile,
      startup,
      inputFingerprint,
      inputSnapshot,
      methodologyVersion,
      reportMarkdown,
      validation,
      processingTime,
      idempotencyKey: requestIdempotencyKey,
    });

    const planRecheck = await getCurrentPlanKey(adminClient, user.id);
    if (planRecheck !== planKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Plan changed during valuation",
          message: "Your billing access changed while the valuation was running. Refresh and run the valuation again.",
          upgradeUrl: planRecheck === "free" ? "/pricing?plan=startup" : undefined,
        },
        { status: planRecheck === "free" ? 402 : 409 }
      );
    }

    const { data: newValuation, error: valuationInsertError } = await adminClient
      .from("valuations")
      .insert({
        startup_id: startupId,
        user_id: user.id,
        blended_low_range: effectiveValuation.blended.lowRange,
        blended_high_range: effectiveValuation.blended.highRange,
        blended_weighted_average: effectiveValuation.blended.weightedAverage,
        confidence_level: effectiveValuation.confidenceLevel || "medium",
        data_completeness: effectiveValuation.dataCompleteness || 0,
        methodology_version: methodologyVersion,
        market_conditions_snapshot: reportData.marketConditionsSnapshot,
        comparable_companies: effectiveValuation.detailedAnalysis?.comparableCompanies || [],
        processing_time_seconds: processingSeconds,
        ai_model_used: effectiveValuation.generatedByModel,
        llm_provider: "evaldam-professional-engine",
        status: "completed",
        methods_results: methodsWithWeights,
        key_reasons: effectiveValuation.blended?.keyReasons || [],
        report_data: reportData,
        data_validation_result: validation,
        suspicious_flags: [],
        inputs_snapshot: inputSnapshot || profile,
        professional_review: reportData.reviewStatus,
        generated_on_tier: planKey,
        should_watermark: isFreePlan,
      })
      .select()
      .single();

    if (valuationInsertError || !newValuation) {
      throw new Error(`Failed to save valuation: ${valuationInsertError?.message || "unknown error"}`);
    }

    await persistAuditTrail(adminClient, {
      valuationId: newValuation.id,
      startupId,
      profile,
      valuation: effectiveValuation,
      methodsWithWeights,
      validation,
      inputSnapshot,
    });

    logger.info("Evaldam: Valuation complete", {
      company: profile.companyName,
      blendedValuation: effectiveValuation.blended.weightedAverage,
      confidenceLevel: effectiveValuation.confidenceLevel,
      processingTime: `${processingTime}ms`,
    });

    return successResponse(
      {
        valuation: {
          ...effectiveValuation,
          id: newValuation.id,
          startupId,
          methods: methodsWithWeights,
          persisted: true,
        },
        savedValuation: newValuation,
        reportMarkdown,
        validation,
        usage: usageReservation.usage,
        processingTime,
      },
      200,
      processingTime
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error("Evaldam: Valuation failed", { error: errorMsg, stack: error instanceof Error ? error.stack : undefined });
    const status = error instanceof ValuationTimeoutError
      ? 504
      : error instanceof ValidationError
        ? 400
        : 500;

    return NextResponse.json(
      {
        success: false,
        error: error instanceof ValuationTimeoutError ? "Valuation timed out" : "Valuation failed",
        details: errorMsg,
        retryable: error instanceof ValuationTimeoutError,
        retryAfterSeconds: error instanceof ValuationTimeoutError ? 30 : undefined,
        idempotencyKey: error instanceof ValuationTimeoutError ? requestIdempotencyKey || undefined : undefined,
        timestamp: new Date().toISOString(),
      },
      {
        status,
        headers: error instanceof ValuationTimeoutError ? { "Retry-After": "30" } : undefined,
      }
    );
  }
}

function buildReportData(params: {
  valuation: ProfessionalValuationResult;
  profile: StartupProfile;
  startup: StartupSnapshot;
  inputFingerprint?: string;
  inputSnapshot?: unknown;
  methodologyVersion: string;
  reportMarkdown: string;
  validation: unknown;
  processingTime: number;
  idempotencyKey?: string;
}) {
  const {
    valuation,
    profile,
    startup,
    inputFingerprint,
    inputSnapshot,
    methodologyVersion,
    reportMarkdown,
    validation,
    processingTime,
    idempotencyKey,
  } = params;
  const inputTrace = buildInputEvidenceRows({
    valuationId: "pending",
    startupId: startup.id,
    profile,
  }).map((row) => row.input_data as InputTraceEntry);
  const fallbackComparables = (valuation.detailedAnalysis?.comparableCompanies || []).filter((item) =>
    /fallback|typical|unavailable/i.test(String(item))
  );

  return {
    inputFingerprint,
    idempotencyKey: idempotencyKey || undefined,
    inputSnapshot,
    methodologyVersion,
    determinismPolicy:
      "Same startup inputs and methodology reuse the existing valuation. New versions are created only when material inputs change.",
    generatedBecause: "material_input_or_methodology_change",
    reportMarkdown,
    executiveSummary: valuation.executiveSummary,
    detailedAnalysis: valuation.detailedAnalysis,
    sensitivityAnalysis: valuation.sensitivityAnalysis,
    validation,
    professionalCitation: valuation.professionalCitation,
    generatedAt: valuation.generatedAt,
    startupProfile: profile,
    sourceAudit: {
      inputTrace,
      verificationGaps: inputTrace
        .filter((entry) => !entry.present || entry.verificationStatus !== "verified")
        .map((entry) => ({
          field: entry.key,
          label: entry.label,
          reason: entry.present ? "Founder-provided or extracted value needs independent verification." : "Value was not provided.",
        })),
      marketDataStatus: fallbackComparables.length > 0 ? "fallback_or_generic_benchmarks_used" : "method_level_sources_used",
      fallbackComparables,
      generatedBy: "server",
      processingTimeMs: processingTime,
    },
    marketConditionsSnapshot: {
      marketContext: valuation.detailedAnalysis?.marketContext,
      comparables: valuation.detailedAnalysis?.comparableCompanies || [],
      fallbackComparables,
      generatedAt: valuation.generatedAt,
    },
    reviewStatus: {
      status: "system_generated_unreviewed",
      note: "Not a statutory valuation certificate. Professional reviewer approval is required before presenting as a signed valuation opinion.",
    },
    methodBreakdown: valuation.blended.methodBreakdown,
    sourcePolicy:
      "Each valuation number should be read with its source type: founder input, extracted input, calculated output, market benchmark, fallback assumption, or reviewer adjustment.",
    databaseStartupSnapshot: startup,
  };
}

function removeProprietaryScore(valuation: ProfessionalValuationResult): ProfessionalValuationResult {
  const methods = valuation.methods.filter((method) => method.methodName !== "evaldam-score");
  if (methods.length === valuation.methods.length || methods.length === 0) return valuation;

  const originalBreakdown = valuation.blended.methodBreakdown || {};
  const rawWeightTotal = methods.reduce((sum, method) => {
    const weight = originalBreakdown[method.methodName]?.weight;
    return sum + (typeof weight === "number" && weight > 0 ? weight : 0);
  }, 0);

  const methodBreakdown: Record<string, { estimate: number; weight: number }> = {};
  let weightedAverage = 0;

  for (const method of methods) {
    const rawWeight = originalBreakdown[method.methodName]?.weight;
    const weight = rawWeightTotal > 0 && typeof rawWeight === "number" && rawWeight > 0
      ? rawWeight / rawWeightTotal
      : 1 / methods.length;
    methodBreakdown[method.methodName] = {
      estimate: method.midEstimate,
      weight,
    };
    weightedAverage += method.midEstimate * weight;
  }

  const blendedRange = {
    low: Math.min(...methods.map((method) => method.lowEstimate)),
    high: Math.max(...methods.map((method) => method.highEstimate)),
    mid: Math.round(weightedAverage),
  };

  return {
    ...valuation,
    methods,
    blended: {
      ...valuation.blended,
      lowRange: blendedRange.low,
      highRange: blendedRange.high,
      weightedAverage: blendedRange.mid,
      methodBreakdown,
    },
    executiveSummary: {
      ...valuation.executiveSummary,
      blendedRange,
      methodologyNote:
        "Free plan valuation derived from 5 non-proprietary professional methods. Evaldam AI Score is available on paid plans.",
    },
    professionalCitation: `${valuation.professionalCitation} | Free plan output excludes Evaldam AI Score.`,
  };
}

async function persistAuditTrail(
  adminClient: ReturnType<typeof createAdminClient>,
  params: {
    valuationId: string;
    startupId: string;
    profile: StartupProfile;
    valuation: ProfessionalValuationResult;
    methodsWithWeights: MethodWithWeight[];
    validation: unknown;
    inputSnapshot?: unknown;
  }
) {
  const { valuationId, startupId, profile, valuation, methodsWithWeights, validation, inputSnapshot } = params;

  const evidenceRows = buildMethodEvidenceRows({
    valuationId,
    startupId,
    profile,
    methods: methodsWithWeights,
    methodBreakdown: valuation.blended.methodBreakdown,
  });

  if (evidenceRows.length > 0) {
    const { error } = await adminClient.from("valuation_methods").insert(evidenceRows);
    if (error) throw new Error(`Failed to save valuation methods: ${error.message}`);
  }

  const valuationEvidenceRows = [
    ...buildInputEvidenceRows({ valuationId, startupId, profile }),
    ...evidenceRows.flatMap((row) => [
      {
        valuation_id: valuationId,
        evidence_type: "method_output",
        evidence_key: `${row.method_name}_output`,
        evidence_value: {
          low_estimate: row.low_estimate,
          mid_estimate: row.mid_estimate,
          high_estimate: row.high_estimate,
          confidence: row.confidence,
          blendWeight: row.method_inputs?.blendWeight,
        },
        source: "recalculated",
        source_date: new Date().toISOString(),
        source_confidence: row.confidence === "high" ? 90 : row.confidence === "medium" ? 70 : 45,
        input_data: row.method_inputs,
        calculated_by: row.method_name,
      },
      {
        valuation_id: valuationId,
        evidence_type: "assumption",
        evidence_key: `${row.method_name}_assumptions`,
        evidence_value: row.assumptions || {},
        source: "recalculated",
        source_date: new Date().toISOString(),
        source_confidence: 75,
        input_data: row.method_inputs,
        calculated_by: row.method_name,
      },
    ]),
  ];

  if (valuationEvidenceRows.length > 0) {
    const { error } = await adminClient.from("valuation_evidence").insert(valuationEvidenceRows);
    if (error) throw new Error(`Failed to save valuation evidence: ${error.message}`);
  }

  await generateStructuredReport(adminClient, {
    valuation: {
      id: valuationId,
      blended_low_range: valuation.blended.lowRange,
      blended_high_range: valuation.blended.highRange,
      blended_weighted_average: valuation.blended.weightedAverage,
      confidence_level: valuation.confidenceLevel,
    },
    methods: evidenceRows,
    comparables: [],
    dataValidation: validation,
    inputs: {
      arr: profile.annualRecurringRevenue || 0,
      growth_rate: profile.monthlyGrowthRate || 0,
      team_size: profile.team?.length || 0,
      total_addressable_market: profile.totalAddressableMarket || 0,
      stage: profile.stage,
    },
  }).catch((error) => {
    logger.warn("Structured report persistence failed", {
      valuationId,
      error: error instanceof Error ? error.message : String(error),
    });
  });

  const { data: latestVersion } = await adminClient
    .from("valuation_versions")
    .select("version_number, inputs_snapshot")
    .eq("valuation_id", valuationId)
    .order("version_number", { ascending: false })
    .limit(1);

  await adminClient.from("valuation_versions").insert({
    valuation_id: valuationId,
    version_number: (latestVersion?.[0]?.version_number || 0) + 1,
    inputs_snapshot: inputSnapshot || profile,
    outputs_snapshot: {
      blended_low_range: valuation.blended.lowRange,
      blended_high_range: valuation.blended.highRange,
      blended_weighted_average: valuation.blended.weightedAverage,
      confidence_level: valuation.confidenceLevel,
    },
    changed_inputs: {},
    change_reason: "initial_server_generation",
  });
}

async function findExistingValuation(
  adminClient: ReturnType<typeof createAdminClient>,
  params: {
    startupId: string;
    userId: string;
    inputFingerprint?: string;
    methodologyVersion: string;
    idempotencyKey?: string;
  }
) {
  const { startupId, userId, inputFingerprint, methodologyVersion, idempotencyKey } = params;

  if (inputFingerprint) {
    const { data, error } = await adminClient
      .from("valuations")
      .select("*")
      .eq("startup_id", startupId)
      .eq("user_id", userId)
      .eq("status", "completed")
      .eq("report_data->>inputFingerprint", inputFingerprint)
      .eq("report_data->>methodologyVersion", methodologyVersion)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.warn("Valuation fingerprint lookup failed", {
        startupId,
        userId,
        error: error.message,
      });
    } else if (data) {
      return data;
    }
  }

  if (!idempotencyKey) return null;

  const { data, error } = await adminClient
    .from("valuations")
    .select("*")
    .eq("startup_id", startupId)
    .eq("user_id", userId)
    .eq("status", "completed")
    .eq("report_data->>idempotencyKey", idempotencyKey)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.warn("Valuation idempotency lookup failed", {
      startupId,
      userId,
      error: error.message,
    });
    return null;
  }

  return data || null;
}

async function getCurrentPlanKey(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<PlanKey> {
  const { data, error } = await adminClient
    .from("users")
    .select("plan, plan_active, subscription_end_date")
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw new ValidationError("Account profile not found during valuation save.");
  }

  const active = Boolean(data.plan_active) && (
    !data.subscription_end_date || new Date(data.subscription_end_date) >= new Date()
  );
  return normalizePlanKey(data.plan, active);
}

async function reserveValuationBurstSlot(
  userId: string,
  planKey: PlanKey
): Promise<{ allowed: boolean; resetsAt: string }> {
  const minuteStart = new Date();
  minuteStart.setUTCSeconds(0, 0);
  const resetsAt = new Date(minuteStart.getTime() + 60_000).toISOString();
  const periodKey = `minute:${minuteStart.toISOString().slice(0, 16)}Z`;
  const limit = VALUATION_BURST_LIMITS_PER_MINUTE[planKey] || VALUATION_BURST_LIMITS_PER_MINUTE.free;

  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.rpc("increment_ai_usage_counter_if_available", {
      p_user_id: userId,
      p_usage_key: `valuation-burst:${userId}`,
      p_feature: "valuation_preview",
      p_plan_key: planKey,
      p_period_key: periodKey,
      p_reset_at: resetsAt,
      p_limit: limit,
    });

    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return { allowed: Boolean(row?.allowed), resetsAt };
  } catch (error) {
    logger.warn("Valuation burst limiter unavailable; allowing request", {
      userId,
      planKey,
      error: error instanceof Error ? error.message : String(error),
    });
    return { allowed: true, resetsAt };
  }
}

function getProfileField(profile: StartupProfile, fieldName: string) {
  if (fieldName === "team") return profile.team?.length || 0;
  return profile[fieldName as keyof StartupProfile];
}
