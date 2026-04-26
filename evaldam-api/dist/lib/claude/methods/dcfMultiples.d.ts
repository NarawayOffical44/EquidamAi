import { StartupProfile, ValuationMethodResult } from "@/types";
import { ValuationMethodBase } from "@/lib/claude/base-method";
export declare class DCFMultiplesMethod extends ValuationMethodBase {
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
            wacc: any;
        };
    };
}
export declare function dcfMultiplesMethod(profile: StartupProfile): Promise<ValuationMethodResult>;
//# sourceMappingURL=dcfMultiples.d.ts.map