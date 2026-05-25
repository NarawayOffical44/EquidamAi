import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildMethodEvidenceRows } from "@/lib/valuation/evidence-builder";
import { generateStructuredReport } from "@/lib/valuation/report-structurer";
import { errorResponse, successResponse } from "@/lib/utils/response";
import { AppError } from "@/lib/utils/errors";
import { StartupProfile, ValuationMethodResult } from "@/types";
import {
  adminOnlyResponse,
  getAuthenticatedUser,
  getValuationWorkspaceAccess,
  isWorkspaceAdmin,
  paidWorkspaceRequiredResponse,
  unauthorizedResponse,
} from "@/lib/team/access";

const ValuationMethodSchema = z.object({
  methodName: z.enum(["scorecard", "berkus", "vc", "dcf-ltg", "dcf-multiples", "comparables", "evaldam-score"]),
  lowEstimate: z.coerce.number().finite(),
  midEstimate: z.coerce.number().finite(),
  highEstimate: z.coerce.number().finite(),
  reasoning: z.string().default(""),
  sources: z.array(z.string()).default([]),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
  assumptions: z.record(z.string(), z.union([z.string(), z.number()])).default({}),
  proprietary: z
    .object({
      internalPercentile: z.number().optional(),
      industryGrowthPremium: z.number().optional(),
      teamExitHistory: z.boolean().optional(),
      moatStrength: z.number().optional(),
      customerConcentrationRisk: z.number().optional(),
      marketTimingScore: z.number().optional(),
    })
    .optional(),
});

