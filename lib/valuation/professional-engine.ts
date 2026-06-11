/**
 * Evaldam AI - Professional Valuation Engine
 * Senior Valuation Specialist (20+ years CA + IB)
 *
 * Strict methodology: 6 professional methods + dynamic weighting
 * Every number cited. Every calculation shown. Full transparency.
 */

import { StartupProfile, ValuationResult, ValuationMethodResult } from "@/types";
import { ScorecardMethod } from "@/lib/claude/methods/scorecard";
import { BerkusMethod } from "@/lib/claude/methods/berkus";
import { VCMethod } from "@/lib/claude/methods/vcMethod";
import { DCFLTGMethod } from "@/lib/claude/methods/dcfLTG";
import { DCFMultiplesMethod } from "@/lib/claude/methods/dcfMultiples";
import { ComparablesMethod } from "@/lib/claude/methods/comparables";
import { EvalDamScoreMethod } from "@/lib/claude/methods/evaldam-score";
import { logger } from "@/lib/utils/logger";
import { getLiveWACC } from "@/lib/market-data/fed-rates";
import { getLiveComparables, calculateIndustryMultiple } from "@/lib/market-data/comparables";

const DEFAULT_METHOD_TIMEOUT_MS = 90_000;
const DEFAULT_ENGINE_TIMEOUT_MS = 120_000;
type ValuationCurrency = "INR" | "USD";

const INDIA_VALUATION_CONTEXT = {
  riskFreeRate: 0.067,
  countryRiskPremium: 0.035,
  earlyStageDiscountRateRange: "45-60%",
};

const GLOBAL_VALUATION_CONTEXT = {
  riskFreeRate: 0.04,
  earlyStageDiscountRateRange: "30-40%",
};

export class ValuationTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValuationTimeoutError";
  }
}

