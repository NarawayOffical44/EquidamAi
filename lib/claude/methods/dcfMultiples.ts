import { StartupProfile, ValuationMethodResult } from "@/types";
import { ValuationMethodBase } from "@/lib/claude/base-method";

export class DCFMultiplesMethod extends ValuationMethodBase {
  constructor(profile: StartupProfile) {
    super(profile, "dcf-multiples");
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
