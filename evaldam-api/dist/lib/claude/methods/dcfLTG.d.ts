import { StartupProfile, ValuationMethodResult } from "@/types";
import { ValuationMethodBase } from "@/lib/claude/base-method";
export declare class DCFLTGMethod extends ValuationMethodBase {
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
            wacc: any;
            ltgRate: any;
            terminalValue: any;
            taxRate: number;
        };
    };
}
export declare function dcfLTGMethod(profile: StartupProfile): Promise<ValuationMethodResult>;
//# sourceMappingURL=dcfLTG.d.ts.map