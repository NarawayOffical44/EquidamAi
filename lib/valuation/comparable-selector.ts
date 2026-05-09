/**
 * Comparable Companies Selection Engine
 * Produces a defensible, reproducible peer set with rationale.
 */

export interface ComparableScore {
  comparable_id: string;
  company_name: string;
  arr: number;
  growth_rate: number;
  team_size: number;
  relevance_score: number;
  data_quality: number;
  funding_recency_days: number;
  final_rank_score: number;
  selection_reason: string;
  exclusion_reason?: string;
}

export interface ComparableSelectionResult {
  comparables: ComparableScore[];
  confidence: number;
  rationale: string;
}

export async function selectDefensibleComparables(
  supabase: any,
  profile: any,
  limit: number = 12
): Promise<ComparableSelectionResult> {
  const arr = Number(profile.arr || 0);
  const growthRate = Number(profile.growth_rate ?? profile.monthly_growth_rate ?? 0);
  const teamSize = Number(profile.team_size || 0);

  let query = supabase
    .from("comparable_companies")
    .select("*")
    .eq("industry", profile.industry)
    .eq("stage", profile.stage)
    .is("excluded_reasons", null);

  if (arr > 0) {
    query = query.gte("arr", arr * 0.5).lte("arr", arr * 1.5);
  }

  if (growthRate !== 0) {
    query = query.gte("growth_rate", Math.max(-50, growthRate - 20)).lte("growth_rate", Math.min(100, growthRate + 20));
  }

  let { data: candidates, error } = await query.limit(50);
  if (error) {
    return { comparables: [], confidence: 0, rationale: `Comparable query failed: ${error.message}` };
  }

  if (!candidates || candidates.length === 0) {
    const fallback = await supabase
      .from("comparable_companies")
      .select("*")
      .eq("industry", profile.industry)
      .eq("stage", profile.stage)
      .is("excluded_reasons", null)
      .limit(50);

    candidates = fallback.data || [];
  }

  if (!candidates || candidates.length === 0) {
    return {
      comparables: [],
      confidence: 0,
      rationale: "No comparable companies found matching stage and industry criteria.",
    };
  }

  let scored = candidates.map((candidate: any) => scoreCandidate(candidate, { arr, growthRate, teamSize, country: profile.country }));
  scored = excludeMultipleOutliers(scored);
  scored = excludeStaleData(scored);

  scored.forEach((candidate: any) => {
    const recencyBonus = Math.max(0, 1 - candidate.funding_recency_days / 365);
    candidate.final_rank_score =
      candidate.relevance_score * 0.5 +
      (candidate.data_quality / 100) * 0.3 +
      recencyBonus * 0.2;
  });

  scored.sort((a: any, b: any) => b.final_rank_score - a.final_rank_score);

  const selected = scored.slice(0, limit);
  const confidence = calculatePeerSetConfidence(selected);
  const rationale = buildSelectionRationale(selected, candidates.length, profile, arr, growthRate);

  return {
    comparables: selected.map(toComparableScore),
    confidence,
    rationale,
  };
}

function scoreCandidate(candidate: any, profile: { arr: number; growthRate: number; teamSize: number; country?: string }) {
  const arrScore =
    profile.arr > 0
      ? (1 - Math.min(1, Math.abs((candidate.arr || 0) - profile.arr) / Math.max(profile.arr, 1))) * 0.35
      : 0.18;
  const growthScore =
    profile.growthRate !== 0
      ? (1 - Math.min(1, Math.abs((candidate.growth_rate || 0) - profile.growthRate) / 50)) * 0.35
      : 0.18;
  const teamScore =
    candidate.team_size && profile.teamSize > 0
      ? (1 - Math.min(1, Math.abs(candidate.team_size - profile.teamSize) / Math.max(profile.teamSize, 1))) * 0.2
      : 0.1;
  const geographyScore = candidate.country && profile.country && candidate.country === profile.country ? 0.1 : 0;

  return {
    ...candidate,
    relevance_score: Math.max(0, Math.min(1, arrScore + growthScore + teamScore + geographyScore)),
    data_quality: candidate.data_quality || (candidate.verified ? 80 : 50),
    funding_recency_days: calculateRecencyDays(candidate.data_freshness_date || candidate.valuation_date),
  };
}

