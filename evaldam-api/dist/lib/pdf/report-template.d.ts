/**
 * EVALDAM AI — Professional Valuation Report Template
 * Fills from report_data JSONB stored in database.
 * Output: print-ready HTML → browser window.print() → PDF
 */
export interface ReportData {
    companyName: string;
    stage: string;
    industry?: string;
    website?: string;
    description?: string;
    blendedLow: number;
    blendedHigh: number;
    blendedAverage: number;
    confidenceLevel: string;
    dataCompleteness: number;
    methods: Array<{
        methodName: string;
        lowEstimate: number;
        midEstimate: number;
        highEstimate: number;
        confidence: string;
        reasoning?: string;
        assumptions?: Record<string, any>;
    }>;
    keyReasons: string[];
    executiveSummary?: {
        blendedRange?: {
            low: number;
            high: number;
            mid: number;
        };
        keyReasons?: string[];
        methodologyNote?: string;
        confidenceRating?: string;
    };
    sensitivityAnalysis?: Array<{
        variable: string;
        scenario: string;
        impact: number;
        percentageChange: number;
    }>;
    detailedAnalysis?: {
        industryAnalysis?: string;
        comparableCompanies?: string[];
        marketContext?: string;
    };
    professionalCitation?: string;
    generatedAt?: string;
    valuationId?: string;
}
export declare function generateProfessionalReportHTML(data: ReportData): string;
//# sourceMappingURL=report-template.d.ts.map