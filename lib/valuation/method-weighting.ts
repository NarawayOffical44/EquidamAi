/**
 * Dynamic Method Weighting Based on Company Stage
 * Adjusts valuation method weights based on ARR to improve accuracy
 * across all company sizes
 */

export interface MethodWeights {
  scorecard: number;
  berkus: number;
  vcMethod: number;
  dcfLTG: number;
  dcfMultiples: number;
  comparables: number;
  evaldamScore: number;
}

/**
 * Get appropriate method weights based on ARR
 * @param arr Annual Recurring Revenue in INR
 * @returns Weights for each valuation method (sum = 1.0)
 */
export function getMethodWeights(arr: number): MethodWeights {
  // Pre-revenue / Angel / Seed (< ₹10L ARR)
  if (arr < 1000000) {
    return {
      scorecard: 0.35,
      berkus: 0.25,
      vcMethod: 0.15,
      dcfLTG: 0.03,
      dcfMultiples: 0.05,
      comparables: 0.17,
      evaldamScore: 0.0,
    };
  }

  // Early revenue / Seed to Series A (₹10L to ₹5Cr ARR)
  if (arr < 50000000) {
    return {
      scorecard: 0.15,
      berkus: 0.08,
      vcMethod: 0.25,
      dcfLTG: 0.12,
      dcfMultiples: 0.2,
      comparables: 0.2,
      evaldamScore: 0.0,
    };
  }

  // Series A to B (₹5Cr to ₹50Cr ARR)
  if (arr < 500000000) {
    return {
      scorecard: 0.05,
      berkus: 0.0, // Exclude - not suitable for this stage
      vcMethod: 0.2,
      dcfLTG: 0.35,
      dcfMultiples: 0.25,
      comparables: 0.15,
      evaldamScore: 0.0,
    };
  }

  // Series B and beyond - GitHub scale (₹50Cr+ ARR)
  // Scorecard and Berkus excluded - designed for early stage only
  return {
    scorecard: 0.0, // Exclude
    berkus: 0.0, // Exclude
    vcMethod: 0.15,
    dcfLTG: 0.4,
    dcfMultiples: 0.3,
    comparables: 0.15,
    evaldamScore: 0.0,
  };
}

/**
 * Get stage name from ARR
 */
export function getCompanyStage(arr: number): string {
  if (arr < 1000000) return "Pre-Revenue / Angel / Seed";
  if (arr < 50000000) return "Seed to Series A";
  if (arr < 500000000) return "Series A to B";
  return "Series B+";
}

/**
 * Calculate weighted blended valuation
 */
export function calculateWeightedValuation(
  methods: {
    scorecard?: number;
    berkus?: number;
    vcMethod?: number;
    dcfLTG?: number;
    dcfMultiples?: number;
    comparables?: number;
    evaldamScore?: number;
  },
  weights: MethodWeights
): number {
  let total = 0;
  let weightSum = 0;

  if (methods.scorecard && weights.scorecard > 0) {
    total += methods.scorecard * weights.scorecard;
    weightSum += weights.scorecard;
  }

  if (methods.berkus && weights.berkus > 0) {
    total += methods.berkus * weights.berkus;
    weightSum += weights.berkus;
  }

  if (methods.vcMethod && weights.vcMethod > 0) {
    total += methods.vcMethod * weights.vcMethod;
    weightSum += weights.vcMethod;
  }

  if (methods.dcfLTG && weights.dcfLTG > 0) {
    total += methods.dcfLTG * weights.dcfLTG;
    weightSum += weights.dcfLTG;
  }

  if (methods.dcfMultiples && weights.dcfMultiples > 0) {
    total += methods.dcfMultiples * weights.dcfMultiples;
    weightSum += weights.dcfMultiples;
  }

  if (methods.comparables && weights.comparables > 0) {
    total += methods.comparables * weights.comparables;
    weightSum += weights.comparables;
  }

  if (methods.evaldamScore && weights.evaldamScore > 0) {
    total += methods.evaldamScore * weights.evaldamScore;
    weightSum += weights.evaldamScore;
  }

  return weightSum > 0 ? total / weightSum : 0;
}
