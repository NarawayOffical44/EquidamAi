export interface ExtractedProfileData {
    autoExtracted: Record<string, any>;
    extractionConfidence: number;
    extractedFields: string[];
    missingCriticalFields: string[];
}
export declare function extractProfileFromPitchDeck(pdfText: string, websiteUrl?: string): Promise<ExtractedProfileData>;
//# sourceMappingURL=extractProfile.d.ts.map