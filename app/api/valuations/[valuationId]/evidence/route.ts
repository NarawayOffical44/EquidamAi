import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildMethodEvidenceRows } from "@/lib/valuation/evidence-builder";
import { generateStructuredReport } from "@/lib/valuation/report-structurer";
import { errorResponse, successResponse } from "@/lib/utils/response";
import { StartupProfile, ValuationMethodResult } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ valuationId: string }> }
) {
  try {
    const { valuationId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) return errorResponse("Unauthorized", 401);

    const { data: valuation, error: valuationError } = await supabase
      .from("valuations")
      .select("id, user_id, startup_id, blended_low_range, blended_high_range, blended_weighted_average, confidence_level, data_completeness, market_conditions_snapshot, comparable_companies, report_data, created_at")
      .eq("id", valuationId)
      .single();

    if (valuationError || !valuation) return errorResponse("Valuation not found", 404);
    if (valuation.user_id !== user.id) return errorResponse("Forbidden", 403);

    const { data: methods, error: methodsError } = await supabase
      .from("valuation_methods")
      .select("*")
      .eq("valuation_id", valuationId)
      .order("created_at", { ascending: true });

    if (methodsError) return errorResponse("Failed to fetch valuation evidence", 500);

    const { data: evidence } = await supabase
      .from("valuation_evidence")
      .select("*")
      .eq("valuation_id", valuationId)
      .order("created_at", { ascending: true });

    const { data: versions } = await supabase
      .from("valuation_versions")
      .select("*")
      .eq("valuation_id", valuationId)
      .order("version_number", { ascending: true });

    return successResponse({
      success: true,
      data: {
        valuation,
        methods: methods || [],
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
    const body = await request.json();
    const {
      startupId,
      startupProfile,
      methods,
      dataValidation,
      suspiciousFlags,
    }: {
      startupId?: string;
      startupProfile?: Partial<StartupProfile>;
      methods?: ValuationMethodResult[];
      dataValidation?: any;
      suspiciousFlags?: any[];
    } = body;

    if (!startupId || !startupProfile || !Array.isArray(methods)) {
      return errorResponse("Missing startupId, startupProfile, or methods", 400);
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) return errorResponse("Unauthorized", 401);

    const { data: valuation, error: valuationError } = await supabase
      .from("valuations")
      .select("id, user_id, startup_id")
      .eq("id", valuationId)
      .single();

    if (valuationError || !valuation) return errorResponse("Valuation not found", 404);
    if (valuation.user_id !== user.id || valuation.startup_id !== startupId) {
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

    const adminClient = createAdminClient();
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
