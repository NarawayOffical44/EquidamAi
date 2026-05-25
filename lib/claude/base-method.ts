/**
 * Base class for all valuation methods
 * Eliminates repetition across scorecard, berkus, vc, dcf, etc.
 * INDIA-FOCUSED: Uses INR values and Indian benchmarks by default
 */

import { StartupProfile, ValuationMethodResult } from '@/types';
import { logger } from '@/lib/utils/logger';
import {
  getIndiaScorecardBase,
} from '@/lib/india-benchmarks/valuation-data';

export abstract class ValuationMethodBase {
  protected profile: StartupProfile;
  protected methodName: 'scorecard' | 'berkus' | 'vc' | 'dcf-ltg' | 'dcf-multiples' | 'comparables' | 'evaldam-score';

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
      const result = this.calculateDeterministic();

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
   * Deterministic calculator for the method.
   * AI may support extraction and explanation elsewhere, but method math must be auditable.
   */
  protected calculateDeterministic(): Omit<ValuationMethodResult, 'methodName'> {
    throw new Error(`${this.methodName} has no deterministic calculator`);
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

  protected clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  protected roundMoney(value: number): number {
    if (!Number.isFinite(value) || value <= 0) return 0;
    const step = value >= 10000000 ? 100000 : value >= 1000000 ? 50000 : 10000;
    return Math.round(value / step) * step;
  }

  protected getARR(): number {
    const arr = Number(this.profile.annualRecurringRevenue || 0);
    if (Number.isFinite(arr) && arr > 0) return arr;
    const mrr = Number(this.profile.monthlyRecurringRevenue || this.profile.recentMonthlyRevenue || 0);
    return Number.isFinite(mrr) && mrr > 0 ? mrr * 12 : 0;
  }

  protected getTeamSize(): number {
    return Math.max(0, this.profile.team?.length || 0);
  }

  protected getAnnualGrowthRate(): number {
    const override = this.getRateAssumptionOverride([
      "annualGrowthRate",
      "revenueGrowthRate",
      "growthRate",
      "projectedGrowthRate",
    ]);
    if (override !== null) return this.clamp(override, 0.01, 2.5);

    const monthlyGrowth = Number(this.profile.monthlyGrowthRate || 0);
    if (!Number.isFinite(monthlyGrowth) || monthlyGrowth <= 0) return 0.12;
    const annualized = Math.pow(1 + monthlyGrowth / 100, 12) - 1;
    return this.clamp(annualized, 0.05, 2.0);
  }

  protected getGrossMargin(): number {
    const grossMargin = Number(this.profile.grossMargin || 0);
    if (!Number.isFinite(grossMargin) || grossMargin <= 0) return 0.65;
    return this.clamp(grossMargin / 100, 0.1, 0.9);
  }

  protected getValuationCurrency(): "INR" | "USD" {
    return this.isIndianStartup() ? "INR" : "USD";
  }

  protected formatMoney(value: number): string {
    if (this.getValuationCurrency() === "INR") {
      if (value >= 10000000) return `INR ${(value / 10000000).toFixed(2)}Cr`;
      if (value >= 100000) return `INR ${(value / 100000).toFixed(2)}L`;
      return `INR ${Math.round(value).toLocaleString("en-IN")}`;
    }
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    return `$${Math.round(value).toLocaleString("en-US")}`;
  }

  protected getMethodConfidence(requiredSignals: number): 'high' | 'medium' | 'low' {
    let score = 0;
    if (this.getARR() > 0) score++;
    if ((this.profile.monthlyGrowthRate || 0) > 0) score++;
    if ((this.profile.totalAddressableMarket || 0) > 0) score++;
    if (this.getTeamSize() > 0) score++;
    if ((this.profile.customerCount || 0) > 0) score++;
    if ((this.profile.grossMargin || 0) > 0) score++;

    if (score >= requiredSignals) return 'high';
    if (score >= Math.max(2, requiredSignals - 2)) return 'medium';
    return 'low';
  }

  protected getNumericAssumptionOverride(keys: string[]): number | null {
    const normalizedKeys = keys.map((key) => this.normalizeAssumptionKey(key));
    const contexts = [
      this.profile.customValuationContext,
      this.profile.additionalFactors,
    ].filter(Boolean) as Array<Record<string, string>>;

    for (const context of contexts) {
      for (const [rawKey, rawValue] of Object.entries(context)) {
        const normalizedKey = this.normalizeAssumptionKey(rawKey);
        const matches = normalizedKeys.some(
          (key) => normalizedKey === key || normalizedKey.includes(key)
        );
        if (!matches) continue;

        const parsed = this.parseNumericAssumption(rawValue);
        if (parsed !== null) return parsed;
      }
    }

    return null;
  }

  protected getRateAssumptionOverride(keys: string[]): number | null {
    const value = this.getNumericAssumptionOverride(keys);
    if (value === null) return null;
    return value > 1 ? value / 100 : value;
  }

  protected getBenchmarkedMultiple(
    keys: string[],
    defaultValue: number,
    benchmarkMin: number,
    benchmarkMax: number
  ): {
    value: number;
    defaultValue: number;
    overrideUsed: boolean;
    benchmarkWarning?: string;
  } {
    const override = this.getNumericAssumptionOverride(keys);
    const value = override ?? defaultValue;
    const benchmarkWarning = override !== null && (override < benchmarkMin || override > benchmarkMax)
      ? `User override ${override.toFixed(2)}x is outside benchmark range ${benchmarkMin.toFixed(1)}x-${benchmarkMax.toFixed(1)}x.`
      : undefined;

    return {
      value,
      defaultValue,
      overrideUsed: override !== null,
      benchmarkWarning,
    };
  }

  protected getBenchmarkedRate(
    keys: string[],
    defaultValue: number,
    benchmarkMin: number,
    benchmarkMax: number
  ): {
    value: number;
    defaultValue: number;
    overrideUsed: boolean;
    benchmarkWarning?: string;
  } {
    const override = this.getRateAssumptionOverride(keys);
    const value = override ?? defaultValue;
    const benchmarkWarning = override !== null && (override < benchmarkMin || override > benchmarkMax)
      ? `User override ${(override * 100).toFixed(1)}% is outside benchmark range ${(benchmarkMin * 100).toFixed(1)}%-${(benchmarkMax * 100).toFixed(1)}%.`
      : undefined;

    return {
      value,
      defaultValue,
      overrideUsed: override !== null,
      benchmarkWarning,
    };
  }

  protected projectRevenue(
    startingRevenue: number,
    years: number,
    options: {
      maxInitialGrowth?: number;
      minGrowth?: number;
      decay?: number;
    } = {}
  ): {
    projectedRevenue: number;
    annualRevenues: number[];
    annualGrowthRates: number[];
    baseAnnualGrowth: number;
    growthOverrideUsed: boolean;
    growthBenchmarkWarning?: string;
  } {
    const growthOverride = this.getRateAssumptionOverride([
      "annualGrowthRate",
      "revenueGrowthRate",
      "growthRate",
      "projectedGrowthRate",
    ]);
    const baseAnnualGrowth = growthOverride ?? this.getAnnualGrowthRate();
    const maxInitialGrowth = options.maxInitialGrowth ?? this.getStageGrowthCap();
    const minGrowth = options.minGrowth ?? (this.profile.stage === "pre-revenue" ? 0.06 : 0.04);
    const decay = options.decay ?? 0.72;
    const annualRevenues: number[] = [];
    const annualGrowthRates: number[] = [];
    let revenue = Math.max(0, startingRevenue);

    for (let year = 1; year <= years; year += 1) {
      const decayedCap = Math.max(minGrowth, maxInitialGrowth * Math.pow(0.88, year - 1));
      const growth = this.clamp(baseAnnualGrowth * Math.pow(decay, year - 1), minGrowth, decayedCap);
      revenue *= 1 + growth;
      annualRevenues.push(revenue);
      annualGrowthRates.push(Number((growth * 100).toFixed(2)));
    }

    const growthBenchmarkWarning = growthOverride !== null && growthOverride > maxInitialGrowth
      ? `User growth override ${(growthOverride * 100).toFixed(1)}% exceeds stage benchmark cap ${(maxInitialGrowth * 100).toFixed(1)}%; projection applies annual decay and cap.`
      : undefined;

    return {
      projectedRevenue: revenue,
      annualRevenues,
      annualGrowthRates,
      baseAnnualGrowth,
      growthOverrideUsed: growthOverride !== null,
      growthBenchmarkWarning,
    };
  }

  private getStageGrowthCap(): number {
    const isIndia = this.isIndianStartup();
    const caps: Record<string, number> = isIndia
      ? {
          "pre-revenue": 0.80,
          seed: 0.70,
          "series-a": 0.50,
          "series-b+": 0.35,
        }
      : {
          "pre-revenue": 0.95,
          seed: 0.85,
          "series-a": 0.65,
          "series-b+": 0.45,
        };

    return caps[this.profile.stage] || (isIndia ? 0.60 : 0.75);
  }

  private normalizeAssumptionKey(key: string): string {
    return key.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  private parseNumericAssumption(value: unknown): number | null {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value !== "string") return null;

    const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
    if (!match) return null;

    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  /**
   * Helper: Build company context section for prompt
   */
  protected buildCompanyContext(): string {
    const isIndia = this.isIndianStartup();
    const currencySymbol = isIndia ? '₹' : '$';
    const arrValue = this.getARR() ? this.getARR().toLocaleString() : '0';
    const tamValue = this.profile.totalAddressableMarket
      ? this.profile.totalAddressableMarket.toLocaleString()
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
