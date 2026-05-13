import { NextRequest, NextResponse } from "next/server";
import { StartupProfile, ValuationMethodResult } from "@/types";
import { ProfessionalValuationEngine, ProfessionalValuationResult } from "@/lib/valuation/professional-engine";
import { generateProfessionalReport } from "@/lib/valuation/report-template";
import { logger } from "@/lib/utils/logger";
import { successResponse } from "@/lib/utils/response";
import { ValidationError } from "@/lib/utils/errors";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateStartupProfile } from "@/lib/valuation/data-validator";
import { buildInputEvidenceRows, buildMethodEvidenceRows } from "@/lib/valuation/evidence-builder";
import { generateStructuredReport } from "@/lib/valuation/report-structurer";
import { requirePaidUser } from "@/lib/auth/paid-access";

const VALUATION_METHODOLOGY_VERSION = "professional-engine-2026.1";

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

  try {
    const body = await request.json();
    const {
      startupProfile,
      userId,
      startupId,
      inputFingerprint,
      inputSnapshot,
      methodologyVersion = VALUATION_METHODOLOGY_VERSION,
    } = body;

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

    // Check plan limits
    const supabase = await createClient();
    const paidAccess = await requirePaidUser(supabase);
    if (!paidAccess.ok) return paidAccess.response;
    const { user } = paidAccess;

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

    // Check for required fields for accurate valuation
    const requiredFields = [
      { name: "team", label: "Team information (size, background)" },
      { name: "annualRecurringRevenue", label: "Annual Recurring Revenue (ARR)" },
      { name: "monthlyGrowthRate", label: "Monthly Growth Rate (%)" },
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

    logger.info("Evaldam: Valuation request", {
      company: profile.companyName,
      stage: profile.stage,
      userId,
    });

    // Run professional valuation engine
    const engine = new ProfessionalValuationEngine(profile, userId);
    const valuation = await engine.execute();
    const methodsWithWeights = valuation.methods.map((method) => ({
      ...method,
      weight: valuation.blended.methodBreakdown?.[method.methodName]?.weight ?? null,
    }));

    // Generate professional report
    const reportMarkdown = generateProfessionalReport(
      { ...valuation, methods: methodsWithWeights },
      profile
    );

    const processingTime = Date.now() - startTime;
    const processingSeconds = Math.max(1, Math.round(processingTime / 1000));
    const reportData = buildReportData({
      valuation,
      profile,
      startup,
      inputFingerprint,
      inputSnapshot,
      methodologyVersion,
      reportMarkdown,
      validation,
      processingTime,
    });

    const adminClient = createAdminClient();

    const { data: newValuation, error: valuationInsertError } = await adminClient
      .from("valuations")
      .insert({
        startup_id: startupId,
        user_id: user.id,
        blended_low_range: valuation.blended.lowRange,
        blended_high_range: valuation.blended.highRange,
        blended_weighted_average: valuation.blended.weightedAverage,
        confidence_level: valuation.confidenceLevel || "medium",
        data_completeness: valuation.dataCompleteness || 0,
        methodology_version: methodologyVersion,
        market_conditions_snapshot: reportData.marketConditionsSnapshot,
        comparable_companies: valuation.detailedAnalysis?.comparableCompanies || [],
        processing_time_seconds: processingSeconds,
        ai_model_used: valuation.generatedByModel,
        llm_provider: "evaldam-professional-engine",
        status: "completed",
        methods_results: methodsWithWeights,
        key_reasons: valuation.blended?.keyReasons || [],
        report_data: reportData,
        data_validation_result: validation,
        suspicious_flags: [],
        inputs_snapshot: inputSnapshot || profile,
        professional_review: reportData.reviewStatus,
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
      valuation,
      methodsWithWeights,
      validation,
      inputSnapshot,
    });

    logger.info("Evaldam: Valuation complete", {
      company: profile.companyName,
      blendedValuation: valuation.blended.weightedAverage,
      confidenceLevel: valuation.confidenceLevel,
      processingTime: `${processingTime}ms`,
    });

    return successResponse(
      {
        valuation: {
          ...valuation,
          id: newValuation.id,
          startupId,
          methods: methodsWithWeights,
          persisted: true,
        },
        savedValuation: newValuation,
        reportMarkdown,
        validation,
        processingTime,
      },
      200,
      processingTime
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error("Evaldam: Valuation failed", { error: errorMsg, stack: error instanceof Error ? error.stack : undefined });

    return NextResponse.json(
      {
        success: false,
        error: "Valuation failed",
        details: errorMsg,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
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

function getProfileField(profile: StartupProfile, fieldName: string) {
  if (fieldName === "team") return profile.team?.length || 0;
  return profile[fieldName as keyof StartupProfile];
}
