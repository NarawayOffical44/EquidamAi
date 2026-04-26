/**
 * Professional PDF Report Generator
 * Converts valuation data to investor-grade PDF
 *
 * Structure:
 * 1. Title Page
 * 2. Executive Summary
 * 3. Valuation Summary Table
 * 4. Method-by-Method Breakdown (5 methods × full math + sources)
 * 5. Blended Valuation & Weighting
 * 6. Sensitivity & Scenario Analysis
 * 7. Assumptions & Sources Appendix
 */
import { ProfessionalValuationResult } from '@/lib/valuation/professional-engine';
import { StartupProfile } from '@/types';
export interface PDFReportContent {
    titlePage: string;
    executiveSummary: string;
    valuationTable: string;
    methodBreakdown: string;
    blendedValuation: string;
    sensitivityAnalysis: string;
    appendix: string;
}
export declare function generatePDFReportHTML(result: ProfessionalValuationResult, profile: StartupProfile): string;
/**
 * Generate PDF from HTML using Puppeteer
 * (Call this from API route or backend job)
 */
export declare function generatePDFFromHTML(html: string): Promise<Buffer>;
//# sourceMappingURL=professional-report-generator.d.ts.map