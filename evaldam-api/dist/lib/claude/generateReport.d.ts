import { StartupProfile, ValuationResult, ValuationReport } from "@/types";
export declare function generateFullReport(profile: StartupProfile, valuation: ValuationResult): Promise<Omit<ValuationReport, "id" | "valuationId" | "startupId" | "userId">>;
export declare function generateOnePagerSummary(profile: StartupProfile, valuation: ValuationResult): Promise<string>;
//# sourceMappingURL=generateReport.d.ts.map