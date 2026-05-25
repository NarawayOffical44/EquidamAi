import { StartupProfile, ValuationMethodResult } from "@/types";
import { ValuationMethodBase } from "@/lib/claude/base-method";

export class ScorecardMethod extends ValuationMethodBase {
  constructor(profile: StartupProfile) {
    super(profile, "scorecard");
  }

  protected calculateDeterministic() {
    const baseValuation = this.getBaseValuation();
    const arr = this.getARR();
    const growth = this.profile.monthlyGrowthRate || 0;
    const tam = this.profile.totalAddressableMarket || 0;
    const teamSize = this.getTeamSize();
    const moatScore = this.profile.moatScore || 50;
    const hasAccelerator = Boolean(this.profile.accelerators?.length);
    const hasFounderExit = Boolean(this.profile.teamPreviousExits?.length);
    const teamScore = this.clamp(
      65 + teamSize * 7 + (this.profile.teamExperienceYears || 0) * 2 + (hasFounderExit ? 15 : 0) + (hasAccelerator ? 8 : 0),
      45,
      140
    );
    const marketScore = this.clamp(
      65 + (tam > 1000000000 ? 25 : tam > 100000000 ? 15 : tam > 0 ? 5 : -10) + (this.profile.industry === "ai" ? 8 : 0),
      45,
      135
    );
    const productScore = this.clamp(
      65 + (this.profile.competitiveAdvantage ? 12 : 0) + Math.min(15, (this.profile.patentCount || 0) * 3) + (moatScore - 50) * 0.25,
      40,
      135
    );
    const competitionScore = this.clamp(80 + (moatScore - 50) * 0.35 + (this.profile.customerConcentration && this.profile.customerConcentration > 50 ? -12 : 0), 45, 125);
    const salesScore = this.clamp(
      55 + (arr > 0 ? 20 : 0) + Math.min(25, growth * 1.25) + Math.min(12, (this.profile.customerCount || 0) / 5),
      35,
      135
    );
    const capitalScore = this.clamp(
      70 + ((this.profile.runwayMonths || 0) >= 18 ? 15 : (this.profile.runwayMonths || 0) >= 9 ? 5 : -10) + (this.getGrossMargin() > 0.6 ? 8 : 0),
      40,
      125
    );

    const weightedAdjustment =
      (teamScore * 0.3 +
        marketScore * 0.25 +
        productScore * 0.15 +
        competitionScore * 0.1 +
        salesScore * 0.1 +
        capitalScore * 0.1) /
      100;

    const finalValuation = this.roundMoney(baseValuation * weightedAdjustment);
    const { low, high } = this.createRange(finalValuation, 20);

    return {
      lowEstimate: low,
      midEstimate: finalValuation,
      highEstimate: high,
      reasoning:
        `Scorecard valuation = ${this.formatMoney(baseValuation)} base valuation x ${weightedAdjustment.toFixed(2)} weighted factor adjustment. ` +
        `Factor scores: team ${teamScore.toFixed(0)}%, market ${marketScore.toFixed(0)}%, product ${productScore.toFixed(0)}%, competition ${competitionScore.toFixed(0)}%, sales ${salesScore.toFixed(0)}%, capital ${capitalScore.toFixed(0)}%.`,
      sources: [
        "Bill Payne Scorecard Method / Ohio TechAngels methodology",
        "Evaldam India/global stage benchmark table",
        "Founder-provided startup inputs",
      ],
      confidence: this.getMethodConfidence(4),
      assumptions: {
        baseValuation,
        teamScore: Math.round(teamScore),
        marketScore: Math.round(marketScore),
        productScore: Math.round(productScore),
        competitionScore: Math.round(competitionScore),
        salesScore: Math.round(salesScore),
        capitalScore: Math.round(capitalScore),
        weightedAdjustment: Number(weightedAdjustment.toFixed(3)),
        calculationMode: "deterministic",
      },
    };
  }

  buildPrompt(): string {
    const baseValuation = this.getBaseValuation();
    const isIndia = (this as any).isIndianStartup();
    const currencySymbol = isIndia ? '₹' : '$';

    return `You are a startup valuation expert using the Scorecard Method (Bill Payne / Ohio TechAngels).
${isIndia ? 'INDIA-FOCUSED: Using Indian benchmark comparables and regional adjustments' : ''}

${this.buildCompanyContext()}

Base Pre-Money Valuation (comparable companies in region/stage): ${currencySymbol}${baseValuation.toLocaleString()}

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

${isIndia ? `
INDIA-SPECIFIC ADJUSTMENTS:
- DPIIT Recognition: Add +15% if startup has Department for Promotion of Industry and Internal Trade (DPIIT) recognition
- IIT/IIM Founder Premium: Add +20% if founders are from IIT or IIM
- City Tier Impact: Base already adjusted for Tier-1 (Bangalore/Mumbai/Delhi), Tier-2 (Pune/Hyderabad), or Tier-3 cities
- Government Support: Consider presence of DSIR, BIRAC, or other government grant programs
` : ''}

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
