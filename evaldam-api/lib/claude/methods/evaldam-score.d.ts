import { ValuationMethodBase } from '../base-method';
import { StartupProfile } from '@/types';
export declare class EvalDamScoreMethod extends ValuationMethodBase {
    constructor(profile: StartupProfile);
    execute(): Promise<any>;
    /**
     * STEP 1: Internal Database Comparison
     * Compare startup against similar ones in Supabase
     * For MVP: hardcoded scores; production: query DB
     */
    private calculateInternalPercentile;
    /**
     * STEP 2: Industry Growth Rate Premium (2026 Verified Data)
     * Sources: McKinsey AI Index 2026, Gartner Magic Quadrant, CB Insights
     */
    private calculateIndustryGrowthPremium;
    /**
     * STEP 3: Team Exit History Bonus
     * Founder/team members with successful exits → +5-15%
     */
    private calculateTeamExitBonus;
    /**
     * STEP 4: Patent/IP Strength Bonus
     * More patents → stronger moat → higher valuation
     */
    private calculatePatentBonus;
    /**
     * STEP 5: Customer Concentration Risk
     * If >40% revenue from one customer → risk discount
     */
    private calculateConcentrationRisk;
    /**
     * STEP 6: Market Timing Score
     * Assess if startup is entering market at right time
     * Uses industry growth rate + TAM expansion
     */
    private calculateMarketTimingScore;
    /**
     * STEP 7: Assess Moat Strength via LLM
     * Uses user input + GPT assessment of competitive advantage
     */
    private assessMoatStrength;
    /**
     * STEP 8: Parse Investor Custom Criteria
     * Reads from profile.customValuationContext (entered via prompt box)
     */
    private parseInvestorCriteria;
    /**
     * Determine confidence level based on data completeness
     */
    private determineConfidence;
    /**
     * Build detailed multi-line reasoning with all factors
     */
    private buildDetailedReasoning;
    buildPrompt(): string;
    parseResponse(): any;
}
export default EvalDamScoreMethod;
//# sourceMappingURL=evaldam-score.d.ts.map