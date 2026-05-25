import { StartupProfile, ValuationMethodResult } from "@/types";
import { ValuationMethodBase } from "@/lib/claude/base-method";
import { calculateIndiaWACC } from "@/lib/india-benchmarks/valuation-data";

export class DCFLTGMethod extends ValuationMethodBase {
  constructor(profile: StartupProfile) {
    super(profile, "dcf-ltg");
  }

  protected calculateDeterministic() {
    const isIndia = (this as any).isIndianStartup();
    const startingRevenue = this.getARR() > 0 ? this.getARR() : this.getBaseValuation() * 0.08;
    const years = 5;
    const defaultWacc = this.getWacc(isIndia);
    const wacc = this.getBenchmarkedRate(
      ["wacc", "discountRate", "costOfCapital"],
      defaultWacc,
      isIndia ? 0.11 : 0.09,
      isIndia ? 0.35 : 0.30
    );
    const defaultLtgRate = isIndia ? 0.025 : 0.02;
    const ltgRateInput = this.getBenchmarkedRate(
      ["ltgRate", "terminalGrowth", "longTermGrowthRate"],
      defaultLtgRate,
      isIndia ? 0.015 : 0.01,
      isIndia ? 0.04 : 0.035
    );
    const ltgRate = Math.min(ltgRateInput.value, Math.max(0.005, wacc.value - 0.01));
    const targetFcfMargin = this.clamp(this.getGrossMargin() * 0.5 - 0.05, 0.08, 0.3);
    const projection = this.projectRevenue(startingRevenue, years, {
      maxInitialGrowth: isIndia ? 0.60 : 0.75,
      minGrowth: startingRevenue > 0 ? 0.04 : 0.06,
      decay: isIndia ? 0.68 : 0.72,
    });
    const cashFlows: number[] = [];

    for (let year = 1; year <= years; year += 1) {
      const revenue = projection.annualRevenues[year - 1] || startingRevenue;
      const fcfMargin = this.clamp(targetFcfMargin * (year / years), -0.1, targetFcfMargin);
      cashFlows.push(revenue * fcfMargin);
    }

    const finalYearFcf = cashFlows[cashFlows.length - 1];
    const terminalValue = finalYearFcf * (1 + ltgRate) / Math.max(0.01, wacc.value - ltgRate);
    const discountedCashFlows = cashFlows.reduce(
      (sum, cashFlow, index) => sum + cashFlow / Math.pow(1 + wacc.value, index + 1),
      0
    );
    const discountedTerminalValue = terminalValue / Math.pow(1 + wacc.value, years);
    const enterpriseValue = this.roundMoney(Math.max(discountedCashFlows + discountedTerminalValue, this.getBaseValuation() * 0.35));
    const { low, high } = this.createRange(enterpriseValue, 30);

    return {
      lowEstimate: low,
      midEstimate: enterpriseValue,
      highEstimate: high,
      reasoning:
        `DCF LTG projects ${years} years of revenue from ${this.formatMoney(startingRevenue)}, ramps FCF margin to ${(targetFcfMargin * 100).toFixed(1)}%, ` +
        `discounts cash flows at ${(wacc.value * 100).toFixed(1)}%, and applies ${(ltgRate * 100).toFixed(1)}% terminal growth. Revenue growth decays annually instead of compounding flat.`,
      sources: [
        "Discounted Cash Flow with Gordon Growth terminal value",
        isIndia ? "India WACC calibration from Evaldam benchmark table" : "Global SaaS/technology WACC benchmark range",
        "Founder-provided revenue, growth, and margin inputs",
      ],
      confidence: this.getMethodConfidence(5),
      assumptions: {
        startingRevenue,
        projectedYear5Revenue: Math.round(projection.projectedRevenue),
        targetFcfMargin: Number((targetFcfMargin * 100).toFixed(1)),
        terminalValue: Math.round(terminalValue),
        wacc: Number((wacc.value * 100).toFixed(2)),
        defaultWacc: Number((wacc.defaultValue * 100).toFixed(2)),
        waccOverrideUsed: wacc.overrideUsed ? "true" : "false",
        waccBenchmarkWarning: wacc.benchmarkWarning || "",
        ltgRate: Number((ltgRate * 100).toFixed(2)),
        defaultLtgRate: Number((ltgRateInput.defaultValue * 100).toFixed(2)),
        ltgOverrideUsed: ltgRateInput.overrideUsed ? "true" : "false",
        ltgBenchmarkWarning: ltgRateInput.benchmarkWarning || "",
        discountedCashFlows: Math.round(discountedCashFlows),
        discountedTerminalValue: Math.round(discountedTerminalValue),
        annualGrowthRates: projection.annualGrowthRates.join(", "),
        growthOverrideUsed: projection.growthOverrideUsed ? "true" : "false",
        growthBenchmarkWarning: projection.growthBenchmarkWarning || "",
        calculationMode: "deterministic",
      },
    };
  }