const EvidenceRefreshSchema = z.object({
  startupId: z.string().uuid(),
  startupProfile: z.record(z.string(), z.unknown()),
  methods: z.array(ValuationMethodSchema).min(1).max(20),
  dataValidation: z.unknown().optional(),
  suspiciousFlags: z.array(z.unknown()).optional().default([]),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ valuationId: string }> }
) {
  try {
    const { valuationId } = await params;
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return unauthorizedResponse();
    const adminClient = createAdminClient();
    const valuationAccess = await getValuationWorkspaceAccess(adminClient, user.id, valuationId);
    if (!valuationAccess) return paidWorkspaceRequiredResponse();

    const { data: valuation, error: valuationError } = await adminClient
      .from("valuations")
      .select("id, user_id, startup_id, blended_low_range, blended_high_range, blended_weighted_average, confidence_level, data_completeness, market_conditions_snapshot, comparable_companies, report_data, generated_on_tier, should_watermark, created_at")
      .eq("id", valuationId)
      .single();

    if (valuationError || !valuation) return errorResponse("Valuation not found", 404);

    const { data: methods, error: methodsError } = await adminClient
      .from("valuation_methods")
      .select("*")
      .eq("valuation_id", valuationId)
      .order("created_at", { ascending: true });

    if (methodsError) return errorResponse("Failed to fetch valuation evidence", 500);
    const isFreeReport =
      valuationAccess.access.plan === "free" ||
      !valuationAccess.access.planActive ||
      valuation.generated_on_tier === "free" ||
      valuation.should_watermark === true;
    const visibleMethods = isFreeReport
      ? (methods || []).filter((method: any) => method.method_name !== "evaldam-score" && method.method_name !== "evaldam_score")
      : methods || [];

    const { data: evidence } = await adminClient
      .from("valuation_evidence")
      .select("*")
      .eq("valuation_id", valuationId)
      .order("created_at", { ascending: true });

    const { data: versions } = await adminClient
      .from("valuation_versions")
      .select("*")
      .eq("valuation_id", valuationId)
      .order("version_number", { ascending: true });

    return successResponse({
      success: true,
      data: {
        valuation,
        methods: visibleMethods,
        evidence: evidence || [],
        versions: versions || [],
      },
    });
  } catch (error: any) {
    return errorResponse(error?.message || "Failed to fetch valuation evidence", 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ valuationId: string }> }
) {
  try {
    const { valuationId } = await params;
    const body = EvidenceRefreshSchema.parse(await request.json());
    const startupId = body.startupId;
    const startupProfile = body.startupProfile as Partial<StartupProfile>;
    const methods: ValuationMethodResult[] = body.methods;
    const dataValidation = body.dataValidation;
    const suspiciousFlags = body.suspiciousFlags;

    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return unauthorizedResponse();
    const adminClient = createAdminClient();
    const valuationAccess = await getValuationWorkspaceAccess(adminClient, user.id, valuationId);
    if (!valuationAccess) return paidWorkspaceRequiredResponse();
    if (!isWorkspaceAdmin(valuationAccess.access)) {
      return adminOnlyResponse("Only the workspace Admin can refresh valuation evidence");
    }

    const { data: valuation, error: valuationError } = await adminClient
      .from("valuations")
      .select("id, user_id, startup_id")
      .eq("id", valuationId)
      .single();

    if (valuationError || !valuation) return errorResponse("Valuation not found", 404);
    if (valuation.startup_id !== startupId) {
      return errorResponse("Forbidden", 403);
    }

    const evidenceRows = buildMethodEvidenceRows({
      valuationId,
      startupId,
      profile: startupProfile,
      methods,
    });

    if (evidenceRows.length === 0) {
      return successResponse({ success: true, inserted: 0 }, 200);
    }

    await adminClient
      .from("valuation_methods")
      .delete()
      .eq("valuation_id", valuationId);

    const { error } = await adminClient.from("valuation_methods").insert(evidenceRows);
    if (error) return errorResponse("Failed to save valuation evidence", 500);

    const valuationEvidenceRows = evidenceRows.flatMap((row) => [
      {
        valuation_id: valuationId,
        evidence_type: "method_output",
        evidence_key: `${row.method_name}_output`,
        evidence_value: {
          low_estimate: row.low_estimate,
          mid_estimate: row.mid_estimate,
          high_estimate: row.high_estimate,
          confidence: row.confidence,
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
    ]);

    await adminClient
      .from("valuation_evidence")
      .delete()
      .eq("valuation_id", valuationId);

    if (valuationEvidenceRows.length > 0) {
      await adminClient.from("valuation_evidence").insert(valuationEvidenceRows);
    }

    await adminClient
      .from("valuations")
      .update({
        data_validation_result: dataValidation || null,
        suspicious_flags: suspiciousFlags || [],
        inputs_snapshot: startupProfile,
      })
      .eq("id", valuationId);

    const { data: fullValuation } = await adminClient
      .from("valuations")
      .select("*")
      .eq("id", valuationId)
      .single();

    const { data: comparableRows } = await adminClient
      .from("comparable_selections")
      .select("comparable_companies(*)")
      .eq("valuation_id", valuationId);

    await generateStructuredReport(adminClient, {
      valuation: fullValuation || { id: valuationId },
      methods: evidenceRows,
      comparables: (comparableRows || []).map((row: any) => row.comparable_companies).filter(Boolean),
      dataValidation,
      inputs: {
        arr: startupProfile.annualRecurringRevenue || 0,
        growth_rate: startupProfile.monthlyGrowthRate || 0,
        team_size: startupProfile.team?.length || 0,
        total_addressable_market: startupProfile.totalAddressableMarket || 0,
        stage: startupProfile.stage,
      },
    }).catch(() => null);

    const { data: latestVersion } = await adminClient
      .from("valuation_versions")
      .select("version_number, inputs_snapshot")
      .eq("valuation_id", valuationId)
      .order("version_number", { ascending: false })
      .limit(1);

    const previous = latestVersion?.[0];
    await adminClient.from("valuation_versions").insert({
      valuation_id: valuationId,
      version_number: (previous?.version_number || 0) + 1,
      inputs_snapshot: startupProfile,
      outputs_snapshot: {
        blended_low_range: fullValuation?.blended_low_range,
        blended_high_range: fullValuation?.blended_high_range,
        blended_weighted_average: fullValuation?.blended_weighted_average,
        confidence_level: fullValuation?.confidence_level,
      },
      changed_inputs: previous?.inputs_snapshot ? diffInputs(previous.inputs_snapshot, startupProfile) : {},
      change_reason: previous ? "regenerated" : "initial_generation",
    });

    return successResponse({
      success: true,
      inserted: evidenceRows.length,
      evidenceItems: valuationEvidenceRows.length,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        new AppError("VALIDATION_ERROR", "Invalid valuation evidence request", 400, {
          issues: error.issues,
        }),
        400
      );
    }
    return errorResponse(error?.message || "Failed to save valuation evidence", 500);
  }
}

function diffInputs(previous: any, current: any) {
  const changed: Record<string, { old_value: any; new_value: any }> = {};
  const keys = new Set([...Object.keys(previous || {}), ...Object.keys(current || {})]);

  for (const key of keys) {
    const oldValue = previous?.[key];
    const newValue = current?.[key];
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changed[key] = { old_value: oldValue, new_value: newValue };
    }
  }

  return changed;
}
