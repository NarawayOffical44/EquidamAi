import { StartupProfile, ValuationMethodResult } from "@/types";
import { ValuationMethodBase } from "@/lib/claude/base-method";
import { getIndianExitMultiple } from "@/lib/india-benchmarks/valuation-data";

export class VCMethod extends ValuationMethodBase {
  constructor(profile: StartupProfile) {
    super(profile, "vc");
  }

  protected calculateDeterministic() {
    const isIndia = (this as any).isIndianStartup();
    const arr = this.getARR();
    const currentRevenue = arr > 0 ? arr : this.getBaseValuation() * 0.08;
    const years = isIndia ? 8 : 6;
    const defaultMultiple = isIndia
      ? getIndianExitMultiple(this.profile.industry || "saas")
      : this.getGlobalRevenueMultiple();
    const multipleBenchmark = isIndia
      ? this.getIndiaMultipleBenchmark()
      : this.getGlobalMultipleBenchmark();
    const selectedMultiple = this.getBenchmarkedMultiple(
      ["exitMultiple", "revenueMultiple", "vcExitMultiple", "terminalMultiple"],
      defaultMultiple,
      multipleBenchmark.min,
      multipleBenchmark.max
    );
    const projection = this.projectRevenue(currentRevenue, years, {
      maxInitialGrowth: isIndia ? 0.70 : 0.85,
      minGrowth: arr > 0 ? 0.04 : 0.06,
      decay: isIndia ? 0.70 : 0.74,
    });
    const projectedExitRevenue = this.roundMoney(projection.projectedRevenue);
    const terminalValue = this.roundMoney(projectedExitRevenue * selectedMultiple.value);
    const defaultTargetReturnMultiple = this.getTargetReturnMultiple(isIndia);
    const targetReturnMultiple = this.getBenchmarkedMultiple(
      ["targetReturnMultiple", "investorReturnMultiple", "requiredReturnMultiple"],
      defaultTargetReturnMultiple,
      isIndia ? 4 : 4,
      isIndia ? 15 : 18
    );
    const postMoneyValuation = terminalValue / targetReturnMultiple.value;
    const assumedInvestment = this.getAssumedInvestment();
    const preMoneyValuation = this.roundMoney(Math.max(postMoneyValuation - assumedInvestment, this.getBaseValuation() * 0.5));
    const { low, high } = this.createRange(preMoneyValuation, 25);

    return {
      lowEstimate: low,
      midEstimate: preMoneyValuation,
      highEstimate: high,
      reasoning:
        `VC method = terminal value (${this.formatMoney(projectedExitRevenue)} projected exit revenue x ${selectedMultiple.value.toFixed(1)}x multiple = ${this.formatMoney(terminalValue)}) ` +
        `/ ${targetReturnMultiple.value.toFixed(1)}x target return, less assumed new investment of ${this.formatMoney(assumedInvestment)}. Growth is decayed year by year to avoid flat high-growth compounding.`,
      sources: [
        "Venture Capital Method",
        isIndia ? "Evaldam India exit multiple and target-return calibration" : "Global venture target-return calibration",
        "Founder-provided revenue and growth inputs",
      ],
      confidence: this.getMethodConfidence(4),
      assumptions: {
        projectedExitRevenue,
        selectedMultiple: Number(selectedMultiple.value.toFixed(2)),
        defaultSelectedMultiple: Number(selectedMultiple.defaultValue.toFixed(2)),
        multipleOverrideUsed: selectedMultiple.overrideUsed ? "true" : "false",
        multipleBenchmarkWarning: selectedMultiple.benchmarkWarning || "",
        terminalValue,
        targetReturnMultiple: Number(targetReturnMultiple.value.toFixed(2)),
        defaultTargetReturnMultiple: Number(targetReturnMultiple.defaultValue.toFixed(2)),
        targetReturnOverrideUsed: targetReturnMultiple.overrideUsed ? "true" : "false",
        targetReturnBenchmarkWarning: targetReturnMultiple.benchmarkWarning || "",
        discountYears: years,
        assumedInvestment,
        annualGrowthRates: projection.annualGrowthRates.join(", "),
        growthOverrideUsed: projection.growthOverrideUsed ? "true" : "false",
        growthBenchmarkWarning: projection.growthBenchmarkWarning || "",
        calculationMode: "deterministic",
      },
    };
  }

  private getTargetReturnMultiple(isIndia: boolean): number {
    const indiaMultiples: Record<string, number> = {
      "pre-revenue": 12,
      seed: 10,
      "series-a": 6,
      "series-b+": 4,
    };
    const globalMultiples: Record<string, number> = {
      "pre-revenue": 15,
      seed: 10,
      "series-a": 6,
      "series-b+": 4,
    };
    return (isIndia ? indiaMultiples : globalMultiples)[this.profile.stage] || 8;
  }

