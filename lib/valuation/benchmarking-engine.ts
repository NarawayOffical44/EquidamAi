import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ComparableSelectionResult, selectDefensibleComparables } from "@/lib/valuation/comparable-selector";
import {
  BenchmarkAnalysis,
  BenchmarkCalculationRequest,
  BenchmarkCalculationResult,
  ComparableCompany,
  IndustryBenchmark,
  PercentileMetrics,
  Industry,
  CompanyStage,
} from "@/types";

/**
 * Calculate percentile rank for a given value within a distribution
 * Returns 0-100 where 50 is median
 */
function calculatePercentileRank(value: number, metrics: PercentileMetrics): number {
  if (!value || !metrics) return 50;

  // Simple percentile calculation based on position in distribution
  if (value <= metrics.p25Value) return 25;
  if (value <= metrics.medianValue) {
    const range = metrics.medianValue - metrics.p25Value;
    return range > 0 ? 25 + ((value - metrics.p25Value) / range) * 25 : 50;
  }
  if (value <= metrics.p75Value) {
    const range = metrics.p75Value - metrics.medianValue;
    return range > 0 ? 50 + ((value - metrics.medianValue) / range) * 25 : 75;
  }
  if (value <= metrics.maxValue) {
    const range = metrics.maxValue - metrics.p75Value;
    return range > 0 ? 75 + ((value - metrics.p75Value) / range) * 25 : 100;
  }

  // Above max value
  return 100;
}

/**
 * Find comparable companies based on industry, stage, and metrics
 */
async function findComparableCompanies(
  industry: Industry,
  stage: CompanyStage,
  arr?: number,
  growthRate?: number,
  teamSize?: number,
  limit: number = 10
): Promise<ComparableCompany[]> {
  const supabase = await createClient();
  const arrWindows = arr && arr > 0 ? [0.5, 1, undefined] : [undefined];

  for (const arrWindow of arrWindows) {
    let query = supabase
    .from("comparable_companies")
    .select("*")
    .eq("industry", industry)
    .eq("stage", stage);

  // Filter by ARR range if provided (±50% range)
  if (arrWindow) {
    query = query
      .gte("arr", arr! * (1 - arrWindow))
      .lte("arr", arr! * (1 + arrWindow));
  }

  // Sort by most recent and most relevant
  const { data, error } = await query
    .order("valuation_date", { ascending: false })
    .limit(limit * 3);

  if (error) {
    console.error("Error finding comparables:", error);
    return [];
  }

  if (data && data.length > 0) {
    return rankComparableCompanies(data, arr, growthRate, teamSize).slice(0, limit);
  }
  }

  return [];
}

function rankComparableCompanies(
  companies: ComparableCompany[],
  arr?: number,
  growthRate?: number,
  teamSize?: number
): ComparableCompany[] {
  return [...companies].sort((a: any, b: any) => {
    return (
      relevanceDistance(a, arr, growthRate, teamSize) -
      relevanceDistance(b, arr, growthRate, teamSize)
    );
  });
}

function relevanceDistance(
  company: any,
  arr?: number,
  growthRate?: number,
  teamSize?: number
): number {
  const companyArr = Number(company.arr || 0);
  const companyGrowth = Number(company.growth_rate ?? company.growthRate ?? 0);
  const companyTeam = Number(company.team_size ?? company.teamSize ?? 0);
  const arrDistance = arr && companyArr > 0 ? Math.abs(Math.log(companyArr / arr)) : 0;
  const growthDistance =
    growthRate && companyGrowth > 0 ? Math.abs(companyGrowth - growthRate) / 100 : 0;
  const teamDistance =
    teamSize && companyTeam > 0 ? Math.abs(companyTeam - teamSize) / Math.max(teamSize, 1) : 0;

  return arrDistance * 2 + growthDistance + teamDistance * 0.5;
}

/**
 * Fetch industry benchmarks for a given industry, stage, and metrics
 */
async function getIndustryBenchmarks(
  industry: Industry,
  stage: CompanyStage
): Promise<Record<string, PercentileMetrics>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("industry_benchmarks")
    .select("*")
    .eq("industry", industry)
    .eq("stage", stage);

  if (error) {
    console.error("Error fetching benchmarks:", error);
    return {};
  }

  // Convert to record keyed by metric_name
  const benchmarkMap: Record<string, PercentileMetrics> = {};
  data?.forEach((benchmark: any) => {
    benchmarkMap[benchmark.metric_name] = {
      count: benchmark.count,
      minValue: benchmark.min_value,
      p25Value: benchmark.p25_value,
      medianValue: benchmark.median_value,
      p75Value: benchmark.p75_value,
      maxValue: benchmark.max_value,
      meanValue: benchmark.mean_value,
      stdDev: benchmark.std_dev,
      lastUpdated: benchmark.last_updated,
      dataPointsUsed: benchmark.data_points_used,
      confidenceScore: benchmark.confidence_score,
    };
  });

  return benchmarkMap;
}

/**
 * Generate market position description based on percentile
 */
function generateMarketPosition(percentile: number, stage: CompanyStage): string {
  if (percentile >= 90) return `Top 10% among ${stage} stage companies`;
  if (percentile >= 75) return `Top 25% among ${stage} stage companies`;
  if (percentile >= 50) return `Above median for ${stage} stage companies`;
  if (percentile >= 25) return `Below median for ${stage} stage companies`;
  return `Bottom 25% among ${stage} stage companies`;
}

/**
 * Generate markdown analysis summary
 */
