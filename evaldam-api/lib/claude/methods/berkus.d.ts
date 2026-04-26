import { StartupProfile, ValuationMethodResult } from "@/types";
import { ValuationMethodBase } from "@/lib/claude/base-method";
export declare class BerkusMethod extends ValuationMethodBase {
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
            factorValue: number;
            ideaScore: any;
            prototypeScore: any;
            teamScore: any;
            relationshipScore: any;
            tractionScore: any;
        };
    };
}
export declare function berkusMethod(profile: StartupProfile): Promise<ValuationMethodResult>;
//# sourceMappingURL=berkus.d.ts.map