import { StartupProfile } from "@/types";
export interface ValidationResult {
    isValid: boolean;
    missingCritical: string[];
    missingOptional: string[];
    score: number;
    recommendations: string[];
}
export interface CriticalFieldRequirement {
    field: string;
    label: string;
    description: string;
    reason: string;
    exampleValue: string;
}
/**
 * Validate startup profile completeness
 * Returns missing fields that should be collected before valuation
 */
export declare function validateStartupProfile(profile: StartupProfile): ValidationResult;
/**
 * Get user-friendly prompt for missing critical data
 */
export declare function getMissingDataPrompt(missingFields: string[]): {
    title: string;
    fields: CriticalFieldRequirement[];
    message: string;
};
/**
 * Data completeness score impacts confidence level
 */
export declare function getConfidenceLevel(dataScore: number): "high" | "medium" | "low";
//# sourceMappingURL=data-validator.d.ts.map