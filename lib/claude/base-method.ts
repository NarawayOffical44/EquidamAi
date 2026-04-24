/**
 * Base class for all valuation methods
 * Eliminates repetition across scorecard, berkus, vc, dcf, etc.
 */

import { StartupProfile, ValuationMethodResult } from '@/types';
import { callLLM } from './providers';
import { extractJSON } from './client';
import { logger } from '@/lib/utils/logger';

export abstract class ValuationMethodBase {
  protected profile: StartupProfile;
  protected methodName: 'scorecard' | 'berkus' | 'vc' | 'dcf-ltg' | 'dcf-multiples' | 'evaldam-score';

  constructor(profile: StartupProfile, methodName: ValuationMethodResult['methodName']) {
    this.profile = profile;
    this.methodName = methodName;
  }

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
  async execute(): Promise<ValuationMethodResult> {
    logger.info(`Executing ${this.methodName} valuation`, {
      company: this.profile.companyName,
      stage: this.profile.stage,
    });

    try {
      const prompt = this.buildPrompt();
      const responseText = await callLLM(
        [{ role: 'user', content: prompt }],
        {
          useCase: 'valuation',
          temperature: 0.2,
        }
      );

      // Log response for debugging
      if (!responseText || responseText.length === 0) {
        throw new Error(`Empty response from LLM for ${this.methodName}`);
      }

      logger.debug(`${this.methodName} response`, {
        responsePreview: responseText.substring(0, 300),
        length: responseText.length,
      });

      const json = extractJSON(responseText);
      const result = this.parseResponse(json);

      logger.info(`${this.methodName} complete`, {
        valuation: result.midEstimate,
        confidence: result.confidence,
      });

      return {
        methodName: this.methodName,
        ...result,
      };
    } catch (error) {
      logger.error(
        `${this.methodName} valuation failed`,
        error,
        { company: this.profile.companyName }
      );
      throw error;
    }
  }

  /**
   * Helper: Format valuation range with ±margin
   */
  protected createRange(
    mid: number,
    marginPercent = 20
  ): { low: number; high: number } {
    const margin = mid * (marginPercent / 100);
    return {
      low: Math.round(mid - margin),
      high: Math.round(mid + margin),
    };
  }

  /**
   * Helper: Build company context section for prompt
   */
  protected buildCompanyContext(): string {
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
  protected getBaseValuation(): number {
    const basesByStage: Record<string, number> = {
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