  private getWacc(isIndia: boolean): number {
    if (isIndia) return calculateIndiaWACC(this.profile.industry || "saas");
    const globalWacc: Record<string, number> = {
      ai: 0.14,
      saas: 0.11,
      fintech: 0.12,
      deeptech: 0.15,
      other: 0.12,
    };
    return globalWacc[this.profile.industry || "other"] || 0.12;
  }

  buildPrompt(): string {
    const isIndia = (this as any).isIndianStartup();

    return `You are a financial analyst using DCF with Long-Term Growth (Damodaran, 2026).
${isIndia ? 'INDIA-FOCUSED: Using RBI repo rate and India-specific risk premiums' : ''}

${this.buildCompanyContext()}

DCF WITH LONG-TERM GROWTH:
1. Project FCF for 5-10 years with realistic growth deceleration
2. Terminal Value = Final Year FCF × (1 + LTG) / (WACC - LTG)
3. Discount all FCF to present using WACC
4. Sum discounted cash flows

${isIndia ? `
2026 INDIA-SPECIFIC DCF PARAMETERS:
- Long-term growth (LTG): 2.0-2.5% (conservative, India GDP ~7%)
- WACC Components:
  * Risk-free rate: RBI repo rate 6.5% (vs US Treasury 4.5%)
  * Equity risk premium: 2.0-2.5%
  * Country risk premium: 3.5% (India-specific)
  * Currency risk premium: 2.0% (USD cost exposure)
- Sector-specific WACC adjustments:
  * Fintech: 12% (regulated, higher risk)
  * SaaS: 11% (standard)
  * Healthcare: 13% (regulatory heavy)
  * Deeptech: 14% (high tech risk)
  * Consumer: 10% (lower risk)
- Tax rate: 0% (pre-profit) to 30% (profitable, India corporate tax)
` : `
2026 GLOBAL DCF PARAMETERS:
- Long-term growth (LTG): 2.0-2.5% (never exceed global GDP)
- WACC (SaaS): 9-14% (default 11%)
- Risk-free rate: 4.0-4.5%
- Tax rate: 0% (pre-profit) to 21% (profitable)
`}

Use conservative growth assumptions. Terminal value typically 60-80% of total.

Return JSON:
{
  "projectedYear5Revenue": number,
  "terminalValue": number,
  "wacc": number,
  "ltgRate": number,
  "enterpriseValue": number,
  "reasoning": "Step-by-step DCF with projections and discount",
  "confidence": "high|medium|low"
}`;
  }

  parseResponse(json: Record<string, any>) {
    const { low, high } = this.createRange(json.enterpriseValue, 30);

    return {
      lowEstimate: low,
      midEstimate: json.enterpriseValue,
      highEstimate: high,
      reasoning: json.reasoning,
      sources: [
        "Damodaran DCF Model (January 2026)",
        "WACC: 9-14% for SaaS, LTG: 2.0-2.5%",
      ],
      confidence: json.confidence || "medium",
      assumptions: {
        wacc: json.wacc,
        ltgRate: json.ltgRate,
        terminalValue: json.terminalValue,
        taxRate: 0,
      },
    };
  }
}

export async function dcfLTGMethod(profile: StartupProfile): Promise<ValuationMethodResult> {
  return new DCFLTGMethod(profile).execute();
}