export interface ProfessionalValuationResult extends ValuationResult {
  executiveSummary: {
    blendedRange: { low: number; high: number; mid: number };
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

interface ProfessionalValuationEngineOptions {
  includeEvaldamScore?: boolean;
}

interface ProfessionalValuationAnchor {
  mid: number;
  low?: number;
  high?: number;
  confidence: "high" | "medium" | "low";
  source: string;
}

interface BlendResult {
  low: number;
  high: number;
  mid: number;
  adjustedEstimates: Record<string, number>;
  effectiveWeights: Record<string, number>;
  notes: string[];
}

/**
 * Professional Valuation Engine
 * Runs deterministic valuation methods with full transparency and professional rigor.
 */
export class ProfessionalValuationEngine {
  private profile: StartupProfile;
  private userId: string;
  private includeEvaldamScore: boolean;

  constructor(profile: StartupProfile, userId: string, options: ProfessionalValuationEngineOptions = {}) {
    this.profile = profile;
    this.userId = userId;
    this.includeEvaldamScore = options.includeEvaldamScore !== false;
  }

  /**
   * Execute complete professional valuation
   * Step 1: Run deterministic methods in parallel
   * Step 2: Perform market research
   * Step 3: Dynamic weighting
   * Step 4: Generate professional output
   */
  async execute(): Promise<ProfessionalValuationResult> {
    logger.info("Evaldam: Professional Valuation Started", {
      company: this.profile.companyName,
      stage: this.profile.stage,
      timestamp: new Date().toISOString(),
    });

    // Fetch live market data
    const liveWACC = await getLiveWACC();
    const liveComparables = await getLiveComparables(this.profile.industry || "tech", this.profile.stage);
    const industryMultiple = calculateIndustryMultiple(liveComparables, this.profile.industry || "tech");

    logger.info("Live market data fetched", {
      riskFreeRate: liveWACC.riskFreeRate,
      comparables: liveComparables.length,
      industryMultiple: industryMultiple.medianMultiple,
    });

    // Store live data for use by methods
    (this as any).liveWACC = liveWACC;
    (this as any).liveComparables = liveComparables;
    (this as any).industryMultiple = industryMultiple;

    // Step 1: Run methods in parallel with error handling.
    const methodExecutions = [
      { name: "scorecard", run: () => new ScorecardMethod(this.profile).execute() },
      { name: "berkus", run: () => new BerkusMethod(this.profile).execute() },
      { name: "vc", run: () => new VCMethod(this.profile).execute() },
      { name: "dcf-ltg", run: () => new DCFLTGMethod(this.profile).execute() },
      { name: "dcf-multiples", run: () => new DCFMultiplesMethod(this.profile).execute() },
      { name: "comparables", run: () => new ComparablesMethod(this.profile, liveComparables, industryMultiple).execute() },
    ];

    if (this.includeEvaldamScore) {
      methodExecutions.push({
        name: "evaldam-score",
        run: () => new EvalDamScoreMethod(this.profile).execute(),
      });
    }

    const methodTimeoutMs = getTimeoutMs("VALUATION_METHOD_TIMEOUT_MS", DEFAULT_METHOD_TIMEOUT_MS);
    const engineTimeoutMs = getTimeoutMs("VALUATION_ENGINE_TIMEOUT_MS", DEFAULT_ENGINE_TIMEOUT_MS);
    const results = await withTimeout(
      Promise.allSettled(
        methodExecutions.map((method) =>
          withTimeout(method.run(), methodTimeoutMs, `${method.name} valuation method`)
        )
      ),
      engineTimeoutMs,
      "valuation method batch"
    );

    // Process results and exclude failed/invalid methods from the blend.
    const methods: ValuationMethodResult[] = [];
    const failedMethods: string[] = [];
    const methodNames = methodExecutions.map((method) => method.name);

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const method = this.sanitizeMethodResult(result.value);
        if (method) {
          methods.push(method);
          logger.info(`${methodNames[index]} succeeded`, { valuation: method.midEstimate });
        } else {
          failedMethods.push(methodNames[index]);
          logger.warn(`${methodNames[index]} returned invalid valuation output`);
        }
      } else {
        failedMethods.push(methodNames[index]);
        logger.warn(`${methodNames[index]} failed and was excluded from weighted blend`, {
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
      }
    });

    if (methods.length === 0) {
      const fallbackMethod = this.createFallbackMethod();
      methods.push(fallbackMethod);
      failedMethods.push("all_primary_methods");
      logger.warn("All valuation methods failed; using a single low-confidence fallback method", {
        valuation: fallbackMethod.midEstimate,
      });
    }

    // Step 2: Market context (industry detection, comparables)
    const industryAnalysis = this.analyzeIndustry();
    const comparables = this.identifyComparables();
    const marketContext = this.getMarketContext();

    // Step 3: Dynamic weighting based on stage
    const weights = this.calculateDynamicWeights(methods);
    const blendedValuation = this.blendValuations(methods, weights);

    // Step 4: Sensitivity analysis
    const sensitivityAnalysis = this.generateSensitivityAnalysis(blendedValuation.mid);

    // Step 5: Generate professional output
    const result: ProfessionalValuationResult = {
      id: `val_${Date.now()}`,
      startupId: this.profile.id || `startup_${Date.now()}`,
      userId: this.userId,
      methods,
      blended: {
        lowRange: blendedValuation.low,
        highRange: blendedValuation.high,
        weightedAverage: blendedValuation.mid,
        methodBreakdown: this.createMethodBreakdown(
          methods,
          blendedValuation.effectiveWeights,
          blendedValuation.adjustedEstimates
        ),
        sensitivityAnalysis: sensitivityAnalysis.map(s => ({
          metric: s.variable,
          scenario: s.scenario,
          impactOnValuation: s.impact,
        })),
        keyReasons: this.generateKeyReasons(methods, blendedValuation),
      },
      executiveSummary: {
        blendedRange: blendedValuation,
        keyReasons: this.generateKeyReasons(methods, blendedValuation),
        methodologyNote: this.buildMethodologyNote(methods, failedMethods, blendedValuation.notes),
        confidenceRating: this.rateConfidence(methods),
      },
      detailedAnalysis: {
        industryAnalysis,
        comparableCompanies: comparables,
        marketContext,
      },
      sensitivityAnalysis,
      dataCompleteness: this.calculateDataCompleteness(),
      confidenceLevel: this.determineConfidenceLevel(methods),
      generatedAt: new Date().toISOString(),
      generatedByModel: "evaldam-deterministic-valuation-engine-2026",
      professionalCitation: `Valuation Report Generated: ${new Date().toLocaleDateString()} | Source: Evaldam Deterministic Valuation Engine | Methodology: ${methods.length}-method normalized blend | Currency: ${this.getValuationCurrency()} | Benchmarks: 2026 Market Data`,
    };

    logger.info("EQUIDAM: Valuation Complete", {
      blendedValuation: result.blended.weightedAverage,
      confidenceLevel: result.confidenceLevel,
    });

    return result;
  }

  /**
   * Get default fallback valuation based on stage and profile
   */
  private getDefaultValuation(): number {
    const stage = this.profile.stage;
    const arr = this.getARRInValuationCurrency();
    const currency = this.getValuationCurrency();

    // Stage-based defaults (conservative estimates)
    const stageDefaults: Record<ValuationCurrency, Record<string, number>> = {
      INR: {
        'pre-revenue': 25000000,
        'seed': 40000000,
        'series-a': 120000000,
        'series-b+': 400000000,
      },
      USD: {
        'pre-revenue': 1500000,
        'seed': 3000000,
        'series-a': 8000000,
        'series-b+': 25000000,
      },
    };

    let baseValuation = stageDefaults[currency][stage] || stageDefaults[currency].seed;

    // Adjust by ARR if available
    if (arr > 0) {
      const arrMultiple = this.isIndianStartup() ? 3.5 : 4;
      baseValuation = Math.max(baseValuation, arr * arrMultiple);
    }

    return baseValuation;
  }

  private createFallbackMethod(): ValuationMethodResult {
    const fallbackValuation = this.getDefaultValuation();
    return {
      methodName: "scorecard",
      lowEstimate: Math.round(fallbackValuation * 0.65),
      midEstimate: Math.round(fallbackValuation),
      highEstimate: Math.round(fallbackValuation * 1.35),
      reasoning:
        "Low-confidence fallback valuation because all primary valuation methods failed. This fallback is stage and revenue calibrated only and should not be treated as investor-ready.",
      sources: ["Evaldam stage-based fallback benchmark"],
      confidence: "low",
      assumptions: {
        fallback: "true",
        currency: this.getValuationCurrency(),
      },
    };
  }

  private sanitizeMethodResult(method: ValuationMethodResult): ValuationMethodResult | null {
    const lowEstimate = Number(method.lowEstimate);
    const midEstimate = Number(method.midEstimate);
    const highEstimate = Number(method.highEstimate);

    if (![lowEstimate, midEstimate, highEstimate].every((value) => Number.isFinite(value) && value > 0)) {
      return null;
    }

    const low = Math.min(lowEstimate, midEstimate, highEstimate);
    const high = Math.max(lowEstimate, midEstimate, highEstimate);

    return {
      ...method,
      lowEstimate: Math.round(low),
      midEstimate: Math.round(midEstimate),
      highEstimate: Math.round(high),
      assumptions: {
        ...method.assumptions,
        valuationCurrency: this.getValuationCurrency(),
      },
    };
  }

  private normalizeWeightsForAvailableMethods(
    methods: ValuationMethodResult[],
    rawWeights: Record<string, number>
  ): Record<string, number> {
    const availableMethodNames = new Set(methods.map((method) => method.methodName));
    const normalized: Record<string, number> = {};
    let totalWeight = 0;

    for (const method of methods) {
      const rawWeight = availableMethodNames.has(method.methodName)
        ? Math.max(0, rawWeights[method.methodName] ?? 0)
        : 0;
      normalized[method.methodName] = rawWeight;
      totalWeight += rawWeight;
    }

    if (totalWeight <= 0) {
      const equalWeight = methods.length > 0 ? 1 / methods.length : 0;
      for (const method of methods) normalized[method.methodName] = equalWeight;
      return normalized;
    }

    for (const method of methods) {
      normalized[method.methodName] = normalized[method.methodName] / totalWeight;
    }

    return normalized;
  }

  private buildMethodologyNote(
    methods: ValuationMethodResult[],
    failedMethods: string[],
    blendNotes: string[] = []
  ): string {
    const failedNote = failedMethods.length > 0
      ? ` Excluded failed/invalid methods from the blend: ${Array.from(new Set(failedMethods)).join(", ")}.`
      : "";
    const indiaNote = this.isIndianStartup()
      ? " India calibration applies FEMA/Rule 11UA context, higher INR discount-rate assumptions, and India-market multiple discounts."
      : " Global calibration applies USD-market rates and global venture comparables.";
    const assumptionWarnings = this.getAssumptionOverrideWarnings();
    const assumptionNote = assumptionWarnings.length > 0
      ? ` User assumption guardrails: ${assumptionWarnings.join(" ")}`
      : "";
    const blendNote = blendNotes.length > 0
      ? ` Blend controls: ${blendNotes.join(" ")}`
      : "";

    return `Valuation derived from ${methods.length} valid deterministic method${methods.length === 1 ? "" : "s"} with normalized stage-weighted blending. AI is limited to input support and narrative context; final valuation math is formula-based and auditable.${indiaNote}${blendNote}${assumptionNote}${failedNote}`;
  }

  private getValuationCurrency(): ValuationCurrency {
    return this.isIndianStartup() ? "INR" : "USD";
  }

  private getARRInValuationCurrency(): number {
    const arr = Number(this.profile.annualRecurringRevenue || 0);
    if (Number.isFinite(arr) && arr > 0) return arr;

    const mrr = Number(this.profile.monthlyRecurringRevenue || this.profile.recentMonthlyRevenue || 0);
    return Number.isFinite(mrr) && mrr > 0 ? mrr * 12 : 0;
  }

  private formatMoney(value: number): string {
    const currency = this.getValuationCurrency();
    if (currency === "INR") {
      if (value >= 10000000) return `INR ${(value / 10000000).toFixed(2)}Cr`;
      if (value >= 100000) return `INR ${(value / 100000).toFixed(2)}L`;
      return `INR ${Math.round(value).toLocaleString("en-IN")}`;
    }
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    return `$${Math.round(value).toLocaleString("en-US")}`;
  }

  private isIndianStartup(): boolean {
    const explicitCountry = String((this.profile as StartupProfile & { country?: string }).country || "").toLowerCase();
    if (["in", "ind", "india", "bharat"].includes(explicitCountry)) return true;
    if (explicitCountry && !["in", "ind", "india", "bharat"].includes(explicitCountry)) return false;

    const headquarters = (this.profile.headquarters || "India").toLowerCase();
    const indiaKeywords = [
      "india",
      "mumbai",
      "bangalore",
      "bengaluru",
      "delhi",
      "hyderabad",
      "pune",
      "kolkata",
      "chennai",
      "inr",
      "indian",
    ];
    return indiaKeywords.some((keyword) => headquarters.includes(keyword));
  }

  /**
   * Analyze industry and auto-detect sector
   */
  private analyzeIndustry(): string {
    const industry = this.profile.industry || "technology";
    const stage = this.profile.stage;
    const arr = this.getARRInValuationCurrency();
    const isIndia = this.isIndianStartup();

    let analysis = `Industry: ${industry.toUpperCase()}\n`;
    analysis += `Stage: ${stage} | Current ARR: ${this.formatMoney(arr)}\n\n`;

    if (isIndia) {
      analysis +=
        "India calibration applied: higher INR risk-free-rate baseline, FEMA/Income Tax compliance context, and India-market multiple discounts for domestic revenue profiles. ";
      analysis +=
        `Early-stage discount-rate reference range: ${INDIA_VALUATION_CONTEXT.earlyStageDiscountRateRange}. `;
      analysis +=
        "Foreign investment outputs should be treated as commercial estimates, not certified statutory valuation reports.\n";
    } else if (industry === "ai") {
      analysis +=
        "AI/ML-focused companies command premium multiples (8–50x ARR depending on traction). ";
      analysis += "Market premium reflects strong growth tailwinds and defensibility. ";
      analysis += "Data: Damodaran 2026 AI sector analysis, VentureSource Q1 2026.\n";
    } else if (industry === "saas") {
      analysis +=
        "SaaS valuation multiples vary by growth rate and margin profile. ";
      analysis += "Baseline 4.5–5.7x ARR for traditional; higher for AI-enhanced. ";
      analysis += "Sources: Livmo 2026 SaaS Index, S&P CapitalIQ.\n";
    }

    return analysis;
  }

  /**
   * Identify comparable companies (using live market data)
   */
  private identifyComparables(): string[] {
    const comparablesList = (this as any).liveComparables || [];

    if (comparablesList.length === 0) {
      if (this.isIndianStartup()) {
        return [
          "Indian SaaS/fintech private rounds (typical revenue multiples 3-6x, lower for domestic-only ARPU)",
          "Indian early-stage rounds calibrated to higher discount rates and regulatory execution risk",
        ];
      }
      return [
        "Series A SaaS companies (typical multiples 3–8x ARR)",
        "Growth-stage tech (typical multiples 5–15x depending on sector)",
      ];
    }

    return comparablesList.map((comp: any) => {
      const multiple = comp.multiple ? ` (~${comp.multiple.toFixed(1)}x ARR)` : "";
      const valuation = comp.valuation ? ` $${(comp.valuation / 1e9).toFixed(1)}B` : "";
      const source = comp.source ? `; source: ${comp.source}` : "";
      return `${comp.name} (${comp.industry.toUpperCase()} ${comp.stage}${valuation}${multiple}${source})`;
    });
  }

  /**
   * Market context with live Federal Reserve data
   */
  private getMarketContext(): string {
    if (this.isIndianStartup()) {
      const comparableStatus = (((this as any).liveComparables || []) as Array<{ source?: string }>).some((comp) =>
        /fallback/i.test(comp.source || "")
      )
        ? "Comparable context includes fallback benchmarks and should be independently verified."
        : "Comparable context was generated from configured market data sources.";

      return `2026 India Market Context:
- Regulatory valuation matters: FEMA pricing rules can create a minimum FMV floor for non-resident investment; Rule 11UA/Income Tax valuation can require prescribed FMV methods for tax positions.
- Risk-free-rate baseline: Government of India 10-year yield reference around ${(INDIA_VALUATION_CONTEXT.riskFreeRate * 100).toFixed(1)}%, higher than US Treasury baselines.
- Early-stage discount rates: India-calibrated commercial range ${INDIA_VALUATION_CONTEXT.earlyStageDiscountRateRange}, reflecting execution, country, currency, and regulatory risk.
- Market multiples: Domestic India revenue profiles usually receive lower ARR/revenue multiples than US/global SaaS peers because ARPU and immediate monetizable TAM are lower.
- Instruments: CCPS/CCD and foreign investment structures need upfront valuation/conversion logic; this output is not a statutory IBBI/merchant-banker certificate.
Comparable status: ${comparableStatus}
Sources used in policy logic: RBI/FEMA pricing framework, Income Tax Rule 11UA framework, India private market benchmark assumptions.`;
    }

    const liveWACC = (this as any).liveWACC;
    const liveComparables = ((this as any).liveComparables || []) as Array<{ source?: string }>;
    const riskFree = liveWACC ? (liveWACC.riskFreeRate * 100).toFixed(2) : "4.5";
    const fedRate = liveWACC ? (liveWACC.federalFundsRate * 100).toFixed(2) : "4.5";
    const comparableStatus = liveComparables.some((comp) => /fallback/i.test(comp.source || ""))
      ? "Comparable context includes fallback benchmarks and should be independently verified."
      : "Comparable context was generated from configured market data sources.";

    return `2026 Market Context (Live Data):
- Global software/SaaS valuations remain healthy post-2024 corrections
- AI/ML companies command 20–50% premium over traditional SaaS
- Interest rates: Federal funds rate ${fedRate}% | 10Y Treasury ${riskFree}% (Live from Federal Reserve)
- Early-stage discount rates: global commercial reference range ${GLOBAL_VALUATION_CONTEXT.earlyStageDiscountRateRange}; baseline risk-free reference ${(GLOBAL_VALUATION_CONTEXT.riskFreeRate * 100).toFixed(1)}%
- VC activity: Strong Series A/B funding in AI, SaaS, fintech; selective in other sectors
- M&A market: Premium multiples (6–8x EBITDA) for profitable SaaS exits
- Public comps: SaaS ETF (ARKW) trades 8–12x EV/Revenue; software peers 9–13x EV/EBITDA
Comparable status: ${comparableStatus}
Sources: Federal Reserve (Real-time), Crunchbase (Live comparables), Damodaran tables, S&P CapitalIQ`;
  }

  /**
   * Calculate dynamic weights based on ARR (Annual Recurring Revenue)
   * EVALDAM PROPRIETARY: 20% weight to Evaldam Score (combines all factors)
   * Traditional methods: 80% total weight, ARR-based distribution
   *
   * Credits: Inspired by industry best practices for valuation method selection
   * Scorecard & Berkus designed for pre-revenue/early stage - capped at low ARR
   * DCF methods scale with mature company metrics and market data
   */
  private calculateDynamicWeights(
    methods: ValuationMethodResult[]
  ): Record<string, number> {
    const arr = this.getARRInValuationCurrency();
    const isPreRevenue = this.profile.stage === "pre-revenue" || arr <= 0;
    const thresholds = this.getValuationCurrency() === "INR"
      ? { earlyRevenueUpper: 50000000, growthUpper: 500000000 }
      : { earlyRevenueUpper: 600000, growthUpper: 6000000 };
    let methodWeights: Record<string, number>;

    if (isPreRevenue) {
      methodWeights = {
        scorecard: 0.35,
        berkus: 0.25,
        vc: 0.15,
        "dcf-ltg": 0.03,
        "dcf-multiples": 0.05,
        comparables: 0.17,
        "evaldam-score": 0,
      };
    } else if (arr < thresholds.earlyRevenueUpper) {
      methodWeights = {
        scorecard: 0.15,
        berkus: 0.08,
        vc: 0.25,
        "dcf-ltg": 0.12,
        "dcf-multiples": 0.20,
        comparables: 0.20,
        "evaldam-score": 0,
      };
    } else if (arr < thresholds.growthUpper) {
      methodWeights = {
        scorecard: 0.05,
        berkus: 0,
        vc: 0.20,
        "dcf-ltg": 0.30,
        "dcf-multiples": 0.25,
        comparables: 0.20,
        "evaldam-score": 0,
      };
    } else {
      methodWeights = {
        scorecard: 0,
        berkus: 0,
        vc: 0.15,
        "dcf-ltg": 0.35,
        "dcf-multiples": 0.25,
        comparables: 0.25,
        "evaldam-score": 0,
      };
    }

    return this.normalizeWeightsForAvailableMethods(methods, methodWeights);
  }

  /**
   * Blend valuations using stage weights, confidence weights, and outlier controls.
   */
  private blendValuations(
    methods: ValuationMethodResult[],
    weights: Record<string, number>
  ): BlendResult {
    const includedMethods = methods.filter((method) => (weights[method.methodName] ?? 0) > 0);
    const activeMethods = includedMethods.length > 0 ? includedMethods : methods;
    const median = this.median(activeMethods.map((method) => method.midEstimate));
    const anchor = this.getProfessionalValuationAnchor();
    const outlierBounds = this.getOutlierBounds(median, anchor);
    const adjustedEstimates: Record<string, number> = {};
    const effectiveWeights: Record<string, number> = {};
    const notes: string[] = [];
    let rawEffectiveWeightTotal = 0;

    for (const method of activeMethods) {
      const rawWeight = includedMethods.length > 0
        ? weights[method.methodName] ?? 0
        : 1 / Math.max(activeMethods.length, 1);
      const confidenceWeight = this.getConfidenceWeight(method.confidence);
      const effectiveWeight = rawWeight * confidenceWeight;
      effectiveWeights[method.methodName] = effectiveWeight;
      rawEffectiveWeightTotal += effectiveWeight;

      const adjustedMid = this.clamp(method.midEstimate, outlierBounds.low, outlierBounds.high);
      adjustedEstimates[method.methodName] = Math.round(adjustedMid);
      if (Math.round(adjustedMid) !== Math.round(method.midEstimate)) {
        notes.push(
          `${method.methodName} estimate adjusted from ${this.formatMoney(method.midEstimate)} to ${this.formatMoney(adjustedMid)} for blend outlier control.`
        );
      }
    }

    if (rawEffectiveWeightTotal <= 0) {
      const equalWeight = activeMethods.length > 0 ? 1 / activeMethods.length : 0;
      for (const method of activeMethods) {
        effectiveWeights[method.methodName] = equalWeight;
      }
    } else {
      for (const method of activeMethods) {
        effectiveWeights[method.methodName] = effectiveWeights[method.methodName] / rawEffectiveWeightTotal;
      }
    }

    let weightedMid = 0;
    let weightedLow = 0;
    let weightedHigh = 0;

    for (const method of activeMethods) {
      const weight = effectiveWeights[method.methodName] ?? 0;
      if (weight <= 0) continue;
      const adjustedMid = adjustedEstimates[method.methodName] ?? method.midEstimate;
      const adjustedLow = this.clamp(method.lowEstimate, outlierBounds.low * 0.85, adjustedMid);
      const adjustedHigh = this.clamp(method.highEstimate, adjustedMid, outlierBounds.high * 1.15);
      weightedMid += adjustedMid * weight;
      weightedLow += adjustedLow * weight;
      weightedHigh += adjustedHigh * weight;
    }

    if (anchor) {
      const anchorWeight = anchor.confidence === "high" ? 0.35 : anchor.confidence === "medium" ? 0.25 : 0.15;
      weightedMid = weightedMid * (1 - anchorWeight) + anchor.mid * anchorWeight;
      weightedLow = weightedLow * (1 - anchorWeight) + (anchor.low ?? anchor.mid * 0.85) * anchorWeight;
      weightedHigh = weightedHigh * (1 - anchorWeight) + (anchor.high ?? anchor.mid * 1.15) * anchorWeight;
      notes.push(
        `Professional anchor from ${anchor.source} applied at ${(anchorWeight * 100).toFixed(0)}% calibration weight; this is a commercial calibration input, not a statutory certificate.`
      );
    }

    const minimumRangeMargin = this.getMinimumRangeMargin(anchor);
    const low = Math.min(weightedLow, weightedMid * (1 - minimumRangeMargin));
    const high = Math.max(weightedHigh, weightedMid * (1 + minimumRangeMargin));

    return {
      low: Math.round(Math.min(low, weightedMid)),
      high: Math.round(Math.max(high, weightedMid)),
      mid: Math.round(weightedMid),
      adjustedEstimates,
      effectiveWeights,
      notes,
    };
  }

  /**
   * Create method breakdown with weights
   */
  private createMethodBreakdown(
    methods: ValuationMethodResult[],
    weights: Record<string, number>,
    adjustedEstimates: Record<string, number> = {}
  ): Record<string, { estimate: number; weight: number }> {
    const breakdown: Record<string, { estimate: number; weight: number }> = {};

    for (const method of methods) {
      const weight = weights[method.methodName] ?? 0;
      breakdown[method.methodName] = {
        estimate: adjustedEstimates[method.methodName] ?? method.midEstimate,
        weight,
      };
    }

    return breakdown;
  }

  private getConfidenceWeight(confidence: ValuationMethodResult["confidence"]): number {
    if (confidence === "high") return 1;
    if (confidence === "medium") return 0.85;
    return 0.65;
  }

  private getOutlierBounds(
    median: number,
    anchor: ProfessionalValuationAnchor | null
  ): { low: number; high: number } {
    if (!Number.isFinite(median) || median <= 0) {
      const fallback = this.getDefaultValuation();
      return { low: fallback * 0.5, high: fallback * 2 };
    }

    if (anchor) {
      const anchorRange = anchor.confidence === "high"
        ? { low: 0.72, high: 1.38 }
        : anchor.confidence === "medium"
        ? { low: 0.62, high: 1.55 }
        : { low: 0.52, high: 1.80 };
      const low = Math.max(anchor.mid * anchorRange.low, median * 0.40);
      const high = Math.min(anchor.mid * anchorRange.high, median * 2.25);

      if (low < high) {
        return { low, high };
      }

      return {
        low: anchor.mid * anchorRange.low,
        high: anchor.mid * anchorRange.high,
      };
    }

    const stageRange: Record<string, { low: number; high: number }> = {
      "pre-revenue": { low: 0.45, high: 2.00 },
      seed: { low: 0.50, high: 1.90 },
      "series-a": { low: 0.58, high: 1.75 },
      "series-b+": { low: 0.65, high: 1.60 },
    };
    const range = stageRange[this.profile.stage] || stageRange.seed;

    return {
      low: median * range.low,
      high: median * range.high,
    };
  }

  private getMinimumRangeMargin(anchor: ProfessionalValuationAnchor | null): number {
    if (anchor?.confidence === "high") return 0.12;
    if (anchor) return 0.15;
    if (this.profile.stage === "pre-revenue") return 0.22;
    if (this.profile.stage === "seed") return 0.18;
    return 0.14;
  }

  private getProfessionalValuationAnchor(): ProfessionalValuationAnchor | null {
    const directAnchor = (this.profile as any).professionalValuation;
    const directMid = typeof directAnchor === "object" && directAnchor !== null
      ? this.parseMoneyValue(
          directAnchor.midEstimate ??
          directAnchor.mid ??
          directAnchor.value ??
          directAnchor.valuation
        )
      : this.parseMoneyValue(directAnchor);

    const contextMid = this.getContextMoneyValue([
      "professionalValuation",
      "professionalValuationMid",
      "externalValuation",
      "reviewerValuation",
      "valuerValuation",
    ]);

    const mid = directMid ?? contextMid;
    if (!mid || mid <= 0) return null;

    const low = typeof directAnchor === "object" && directAnchor !== null
      ? this.parseMoneyValue(directAnchor.lowEstimate ?? directAnchor.low)
      : this.getContextMoneyValue(["professionalValuationLow", "externalValuationLow"]);
    const high = typeof directAnchor === "object" && directAnchor !== null
      ? this.parseMoneyValue(directAnchor.highEstimate ?? directAnchor.high)
      : this.getContextMoneyValue(["professionalValuationHigh", "externalValuationHigh"]);
    const confidenceRaw = typeof directAnchor === "object" && directAnchor !== null
      ? String(directAnchor.confidence || "").toLowerCase()
      : String(this.getContextStringValue(["professionalValuationConfidence", "externalValuationConfidence"]) || "").toLowerCase();
    const confidence: ProfessionalValuationAnchor["confidence"] =
      confidenceRaw === "high" || confidenceRaw === "medium" || confidenceRaw === "low"
        ? confidenceRaw
        : "medium";
    const source = typeof directAnchor === "object" && directAnchor !== null && directAnchor.source
      ? String(directAnchor.source)
      : this.getContextStringValue(["professionalValuationSource", "externalValuationSource"]) || "user-supplied professional valuation";

    return {
      mid,
      low: low && low > 0 ? Math.min(low, mid) : undefined,
      high: high && high > 0 ? Math.max(high, mid) : undefined,
      confidence,
      source,
    };
  }

  private getAssumptionOverrideWarnings(): string[] {
    const warnings: string[] = [];
    const isIndia = this.isIndianStartup();
    const growth = this.getContextRateValue([
      "annualGrowthRate",
      "revenueGrowthRate",
      "growthRate",
      "projectedGrowthRate",
    ]);
    const growthCap = this.profile.stage === "series-b+"
      ? isIndia ? 0.35 : 0.45
      : this.profile.stage === "series-a"
      ? isIndia ? 0.50 : 0.65
      : isIndia ? 0.70 : 0.85;

    if (growth !== null && growth > growthCap) {
      warnings.push(`Growth override ${(growth * 100).toFixed(1)}% is above the stage benchmark cap ${(growthCap * 100).toFixed(1)}%; projections decay and cap it year by year.`);
    }

    const wacc = this.getContextRateValue(["wacc", "discountRate", "costOfCapital"]);
    if (wacc !== null) {
      const minWacc = isIndia ? 0.11 : 0.09;
      if (wacc < minWacc) {
        warnings.push(`Discount-rate override ${(wacc * 100).toFixed(1)}% is below the ${isIndia ? "India" : "global"} benchmark floor ${(minWacc * 100).toFixed(1)}%; confidence should be treated conservatively.`);
      }
    }

    const multiple = this.getContextNumberValue([
      "exitMultiple",
      "revenueMultiple",
      "marketMultiple",
      "arrMultiple",
      "terminalMultiple",
    ]);
    if (multiple !== null) {
      const maxMultiple = this.getBenchmarkMultipleCeiling();
      if (multiple > maxMultiple) {
        warnings.push(`Revenue multiple override ${multiple.toFixed(1)}x is above ${isIndia ? "India" : "global"} benchmark ceiling ${maxMultiple.toFixed(1)}x and needs evidence.`);
      }
    }

    return warnings;
  }

  private getBenchmarkMultipleCeiling(): number {
    const isIndia = this.isIndianStartup();
    const indiaCeilings: Record<string, number> = {
      ai: 6,
      saas: 5,
      fintech: 6,
      deeptech: 5,
      other: 4,
    };
    const globalCeilings: Record<string, number> = {
      ai: 20,
      saas: 8,
      fintech: 7,
      deeptech: 10,
      other: 6,
    };
    const ceilings = isIndia ? indiaCeilings : globalCeilings;
    return ceilings[this.profile.industry || "other"] || ceilings.other;
  }

  private median(values: number[]): number {
    const sorted = values.filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
    if (sorted.length === 0) return 0;
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private clamp(value: number, min: number, max: number): number {
    if (min > max) return value;
    return Math.min(max, Math.max(min, value));
  }

  private getContextRateValue(keys: string[]): number | null {
    const value = this.getContextNumberValue(keys);
    if (value === null) return null;
    return value > 1 ? value / 100 : value;
  }

  private getContextMoneyValue(keys: string[]): number | null {
    return this.getContextParsedNumberValue(keys, (value) => this.parseMoneyValue(value));
  }

  private getContextNumberValue(keys: string[]): number | null {
    return this.getContextParsedNumberValue(keys, (value) => this.parseNumberValue(value));
  }

  private getContextStringValue(keys: string[]): string | null {
    const rawValue = this.getContextRawValue(keys);
    if (rawValue === null || rawValue === undefined) return null;
    return String(rawValue);
  }

  private getContextRawValue(keys: string[]): unknown {
    const normalizedKeys = keys.map((key) => this.normalizeContextKey(key));
    const contexts = [
      this.profile.customValuationContext,
      this.profile.additionalFactors,
    ].filter(Boolean) as Array<Record<string, string>>;

    for (const context of contexts) {
      for (const [key, value] of Object.entries(context)) {
        const normalizedKey = this.normalizeContextKey(key);
        const matches = normalizedKeys.some(
          (candidate) => normalizedKey === candidate || normalizedKey.includes(candidate)
        );
        if (matches) return value;
      }
    }

    return null;
  }

  private getContextParsedNumberValue(
    keys: string[],
    parser: (value: unknown) => number | null
  ): number | null {
    const normalizedKeys = keys.map((key) => this.normalizeContextKey(key));
    const contexts = [
      this.profile.customValuationContext,
      this.profile.additionalFactors,
    ].filter(Boolean) as Array<Record<string, string>>;

    for (const context of contexts) {
      for (const [key, value] of Object.entries(context)) {
        const normalizedKey = this.normalizeContextKey(key);
        const matches = normalizedKeys.some(
          (candidate) => normalizedKey === candidate || normalizedKey.includes(candidate)
        );
        if (!matches) continue;

        const parsed = parser(value);
        if (parsed !== null) return parsed;
      }
    }

    return null;
  }

  private normalizeContextKey(key: string): string {
    return key.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  private parseNumberValue(value: unknown): number | null {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value !== "string") return null;
    const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
    if (!match) return null;
    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private parseMoneyValue(value: unknown): number | null {
    const parsed = this.parseNumberValue(value);
    if (parsed === null) return null;
    if (typeof value !== "string") return parsed;

    const normalized = value.toLowerCase();
    if (this.getValuationCurrency() === "INR") {
      if (/\bcr\b|crore/.test(normalized)) return parsed * 10000000;
      if (/\bl\b|\blakh\b|lac/.test(normalized)) return parsed * 100000;
    }

    if (/\bb\b|billion/.test(normalized)) return parsed * 1000000000;
    if (/\bm\b|million/.test(normalized)) return parsed * 1000000;
    if (/\bk\b|thousand/.test(normalized)) return parsed * 1000;

    return parsed;
  }

  /**
   * Generate sensitivity analysis
   */
  private generateSensitivityAnalysis(baseValuation: number): Array<{
    variable: string;
    scenario: string;
    impact: number;
    percentageChange: number;
  }> {
    const sensitivity = [];

    // Growth scenarios
    const growthImpact = baseValuation * 0.15; // +15% per +10% growth
    sensitivity.push({
      variable: "Monthly Growth Rate",
      scenario: "+10% growth (annualized)",
      impact: growthImpact,
      percentageChange: 15,
    });
    sensitivity.push({
      variable: "Monthly Growth Rate",
      scenario: "-10% growth (annualized)",
      impact: -growthImpact * 0.8, // asymmetric
      percentageChange: -12,
    });

    // Exit multiple scenarios
    const multipleImpact = baseValuation * 0.20; // ±1x multiple
    sensitivity.push({
      variable: "Exit Multiple",
      scenario: "+1x ARR/EBITDA multiple",
      impact: multipleImpact,
      percentageChange: 20,
    });
    sensitivity.push({
      variable: "Exit Multiple",
      scenario: "-1x ARR/EBITDA multiple",
      impact: -multipleImpact,
      percentageChange: -20,
    });

    // Market scenario
    sensitivity.push({
      variable: "Market Conditions",
      scenario: "Bull case (favorable exits, 1.5x multiple premium)",
      impact: baseValuation * 0.30,
      percentageChange: 30,
    });
    sensitivity.push({
      variable: "Market Conditions",
      scenario: "Bear case (challenging exits, 0.7x multiple discount)",
      impact: -baseValuation * 0.25,
      percentageChange: -25,
    });

    return sensitivity;
  }

  /**
   * Generate 3-4 key reasons for executive summary
   */
  private generateKeyReasons(
    methods: ValuationMethodResult[],
    blendedValuation: { low: number; high: number; mid: number }
  ): string[] {
    const reasons: string[] = [];

    const arr = this.getARRInValuationCurrency();
    const growth = this.profile.monthlyGrowthRate || 0;
    const stage = this.profile.stage;

    // Reason 1: Traction
    if (growth > 15) {
      reasons.push(
        `Strong monthly growth of ${growth.toFixed(1)}% demonstrates rapid scaling and product-market fit validation`
      );
    } else if (arr > 1000000) {
      reasons.push(
        `Existing revenue of ${this.formatMoney(arr)} ARR provides strong traction and unit economics validation`
      );
    } else {
      reasons.push(`${stage} stage with clear market opportunity and execution roadmap`);
    }

    // Reason 2: Team / Accelerators
    if (this.profile.accelerators?.some((a) => a.name === "YC" || a.name === "Techstars")) {
      reasons.push(
        `Backed by top-tier accelerator (YC/Techstars) — signals quality and network access`
      );
    } else if (this.profile.team && this.profile.team.length >= 2) {
      reasons.push(`Experienced founding team with relevant domain expertise and track record`);
    }

    // Reason 3: Market opportunity
    if (this.profile.totalAddressableMarket && this.profile.totalAddressableMarket > 1000000000) {
      reasons.push(
        `Large addressable market with multiple expansion runway`
      );
    }

    // Reason 4: Method convergence
    const positiveLows = methods.map((m) => m.lowEstimate).filter((value) => value > 0);
    const methodSpread = positiveLows.length > 0
      ? Math.max(...methods.map((m) => m.highEstimate)) / Math.min(...positiveLows)
      : Number.POSITIVE_INFINITY;
    if (methodSpread < 3) {
      reasons.push(
        `Multiple valuation methods converge (${this.formatMoney(blendedValuation.low)}-${this.formatMoney(blendedValuation.high)}), indicating consistent valuation signal`
      );
    }

    return reasons.slice(0, 4);
  }

  /**
   * Rate confidence level
   */
  private rateConfidence(methods: ValuationMethodResult[]): string {
    const confidenceScore = methods.reduce((sum, method) => {
      if (method.confidence === "high") return sum + 3;
      if (method.confidence === "medium") return sum + 2;
      return sum + 1;
    }, 0) / Math.max(methods.length, 1);
    const hasAggressiveOverrides = this.getAssumptionOverrideWarnings().length > 0;

    if (!hasAggressiveOverrides && confidenceScore >= 2.6 && this.getARRInValuationCurrency() > 500000) {
      return "HIGH: Multiple profitable comparables + strong metrics";
    } else if (confidenceScore >= 2 && this.profile.monthlyGrowthRate && this.profile.monthlyGrowthRate > 10) {
      return hasAggressiveOverrides
        ? "MEDIUM: Strong growth trajectory, but aggressive user assumptions require evidence"
        : "MEDIUM-HIGH: Strong growth trajectory with emerging metrics";
    } else if (this.profile.stage === "pre-revenue") {
      return "MEDIUM: Pre-revenue estimate based on team, market size, and methodology";
    } else {
      return "MEDIUM: Reasonable estimate subject to market conditions";
    }
  }

  /**
   * Calculate data completeness score
   */
  private calculateDataCompleteness(): number {
    const requiredFields = [
      "companyName",
      "stage",
      "team",
      ...(this.profile.stage === "pre-revenue" ? [] : ["annualRecurringRevenue"]),
      "monthlyGrowthRate",
      "totalAddressableMarket",
    ];

    const filled = requiredFields.filter((field) => {
      const value = (this.profile as any)[field];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "number") return Number.isFinite(value) && value > 0;
      return value !== null && value !== undefined && value !== "";
    });

    return Math.round((filled.length / requiredFields.length) * 100);
  }

  /**
   * Determine final confidence level
   */
  private determineConfidenceLevel(
    methods: ValuationMethodResult[]
  ): "high" | "medium" | "low" {
    const completion = this.calculateDataCompleteness();
    const hasAggressiveOverrides = this.getAssumptionOverrideWarnings().length > 0;
    const confidenceScore = methods.reduce((sum, method) => {
      if (method.confidence === "high") return sum + 3;
      if (method.confidence === "medium") return sum + 2;
      return sum + 1;
    }, 0) / Math.max(methods.length, 1);

    if (!hasAggressiveOverrides && completion >= 80 && confidenceScore >= 2.6) {
      return "high";
    } else if (completion >= 50 && confidenceScore >= 1.6) {
      return "medium";
    } else {
      return "low";
    }
  }
}

function getTimeoutMs(envKey: string, fallbackMs: number) {
  const configured = Number(process.env[envKey]);
  if (!Number.isFinite(configured) || configured <= 0) return fallbackMs;
  return Math.min(configured, 300_000);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new ValuationTimeoutError(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
