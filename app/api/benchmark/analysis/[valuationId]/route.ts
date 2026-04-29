import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBenchmarkAnalysis } from "@/lib/valuation/benchmarking-engine";
import { errorResponse, successResponse } from "@/lib/utils/response";

/**
 * GET /api/benchmark/analysis/[valuationId]
 * Fetch benchmark analysis for a specific valuation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ valuationId: string }> }
) {
  try {
    const { valuationId } = await params;

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return errorResponse("Unauthorized", 401);
    }

    // Verify user owns this valuation
    const { data: valuation, error: valuationError } = await supabase
      .from("valuations")
      .select("id, user_id")
      .eq("id", valuationId)
      .single();

    if (valuationError || !valuation) {
      return errorResponse("Valuation not found", 404);
    }

    if (valuation.user_id !== user.id) {
      return errorResponse("Forbidden: You don't own this valuation", 403);
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
      const { data } = await supabase
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
