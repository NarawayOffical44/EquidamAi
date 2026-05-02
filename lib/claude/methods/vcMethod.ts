import { StartupProfile, ValuationMethodResult } from "@/types";
import { ValuationMethodBase } from "@/lib/claude/base-method";

export class VCMethod extends ValuationMethodBase {
  constructor(profile: StartupProfile) {
    super(profile, "vc");
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
