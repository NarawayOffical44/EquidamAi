/**
 * Evaldam AI - Professional Valuation Engine
 * Senior Valuation Specialist (20+ years CA + IB)
 *
 * Strict methodology: 6 professional methods + dynamic weighting
 * Every number cited. Every calculation shown. Full transparency.
 */
import { StartupProfile, ValuationResult } from "@/types";
export interface ProfessionalValuationResult extends ValuationResult {
    executiveSummary: {
        blendedRange: {
            low: number;
            high: number;
            mid: number;
        };
        keyReasons: string[];
        methodologyNote: string;
        confidenceRating: string;
    };
    detailedAnalysis: {
        industryAnalysis: string;
        comparableCompanies: string[];
        marketContext: string;
    };
    sensitivityAnalysis: Array<{
        variable: string;
        scenario: string;
        impact: number;
        percentageChange: number;
    }>;
    professionalCitation: string;
}
/**
 * Professional Valuation Engine
 * Runs all 5 methods with full transparency and professional rigor
 */
export declare class ProfessionalValuationEngine {
    private profile;
    private userId;
    constructor(profile: StartupProfile, userId: string);
    /**
     * Execute complete professional valuation
     * Step 1: Run all 5 methods in parallel
     * Step 2: Perform market research
     * Step 3: Dynamic weighting
     * Step 4: Generate professional output
     */
    execute(): Promise<ProfessionalValuationResult>;
    /**
     * Get default fallback valuation based on stage and profile
     */
    private getDefaultValuation;
    /**
     * Analyze industry and auto-detect sector
     */
    private analyzeIndustry;
    /**
     * Identify comparable companies
     */
    private identifyComparables;
    /**
     * Market context and current 2026 landscape
     */
    private getMarketContext;
    /**
     * Calculate dynamic weights based on stage
     * EVALDAM PROPRIETARY: 20% weight to Evaldam Score (combines all factors)
     * Traditional methods: 80% total weight, stage-based distribution
     */
    private calculateDynamicWeights;
    /**
     * Blend valuations using weighted average
     */
    private blendValuations;
    /**
     * Create method breakdown with weights
     */
    private createMethodBreakdown;
    /**
     * Generate sensitivity analysis
     */
    private generateSensitivityAnalysis;
    /**
     * Generate 3-4 key reasons for executive summary
     */
    private generateKeyReasons;
    /**
     * Rate confidence level
     */
    private rateConfidence;
    /**
     * Calculate data completeness score
     */
    private calculateDataCompleteness;
    /**
     * Determine final confidence level
     */
    private determineConfidenceLevel;
}
//# sourceMappingURL=professional-engine.d.ts.map