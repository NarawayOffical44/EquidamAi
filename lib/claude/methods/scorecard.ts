import { StartupProfile, ValuationMethodResult } from "@/types";
import { ValuationMethodBase } from "@/lib/claude/base-method";

export class ScorecardMethod extends ValuationMethodBase {
  constructor(profile: StartupProfile) {
    super(profile, "scorecard");
  }

  buildPrompt(): string {
    const baseValuation = this.getBaseValuation();

    return `You are a startup valuation expert using the Scorecard Method (Bill Payne / Ohio TechAngels).

${this.buildCompanyContext()}

Base Pre-Money Valuation (comparable companies in region/stage): $${baseValuation.toLocaleString()}

SCORECARD METHODOLOGY:
Score the startup on 6 weighted factors vs. average comparable (0-150%, where 100% = market average):

1. Strength of Team (30% weight): Founder experience, domain expertise, startup track record
2. Size of Opportunity / Market (25% weight): TAM, market growth rate, addressable market
3. Product / Technology (15% weight): Tech differentiation, IP/patents, product-market fit
4. Competitive Environment (10% weight): Direct competitors, barriers to entry
5. Sales / Marketing Channels (10% weight): Go-to-market strategy, channel effectiveness
6. Need for Additional Capital (10% weight): Runway, capital efficiency, path to profitability

Weighted Adjustment = (Score1 × 0.30) + (Score2 × 0.25) + (Score3 × 0.15) + (Score4 × 0.10) + (Score5 × 0.10) + (Score6 × 0.10)
Final Valuation = Base Valuation × Weighted Adjustment

IMPORTANT: Assume conservative-to-moderate scores for pre-revenue companies. Always cite "Bill Payne Scorecard Method."

Return JSON:
{
  "teamScore": number (0-150),
  "marketScore": number (0-150),
  "productScore": number (0-150),
  "competitionScore": number (0-150),
  "salesScore": number (0-150),
  "capitalScore": number (0-150),
  "weightedAdjustment": number,
  "finalValuation": number,
  "reasoning": "Step-by-step calculation with each factor and final valuation",
  "confidence": "high|medium|low"
}`;
  }

  parseResponse(json: Record<string, any>) {
    const baseValuation = this.getBaseValuation();
    const { low, high } = this.createRange(json.finalValuation, 20);

    return {
      lowEstimate: low,
      midEstimate: json.finalValuation,
      highEstimate: high,
      reasoning: json.reasoning,
      sources: [
        "Bill Payne Scorecard Method (Ohio TechAngels, 2024)",
        `Base valuation: $${baseValuation.toLocaleString()} (${this.profile.stage} ${this.profile.industry || 'tech'})`,
      ],
      confidence: json.confidence || "medium",
      assumptions: {
        baseValuation,
        stage: this.profile.stage,
        teamScore: json.teamScore,
        marketScore: json.marketScore,
        productScore: json.productScore,
        weightedAdjustment: json.weightedAdjustment,
      },
    };
  }
}

export async function scorecardMethod(profile: StartupProfile): Promise<ValuationMethodResult> {
  return new ScorecardMethod(profile).execute();
}
