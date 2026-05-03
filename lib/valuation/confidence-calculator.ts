/**
 * Confidence Score Calculator
 * Determines how confident we should be in a valuation based on data completeness
 * Range: 0-100%
 */

export interface ConfidenceInputs {
  // URL extracted (baseline)
  companyName?: boolean;
  industry?: boolean;
  description?: boolean;
  foundedYear?: boolean;

  // Financial inputs (high value)
  annualRevenue?: boolean;
  growthRate?: boolean;
  burnRate?: boolean;
  runway?: boolean;

  // Team inputs
  teamSize?: boolean;
  founderExits?: boolean;
  teamExperience?: boolean;

  // Market inputs
  tam?: boolean;
  competition?: boolean;

  // Funding inputs
  fundingRounds?: boolean;
  totalRaised?: boolean;
  investors?: boolean;
  valuation?: boolean;

  // External data
  employeeCount?: boolean;
  mcaFiling?: boolean;
  newsSignals?: boolean;
}

export interface ConfidenceResult {
  score: number; // 0-100
  label: "low" | "medium" | "high";
  color: "red" | "amber" | "green";
  message: string;
  nextSteps: string[];
  fieldsToAdd: string[];
}

/**
 * Calculate confidence score based on data completeness
 */
export function calculateConfidenceScore(inputs: ConfidenceInputs): number {
  let score = 0;

  // URL extracted (baseline) - 5 points each = 20 total
  if (inputs.companyName) score += 5;
  if (inputs.industry) score += 5;
  if (inputs.description) score += 5;
  if (inputs.foundedYear) score += 5;

  // Financial inputs (high value) - 10-20 points each = 55 total
  if (inputs.annualRevenue) score += 20;
  if (inputs.growthRate) score += 15;
  if (inputs.burnRate) score += 10;
  if (inputs.runway) score += 10;

  // Team inputs - 5 points each = 15 total
  if (inputs.teamSize) score += 5;
  if (inputs.founderExits) score += 5;
  if (inputs.teamExperience) score += 5;

  // Market inputs - 5 points each = 10 total
  if (inputs.tam) score += 5;
  if (inputs.competition) score += 5;

  // Funding inputs (fetched automatically) - 5-10 points each = 35 total
  if (inputs.fundingRounds) score += 10;
  if (inputs.totalRaised) score += 10;
  if (inputs.investors) score += 5;
  if (inputs.valuation) score += 10;

  // External data (fetched automatically) - 5-10 points each = 25 total
  if (inputs.employeeCount) score += 10;
  if (inputs.mcaFiling) score += 5;
  if (inputs.newsSignals) score += 10;

  return Math.min(score, 100);
}

/**
 * Get confidence label and recommendations
 */
export function getConfidenceLabel(score: number): ConfidenceResult {
  if (score < 30) {
    return {
      score,
      label: "low",
      color: "red",
      message: "⚠️ Low confidence - Data too sparse for accurate valuation",
      nextSteps: [
        "Add your company's annual revenue",
        "Enter month-over-month growth rate",
        "Provide team size",
      ],
      fieldsToAdd: ["annualRevenue", "growthRate", "teamSize"],
    };
  }

  if (score < 60) {
    return {
      score,
      label: "medium",
      color: "amber",
      message: "📊 Medium confidence - Good progress, add financials for full report",
      nextSteps: [
        "Add burn rate and runway if early-stage",
        "Include total funding raised",
        "Specify your target market size (TAM)",
      ],
      fieldsToAdd: ["burnRate", "totalRaised", "tam"],
    };
  }

  return {
    score,
    label: "high",
    color: "green",
    message: "✅ High confidence - Ready for professional report",
    nextSteps: [
      "View detailed methodology",
      "Download as PDF",
      "Share with investors",
    ],
    fieldsToAdd: [],
  };
}

/**
 * Determine if valuation is reliable enough for signups
 */
export function isValuationReliable(score: number): boolean {
  return score >= 60;
}

/**
 * Get feature unlock status based on confidence
 */
export function getUnlockedFeatures(score: number): {
  canViewValuation: boolean;
  canViewBreakdown: boolean;
  canDownloadPDF: boolean;
  canShareReport: boolean;
} {
  return {
    canViewValuation: score >= 20, // Always show something
    canViewBreakdown: score >= 40, // Method details at 40%
    canDownloadPDF: score >= 60, // PDF at 60%
    canShareReport: score >= 75, // Full sharing at 75%
  };
}
