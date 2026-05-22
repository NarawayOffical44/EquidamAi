export type OnboardingRole = "founder" | "investor_agency";

export type FounderStage = "pre-revenue" | "seed" | "series-a" | "series-b+";
export type FundraisingTimeline = "yes" | "planning" | "no";

export type OrganizationType =
  | "investor"
  | "angel_network"
  | "incubator"
  | "agency"
  | "other";

export type PortfolioAiInterest = "yes" | "maybe" | "no";

export type StageFocus = "pre-revenue" | "seed" | "series-a" | "series-b+" | "growth";

export interface FounderOnboardingData {
  current_stage: FounderStage;
  fundraising_timeline: FundraisingTimeline;
  team_size_estimate: number;
}

export interface InvestorAgencyOnboardingData {
  organization_type: OrganizationType;
  portfolio_size: number;
  stage_focus: StageFocus[];
  portfolio_ai_interest: PortfolioAiInterest;
}

export type AccountOnboardingData = FounderOnboardingData | InvestorAgencyOnboardingData;

export interface AccountOnboardingPayload {
  role: OnboardingRole;
  data: AccountOnboardingData;
}

export interface SalesQualification {
  segment: string;
  scale_band: string;
  intent_level: "low" | "medium" | "high";
  lead_priority: "low" | "medium" | "high";
  recommended_plan: "free" | "startup" | "agency" | "enterprise";
}

const founderStages = new Set<FounderStage>(["pre-revenue", "seed", "series-a", "series-b+"]);
const fundraisingTimelines = new Set<FundraisingTimeline>(["yes", "planning", "no"]);
const organizationTypes = new Set<OrganizationType>([
  "investor",
  "angel_network",
  "incubator",
  "agency",
  "other",
]);
const portfolioAiInterest = new Set<PortfolioAiInterest>(["yes", "maybe", "no"]);
const stageFocusValues = new Set<StageFocus>(["pre-revenue", "seed", "series-a", "series-b+", "growth"]);

export function normalizeAccountOnboardingPayload(input: unknown): AccountOnboardingPayload {
  if (!input || typeof input !== "object") {
    throw new Error("Onboarding answers are required.");
  }

  const raw = input as Record<string, unknown>;
  const role = raw.role;
  const data = raw.data;

  if (role !== "founder" && role !== "investor_agency") {
    throw new Error("Choose Startup / Founder or Investor / Agency.");
  }

  if (!data || typeof data !== "object") {
    throw new Error("Complete the onboarding questions.");
  }

  const rawData = data as Record<string, unknown>;

  if (role === "founder") {
    const currentStage = String(rawData.current_stage || "");
    const fundraisingTimeline = String(rawData.fundraising_timeline || "");
    const teamSize = toPositiveInteger(rawData.team_size_estimate, "Team size");

    if (!founderStages.has(currentStage as FounderStage)) {
      throw new Error("Choose your current startup stage.");
    }
    if (!fundraisingTimelines.has(fundraisingTimeline as FundraisingTimeline)) {
      throw new Error("Choose your fundraising timeline.");
    }

    return {
      role,
      data: {
        current_stage: currentStage as FounderStage,
        fundraising_timeline: fundraisingTimeline as FundraisingTimeline,
        team_size_estimate: teamSize,
      },
    };
  }

  const organizationType = String(rawData.organization_type || "");
  const portfolioSize = toNonNegativeInteger(rawData.portfolio_size, "Portfolio size");
  const stageFocus = Array.isArray(rawData.stage_focus)
    ? rawData.stage_focus.map((item) => String(item)).filter((item) => stageFocusValues.has(item as StageFocus))
    : [];
  const interest = String(rawData.portfolio_ai_interest || "");

  if (!organizationTypes.has(organizationType as OrganizationType)) {
    throw new Error("Choose your organization type.");
  }
  if (stageFocus.length === 0) {
    throw new Error("Choose at least one startup stage you work with.");
  }
  if (!portfolioAiInterest.has(interest as PortfolioAiInterest)) {
    throw new Error("Choose your portfolio AI interest.");
  }

  return {
    role,
    data: {
      organization_type: organizationType as OrganizationType,
      portfolio_size: portfolioSize,
      stage_focus: stageFocus as StageFocus[],
      portfolio_ai_interest: interest as PortfolioAiInterest,
    },
  };
}

export function deriveSalesQualification(payload: AccountOnboardingPayload): SalesQualification {
  if (payload.role === "founder") {
    const data = payload.data as FounderOnboardingData;
    const isRaising = data.fundraising_timeline === "yes" || data.fundraising_timeline === "planning";
    const scaleBand = data.team_size_estimate >= 25
      ? "larger_startup_team"
      : data.team_size_estimate >= 8
        ? "growing_startup_team"
        : data.team_size_estimate >= 2
          ? "small_startup_team"
          : "solo_founder";

    return {
      segment: "startup_founder",
      scale_band: scaleBand,
      intent_level: isRaising ? "high" : "medium",
      lead_priority: isRaising || data.team_size_estimate >= 8 ? "high" : "medium",
      recommended_plan: data.team_size_estimate >= 15 ? "agency" : "startup",
    };
  }

  const data = payload.data as InvestorAgencyOnboardingData;
  const scaleBand = data.portfolio_size >= 75
    ? "enterprise_portfolio"
    : data.portfolio_size >= 25
      ? "large_portfolio"
      : data.portfolio_size >= 8
        ? "mid_portfolio"
        : "small_portfolio";
  const interestScore = data.portfolio_ai_interest === "yes" ? 2 : data.portfolio_ai_interest === "maybe" ? 1 : 0;
  const scaleScore = data.portfolio_size >= 25 ? 2 : data.portfolio_size >= 8 ? 1 : 0;
  const priorityScore = interestScore + scaleScore;

  return {
    segment: data.organization_type,
    scale_band: scaleBand,
    intent_level: priorityScore >= 3 ? "high" : priorityScore >= 1 ? "medium" : "low",
    lead_priority: priorityScore >= 3 ? "high" : priorityScore >= 1 ? "medium" : "low",
    recommended_plan: data.portfolio_size >= 50
        ? "enterprise"
        : data.portfolio_size >= 8 || data.organization_type === "agency"
          ? "agency"
          : "startup",
  };
}

function toPositiveInteger(value: unknown, label: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`${label} must be at least 1.`);
  }
  return Math.round(parsed);
}

function toNonNegativeInteger(value: unknown, label: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be 0 or higher.`);
  }
  return Math.round(parsed);
}
