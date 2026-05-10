import type { ConfidenceInputs } from "@/lib/valuation/confidence-calculator";
import type { StartupProfile } from "@/types";

type MethodSignalInput = {
  name: string;
  value: number;
  confidence: "high" | "medium" | "low";
};

type PublicComparisonInput = {
  match: "aligned" | "conservative" | "aggressive";
  variance: number;
  recommendation: string;
} | null;

export type SignalAnalysis = {
  valueDrivers: string[];
  evidenceGaps: string[];
  investorObjections: string[];
  nextValueLevers: string[];
  methodSignals: string[];
};

const formatMoney = (value: number) => {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
};

const methodLabel = (name: string) => {
  const labels: Record<string, string> = {
    scorecard: "Scorecard",
    berkus: "Berkus",
    dcfLTG: "DCF long-term growth",
    evalDamScore: "Evaldam Score",
  };
  return labels[name] || name;
};

function pushUnique(list: string[], item: string, limit: number) {
  if (list.length >= limit) return;
  if (!list.includes(item)) list.push(item);
}

export function buildSignalAnalysis({
  profile,
  confidence,
  confidenceScore,
  methods,
  publicComparison,
  rangeLow,
  rangeHigh,
}: {
  profile: StartupProfile;
  confidence: ConfidenceInputs;
  confidenceScore: number;
  methods: MethodSignalInput[];
  publicComparison: PublicComparisonInput;
  rangeLow: number;
  rangeHigh: number;
}): SignalAnalysis {
  const valueDrivers: string[] = [];
  const evidenceGaps: string[] = [];
  const investorObjections: string[] = [];
  const nextValueLevers: string[] = [];
  const methodSignals: string[] = [];

  const arr = profile.annualRecurringRevenue || 0;
  const growth = profile.monthlyGrowthRate || 0;
  const teamSize = profile.team?.length || 0;
  const tam = profile.totalAddressableMarket || 0;
  const customers = profile.customerCount || 0;
  const funded = profile.totalFunded || 0;
  const hasMarketNarrative = Boolean(profile.marketDescription);
  const hasMoat = Boolean(profile.competitiveAdvantage) || (profile.moatScore || 0) >= 70;

  if (arr > 0) {
    pushUnique(valueDrivers, `Revenue signal found: ${formatMoney(arr)} ARR anchors the estimate to operating traction.`, 4);
  }
  if (growth >= 10) {
    pushUnique(valueDrivers, `${growth.toFixed(0)}% monthly growth supports a higher upside case if it is repeatable.`, 4);
  }
  if (customers > 0) {
    pushUnique(valueDrivers, `${customers} customer${customers === 1 ? "" : "s"} reduce pure idea-stage risk.`, 4);
  }
  if (teamSize >= 3) {
    pushUnique(valueDrivers, `Team depth is visible (${teamSize} people), which improves execution credibility.`, 4);
  }
  if (funded > 0) {
    pushUnique(valueDrivers, `Prior funding of ${formatMoney(funded)} adds external validation.`, 4);
  }
  if (hasMoat) {
    pushUnique(valueDrivers, "A defensible product or moat signal supports the premium side of the range.", 4);
  }
  if (publicComparison?.match === "aligned") {
    pushUnique(valueDrivers, "Public valuation evidence is broadly aligned with the model output.", 4);
  }
  if (valueDrivers.length === 0) {
    pushUnique(valueDrivers, "The estimate is driven mainly by public positioning and stage-based valuation methods.", 4);
  }

  if (!confidence.annualRevenue) {
    pushUnique(evidenceGaps, "Revenue or ARR was not verified, so revenue-based methods carry less weight.", 4);
  }
  if (!confidence.growthRate) {
    pushUnique(evidenceGaps, "Growth rate is missing; the upside case depends on an unverified growth assumption.", 4);
  }
  if (!confidence.teamSize) {
    pushUnique(evidenceGaps, "Team size or founder depth was not verified from available evidence.", 4);
  }
  if (!confidence.tam && !hasMarketNarrative) {
    pushUnique(evidenceGaps, "Market size and buyer segment are not specific enough to defend the ceiling.", 4);
  }
  if (!confidence.fundingRounds && !confidence.totalRaised) {
    pushUnique(evidenceGaps, "No funding or investor validation was found in the available data.", 4);
  }
  if (!confidence.valuation) {
    pushUnique(evidenceGaps, "No reliable public valuation benchmark was found for direct calibration.", 4);
  }

  if (!confidence.annualRevenue) {
    pushUnique(investorObjections, "Where is the revenue proof behind this valuation range?", 4);
  }
  if (!confidence.growthRate) {
    pushUnique(investorObjections, "What evidence shows demand is growing repeatably?", 4);
  }
  if (!hasMoat) {
    pushUnique(investorObjections, "What prevents competitors from copying the product or distribution motion?", 4);
  }
  if (!confidence.tam) {
    pushUnique(investorObjections, "Is the addressable market large enough to justify the upside case?", 4);
  }
  if (publicComparison?.match === "aggressive") {
    pushUnique(investorObjections, "Why should this company price above available public market evidence?", 4);
  }
  if (rangeHigh / Math.max(rangeLow, 1) > 2) {
    pushUnique(investorObjections, "Why is the valuation range so wide, and what evidence narrows it?", 4);
  }

  if (!confidence.annualRevenue) {
    pushUnique(nextValueLevers, "Add ARR, MRR, or recent monthly revenue to replace stage assumptions with traction evidence.", 4);
  }
  if (!confidence.growthRate) {
    pushUnique(nextValueLevers, "Add 3-6 months of growth data to defend the upside case.", 4);
  }
  if (!confidence.teamSize) {
    pushUnique(nextValueLevers, "Add founder/team background to improve execution confidence.", 4);
  }
  if (!confidence.tam) {
    pushUnique(nextValueLevers, "Define TAM/SAM and buyer segment so the ceiling is tied to market capacity.", 4);
  }
  if (!confidence.fundingRounds && !confidence.newsSignals) {
    pushUnique(nextValueLevers, "Add pilots, LOIs, customer logos, or funding/news evidence to reduce validation risk.", 4);
  }
  if (nextValueLevers.length === 0) {
    pushUnique(nextValueLevers, "Use the full report to test conservative, base, and aggressive scenarios before sharing with investors.", 4);
  }

  const sortedMethods = methods.filter((m) => m.value > 0).sort((a, b) => b.value - a.value);
  if (sortedMethods.length > 0) {
    const highest = sortedMethods[0];
    const lowest = sortedMethods[sortedMethods.length - 1];
    pushUnique(methodSignals, `${methodLabel(highest.name)} is the highest signal at ${formatMoney(highest.value)}.`, 3);
    if (lowest.name !== highest.name) {
      pushUnique(methodSignals, `${methodLabel(lowest.name)} is the most conservative signal at ${formatMoney(lowest.value)}.`, 3);
    }
  }
  if (confidenceScore < 60) {
    pushUnique(methodSignals, "Confidence is capped because the methods are using incomplete public evidence.", 3);
  } else {
    pushUnique(methodSignals, "Method confidence is stronger because core business evidence was available.", 3);
  }

  return {
    valueDrivers,
    evidenceGaps,
    investorObjections,
    nextValueLevers,
    methodSignals,
  };
}
