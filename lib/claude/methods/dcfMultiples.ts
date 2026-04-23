import { StartupProfile, ValuationMethodResult } from "@/types";
import { ValuationMethodBase } from "@/lib/claude/base-method";

export class DCFMultiplesMethod extends ValuationMethodBase {
  constructor(profile: StartupProfile) {
    super(profile, "dcf-multiples");
  }

  buildPrompt(): string {
    return `You are a financial analyst using DCF with exit multiples.

${this.buildCompanyContext()}

DCF WITH MULTIPLES (Terminal Value via Exit Multiple):
1. Project revenue to exit year (5-7 years)
2. Terminal Value = Exit Year Revenue × Selected Multiple
3. Discount to present using WACC
4. More reliable for high-growth startups than pure LTG

2026 EXIT MULTIPLES:
- Traditional SaaS: 3x-7x ARR (median 4.5-5.7x)
- AI-Enhanced SaaS: 8x-20x (median 12-15x)
- AI-Native: 10x-50x (median 20-30x for strong traction)

EBITDA Multiples (if profitable):
- Public SaaS: 9x-13x (median 9.8-10.6x)
- Private SaaS: 20x-30x
- AI premium: +20-50%

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
