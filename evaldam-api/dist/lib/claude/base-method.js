"use strict";
/**
 * Base class for all valuation methods
 * Eliminates repetition across scorecard, berkus, vc, dcf, etc.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValuationMethodBase = void 0;
const providers_1 = require("./providers");
const client_1 = require("./client");
const logger_1 = require("@/lib/utils/logger");
class ValuationMethodBase {
    constructor(profile, methodName) {
        this.profile = profile;
        this.methodName = methodName;
    }
    /**
     * Execute valuation - template method pattern
     */
    async execute() {
        logger_1.logger.info(`Executing ${this.methodName} valuation`, {
            company: this.profile.companyName,
            stage: this.profile.stage,
        });
        try {
            const prompt = this.buildPrompt();
            const responseText = await (0, providers_1.callLLM)([{ role: 'user', content: prompt }], {
                useCase: 'valuation',
                temperature: 0.2,
            });
            // Log response for debugging
            if (!responseText || responseText.length === 0) {
                throw new Error(`Empty response from LLM for ${this.methodName}`);
            }
            logger_1.logger.debug(`${this.methodName} response`, {
                responsePreview: responseText.substring(0, 300),
                length: responseText.length,
            });
            const json = (0, client_1.extractJSON)(responseText);
            const result = this.parseResponse(json);
            logger_1.logger.info(`${this.methodName} complete`, {
                valuation: result.midEstimate,
                confidence: result.confidence,
            });
            return {
                methodName: this.methodName,
                ...result,
            };
        }
        catch (error) {
            logger_1.logger.error(`${this.methodName} valuation failed`, error, { company: this.profile.companyName });
            throw error;
        }
    }
    /**
     * Helper: Format valuation range with ±margin
     */
    createRange(mid, marginPercent = 20) {
        const margin = mid * (marginPercent / 100);
        return {
            low: Math.round(mid - margin),
            high: Math.round(mid + margin),
        };
    }
    /**
     * Helper: Build company context section for prompt
     */
    buildCompanyContext() {
        return `
Company Profile:
- Name: ${this.profile.companyName}
- Stage: ${this.profile.stage}
- Industry: ${this.profile.industry || 'tech'}
- Founded: ${this.profile.founded || 'N/A'}
- Headquarters: ${this.profile.headquarters || 'N/A'}
- Team size: ${this.profile.team?.length || 0}
- ARR: $${this.profile.annualRecurringRevenue?.toLocaleString() || '0'}
- Monthly growth: ${this.profile.monthlyGrowthRate || 'N/A'}%
- TAM: $${this.profile.totalAddressableMarket?.toLocaleString() || 'Unknown'}
- Accelerators: ${this.profile.accelerators?.map(a => a.name).join(', ') || 'None'}
    `.trim();
    }
    /**
     * Helper: Get base valuation for stage
     */
    getBaseValuation() {
        const basesByStage = {
            'pre-revenue': 1500000,
            'seed': 3000000,
            'series-a': 8000000,
            'series-b+': 25000000,
        };
        let base = basesByStage[this.profile.stage] || 3000000;
        // AI premium
        if (this.profile.industry === 'ai') {
            base *= 1.3;
        }
        // Geography adjustment
        if (this.profile.headquarters?.includes('UAE')) {
            base *= 0.85;
        }
        return Math.round(base);
    }
}
exports.ValuationMethodBase = ValuationMethodBase;
//# sourceMappingURL=base-method.js.map