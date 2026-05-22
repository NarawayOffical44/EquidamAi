export type PlanKey = "free" | "startup" | "agency" | "enterprise";
export type LegacyBillingPlanKey = "pro" | "plus" | "enterprise";
export type PlanPeriod = "day" | "month";

export interface PlanLimitConfig {
  key: PlanKey;
  displayName: string;
  targetUser: string;
  billingAlias: LegacyBillingPlanKey | null;
  valuationPreviews: {
    limit: number;
    period: PlanPeriod;
  };
  startupProfiles: number;
  draftOnly: boolean;
  teamSeats: number;
  aiQuestions: {
    limit: number;
    period: PlanPeriod;
  };
  aiPromptCharacterLimit: number | null;
  reportsPerMonth: number;
  pdfExport: boolean;
  fullReport: boolean;
  evaldamAiScore: boolean;
  portfolioDashboard: "none" | "standard" | "advanced";
  whiteLabelReports: boolean;
}

export const UNLIMITED_LIMIT = 999999;
export const FREE_AI_PROMPT_CHARACTER_LIMIT = 1000;

export const ANONYMOUS_AI_LIMIT = {
  limit: 3,
  period: "day" as const,
  promptCharacterLimit: FREE_AI_PROMPT_CHARACTER_LIMIT,
};

export const PLAN_LIMITS: Record<PlanKey, PlanLimitConfig> = {
  free: {
    key: "free",
    displayName: "Free",
    targetUser: "Early explorers",
    billingAlias: null,
    valuationPreviews: { limit: 5, period: "month" },
    startupProfiles: 1,
    draftOnly: true,
    teamSeats: 0,
    aiQuestions: { limit: 10, period: "month" },
    aiPromptCharacterLimit: FREE_AI_PROMPT_CHARACTER_LIMIT,
    reportsPerMonth: 3,
    pdfExport: true,
    fullReport: true,
    evaldamAiScore: false,
    portfolioDashboard: "none",
    whiteLabelReports: false,
  },
  startup: {
    key: "startup",
    displayName: "Startup",
    targetUser: "Individual founders",
    billingAlias: "pro",
    valuationPreviews: { limit: UNLIMITED_LIMIT, period: "month" },
    startupProfiles: 1,
    draftOnly: false,
    teamSeats: 0,
    aiQuestions: { limit: 100, period: "month" },
    aiPromptCharacterLimit: null,
    reportsPerMonth: 3,
    pdfExport: true,
    fullReport: true,
    evaldamAiScore: true,
    portfolioDashboard: "none",
    whiteLabelReports: false,
  },
  agency: {
    key: "agency",
    displayName: "Agency / Investor",
    targetUser: "Agencies, micro VCs, incubators",
    billingAlias: "plus",
    valuationPreviews: { limit: UNLIMITED_LIMIT, period: "month" },
    startupProfiles: 10,
    draftOnly: false,
    teamSeats: 5,
    aiQuestions: { limit: 500, period: "month" },
    aiPromptCharacterLimit: null,
    reportsPerMonth: 25,
    pdfExport: true,
    fullReport: true,
    evaldamAiScore: true,
    portfolioDashboard: "standard",
    whiteLabelReports: false,
  },
  enterprise: {
    key: "enterprise",
    displayName: "Enterprise",
    targetUser: "Large funds & platforms",
    billingAlias: "enterprise",
    valuationPreviews: { limit: UNLIMITED_LIMIT, period: "month" },
    startupProfiles: UNLIMITED_LIMIT,
    draftOnly: false,
    teamSeats: UNLIMITED_LIMIT,
    aiQuestions: { limit: 5000, period: "month" },
    aiPromptCharacterLimit: null,
    reportsPerMonth: UNLIMITED_LIMIT,
    pdfExport: true,
    fullReport: true,
    evaldamAiScore: true,
    portfolioDashboard: "advanced",
    whiteLabelReports: true,
  },
};

export function normalizePlanKey(plan?: string | null, planActive: boolean | null = true): PlanKey {
  if (planActive === false) return "free";

  const normalized = String(plan || "free").trim().toLowerCase();

  if (normalized === "startup" || normalized === "pro" || normalized === "professional" || normalized === "founder") {
    return "startup";
  }

  if (
    normalized === "agency" ||
    normalized === "investor" ||
    normalized === "plus" ||
    normalized === "business" ||
    normalized === "advisor"
  ) {
    return "agency";
  }

  if (normalized === "enterprise") {
    return "enterprise";
  }

  return "free";
}

export function getPlanLimits(plan?: string | null, planActive: boolean | null = true): PlanLimitConfig {
  return PLAN_LIMITS[normalizePlanKey(plan, planActive)];
}

export function getPlanDisplayName(plan?: string | null, planActive: boolean | null = true) {
  return getPlanLimits(plan, planActive).displayName;
}

export function toLegacyBillingPlan(plan?: string | null): LegacyBillingPlanKey | null {
  return PLAN_LIMITS[normalizePlanKey(plan)].billingAlias;
}

export function isPaidPlan(plan?: string | null, planActive?: boolean | null) {
  return normalizePlanKey(plan, planActive) !== "free";
}

export function formatLimitValue(value: number) {
  return value >= UNLIMITED_LIMIT ? "Unlimited" : String(value);
}
