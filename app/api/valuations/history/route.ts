import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/lib/utils/response";

/**
 * GET /api/valuations/history
 * Fetch valuation history for current user's startups
 *
 * Query params:
 * - startupId?: string (filter by specific startup)
 * - limit?: number (default: 50)
 * - offset?: number (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startupId = searchParams.get("startupId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return errorResponse("Unauthorized", 401);
    }

    // Build query
    let query = supabase
      .from("valuations")
      .select(
        `
        id,
        startup_id,
        blended_valuation_low,
        blended_valuation_high,
        blended_valuation_mid,
        generated_at,
        startups!inner(
          id,
          company_name,
          industry,
          stage
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", user.id);

    // Filter by startup if provided
    if (startupId) {
      query = query.eq("startup_id", startupId);
    }

    // Sort by newest first
    const { data, error, count } = await query
      .order("generated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching valuation history:", error);
      return errorResponse("Failed to fetch history", 500);
    }

    return successResponse(
      {
        success: true,
        data: data || [],
        pagination: {
          limit,
          offset,
          total: count || 0,
        },
      },
      200
    );
  } catch (error: any) {
    console.error("Valuation history fetch error:", error);
    return errorResponse(error?.message || "Failed to fetch history", 500);
  }
}
