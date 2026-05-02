/**
 * Base class for all valuation methods
 * Eliminates repetition across scorecard, berkus, vc, dcf, etc.
 * INDIA-FOCUSED: Uses INR values and Indian benchmarks by default
 */

import { StartupProfile, ValuationMethodResult } from '@/types';
import { callLLM } from './providers';
import { extractJSON } from './client';
import { logger } from '@/lib/utils/logger';
import {
  getIndiaScorecardBase,
  getIndianExitMultiple,
  calculateIndiaWACC,
  getIndianComparableMultiple,
} from '@/lib/india-benchmarks/valuation-data';

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
    const isIndia = this.isIndianStartup();
    const INR_EXCHANGE_RATE = 83.5; // 1 USD = 83.5 INR

    const currencySymbol = isIndia ? '₹' : '$';
    const arrValue = this.profile.annualRecurringRevenue
      ? isIndia
        ? (this.profile.annualRecurringRevenue * INR_EXCHANGE_RATE).toLocaleString()
        : this.profile.annualRecurringRevenue.toLocaleString()
      : '0';
    const tamValue = this.profile.totalAddressableMarket
      ? isIndia
        ? (this.profile.totalAddressableMarket * INR_EXCHANGE_RATE).toLocaleString()
        : this.profile.totalAddressableMarket.toLocaleString()
      : 'Unknown';

    const context = `
Company Profile:
- Name: ${this.profile.companyName}
- Stage: ${this.profile.stage}
- Industry: ${this.profile.industry || 'tech'}
- Founded: ${this.profile.founded || 'N/A'}
- Headquarters: ${this.profile.headquarters || 'India'}
- Team size: ${this.profile.team?.length || 0}
- ARR: ${currencySymbol}${arrValue}
- Monthly growth: ${this.profile.monthlyGrowthRate || 'N/A'}%
- TAM: ${currencySymbol}${tamValue}
- Accelerators: ${this.profile.accelerators?.map(a => a.name).join(', ') || 'None'}
${isIndia ? `- Market Focus: India ${this.profile.founderAchievements?.some(a => a.title?.toLowerCase().includes('dpiit') || a.description?.toLowerCase().includes('dpiit')) ? '(DPIIT Recognized)' : ''}` : ''}
    `.trim();

    return context;
  }

  /**
   * Helper: Detect if startup is India-based
   */
  protected isIndianStartup(): boolean {
    if (!this.profile.headquarters) return true; // Default to India for platform
    const indiaKeywords = ['india', 'mumbai', 'bangalore', 'delhi', 'hyderabad', 'pune', 'bengaluru', 'kolkata', 'chennai', 'inr', 'indian'];
    return indiaKeywords.some(keyword =>
      this.profile.headquarters?.toLowerCase().includes(keyword)
    );
  }

  /**
   * Helper: Get base valuation for stage (INR for India, USD otherwise)
   */
  protected getBaseValuation(): number {
    const isIndia = this.isIndianStartup();

    if (isIndia) {
      // India-specific base valuations (INR)
      const isDpiit = this.profile.founderAchievements?.some(a => a.title?.toLowerCase().includes('dpiit') || a.description?.toLowerCase().includes('dpiit')) || false;
      const isIitIim = this.profile.team?.some(m => m.background?.toLowerCase().includes('iit') || m.background?.toLowerCase().includes('iim')) || false;
      const location = this.profile.headquarters || 'bangalore';

      // Use India-specific base calculation
      let base = getIndiaScorecardBase(
        this.profile.stage,
        location,
        isDpiit,
        isIitIim
      );

      // AI premium for India market
      if (this.profile.industry === 'ai') {
        base *= 1.2; // Lower premium than US (20% vs 30%)
      }

      return Math.round(base);
    }

    // Global (USD) fallback
    const basesByStage: Record<string, number> = {
      'pre-revenue': 1500000,
      'seed': 3000000,
      'series-a': 8000000,
      'series-b+': 25000000,
    };

    let base = basesByStage[this.profile.stage] || 3000000;

    if (this.profile.industry === 'ai') {
      base *= 1.3;
    }

    if (this.profile.headquarters?.includes('UAE')) {
      base *= 0.85;
    }

    return Math.round(base);
  }
}
