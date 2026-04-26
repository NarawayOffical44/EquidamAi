import { StartupProfile } from "@/types";

export interface ValidationResult {
  isValid: boolean;
  missingCritical: string[]; // Fields required for valuation
  missingOptional: string[]; // Fields that improve accuracy but not required
  score: number; // 0-100: data completeness
  recommendations: string[]; // User-friendly suggestions
}

export interface CriticalFieldRequirement {
  field: string;
  label: string;
  description: string;
  reason: string; // Why it's critical
  exampleValue: string;
}

/**
 * Critical data fields required for any valuation
 * If missing, ask user before proceeding
 */
const CRITICAL_FIELDS: CriticalFieldRequirement[] = [
  {
    field: "companyName",
    label: "Company Name",
    description: "Official company name",
    reason: "Identifies the company",
    exampleValue: "TechStartup AI",
  },
  {
    field: "stage",
    label: "Funding Stage",
    description: "Current stage (pre-revenue, seed, series-a, etc.)",
    reason: "Stage determines valuation methodology weights",
    exampleValue: "seed",
  },
  {
    field: "industry",
    label: "Industry",
    description: "Primary industry (saas, ai, fintech, deeptech, other)",
    reason: "Industry growth rates affect valuation 15-25%",
    exampleValue: "ai",
  },
  {
    field: "annualRecurringRevenue",
    label: "Annual Recurring Revenue (ARR)",
    description: "Annual revenue (use 0 if pre-revenue)",
    reason: "Revenue is key input to 4 of 5 methods",
    exampleValue: "150000",
  },
  {
    field: "team",
    label: "Team Size / Founders",
    description: "At least one founder with name and background",
    reason: "Team quality is 20-30% of valuation",
    exampleValue: "2 founders with 5+ years startup experience",
  },
];

/**
 * Optional fields that improve accuracy
 */
const OPTIONAL_FIELDS = [
  "monthlyGrowthRate",
  "customerCount",
  "totalAddressableMarket",
  "teamPreviousExits",
  "patentCount",
  "customerConcentration",
];

/**
 * Validate startup profile completeness
 * Returns missing fields that should be collected before valuation
 */
export function validateStartupProfile(
  profile: StartupProfile
): ValidationResult {
  const missingCritical: string[] = [];
  const missingOptional: string[] = [];
  let dataPoints = 0;

  // Check critical fields
  for (const field of CRITICAL_FIELDS) {
    const value = (profile as any)[field.field];

    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      missingCritical.push(field.field);
    } else {
      dataPoints++;
    }
  }

  // Check optional fields
  for (const field of OPTIONAL_FIELDS) {
    const value = (profile as any)[field];
    if (!value) {
      missingOptional.push(field);
    } else {
      dataPoints++;
    }
  }

  // Calculate completeness score
  const totalPossibleFields = CRITICAL_FIELDS.length + OPTIONAL_FIELDS.length;
  const score = Math.round((dataPoints / totalPossibleFields) * 100);

  // Generate recommendations
  const recommendations: string[] = [];

  if (missingCritical.length > 0) {
    recommendations.push(
      `Please provide: ${missingCritical
        .map((f) => CRITICAL_FIELDS.find((cf) => cf.field === f)?.label)
        .join(", ")}`
    );
  }

  if (score < 60 && missingOptional.length > 0) {
    recommendations.push(
      "For more accurate results, consider adding: " +
        missingOptional.slice(0, 3).join(", ")
    );
  }

  if (score >= 80) {
    recommendations.push("Data looks complete. Valuation should be highly accurate.");
  } else if (score >= 60) {
    recommendations.push(
      "Data is sufficient for valuation. More detail improves accuracy."
    );
  } else {
    recommendations.push(
      "Please fill in critical fields for accurate valuation."
    );
  }

  return {
    isValid: missingCritical.length === 0,
    missingCritical,
    missingOptional,
    score,
    recommendations,
  };
}

/**
 * Get user-friendly prompt for missing critical data
 */
export function getMissingDataPrompt(
  missingFields: string[]
): { title: string; fields: CriticalFieldRequirement[]; message: string } {
  const fields = missingFields
    .map((f) => CRITICAL_FIELDS.find((cf) => cf.field === f))
    .filter((f): f is CriticalFieldRequirement => f !== undefined);

  return {
    title: "Please Complete Your Startup Profile",
    fields,
    message: `We need a bit more info to generate an accurate valuation. These fields are important because they're key inputs to our methods:`,
  };
}

/**
 * Data completeness score impacts confidence level
 */
export function getConfidenceLevel(
  dataScore: number
): "high" | "medium" | "low" {
  if (dataScore >= 80) return "high";
  if (dataScore >= 60) return "medium";
  return "low";
}
