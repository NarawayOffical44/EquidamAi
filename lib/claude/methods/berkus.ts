import { StartupProfile, ValuationMethodResult } from "@/types";
import { ValuationMethodBase } from "@/lib/claude/base-method";

export class BerkusMethod extends ValuationMethodBase {
  constructor(profile: StartupProfile) {
    super(profile, "berkus");
  }

  protected calculateDeterministic() {
    const isIndia = (this as any).isIndianStartup();
    const cap = isIndia ? 30000000 : 5000000;
    const factorValue = cap / 5;
    const arr = this.getARR();
    const teamSize = this.getTeamSize();
    const hasAccelerator = Boolean(this.profile.accelerators?.length);
    const hasGovernmentSignal = Boolean(
      this.profile.founderAchievements?.some((achievement) =>
        /dpiit|grant|birac|dsir|startup india/i.test(`${achievement.title} ${achievement.description}`)
      )
    );

    const ideaScore = this.clamp(0.45 + (this.profile.marketDescription || this.profile.totalAddressableMarket ? 0.2 : 0) + (this.profile.industry === "ai" ? 0.05 : 0), 0.2, 1);
    const prototypeScore = this.clamp(0.35 + (arr > 0 ? 0.25 : 0) + (this.profile.customerCount ? 0.15 : 0) + (this.profile.competitiveAdvantage ? 0.1 : 0), 0.15, 1);
    const teamScore = this.clamp(0.35 + Math.min(0.35, teamSize * 0.08) + (this.profile.teamExperienceYears ? 0.12 : 0) + (this.profile.teamPreviousExits?.length ? 0.15 : 0), 0.2, 1);
    const relationshipScore = this.clamp(0.3 + (hasAccelerator ? 0.25 : 0) + (hasGovernmentSignal ? 0.15 : 0) + (this.profile.totalFunded ? 0.1 : 0), 0.15, 1);
    const tractionScore = this.clamp(0.25 + (arr > 0 ? 0.25 : 0) + Math.min(0.25, (this.profile.monthlyGrowthRate || 0) / 60) + Math.min(0.15, (this.profile.customerCount || 0) / 100), 0.1, 1);

    const totalValuation = this.roundMoney(
      factorValue * (ideaScore + prototypeScore + teamScore + relationshipScore + tractionScore)
    );
    const { low, high } = this.createRange(totalValuation, 20);

    return {
      lowEstimate: low,
      midEstimate: totalValuation,
      highEstimate: high,
      reasoning:
        `Berkus valuation = ${this.formatMoney(factorValue)} per milestone x scored milestone completion. ` +
        `Scores: idea ${(ideaScore * 100).toFixed(0)}%, prototype ${(prototypeScore * 100).toFixed(0)}%, team ${(teamScore * 100).toFixed(0)}%, relationships ${(relationshipScore * 100).toFixed(0)}%, traction ${(tractionScore * 100).toFixed(0)}%.`,
      sources: [
        "Dave Berkus Checklist Method",
        isIndia ? "Evaldam India pre-revenue cap calibration" : "Global early-stage Berkus cap calibration",
        "Founder-provided startup inputs",
      ],
      confidence: this.getMethodConfidence(3),
      assumptions: {
        cap,
        factorValue,
        ideaScore: Number((ideaScore * 100).toFixed(0)),
        prototypeScore: Number((prototypeScore * 100).toFixed(0)),
        teamScore: Number((teamScore * 100).toFixed(0)),
        relationshipScore: Number((relationshipScore * 100).toFixed(0)),
        tractionScore: Number((tractionScore * 100).toFixed(0)),
        calculationMode: "deterministic",
      },
    };
  }