  private getGlobalRevenueMultiple(): number {
    const multiples: Record<string, number> = {
      ai: 12,
      saas: 6,
      fintech: 5,
      deeptech: 7,
      other: 4,
    };
    return multiples[this.profile.industry || "other"] || 4;
  }

  private getIndiaMultipleBenchmark(): { min: number; max: number } {
    const benchmarks: Record<string, { min: number; max: number }> = {
      ai: { min: 2, max: 6 },
      saas: { min: 3, max: 5 },
      fintech: { min: 3, max: 6 },
      deeptech: { min: 2, max: 5 },
      other: { min: 2, max: 4 },
    };
    return benchmarks[this.profile.industry || "other"] || benchmarks.other;
  }

  private getGlobalMultipleBenchmark(): { min: number; max: number } {
    const benchmarks: Record<string, { min: number; max: number }> = {
      ai: { min: 8, max: 20 },
      saas: { min: 3, max: 8 },
      fintech: { min: 3, max: 7 },
      deeptech: { min: 4, max: 10 },
      other: { min: 2, max: 6 },
    };
    return benchmarks[this.profile.industry || "other"] || benchmarks.other;
  }

  private getAssumedInvestment(): number {
    const latestFunding = this.profile.fundingHistory?.[this.profile.fundingHistory.length - 1]?.amount;
    if (latestFunding && latestFunding > 0) return latestFunding;
    const stageInvestment: Record<string, number> = this.getValuationCurrency() === "INR"
      ? {
          "pre-revenue": 5000000,
          seed: 20000000,
          "series-a": 80000000,
          "series-b+": 250000000,
        }
      : {
          "pre-revenue": 250000,
          seed: 750000,
          "series-a": 3000000,
          "series-b+": 10000000,
        };
    return stageInvestment[this.profile.stage] || 0;
  }

  buildPrompt(): string {
    const isIndia = (this as any).isIndianStartup();

    return `You are a VC using the Venture Capital Method for valuation.
${isIndia ? 'INDIA-FOCUSED: Using Indian exit multiples and angel ROI benchmarks' : ''}

${this.buildCompanyContext()}

VENTURE CAPITAL METHOD:
1. Estimate terminal value (7-10 years in India, 5-7 globally) = Projected Revenue × Exit Multiple
2. Required ROI: Pre-revenue 40-50%, Seed 30-40%, Series A 20-30% (Indian benchmarks lower than US)
3. Post-money today = Terminal Value / (1 + ROI)^years
4. Pre-money = Post-money - Investment

${isIndia ? `
2026 INDIAN MARKET ARR MULTIPLES:
- Fintech: 3-6x revenue (regulated, high growth)
- SaaS: 3-5x revenue (vs 4.5-5.7x US, lower due to smaller market)
- D2C: 1-3x revenue (consumer-facing, lower multiples)
- Healthcare/Healthtech: 4-8x EBITDA (regulated, premium for health)
- AI/Deeptech: 2-5x revenue (higher risk in India)
- Consumer: 1-2x revenue (competitive, lower margins)
- Expected Exit Timeline: 7-10 years (vs 5-7 in US)
- Angel ROI Expectations: 10-15x (vs 30x in US, more realistic for India market)
` : `
2026 GLOBAL ARR MULTIPLES:
- Traditional SaaS: 3x-7x (median 4.5-5.7x)
- AI-Enhanced SaaS: 8x-20x
- Pure AI-Native: 10x-50x (median 20-30x)
`}

Use realistic growth projections and conservative assumptions.

Return JSON:
{
  "projectedExitRevenue": number,
  "selectedMultiple": number,
  "terminalValue": number,
  "requiredROI": number,
  "discountYears": number,
  "preMoneyValuation": number,
  "reasoning": "Full calculation with each step",
  "confidence": "high|medium|low"
}`;
  }

  parseResponse(json: Record<string, any>) {
    const { low, high } = this.createRange(json.preMoneyValuation, 25);

    return {
      lowEstimate: low,
      midEstimate: json.preMoneyValuation,
      highEstimate: high,
      reasoning: json.reasoning,
      sources: [
        "Venture Capital Method (Standard VC Practice)",
        "ARR Multiples: 2026 benchmarks",
      ],
      confidence: json.confidence || "high",
      assumptions: {
        terminalValue: json.terminalValue,
        exitMultiple: json.selectedMultiple,
        requiredROI: json.requiredROI,
        discountYears: json.discountYears,
      },
    };
  }
}

export async function vcMethod(profile: StartupProfile): Promise<ValuationMethodResult> {
  return new VCMethod(profile).execute();
}
