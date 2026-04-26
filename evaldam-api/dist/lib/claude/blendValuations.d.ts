import { StartupProfile, ValuationMethodResult, BlendedValuation } from "@/types";
/**
 * Blend multiple valuation methods into a final range with weighted average.
 * Weighting depends on company stage and data completeness.
 */
export declare function blendValuations(profile: StartupProfile, methods: ValuationMethodResult[]): BlendedValuation;
//# sourceMappingURL=blendValuations.d.ts.map