import { StartupProfile, ValuationMethodResult } from "@/types";
import { ValuationMethodBase } from "@/lib/claude/base-method";

export class VCMethod extends ValuationMethodBase {
  constructor(profile: StartupProfile) {
    super(profile, "vc");
  }

  buildPrompt(): string {
    return `You are a VC using the Venture Capital Method for valuation.

${this.buildCompanyContext()}

VENTURE CAPITAL METHOD:
1. Estimate terminal value (5-7 years) = Projected Revenue × Exit Multiple
2. Required ROI: Pre-revenue 50%, Seed 40-50%, Series A 30-40%
3. Post-money today = Terminal Value / (1 + ROI)^years
4. Pre-money = Post-money - Investment

2026 ARR MULTIPLES:
- Traditional SaaS: 3x-7x (median 4.5-5.7x)
- AI-Enhanced SaaS: 8x-20x
- Pure AI-Native: 10x-50x (median 20-30x)

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
