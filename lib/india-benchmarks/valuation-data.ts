/**
 * INDIA-SPECIFIC VALUATION BENCHMARKS
 * Critical data for accurate Indian startup valuations
 */

export interface IndiaBenchmarks {
  // Scorecard method
  scorecardBaseBySeedStage: Record<string, number>; // ₹ values for Indian context
  dpiitPremium: number; // % boost for DPIIT recognition
  iitIimPremium: number; // Founder education premium
  cityTierWeights: Record<string, number>;

  // Berkus method
  berkusCapIndia: number; // Indian pre-revenue cap
  acceleratorBonus: number; // For T-Hub, NSRCEL, YC India
  governmentGrantBonus: number; // DST, BIRAC, Startup India grants

  // VC method
  indianExitMultiples: Record<string, { min: number; max: number }>;
  indianAngelRoi: number; // 10-15x vs 30x US
  indianExitTimelineYears: number; // 7-10 years
  dilutionPerRound: number;

  // DCF
  rbiRepoRate: number; // India risk-free rate
  indiaCountryRiskPremium: number;
  currencyRiskPremium: number; // For USD costs
  sectorWaccAdjustments: Record<string, number>;

  // Exit multiples
  nsePublicMultiples: Record<string, number>; // NSE listed comps
  indianPrivateDeals: Record<string, { avgMultiple: number; dealCount: number }>;
}

export const INDIA_BENCHMARKS: IndiaBenchmarks = {
  // SCORECARD - Indian Angel Benchmarks
  scorecardBaseBySeedStage: {
    "pre-revenue": 25000000, // ₹2Cr typical angel round
    "seed": 40000000, // ₹4Cr seed round
    "series-a": 75000000, // ₹7.5Cr Series A
  },
  dpiitPremium: 0.15, // +15% for DPIIT recognition
  iitIimPremium: 0.20, // +20% for IIT/IIM founders
  cityTierWeights: {
    "tier-1": 1.0, // Bangalore, Mumbai, Delhi baseline
    "tier-2": 0.75, // Pune, Hyderabad, Chennai
    "tier-3": 0.55, // Other cities
  },

  // BERKUS - Indian Pre-Revenue Caps
  berkusCapIndia: 30000000, // ₹3Cr max (vs ₹2.5M in global)
  acceleratorBonus: 0.25, // +25% for T-Hub, NSRCEL backing
  governmentGrantBonus: 0.15, // +15% for govt grants

  // VC METHOD - Indian Exit Multiples & ROI
  indianExitMultiples: {
    fintech: { min: 3, max: 6 }, // 3-6x revenue
    saas: { min: 3, max: 5 }, // 3-5x revenue (lower than US)
    d2c: { min: 1, max: 3 }, // 1-3x revenue
    healthcare: { min: 4, max: 8 }, // 4-8x EBITDA
    deeptech: { min: 2, max: 5 }, // 2-5x (risky)
    consumer: { min: 1, max: 2 }, // 1-2x revenue
  },
  indianAngelRoi: 12, // 12x average (10-15x range) vs 30x US
  indianExitTimelineYears: 8, // 7-10 years realistic
  dilutionPerRound: 0.25, // 25% dilution per round

  // DCF - India-Specific Rates
  rbiRepoRate: 0.065, // 6.5% current RBI repo rate
  indiaCountryRiskPremium: 0.035, // +3.5% India-specific risk
  currencyRiskPremium: 0.02, // +2% for USD cost exposure
  sectorWaccAdjustments: {
    fintech: 0.12, // 12% (regulated, higher risk)
    saas: 0.11, // 11% (standard SaaS)
    healthcare: 0.13, // 13% (regulatory heavy)
    deeptech: 0.14, // 14% (high tech risk)
    consumer: 0.10, // 10% (lower risk)
  },

  // EXIT MULTIPLES - NSE/BSE Comps & Private Deals
  nsePublicMultiples: {
    "infibeam-avenues": 2.5, // SaaS/fintech
    "nykaa": 1.8, // D2C
    "policybazaar": 3.2, // Fintech
    "zomato": 4.5, // Marketplace
    "paytm": 2.1, // Fintech (post-IPO correction)
  },
  indianPrivateDeals: {
    fintech: { avgMultiple: 4.2, dealCount: 45 }, // 45 deals @ 4.2x median
    saas: { avgMultiple: 3.5, dealCount: 32 },
    d2c: { avgMultiple: 2.1, dealCount: 28 },
    healthtech: { avgMultiple: 3.8, dealCount: 18 },
  },
};

/**
 * Calculate India-adjusted Scorecard base
 */
export function getIndiaScorecardBase(stage: string, location: string, isDpiit: boolean, isIitIim: boolean): number {
  let base = INDIA_BENCHMARKS.scorecardBaseBySeedStage[stage] || 25000000;

  // Apply city tier adjustment
  const cityTier = location.includes("bangalore") || location.includes("mumbai") || location.includes("delhi")
    ? "tier-1"
    : location.includes("pune") || location.includes("hyderabad") || location.includes("chennai")
    ? "tier-2"
    : "tier-3";

  base *= INDIA_BENCHMARKS.cityTierWeights[cityTier];

  // Apply founder premium
  if (isDpiit) base *= 1 + INDIA_BENCHMARKS.dpiitPremium;
  if (isIitIim) base *= 1 + INDIA_BENCHMARKS.iitIimPremium;

  return Math.round(base);
}

/**
 * Get India-appropriate exit multiple by sector
 */
export function getIndianExitMultiple(sector: string, isBootstrapped: boolean = false): number {
  const multiples = INDIA_BENCHMARKS.indianExitMultiples[sector.toLowerCase()] || { min: 2, max: 4 };

  // Bootstrapped profitable companies get higher multiple
  const multiple = isBootstrapped ? multiples.max : (multiples.min + multiples.max) / 2;

  return multiple;
}

/**
 * Calculate India-specific WACC
 */
export function calculateIndiaWACC(sector: string = "saas"): number {
  const baseWacc = INDIA_BENCHMARKS.rbiRepoRate +
                   INDIA_BENCHMARKS.indiaCountryRiskPremium +
                   INDIA_BENCHMARKS.currencyRiskPremium;

  const sectorAdjustment = INDIA_BENCHMARKS.sectorWaccAdjustments[sector.toLowerCase()] || 0.11;

  return sectorAdjustment;
}

/**
 * Get Indian comparable exit multiple (NSE/BSE or private deal)
 */
export function getIndianComparableMultiple(sector: string, usePublic: boolean = false): number {
  if (usePublic) {
    // Average of NSE public multiples
    const values = Object.values(INDIA_BENCHMARKS.nsePublicMultiples);
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  // Use private deal data
  const deals = INDIA_BENCHMARKS.indianPrivateDeals[sector.toLowerCase()];
  return deals?.avgMultiple || 3.0;
}