  buildPrompt(): string {
    const isIndia = (this as any).isIndianStartup();
    const factorValue = isIndia ? 6000000 : 1000000;
    const factorCurrency = isIndia ? '₹' : '$';
    const maxValuation = isIndia ? '₹2.5Cr-₹3Cr' : '$3.75M-$5M';

    return `You are a startup valuation expert using the Berkus Method / Checklist Method.
${isIndia ? 'INDIA-FOCUSED: Using Indian pre-revenue valuation caps' : ''}

${this.buildCompanyContext()}

BERKUS METHOD (Dave Berkus, updated for 2026):
Assign value up to ${factorCurrency}${(factorValue / 1e6).toFixed(1)}M per factor (India-calibrated). Score each factor 0-100%.

Factors to evaluate:
1. Sound Idea / Business Model (${factorCurrency}${(factorValue / 1e7).toFixed(1)}Cr potential)
   - Is the idea sound and differentiated?
   - Clear business model and revenue potential?
   - Score: 0-100%

2. Prototype / Working Product (${factorCurrency}${(factorValue / 1e7).toFixed(1)}Cr potential)
   - Exists a working prototype or MVP?
   - Product demonstrates core value proposition?
   - Score: 0-100%

3. Quality Management Team (${factorCurrency}${(factorValue / 1e7).toFixed(1)}Cr potential)
   - Founder has relevant experience?
   - Team is complementary and committed?
   - Previous startup/success experience?
   - Score: 0-100%

4. ${isIndia ? 'Accelerator / Incubator Support' : 'Strategic Relationships / Network'} (${factorCurrency}${(factorValue / 1e7).toFixed(1)}Cr potential)
   - ${isIndia ? 'T-Hub, NSRCEL, YC India, or other major accelerator backing?' : 'Accelerator participation (YC, Techstars, etc.)?'}
   - ${isIndia ? 'Government recognition or grant support (DSIR, BIRAC, Startup India)?' : 'Strategic partnerships or key relationships?'}
   - Industry connections and credibility?
   - Score: 0-100%

5. Product Rollout / Early Traction / Sales (${factorCurrency}${(factorValue / 1e7).toFixed(1)}Cr potential)
   - Initial revenue or strong traction signals?
   - Customer validation or LOIs?
   - Growth trajectory evident?
   - Score: 0-100%

CALCULATION:
Pre-money valuation = (${factorCurrency}${(factorValue / 1e7).toFixed(1)}Cr × score1%) + (${factorCurrency}${(factorValue / 1e7).toFixed(1)}Cr × score2%) + (${factorCurrency}${(factorValue / 1e7).toFixed(1)}Cr × score3%) + (${factorCurrency}${(factorValue / 1e7).toFixed(1)}Cr × score4%) + (${factorCurrency}${(factorValue / 1e7).toFixed(1)}Cr × score5%)
Maximum realistic valuation: ~${maxValuation}

IMPORTANT:
- Cite "Dave Berkus Checklist Method (revised 2024)"
- Pre-revenue/idea-stage companies typically score 20-40% per factor
- Seed-stage with MVP typically score 50-75%
- Series A candidates with traction score 80-100%+
- Confidence: medium to high
- Add ±20% range

Return JSON:
{
  "ideaScore": number (0-100),
  "prototypeScore": number (0-100),
  "teamScore": number (0-100),
  "relationshipScore": number (0-100),
  "tractionScore": number (0-100),
  "valuationPerFactor": number,
  "totalValuation": number,
  "lowEstimate": number,
  "highEstimate": number,
  "reasoning": "Step-by-step scoring with final calculation",
  "confidence": "high|medium|low"
}`;
  }

  parseResponse(json: Record<string, any>) {
    const isIndia = (this as any).isIndianStartup();
    const factorValue = isIndia ? 50000000 : 750000;
    const { low, high } = this.createRange(json.totalValuation, 20);

    return {
      lowEstimate: low,
      midEstimate: json.totalValuation,
      highEstimate: high,
      reasoning: json.reasoning,
      sources: [
        "Dave Berkus Checklist Method (2024)",
        `Factor value: ${isIndia ? '₹5Cr per factor (India-calibrated)' : '$750k per factor (2026 adjustment)'}`,
      ],
      confidence: json.confidence || "medium",
      assumptions: {
        factorValue,
        ideaScore: json.ideaScore,
        prototypeScore: json.prototypeScore,
        teamScore: json.teamScore,
        relationshipScore: json.relationshipScore,
        tractionScore: json.tractionScore,
      },
    };
  }
}

export async function berkusMethod(profile: StartupProfile): Promise<ValuationMethodResult> {
  return new BerkusMethod(profile).execute();
}
