/**
 * Base class for all valuation methods
 * Eliminates repetition across scorecard, berkus, vc, dcf, etc.
 */
import { StartupProfile, ValuationMethodResult } from '@/types';
export declare abstract class ValuationMethodBase {
    protected profile: StartupProfile;
    protected methodName: 'scorecard' | 'berkus' | 'vc' | 'dcf-ltg' | 'dcf-multiples' | 'evaldam-score';
    constructor(profile: StartupProfile, methodName: ValuationMethodResult['methodName']);
    /**
     * Abstract method - each subclass implements its prompt
     */
    abstract buildPrompt(): string;
    /**
     * Abstract method - each subclass implements JSON parsing
     */
    abstract parseResponse(json: Record<string, any>): Omit<ValuationMethodResult, 'methodName'>;
    /**
     * Execute valuation - template method pattern
     */
    execute(): Promise<ValuationMethodResult>;
    /**
     * Helper: Format valuation range with ±margin
     */
    protected createRange(mid: number, marginPercent?: number): {
        low: number;
        high: number;
    };
    /**
     * Helper: Build company context section for prompt
     */
    protected buildCompanyContext(): string;
    /**
     * Helper: Get base valuation for stage
     */
    protected getBaseValuation(): number;
}
//# sourceMappingURL=base-method.d.ts.map