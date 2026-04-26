import { StartupProfile, ValuationMethodResult } from "@/types";
import { ValuationMethodBase } from "@/lib/claude/base-method";
export declare class ScorecardMethod extends ValuationMethodBase {
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
            baseValuation: number;
            stage: import("@/types").CompanyStage;
            teamScore: any;
            marketScore: any;
            productScore: any;
            weightedAdjustment: any;
        };
    };
}
export declare function scorecardMethod(profile: StartupProfile): Promise<ValuationMethodResult>;
//# sourceMappingURL=scorecard.d.ts.map