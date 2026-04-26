/**
 * Chart & Data Visualization Generator
 * Professional SVG charts for investor-grade reports
 * Sources: McKinsey, Gartner, Damodaran, VentureSource
 */
/**
 * Valuation Range Chart (Horizontal bar)
 */
export declare function generateValuationRangeChart(lowEst: number, mid: number, highEst: number, companyName: string): string;
/**
 * Method Contribution Pie Chart
 */
export declare function generateMethodContributionChart(methods: Array<{
    name: string;
    weight: number;
    estimate: number;
}>): string;
/**
 * Sensitivity Analysis Chart
 */
export declare function generateSensitivityChart(baseValuation: number, sensitivities: Array<{
    scenario: string;
    percentageChange: number;
}>): string;
/**
 * Market Benchmarks Comparison Chart
 * Shows where valuation sits relative to market multiples
 */
export declare function generateMarketBenchmarksChart(industry: string, arrMultiple?: number): string;
/**
 * Historical SaaS Valuation Trends (McKinsey/Gartner data)
 */
export declare function generateValuationTrendsChart(): string;
//# sourceMappingURL=chart-generator.d.ts.map