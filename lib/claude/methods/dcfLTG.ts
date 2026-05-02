import { StartupProfile, ValuationMethodResult } from "@/types";
import { ValuationMethodBase } from "@/lib/claude/base-method";

export class DCFLTGMethod extends ValuationMethodBase {
  constructor(profile: StartupProfile) {
    super(profile, "dcf-ltg");
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
