import { StartupProfile, ValuationMethodResult } from "@/types";
import { ValuationMethodBase } from "@/lib/claude/base-method";

export class BerkusMethod extends ValuationMethodBase {
  constructor(profile: StartupProfile) {
    super(profile, "berkus");
  }

  buildPrompt(): string {
    return `You are a startup valuation expert using the Berkus Method / Checklist Method.

${this.buildCompanyContext()}

BERKUS METHOD (Dave Berkus, updated for 2026):
Assign value up to $750k per factor (2026 hot market adjustment). Score each factor 0-100%.

Factors to evaluate:
1. Sound Idea / Business Model ($750k potential)
   - Is the idea sound and differentiated?
   - Clear business model and revenue potential?
   - Score: 0-100%

2. Prototype / Working Product ($750k potential)
   - Exists a working prototype or MVP?
   - Product demonstrates core value proposition?
   - Score: 0-100%

3. Quality Management Team ($750k potential)
   - Founder has relevant experience?
   - Team is complementary and committed?
   - Previous startup/success experience?
   - Score: 0-100%

4. Strategic Relationships / Network ($750k potential)
   - Accelerator participation (YC, Techstars, etc.)?
   - Strategic partnerships or key relationships?
   - Industry connections and credibility?
   - Score: 0-100%

5. Product Rollout / Early Traction / Sales ($750k potential)
   - Initial revenue or strong traction signals?
   - Customer validation or LOIs?
   - Growth trajectory evident?
   - Score: 0-100%

CALCULATION:
Pre-money valuation = ($750k × score1%) + ($750k × score2%) + ($750k × score3%) + ($750k × score4%) + ($750k × score5%)
Maximum realistic valuation: ~$3.75M-$5M

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
    const { low, high } = this.createRange(json.totalValuation, 20);

    return {
      lowEstimate: low,
      midEstimate: json.totalValuation,
      highEstimate: high,
      reasoning: json.reasoning,
      sources: [
        "Dave Berkus Checklist Method (2024)",
        "Factor value: $750k per factor (2026 adjustment)",
      ],
      confidence: json.confidence || "medium",
      assumptions: {
        factorValue: 750000,
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
