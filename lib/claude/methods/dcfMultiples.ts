import { StartupProfile, ValuationMethodResult } from "@/types";
import { ValuationMethodBase } from "@/lib/claude/base-method";
import { calculateIndiaWACC, getIndianComparableMultiple } from "@/lib/india-benchmarks/valuation-data";

export class DCFMultiplesMethod extends ValuationMethodBase {
  constructor(profile: StartupProfile) {
    super(profile, "dcf-multiples");
  }

  protected calculateDeterministic() {
    const isIndia = (this as any).isIndianStartup();
    const startingRevenue = this.getARR() > 0 ? this.getARR() : this.getBaseValuation() * 0.08;
    const years = isIndia ? 8 : 6;
    const defaultMultiple = isIndia
      ? getIndianComparableMultiple(this.profile.industry || "saas")
      : this.getGlobalExitMultiple();
    const multipleBenchmark = isIndia
      ? this.getIndiaMultipleBenchmark()
      : this.getGlobalMultipleBenchmark();
    const selectedMultiple = this.getBenchmarkedMultiple(
      ["exitMultiple", "revenueMultiple", "dcfMultiple", "terminalMultiple"],
      defaultMultiple,
      multipleBenchmark.min,
      multipleBenchmark.max
    );
    const defaultWacc = isIndia ? calculateIndiaWACC(this.profile.industry || "saas") : this.getGlobalWacc();
    const wacc = this.getBenchmarkedRate(
      ["wacc", "discountRate", "costOfCapital"],
      defaultWacc,
      isIndia ? 0.11 : 0.09,
      isIndia ? 0.35 : 0.30
    );
    const projection = this.projectRevenue(startingRevenue, years, {
      maxInitialGrowth: isIndia ? 0.65 : 0.80,
      minGrowth: startingRevenue > 0 ? 0.04 : 0.06,
      decay: isIndia ? 0.70 : 0.74,
    });
    const projectedExitYearRevenue = this.roundMoney(projection.projectedRevenue);
    const terminalValue = this.roundMoney(projectedExitYearRevenue * selectedMultiple.value);
    const enterpriseValue = this.roundMoney(
      Math.max(terminalValue / Math.pow(1 + wacc.value, years), this.getBaseValuation() * 0.4)
    );
    const { low, high } = this.createRange(enterpriseValue, 25);

    return {
      lowEstimate: low,
      midEstimate: enterpriseValue,
      highEstimate: high,
      reasoning:
        `DCF multiples projects revenue to ${this.formatMoney(projectedExitYearRevenue)} over ${years} years using decayed annual growth, applies a ${selectedMultiple.value.toFixed(1)}x exit multiple, ` +
        `and discounts terminal value at ${(wacc.value * 100).toFixed(1)}%.`,
      sources: [
        "DCF with exit revenue multiples",
        isIndia ? "India private deal multiple calibration" : "Global SaaS/technology revenue multiple calibration",
        "Founder-provided revenue and growth inputs",
      ],
      confidence: this.getMethodConfidence(4),
      assumptions: {
        startingRevenue,
        projectedExitYearRevenue,
        selectedMultiple: Number(selectedMultiple.value.toFixed(2)),
        defaultSelectedMultiple: Number(selectedMultiple.defaultValue.toFixed(2)),
        multipleOverrideUsed: selectedMultiple.overrideUsed ? "true" : "false",
        multipleBenchmarkWarning: selectedMultiple.benchmarkWarning || "",
        terminalValue,
        wacc: Number((wacc.value * 100).toFixed(2)),
        defaultWacc: Number((wacc.defaultValue * 100).toFixed(2)),
        waccOverrideUsed: wacc.overrideUsed ? "true" : "false",
        waccBenchmarkWarning: wacc.benchmarkWarning || "",
        discountYears: years,
        annualGrowthRates: projection.annualGrowthRates.join(", "),
        growthOverrideUsed: projection.growthOverrideUsed ? "true" : "false",
        growthBenchmarkWarning: projection.growthBenchmarkWarning || "",
        calculationMode: "deterministic",
      },
    };
  }

