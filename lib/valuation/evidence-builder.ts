import { StartupProfile, ValuationMethodResult } from "@/types";

const METHOD_NAME_MAP: Record<string, string> = {
  scorecard: "scorecard",
  berkus: "berkus",
  vc: "vc_method",
  "dcf-ltg": "dcf_ltg",
  "dcf-multiples": "dcf_multiples",
};

export function toPersistableMethodName(methodName: string): string | null {
  return METHOD_NAME_MAP[methodName] || null;
}

export function buildMethodEvidenceRows(params: {
  valuationId: string;
  startupId: string;
  profile: Partial<StartupProfile>;
  methods: ValuationMethodResult[];
}) {
  const { valuationId, startupId, profile, methods } = params;

  return methods
    .map((method) => {
      const methodName = toPersistableMethodName(method.methodName);
      if (!methodName) return null;

      return {
        valuation_id: valuationId,
        startup_id: startupId,
        method_name: methodName,
        method_display_name: getMethodDisplayName(method.methodName),
        low_estimate: method.lowEstimate,
        mid_estimate: method.midEstimate,
        high_estimate: method.highEstimate,
        confidence: method.confidence,
        method_inputs: buildMethodInputs(profile, method),
        calculation_steps: buildCalculationSteps(method),
        assumptions: method.assumptions || {},
        benchmarks_used: {
          sources: method.sources || [],
          generatedAt: new Date().toISOString(),
        },
        methodology_explanation: getMethodologyExplanation(method.methodName),
        key_factors_explanation: method.reasoning || "",
        limitations: getMethodLimitations(method.methodName),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
}

function buildMethodInputs(profile: Partial<StartupProfile>, method: ValuationMethodResult) {
  return {
    companyName: profile.companyName,
    stage: profile.stage,
    industry: profile.industry,
    annualRecurringRevenue: profile.annualRecurringRevenue || 0,
    monthlyGrowthRate: profile.monthlyGrowthRate || 0,
    totalAddressableMarket: profile.totalAddressableMarket || 0,
    customerCount: profile.customerCount || 0,
    teamSize: profile.team?.length || 0,
    fundingRaised: profile.totalFunded || 0,
    methodName: method.methodName,
  };
}

function buildCalculationSteps(method: ValuationMethodResult) {
  return {
    lowEstimate: method.lowEstimate,
    midEstimate: method.midEstimate,
    highEstimate: method.highEstimate,
    reasoning: method.reasoning,
    assumptionsUsed: method.assumptions || {},
  };
}

function getMethodDisplayName(methodName: string): string {
  const names: Record<string, string> = {
    scorecard: "Scorecard Method",
    berkus: "Berkus Method",
    vc: "Venture Capital Method",
    "dcf-ltg": "DCF Long-Term Growth",
    "dcf-multiples": "DCF Multiples",
    "evaldam-score": "Evaldam Score",
  };
  return names[methodName] || methodName;
}

function getMethodologyExplanation(methodName: string): string {
  const explanations: Record<string, string> = {
    scorecard: "Benchmarks the company against comparable early-stage startups using weighted qualitative factors.",
    berkus: "Assigns value to early-stage execution milestones before predictable revenue exists.",
    vc: "Estimates exit value and discounts back using investor return expectations.",
    "dcf-ltg": "Projects future cash flows and terminal value, discounted using WACC.",
    "dcf-multiples": "Applies market valuation multiples to company financial metrics.",
  };
  return explanations[methodName] || "Structured valuation method used in the professional report.";
}

function getMethodLimitations(methodName: string): string {
  const limitations: Record<string, string> = {
    scorecard: "Most reliable for early-stage companies with comparable market data; less suitable for mature revenue-stage companies.",
    berkus: "Best for pre-revenue companies; should be weighted down when actual revenue data is available.",
    vc: "Sensitive to exit multiple, dilution, and target return assumptions.",
    "dcf-ltg": "Sensitive to long-term growth, margin, and WACC assumptions.",
    "dcf-multiples": "Depends on the quality and freshness of comparable-company multiples.",
  };
  return limitations[methodName] || "Review assumptions and source data before relying on this method independently.";
}
