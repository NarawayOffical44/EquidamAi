import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/lib/utils/response";

/**
 * GET /api/comparable-companies
 * Search comparable companies with filters
 *
 * Query params:
 * - industry: string (required)
 * - stage: string (required)
 * - arrMin?: number
 * - arrMax?: number
 * - growthRateMin?: number
 * - limit?: number (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const industry = searchParams.get("industry");
    const stage = searchParams.get("stage");
    const arrMin = searchParams.get("arrMin");
    const arrMax = searchParams.get("arrMax");
    const growthRateMin = searchParams.get("growthRateMin");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Validate required params
    if (!industry || !stage) {
      return errorResponse("Missing required params: industry, stage", 400);
    }

    const supabase = await createClient();

    let query = supabase
      .from("comparable_companies")
      .select("*")
      .eq("industry", industry)
      .eq("stage", stage);

    // Apply filters
    if (arrMin) {
      query = query.gte("arr", parseFloat(arrMin));
    }

    if (arrMax) {
      query = query.lte("arr", parseFloat(arrMax));
    }

    if (growthRateMin) {
      query = query.gte("growth_rate", parseFloat(growthRateMin));
    }

    // Sort by latest valuation and limit results
    const { data, error } = await query
      .order("valuation_date", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching comparable companies:", error);
      return errorResponse("Failed to fetch comparable companies", 500);
    }

    return successResponse(
      {
        success: true,
        data: data || [],
        count: data?.length || 0,
      },
      200
    );
  } catch (error: any) {
    console.error("Comparable companies search error:", error);
    return errorResponse(error?.message || "Failed to search comparable companies", 500);
  }
}
