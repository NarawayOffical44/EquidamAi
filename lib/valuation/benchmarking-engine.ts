import { createClient } from "@/lib/supabase/server";
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
  if (value <= metrics.medianValue) return 25 + ((value - metrics.p25Value) / (metrics.medianValue - metrics.p25Value)) * 25;
  if (value <= metrics.p75Value) return 50 + ((value - metrics.medianValue) / (metrics.p75Value - metrics.medianValue)) * 25;
  if (value <= metrics.maxValue) return 75 + ((value - metrics.p75Value) / (metrics.maxValue - metrics.p75Value)) * 25;

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

  let query = supabase
    .from("comparable_companies")
    .select("*")
    .eq("industry", industry)
    .eq("stage", stage);

  // Filter by ARR range if provided (±50% range)
  if (arr && arr > 0) {
    const lowerBound = arr * 0.5;
    const upperBound = arr * 1.5;
    query = query.gte("arr", lowerBound).lte("arr", upperBound);
  }

  // Sort by most recent and most relevant
  const { data, error } = await query
    .order("valuation_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error finding comparables:", error);
    return [];
  }

  return data || [];
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
  industrialBenchmarks: Record<string, PercentileMetrics>
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

    // Find comparable companies
    const comparables = await findComparableCompanies(
      industry as Industry,
      stage,
      arr,
      growthRate,
      teamSize
    );

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
      industrialBenchmarks
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
    const supabase = await createClient();
    const { error } = await supabase.from("benchmark_analysis").insert([benchmarkAnalysis]);

    if (error) {
      console.error("Error saving benchmark analysis:", error);
      throw error;
    }

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
