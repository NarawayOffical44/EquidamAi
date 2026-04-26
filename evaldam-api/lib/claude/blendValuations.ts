import { StartupProfile, ValuationMethodResult, BlendedValuation } from "@/types";

/**
 * Blend multiple valuation methods into a final range with weighted average.
 * Weighting depends on company stage and data completeness.
 */
export function blendValuations(
  profile: StartupProfile,
  methods: ValuationMethodResult[]
): BlendedValuation {
  // Determine weighting based on stage
  let qualitativeWeight = 0.4; // Scorecard + Berkus
  let quantitativeWeight = 0.6; // VC + DCF methods

  if (profile.stage === "series-a" || profile.stage === "series-b+") {
    qualitativeWeight = 0.3;
    quantitativeWeight = 0.7;
  }

  // Separate qualitative and quantitative methods
  const qualitativeMethods = methods.filter(
    (m) => m.methodName === "scorecard" || m.methodName === "berkus"
  );
  const quantitativeMethods = methods.filter(
    (m) => m.methodName === "vc" || m.methodName === "dcf-ltg" || m.methodName === "dcf-multiples"
  );

  // Calculate weighted averages for each group
  let qualitativeAvg = 0;
  if (qualitativeMethods.length > 0) {
    qualitativeAvg =
      qualitativeMethods.reduce((sum, m) => sum + m.midEstimate, 0) /
      qualitativeMethods.length;
  }

  let quantitativeAvg = 0;
  if (quantitativeMethods.length > 0) {
    quantitativeAvg =
      quantitativeMethods.reduce((sum, m) => sum + m.midEstimate, 0) /
      quantitativeMethods.length;
  }

  // Calculate blended mid-point valuation
  const weightedAverage =
    qualitativeAvg * qualitativeWeight + quantitativeAvg * quantitativeWeight;

  // Calculate low and high estimates
  const allEstimates = methods.flatMap((m) => [
    m.lowEstimate,
    m.highEstimate,
  ]);
  const lowRange = Math.min(...allEstimates);
  const highRange = Math.max(...allEstimates);

  // Calculate method weights for reporting
  const methodBreakdown: Record<string, { estimate: number; weight: number }> =
    {};
  methods.forEach((method) => {
    const isQualitative =
      method.methodName === "scorecard" || method.methodName === "berkus";
    const weight = isQualitative
      ? qualitativeWeight / qualitativeMethods.length
      : quantitativeWeight / quantitativeMethods.length;

    methodBreakdown[method.methodName] = {
      estimate: method.midEstimate,
      weight: weight,
    };
  });

  // Generate key reasons for VC summary (based on best methods)
  const keyReasons = generateKeyReasons(profile, methods, weightedAverage);

  // Generate sensitivity analysis
  const sensitivityAnalysis = generateSensitivityAnalysis(weightedAverage);

  return {
    lowRange,
    highRange,
    weightedAverage,
    methodBreakdown,
    sensitivityAnalysis,
    keyReasons,
  };
}

function generateKeyReasons(
  profile: StartupProfile,
  methods: ValuationMethodResult[],
  valuation: number
): string[] {
  const reasons: string[] = [];

  // Reason 1: Stage + Growth
  if (profile.monthlyGrowthRate && profile.monthlyGrowthRate > 10) {
    reasons.push(
      `Strong monthly growth of ${profile.monthlyGrowthRate.toFixed(1)}% MoM indicates rapid scaling potential`
    );
  } else if (profile.annualRecurringRevenue && profile.annualRecurringRevenue > 100000) {
    reasons.push(
      `Existing revenue of $${(profile.annualRecurringRevenue / 1000000).toFixed(1)}M ARR provides strong traction`
    );
  } else {
    reasons.push(
      `${profile.stage === "pre-revenue" ? "Pre-revenue" : "Early-stage"} company with clear market opportunity`
    );
  }

  // Reason 2: Team/Achievements
  if (profile.team && profile.team.length > 2) {
    reasons.push(
      `Experienced team of ${profile.team.length} with relevant domain expertise`
    );
  }
  if (
    profile.accelerators &&
    profile.accelerators.some((a) => a.name === "YC" || a.name === "Techstars")
  ) {
    reasons.push(
      `${profile.accelerators.find((a) => a.name === "YC" || a.name === "Techstars")?.name || "Top"}-backed company with credibility and network access`
    );
  }

  // Reason 3: Market
  if (profile.totalAddressableMarket && profile.totalAddressableMarket > 1000000000) {
    reasons.push(
      `Large addressable market of $${(profile.totalAddressableMarket / 1000000000).toFixed(1)}B+ with multiple expansion opportunities`
    );
  }

  // Reason 4: Multiple convergence
  const highMethod = methods.reduce((prev, current) =>
    current.midEstimate > prev.midEstimate ? current : prev
  );
  const lowMethod = methods.reduce((prev, current) =>
    current.midEstimate < prev.midEstimate ? current : prev
  );

  if (highMethod.midEstimate / lowMethod.midEstimate < 2) {
    reasons.push(
      `Multiple valuation methods converge on similar range, suggesting consistent valuation`
    );
  } else {
    reasons.push(
      `Range reflects methodological diversity; market conditions may drive to upper or lower bound`
    );
  }

  return reasons.slice(0, 4); // Return top 3-4 reasons
}

function generateSensitivityAnalysis(
  baseValuation: number
): Array<{ metric: string; scenario: string; impactOnValuation: number }> {
  return [
    {
      metric: "Revenue Growth",
      scenario: "+10% annual growth",
      impactOnValuation: baseValuation * 0.15, // ~15% increase
    },
    {
      metric: "Revenue Growth",
      scenario: "-10% annual growth",
      impactOnValuation: baseValuation * -0.12, // ~12% decrease
    },
    {
      metric: "Exit Multiple",
      scenario: "+1x multiple (next category)",
      impactOnValuation: baseValuation * 0.2, // ~20% increase
    },
    {
      metric: "Exit Multiple",
      scenario: "-1x multiple (lower category)",
      impactOnValuation: baseValuation * -0.15, // ~15% decrease
    },
  ];
}
