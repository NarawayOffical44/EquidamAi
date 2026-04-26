import { StartupProfile, ValuationMethodResult } from "@/types";
import { ValuationMethodBase } from "@/lib/claude/base-method";
export declare class VCMethod extends ValuationMethodBase {
    constructor(profile: StartupProfile);
    buildPrompt(): string;
    parseResponse(json: Record<string, any>): {
        lowEstimate: number;
        midEstimate: any;
        highEstimate: number;
        reasoning: any;
        sources: string[];
        confidence: any;
        assumptions: {
            terminalValue: any;
            exitMultiple: any;
            requiredROI: any;
            discountYears: any;
        };
    };
}
export declare function vcMethod(profile: StartupProfile): Promise<ValuationMethodResult>;
//# sourceMappingURL=vcMethod.d.ts.map