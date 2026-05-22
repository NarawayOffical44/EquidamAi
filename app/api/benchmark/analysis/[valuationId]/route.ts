import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBenchmarkAnalysis } from "@/lib/valuation/benchmarking-engine";
import { errorResponse, successResponse } from "@/lib/utils/response";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAuthenticatedUser,
  getValuationWorkspaceAccess,
  paidWorkspaceRequiredResponse,
  unauthorizedResponse,
} from "@/lib/team/access";

/**
 * GET /api/benchmark/analysis/[valuationId]
 * Fetch benchmark analysis for a specific valuation
 */
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

    // Verify user owns this valuation
    const { data: valuation, error: valuationError } = await adminClient
      .from("valuations")
      .select("id, user_id")
      .eq("id", valuationId)
      .single();

    if (valuationError || !valuation) {
      return errorResponse("Valuation not found", 404);
    }

    // Fetch benchmark analysis
    const benchmarkAnalysis = await getBenchmarkAnalysis(valuationId);

    if (!benchmarkAnalysis) {
      return successResponse(
        {
          success: true,
          data: null,
          message: "No benchmark analysis found for this valuation",
        },
        200
      );
    }

    // Fetch comparable companies if IDs are present
    let comparables = [];
    if (benchmarkAnalysis.comparableCompanyIds && benchmarkAnalysis.comparableCompanyIds.length > 0) {
      const { data } = await adminClient
        .from("comparable_companies")
        .select("*")
        .in("id", benchmarkAnalysis.comparableCompanyIds);

      comparables = data || [];
    }

    return successResponse(
      {
        success: true,
        data: {
          benchmarkAnalysis,
          comparables,
        },
      },
      200
    );
  } catch (error: any) {
    console.error("Error fetching benchmark analysis:", error);
    return errorResponse(error?.message || "Failed to fetch benchmark analysis", 500);
  }
}
