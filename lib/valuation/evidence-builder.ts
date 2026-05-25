import { StartupProfile, ValuationMethodResult } from "@/types";
import type { DataSource } from "@/types/evidence";

const METHOD_NAME_MAP: Record<string, string> = {
  scorecard: "scorecard",
  berkus: "berkus",
  vc: "vc_method",
  "dcf-ltg": "dcf_ltg",
  "dcf-multiples": "dcf_multiples",
  comparables: "comparables",
  "evaldam-score": "evaldam_score",
};

export function toPersistableMethodName(methodName: string): string | null {
  return METHOD_NAME_MAP[methodName] || null;
}

export function buildMethodEvidenceRows(params: {
  valuationId: string;
  startupId: string;
  profile: Partial<StartupProfile>;
  methods: ValuationMethodResult[];
  methodBreakdown?: Record<string, { estimate: number; weight: number }>;
}) {
  const { valuationId, startupId, profile, methods, methodBreakdown = {} } = params;

  return methods
    .map((method) => {
      const methodName = toPersistableMethodName(method.methodName);
      if (!methodName) return null;
      const weight = methodBreakdown[method.methodName]?.weight;

      return {
        valuation_id: valuationId,
        startup_id: startupId,
        method_name: methodName,
        method_display_name: getMethodDisplayName(method.methodName),
        low_estimate: method.lowEstimate,
        mid_estimate: method.midEstimate,
        high_estimate: method.highEstimate,
        confidence: method.confidence,
        method_inputs: {
          ...buildMethodInputs(profile, method),
          blendWeight: typeof weight === "number" ? weight : null,
        },
        calculation_steps: buildCalculationSteps(method),
        assumptions: {
          ...(method.assumptions || {}),
          blendWeight: typeof weight === "number" ? weight : null,
          inputTrace: buildInputTrace(profile),
        },
        benchmarks_used: {
          sources: method.sources || [],
          generatedAt: new Date().toISOString(),
          sourceReliability: classifySources(method.sources || []),
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
    monthlyRecurringRevenue: profile.monthlyRecurringRevenue || 0,
    monthlyGrowthRate: profile.monthlyGrowthRate || 0,
    totalAddressableMarket: profile.totalAddressableMarket || 0,
    customerCount: profile.customerCount || 0,
    grossMargin: profile.grossMargin || 0,
    customerConcentration: profile.customerConcentration || 0,
    runwayMonths: profile.runwayMonths || 0,
    teamSize: profile.team?.length || 0,
    fundingRaised: profile.totalFunded || 0,
    marketDescription: profile.marketDescription || "",
    competitiveAdvantage: profile.competitiveAdvantage || "",
    patentCount: profile.patentCount || 0,
    moatScore: profile.moatScore || 0,
    sourceFingerprint: buildSourceFingerprint(profile),
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

export function buildInputEvidenceRows(params: {
  valuationId: string;
  startupId: string;
  profile: Partial<StartupProfile>;
}) {
  const { valuationId, profile } = params;
  return buildInputTrace(profile).map((entry) => ({
    valuation_id: valuationId,
    evidence_type: "data_source",
    evidence_key: entry.key,
    evidence_value: {
      label: entry.label,
      value: entry.value,
      present: entry.present,
      verification_status: entry.verificationStatus,
    },
    source: entry.source,
    source_date: new Date().toISOString(),
    source_confidence: entry.confidence,
    input_data: entry,
    calculated_by: "input_snapshot",
  }));
}

export function buildInputTrace(profile: Partial<StartupProfile>) {
  const profileWithExtras = profile as Partial<StartupProfile> & {
    description?: string;
    teamSize?: number;
  };
  const rows = [
    inputTrace("companyName", "Company name", profile.companyName, "user_input", 90),
    inputTrace("stage", "Company stage", profile.stage, "user_input", 90),
    inputTrace("industry", "Industry", profile.industry, "user_input", 80),
    inputTrace("websiteUrl", "Website URL", profile.websiteUrl, profile.extractedFromUrl ? "website_extracted" : "user_input", profile.extractedFromUrl ? 70 : 80),
    inputTrace("description", "Description", profileWithExtras.description || profile.marketDescription, profile.extractedFromUrl ? "website_extracted" : "user_input", profile.extractedFromUrl ? 65 : 75),
    inputTrace("annualRecurringRevenue", "ARR", profile.annualRecurringRevenue, "user_input", profile.annualRecurringRevenue ? 90 : 30),
    inputTrace("monthlyRecurringRevenue", "MRR", profile.monthlyRecurringRevenue, "user_input", profile.monthlyRecurringRevenue ? 90 : 30),
    inputTrace("monthlyGrowthRate", "Monthly growth", profile.monthlyGrowthRate, "user_input", profile.monthlyGrowthRate ? 85 : 30),
    inputTrace("grossMargin", "Gross margin", profile.grossMargin, "user_input", profile.grossMargin ? 75 : 25),
    inputTrace("customerCount", "Customer count", profile.customerCount, "user_input", profile.customerCount ? 75 : 25),
    inputTrace("customerConcentration", "Customer concentration", profile.customerConcentration, "user_input", profile.customerConcentration ? 70 : 25),
    inputTrace("runwayMonths", "Runway months", profile.runwayMonths, "user_input", profile.runwayMonths ? 75 : 25),
    inputTrace("totalAddressableMarket", "TAM", profile.totalAddressableMarket, "user_input", profile.totalAddressableMarket ? 70 : 25),
    inputTrace("teamSize", "Team size", profile.team?.length || profileWithExtras.teamSize, "user_input", profile.team?.length || profileWithExtras.teamSize ? 80 : 25),
    inputTrace("totalFunded", "Total funding raised", profile.totalFunded, "user_input", profile.totalFunded ? 75 : 25),
    inputTrace("competitiveAdvantage", "Competitive advantage", profile.competitiveAdvantage, "user_input", profile.competitiveAdvantage ? 65 : 20),
    inputTrace("patentCount", "Patent/IP count", profile.patentCount, "user_input", profile.patentCount ? 70 : 20),
    inputTrace("moatScore", "Moat score", profile.moatScore, "user_input", profile.moatScore ? 60 : 20),
  ];

  return rows;
}

function inputTrace(key: string, label: string, value: unknown, source: DataSource, confidence: number) {
  const present = value !== null && value !== undefined && value !== "" && value !== 0;
  return {
    key,
    label,
    value: present ? value : null,
    source,
    confidence: present ? confidence : Math.min(confidence, 30),
    present,
    verificationStatus: source === "user_input" ? "unverified_founder_input" : "system_extracted_needs_review",
  };
}

function buildSourceFingerprint(profile: Partial<StartupProfile>) {
  return {
    extractedFromUrl: profile.extractedFromUrl || null,
    autoExtractionScore: profile.autoExtractionScore || null,
    generatedAt: new Date().toISOString(),
  };
}

function classifySources(sources: string[]) {
  if (sources.length === 0) return "fallback_or_internal_assumption";
  if (sources.some((source) => /fallback|default|assumption/i.test(source))) return "mixed_or_fallback";
  return "cited_by_method";
}

function getMethodDisplayName(methodName: string): string {
  const names: Record<string, string> = {
    scorecard: "Scorecard Method",
    berkus: "Berkus Method",
    vc: "Venture Capital Method",
    "dcf-ltg": "DCF Long-Term Growth",
    "dcf-multiples": "DCF Multiples",
    comparables: "Comparable Company Method",
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
    comparables: "Benchmarks the startup against comparable companies, funding rounds, and revenue multiples.",
    "evaldam-score": "Supporting proprietary score based on structured risk and quality factors; not a primary finance method.",
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
    comparables: "Accuracy depends on peer relevance, data freshness, and whether comparables are verified or fallback benchmarks.",
    "evaldam-score": "A supporting signal only; it should not replace statutory valuation methods or verified market evidence.",
  };
  return limitations[methodName] || "Review assumptions and source data before relying on this method independently.";
}