  private getGlobalExitMultiple(): number {
    const multiples: Record<string, number> = {
      ai: 12,
      saas: 5.7,
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

  private getGlobalWacc(): number {
    const wacc: Record<string, number> = {
      ai: 0.14,
      saas: 0.11,
      fintech: 0.12,
      deeptech: 0.15,
      other: 0.12,
    };
    return wacc[this.profile.industry || "other"] || 0.12;
  }

  buildPrompt(): string {
    const isIndia = (this as any).isIndianStartup();

    return `You are a financial analyst using DCF with exit multiples.
${isIndia ? 'INDIA-FOCUSED: Using Indian public market (NSE/BSE) and private deal multiples' : ''}

${this.buildCompanyContext()}

DCF WITH MULTIPLES (Terminal Value via Exit Multiple):
1. Project revenue to exit year (7-10 years in India, 5-7 globally)
2. Terminal Value = Exit Year Revenue × Selected Multiple
3. Discount to present using WACC
4. More reliable for high-growth startups than pure LTG

${isIndia ? `
2026 INDIAN EXIT MULTIPLES (ARR-based):
- Fintech: 3-6x revenue (regulatory premium)
- SaaS: 3-5x revenue (NSE comparables: Infibeam 2.5x, PolicyBazaar 3.2x)
- D2C: 1-3x revenue (Nykaa at 1.8x)
- Healthcare: 4-8x EBITDA (regulatory premium)
- Deeptech: 2-5x revenue (higher risk)
- Consumer: 1-2x revenue (competitive market)

INDIAN PRIVATE DEAL MULTIPLES (2024-2025 data):
- Fintech: avg 4.2x revenue (45+ deals)
- SaaS: avg 3.5x revenue (32+ deals)
- D2C: avg 2.1x revenue (28+ deals)
- Healthtech: avg 3.8x revenue (18+ deals)

BOOTSTRAP vs VC-BACKED:
- Bootstrapped profitable: Higher multiples (20-30x EBITDA)
- VC-backed pre-profitable: Lower multiples (revenue-based)
- Acqui-hire probability: 5-10% of Indian exits (acquisition for team/IP)
` : `
2026 GLOBAL EXIT MULTIPLES:
- Traditional SaaS: 3x-7x ARR (median 4.5-5.7x)
- AI-Enhanced SaaS: 8x-20x (median 12-15x)
- AI-Native: 10x-50x (median 20-30x for strong traction)

EBITDA Multiples (if profitable):
- Public SaaS: 9x-13x (median 9.8-10.6x)
- Private SaaS: 20x-30x
- AI premium: +20-50%
`}

Return JSON:
{
  "projectedExitYearRevenue": number,
  "selectedMultiple": number,
  "terminalValue": number,
  "wacc": number,
  "enterpriseValue": number,
  "reasoning": "Projection, multiple selection, and discount calculation",
  "confidence": "high|medium|low"
}`;
  }

  parseResponse(json: Record<string, any>) {
    const { low, high } = this.createRange(json.enterpriseValue, 25);

    return {
      lowEstimate: low,
      midEstimate: json.enterpriseValue,
      highEstimate: high,
      reasoning: json.reasoning,
      sources: [
        "DCF with Multiples Method (2026 benchmarks)",
        "ARR Multiples: SaaS 4.5-5.7x, AI 12-30x",
      ],
      confidence: json.confidence || "medium",
      assumptions: {
        terminalValue: json.terminalValue,
        exitMultiple: json.selectedMultiple,
        wacc: json.wacc,
      },
    };
  }
}

export async function dcfMultiplesMethod(profile: StartupProfile): Promise<ValuationMethodResult> {
  return new DCFMultiplesMethod(profile).execute();
}
