/**
 * Professional Data Validation Engine
 * Validates startup inputs against realistic ranges
 */

import { DataValidationResult, ValidationWarning, SuspiciousFlag } from "@/types/evidence";

export const REALISTIC_RANGES = {
  pre_revenue: {
    arr: { min: 0, max: 0 },
    monthly_growth_rate: { min: null, max: null },
    team_size: { min: 1, max: 50 },
    tam: { min: 1000000, max: null },
    customer_concentration: { warn_if_above: 0.8 }
  },
  seed: {
    arr: { min: 0, max: 5000000 },
    monthly_growth_rate: { min: -0.5, max: 1.0 },
    team_size: { min: 1, max: 25 },
    tam: { min: 1000000, max: null },
    customer_concentration: { warn_if_above: 0.8 }
  },
  series_a: {
    arr: { min: 500000, max: 25000000 },
    monthly_growth_rate: { min: -0.2, max: 0.5 },
    team_size: { min: 5, max: 50 },
    tam: { min: 10000000, max: null },
    customer_concentration: { warn_if_above: 0.6 }
  },
  series_b_plus: {
    arr: { min: 5000000, max: null },
    monthly_growth_rate: { min: -0.1, max: 0.3 },
    team_size: { min: 25, max: null },
    tam: { min: 100000000, max: null },
    customer_concentration: { warn_if_above: 0.4 }
  }
} as const;

export function validateStartupProfile(profile: any): DataValidationResult {
  const warnings: ValidationWarning[] = [];
  const errors: any[] = [];
  const needs_verification: string[] = [];

  const stage = profile.stage || "seed";
  const ranges = REALISTIC_RANGES[stage as keyof typeof REALISTIC_RANGES] || REALISTIC_RANGES.seed;

  // ARR Validation
  if (profile.arr !== undefined && profile.arr !== null) {
    if (profile.arr < 0) {
      errors.push({
        field: "arr",
        message: "ARR cannot be negative."
      });
    }
  }

  // Growth Rate Validation
  if (profile.monthly_growth_rate !== undefined && profile.monthly_growth_rate !== null) {
    if (profile.monthly_growth_rate > (ranges.monthly_growth_rate.max || 1.0)) {
      warnings.push({
        field: "monthly_growth_rate",
        message: `${(profile.monthly_growth_rate * 100).toFixed(1)}% MoM is exceptional. Verify this is accurate.`,
        severity: "high"
      });
      needs_verification.push("monthly_growth_rate");
    }
  }

  // Team Size Validation
  if (profile.team_size !== undefined && profile.team_size !== null) {
    if (profile.team_size < (ranges.team_size.min || 1)) {
      errors.push({
        field: "team_size",
        message: `Cannot valuate ${stage} company with <${ranges.team_size.min} team members.`
      });
    }
  }

  // ARR vs TAM
  if (profile.arr && profile.total_addressable_market && profile.arr > profile.total_addressable_market) {
    errors.push({
      field: "arr_vs_tam",
      message: "ARR cannot exceed TAM."
    });
  }

  // Concentration Risk
  if (profile.customer_concentration && profile.customer_concentration > (ranges.customer_concentration.warn_if_above || 0.8)) {
    warnings.push({
      field: "customer_concentration",
      message: `${(profile.customer_concentration * 100).toFixed(0)}% from top customer is high risk.`,
      severity: "high"
    });
    needs_verification.push("customer_concentration");
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
    needs_verification
  };
}

export function calculateSuspiciousFlags(profile: any): SuspiciousFlag[] {
  const flags: SuspiciousFlag[] = [];

  if (profile.customer_concentration && profile.customer_concentration > 0.6) {
    flags.push({
      field: "customer_concentration",
      flag: "concentration_risk",
      impact_on_valuation: -0.25,
      recommendation: "High concentration reduces valuation by ~25%."
    });
  }

  if (profile.monthly_growth_rate && profile.monthly_growth_rate > 0.75) {
    flags.push({
      field: "monthly_growth_rate",
      flag: "exceptional_growth",
      impact_on_valuation: 0.15,
      recommendation: "Exceptional growth. Verify sustainability."
    });
  }

  return flags;
}

export function calculateDataQualityScore(profile: any): number {
  let score = 100;
  const required = ["arr", "monthly_growth_rate", "team_size"];
  
  required.forEach(field => {
    if (!profile[field]) score -= 20;
  });

  const validation = validateStartupProfile(profile);
  score -= validation.warnings.length * 5;
  score -= validation.errors.length * 15;

  return Math.max(0, Math.min(100, score));
}
