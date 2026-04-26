"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DCFLTGMethod = void 0;
exports.dcfLTGMethod = dcfLTGMethod;
const base_method_1 = require("@/lib/claude/base-method");
class DCFLTGMethod extends base_method_1.ValuationMethodBase {
    constructor(profile) {
        super(profile, "dcf-ltg");
    }
    buildPrompt() {
        return `You are a financial analyst using DCF with Long-Term Growth (Damodaran, 2026).

${this.buildCompanyContext()}

DCF WITH LONG-TERM GROWTH:
1. Project FCF for 5-10 years with realistic growth deceleration
2. Terminal Value = Final Year FCF × (1 + LTG) / (WACC - LTG)
3. Discount all FCF to present using WACC
4. Sum discounted cash flows

2026 DAMODARAN PARAMETERS:
- Long-term growth (LTG): 2.0-2.5% (never exceed global GDP)
- WACC (SaaS): 9-14% (default 11%)
- Risk-free rate: 4.0-4.5%
- Tax rate: 0% (pre-profit) to 21% (profitable)

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
    parseResponse(json) {
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
exports.DCFLTGMethod = DCFLTGMethod;
async function dcfLTGMethod(profile) {
    return new DCFLTGMethod(profile).execute();
}
//# sourceMappingURL=dcfLTG.js.map