function excludeMultipleOutliers(scored: any[]) {
  const multiples = scored
    .map((candidate) => candidate.valuation_multiples?.ev_arr)
    .filter((value: any): value is number => Number.isFinite(value))
    .sort((a: number, b: number) => a - b);

  if (multiples.length < 3) return scored;

  const median = multiples[Math.floor(multiples.length / 2)];
  const stdDev = Math.sqrt(multiples.reduce((sum, multiple) => sum + Math.pow(multiple - median, 2), 0) / multiples.length);

  return scored.filter((candidate) => {
    const multiple = candidate.valuation_multiples?.ev_arr;
    if (!Number.isFinite(multiple)) return true;
    if (stdDev > 0 && Math.abs(multiple - median) > 2 * stdDev) {
      candidate.exclusion_reason = "outlier_multiple";
      return false;
    }
    return true;
  });
}

function excludeStaleData(scored: any[]) {
  return scored.filter((candidate) => {
    if (candidate.funding_recency_days > 730) {
      candidate.exclusion_reason = "stale_data";
      return false;
    }
    return true;
  });
}

function calculateRecencyDays(date?: string): number {
  if (!date) return 999;
  const parsed = new Date(date).getTime();
  if (!Number.isFinite(parsed)) return 999;
  return Math.floor((Date.now() - parsed) / (1000 * 60 * 60 * 24));
}

function calculatePeerSetConfidence(peers: any[]): number {
  if (peers.length === 0) return 0;

  let score = 100;
  score -= Math.max(0, (12 - peers.length) * 4);

  const avgRecency = peers.reduce((sum, peer) => sum + peer.funding_recency_days, 0) / peers.length;
  score -= Math.max(0, Math.min(20, (avgRecency / 365) * 20));

  const avgQuality = peers.reduce((sum, peer) => sum + peer.data_quality, 0) / peers.length;
  score -= Math.max(0, 100 - avgQuality);

  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildSelectionRationale(selected: any[], candidateCount: number, profile: any, arr: number, growthRate: number): string {
  const median = medianMultiple(selected);
  const avgQuality =
    selected.length > 0
      ? selected.reduce((sum, candidate) => sum + candidate.data_quality, 0) / selected.length
      : 0;

  return [
    `Selected ${selected.length} comparables from ${candidateCount} candidates.`,
    `Criteria: ${profile.stage} stage, ${profile.industry} industry${arr > 0 ? `, ARR around $${(arr / 1000000).toFixed(1)}M` : ""}${growthRate ? `, growth around ${growthRate.toFixed(0)}%` : ""}.`,
    `Median EV/ARR multiple: ${median.toFixed(1)}x.`,
    `Average data quality: ${avgQuality.toFixed(0)}%.`,
  ].join(" ");
}

function medianMultiple(peers: any[]): number {
  const values = peers
    .map((peer) => peer.valuation_multiples?.ev_arr)
    .filter((value): value is number => Number.isFinite(value))
    .sort((a, b) => a - b);

  if (values.length === 0) return 0;
  return values[Math.floor(values.length / 2)];
}

function toComparableScore(candidate: any): ComparableScore {
  return {
    comparable_id: candidate.id,
    company_name: candidate.company_name,
    arr: candidate.arr || 0,
    growth_rate: candidate.growth_rate || 0,
    team_size: candidate.team_size || 0,
    relevance_score: candidate.relevance_score,
    data_quality: candidate.data_quality,
    funding_recency_days: candidate.funding_recency_days,
    final_rank_score: candidate.final_rank_score,
    selection_reason: [
      candidate.arr ? `ARR ${(candidate.arr / 1000000).toFixed(1)}M` : "ARR unavailable",
      candidate.growth_rate !== null && candidate.growth_rate !== undefined ? `growth ${candidate.growth_rate}%` : "growth unavailable",
      `data quality ${candidate.data_quality}%`,
    ].join(", "),
    exclusion_reason: candidate.exclusion_reason,
  };
}