function generateAnalysisSummary(
  industry: Industry,
  stage: CompanyStage,
  valuationPercentile: number,
  arrPercentile: number,
  growthPercentile: number,
  comparableCount: number,
  industrialBenchmarks: Record<string, PercentileMetrics>,
  selection?: ComparableSelectionResult
): string {
  const lines = [
    `## Market Position & Benchmarking Analysis`,
    ``,
    `### Valuation Percentile: ${valuationPercentile}th`,
    `Your startup is valued at the **${valuationPercentile}th percentile** among ${stage} stage **${industry.toUpperCase()}** companies.`,
    ``,
    `### Key Metrics vs Peers`,
    `- **ARR Percentile**: ${arrPercentile}th${arrPercentile >= 75 ? " ✓ Above market average" : arrPercentile < 25 ? " ⚠ Below market average" : ""}`,
    `- **Growth Rate Percentile**: ${growthPercentile}th${growthPercentile >= 75 ? " ✓ Strong growth trajectory" : growthPercentile < 25 ? " ⚠ Growth rate below peers" : ""}`,
    ``,
    `### Comparable Companies`,
    `Analyzed ${comparableCount} comparable companies at similar stage and industry to determine fair valuation range.`,
    selection?.rationale ? selection.rationale : "",
    ``,
    `### Confidence Level`,
    `Based on available market data and comparable company analysis. Updated with latest market information.`,
  ];

  return lines.join("\n");
}

/**
 * Main benchmarking calculation engine
 */
export async function calculateBenchmarking(
  req: BenchmarkCalculationRequest
): Promise<BenchmarkCalculationResult> {
  const { valuationId, industry, stage, arr, growthRate, teamSize } = req;

  try {
    // Fetch industry benchmarks
    const industrialBenchmarks = await getIndustryBenchmarks(industry as Industry, stage);

    const supabase = await createClient();
    const selection = await selectDefensibleComparables(supabase, {
      industry,
      stage,
      arr: arr || 0,
      growth_rate: growthRate || 0,
      team_size: teamSize || 0,
    });

    let comparables: ComparableCompany[] = [];
    if (selection.comparables.length > 0) {
      const { data } = await supabase
        .from("comparable_companies")
        .select("*")
        .in("id", selection.comparables.map((c) => c.comparable_id));
      comparables = data || [];
    } else {
      comparables = await findComparableCompanies(
        industry as Industry,
        stage,
        arr,
        growthRate,
        teamSize
      );
    }

    // Calculate percentile ranks
    const arrBenchmark = industrialBenchmarks["ARR"];
    const growthBenchmark = industrialBenchmarks["growth_rate"];
    const valuationBenchmark = industrialBenchmarks["valuation_multiple"];

    const arrPercentile = arr && arrBenchmark ? calculatePercentileRank(arr, arrBenchmark) : 50;
    const growthPercentile =
      growthRate && growthBenchmark ? calculatePercentileRank(growthRate, growthBenchmark) : 50;

    // Valuation percentile is based on average of ARR and growth percentiles
    // (simplified approach - in production, would use actual valuation data)
    const valuationPercentile = Math.round((arrPercentile + growthPercentile) / 2);

    // Generate analysis summary
    const analysisSummary = generateAnalysisSummary(
      industry as Industry,
      stage,
      valuationPercentile,
      arrPercentile,
      growthPercentile,
      comparables.length,
      industrialBenchmarks,
      selection
    );

    // Create benchmark analysis record
    const benchmarkAnalysis: BenchmarkAnalysis = {
      id: crypto.randomUUID(),
      valuationId,
      valuationPercentile,
      arrPercentile,
      growthPercentile,
      comparableCompanyIds: comparables.map((c) => c.id),
      analysisSummary,
      marketPosition: generateMarketPosition(valuationPercentile, stage),
      peerCount: comparables.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to database
    const { error } = await supabase.from("benchmark_analysis").insert([benchmarkAnalysis]);

    if (error) {
      console.error("Error saving benchmark analysis:", error);
      throw error;
    }

    await persistComparableSelections(valuationId, selection);

    return {
      benchmarkAnalysis,
      comparables,
      industryBenchmarks: industrialBenchmarks,
    };
  } catch (error) {
    console.error("Benchmarking calculation failed:", error);
    throw error;
  }
}

async function persistComparableSelections(
  valuationId: string,
  selection: Awaited<ReturnType<typeof selectDefensibleComparables>>
) {
  if (selection.comparables.length === 0) return;

  const adminClient = createAdminClient();
  const rows = selection.comparables.map((comparable) => ({
    valuation_id: valuationId,
    comparable_id: comparable.comparable_id,
    relevance_score: Math.round(comparable.relevance_score * 100) / 100,
    selection_reason: comparable.selection_reason,
    exclusion_reason: comparable.exclusion_reason || null,
    confidence_contribution: Math.round(selection.confidence / Math.max(selection.comparables.length, 1)),
  }));

  const { error } = await adminClient.from("comparable_selections").insert(rows);
  if (error) {
    console.warn("Failed to persist comparable selections:", error.message);
  }
}

/**
 * Fetch existing benchmark analysis for a valuation
 */
export async function getBenchmarkAnalysis(valuationId: string): Promise<BenchmarkAnalysis | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("benchmark_analysis")
    .select("*")
    .eq("valuation_id", valuationId)
    .single();

  if (error) {
    console.error("Error fetching benchmark analysis:", error);
    return null;
  }

  return data;
}
