import { StartupProfile, ValuationMethodResult } from "@/types";
import { ValuationMethodBase } from "@/lib/claude/base-method";
import type { ComparableCompany } from "@/lib/market-data/comparables";
import { getIndianComparableMultiple } from "@/lib/india-benchmarks/valuation-data";

export class ComparablesMethod extends ValuationMethodBase {
  constructor(
    profile: StartupProfile,
    private readonly comparables: ComparableCompany[] = [],
    private readonly marketMultiple?: { avgMultiple: number; medianMultiple: number }
  ) {
    super(profile, "comparables");
  }

  protected calculateDeterministic(): Omit<ValuationMethodResult, "methodName"> {
    const arr = this.getARR();
    const isFallback = this.comparables.length === 0 || this.comparables.some((company) => /fallback/i.test(company.source || ""));
    const observedMultiples = this.comparables
      .map((company) => company.multiple || (company.arr && company.arr > 0 ? company.valuation / company.arr : 0))
      .filter((multiple) => Number.isFinite(multiple) && multiple > 0)
      .sort((a, b) => a - b);
    const defaultMultiple = observedMultiples.length > 0
      ? observedMultiples[Math.floor(observedMultiples.length / 2)]
      : this.marketMultiple?.medianMultiple || this.defaultMultiple();
    const benchmark = this.getMultipleBenchmark();
    const selectedMultiple = this.getBenchmarkedMultiple(
      ["comparableMultiple", "marketMultiple", "revenueMultiple", "arrMultiple"],
      defaultMultiple,
      benchmark.min,
      benchmark.max
    );
    const marketValuation = arr > 0
      ? arr * selectedMultiple.value
      : this.getBaseValuation() * this.stageComparableAdjustment();
    const finalValuation = this.roundMoney(marketValuation);
    const { low, high } = this.createRange(finalValuation, isFallback ? 35 : 25);
    const sourceNames = this.comparables.slice(0, 5).map((company) => `${company.name} (${company.source})`);

    return {
      lowEstimate: low,
      midEstimate: finalValuation,
      highEstimate: high,
      reasoning:
        arr > 0
          ? `Comparable company method = ${this.formatMoney(arr)} ARR x ${selectedMultiple.value.toFixed(1)}x selected peer revenue multiple. ${isFallback ? "Fallback/generic comparables were used, so the range is wider." : "Configured market-data comparables were used."}`
          : `Comparable company method uses stage-calibrated peer benchmarks because ARR is not available. ${isFallback ? "Fallback/generic comparables were used, so the range is wider." : "Configured market-data comparables were used."}`,
      sources: sourceNames.length > 0
        ? sourceNames
        : ["Evaldam comparable-company benchmark defaults"],
      confidence: isFallback ? "low" : this.getMethodConfidence(4),
      assumptions: {
        arr,
        selectedMultiple: Number(selectedMultiple.value.toFixed(2)),
        defaultSelectedMultiple: Number(selectedMultiple.defaultValue.toFixed(2)),
        multipleOverrideUsed: selectedMultiple.overrideUsed ? "true" : "false",
        multipleBenchmarkWarning: selectedMultiple.benchmarkWarning || "",
        comparableCount: this.comparables.length,
        fallbackComparablesUsed: isFallback ? "true" : "false",
        calculationMode: "deterministic",
      },
    };
  }

  private defaultMultiple(): number {
    if ((this as any).isIndianStartup()) {
      return getIndianComparableMultiple(this.profile.industry || "saas");
    }
    const multiples: Record<string, number> = {
      ai: 10,
      saas: 5.7,
      fintech: 4.5,
      deeptech: 6,
      other: 3.5,
    };
    return multiples[this.profile.industry || "other"] || 3.5;
  }

  private getMultipleBenchmark(): { min: number; max: number } {
    if ((this as any).isIndianStartup()) {
      const benchmarks: Record<string, { min: number; max: number }> = {
        ai: { min: 2, max: 6 },
        saas: { min: 3, max: 5 },
        fintech: { min: 3, max: 6 },
        deeptech: { min: 2, max: 5 },
        other: { min: 2, max: 4 },
      };
      return benchmarks[this.profile.industry || "other"] || benchmarks.other;
    }

    const benchmarks: Record<string, { min: number; max: number }> = {
      ai: { min: 8, max: 20 },
      saas: { min: 3, max: 8 },
      fintech: { min: 3, max: 7 },
      deeptech: { min: 4, max: 10 },
      other: { min: 2, max: 6 },
    };
    return benchmarks[this.profile.industry || "other"] || benchmarks.other;
  }

  private stageComparableAdjustment(): number {
    const adjustment: Record<string, number> = {
      "pre-revenue": 0.9,
      seed: 1,
      "series-a": 1.15,
      "series-b+": 1.25,
    };
    return adjustment[this.profile.stage] || 1;
  }

  buildPrompt(): string {
    return "";
  }

  parseResponse(): Omit<ValuationMethodResult, "methodName"> {
    return this.calculateDeterministic();
  }
}

export async function comparablesMethod(
  profile: StartupProfile,
  comparables: ComparableCompany[] = [],
  marketMultiple?: { avgMultiple: number; medianMultiple: number }
): Promise<ValuationMethodResult> {
  return new ComparablesMethod(profile, comparables, marketMultiple).execute();
}
