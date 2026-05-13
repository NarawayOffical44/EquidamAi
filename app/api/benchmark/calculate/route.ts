import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateBenchmarking } from "@/lib/valuation/benchmarking-engine";
import { BenchmarkCalculationRequest } from "@/types";
import { errorResponse, successResponse } from "@/lib/utils/response";
import { requirePaidUser } from "@/lib/auth/paid-access";

/**
 * POST /api/benchmark/calculate
 * Calculate benchmarking analysis for a valuation
 */
export async function POST(request: NextRequest) {
  try {
    const body: BenchmarkCalculationRequest = await request.json();

    // Validate required fields
    if (!body.valuationId || !body.industry || !body.stage) {
      return errorResponse("Missing required fields: valuationId, industry, stage", 400);
    }

    // Authenticate user
    const supabase = await createClient();
    const paidAccess = await requirePaidUser(supabase);
    if (!paidAccess.ok) return paidAccess.response;
    const { user } = paidAccess;

    // Verify user owns this valuation
    const { data: valuation, error: valuationError } = await supabase
      .from("valuations")
      .select("id, user_id")
      .eq("id", body.valuationId)
      .single();

    if (valuationError || !valuation) {
      return errorResponse("Valuation not found", 404);
    }

    if (valuation.user_id !== user.id) {
      return errorResponse("Forbidden: You don't own this valuation", 403);
    }

    // Calculate benchmarking
    const result = await calculateBenchmarking(body);

    return successResponse(
      {
        success: true,
        data: result,
      },
      200
    );
  } catch (error: any) {
    console.error("Benchmark calculation error:", error);
    return errorResponse(error?.message || "Failed to calculate benchmarking", 500);
  }
}
