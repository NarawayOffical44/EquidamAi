import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildMethodEvidenceRows } from "@/lib/valuation/evidence-builder";
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

    return successResponse({
      success: true,
      data: {
        valuation,
        methods: methods || [],
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
    }: {
      startupId?: string;
      startupProfile?: Partial<StartupProfile>;
      methods?: ValuationMethodResult[];
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

    return successResponse({
      success: true,
      inserted: evidenceRows.length,
    });
  } catch (error: any) {
    return errorResponse(error?.message || "Failed to save valuation evidence", 500);
  }
}
