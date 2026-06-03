import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBenchmarkPersonalization, getCountryFilterVariants } from "@/lib/personalization/country-benchmarks";

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
 * - country?: string
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
    const country = searchParams.get("country");
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));

    // Validate required params
    if (!industry || !stage) {
      return NextResponse.json({ success: false, error: "Missing required params: industry, stage" }, { status: 400 });
    }

    const supabase = await createClient();
    const countryVariants = getCountryFilterVariants(country);
    const personalization = getBenchmarkPersonalization(country);

    const buildQuery = () => {
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

      return query;
    };

    let countryMatched: any[] = [];
    if (countryVariants.length > 0) {
      const countryQuery = buildQuery()
        .in("country", countryVariants)
        .order("valuation_date", { ascending: false })
        .limit(limit);
      const countryResult = await countryQuery;

      if (countryResult.error) {
        console.error("Error fetching country comparable companies:", countryResult.error);
        return NextResponse.json({ success: false, error: "Failed to fetch comparable companies" }, { status: 500 });
      }

      countryMatched = countryResult.data || [];
    }

    const globalResult = await buildQuery()
      .order("valuation_date", { ascending: false })
      .limit(limit);

    const { data, error } = globalResult;

    if (error) {
      console.error("Error fetching comparable companies:", error);
      return NextResponse.json({ success: false, error: "Failed to fetch comparable companies" }, { status: 500 });
    }

    const seen = new Set<string>();
    const withScope = [
      ...countryMatched.map((company) => ({ ...company, benchmark_match_scope: "country" })),
      ...(data || []).map((company) => ({ ...company, benchmark_match_scope: "global" })),
    ].filter((company) => {
      if (!company?.id || seen.has(company.id)) return false;
      seen.add(company.id);
      return true;
    });

    const finalData = withScope.slice(0, limit);
    const countryMatchedCount = finalData.filter((company) => company.benchmark_match_scope === "country").length;
    const globalFallbackCount = finalData.length - countryMatchedCount;

    return NextResponse.json({
      success: true,
      data: finalData,
      count: finalData.length,
      countryMatchedCount,
      globalFallbackCount,
      benchmarkContext: countryVariants.length
        ? `${countryMatchedCount} ${personalization.countryLabel} peer${countryMatchedCount === 1 ? "" : "s"} matched first; ${globalFallbackCount} broader peer${globalFallbackCount === 1 ? "" : "s"} included when useful.`
        : "Global peer set matched by stage, industry, ARR, growth, valuation context, and recency.",
    });
  } catch (error: any) {
    console.error("Comparable companies search error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to search comparable companies" }, { status: 500 });
  }
}
