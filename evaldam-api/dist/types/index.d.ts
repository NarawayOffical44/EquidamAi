export type CompanyStage = 'pre-revenue' | 'seed' | 'series-a' | 'series-b+';
export type Industry = 'saas' | 'ai' | 'fintech' | 'deeptech' | 'other';
export interface TeamMember {
    name: string;
    role: string;
    background?: string;
    linkedinUrl?: string;
}
export interface FounderAchievement {
    title: string;
    description: string;
    year?: number;
}
export interface AcceleratorProgram {
    name: 'YC' | 'Techstars' | 'other';
    batch?: string;
    region?: string;
}
export interface FundingRound {
    round: string;
    amount: number;
    date: string;
    investors?: string[];
    valuation?: number;
}
export interface StartupProfile {
    id: string;
    userId: string;
    companyName: string;
    tagline?: string;
    websiteUrl?: string;
    pitchDeckUrl?: string;
    stage: CompanyStage;
    industry: Industry;
    founded?: string;
    headquarters?: string;
    team: TeamMember[];
    founderAchievements?: FounderAchievement[];
    teamPreviousExits?: {
        memberName: string;
        company: string;
        exitValue?: number;
        year?: number;
    }[];
    teamExperienceYears?: number;
    accelerators?: AcceleratorProgram[];
    runwayMonths?: number;
    monthlyRecurringRevenue?: number;
    annualRecurringRevenue?: number;
    recentMonthlyRevenue?: number;
    monthlyGrowthRate?: number;
    customerCount?: number;
    grossMargin?: number;
    customerConcentration?: number;
    totalAddressableMarket?: number;
    marketDescription?: string;
    competitiveAdvantage?: string;
    patentCount?: number;
    moatScore?: number;
    fundingHistory?: FundingRound[];
    totalFunded?: number;
    customValuationContext?: Record<string, string>;
    additionalFactors?: {
        [key: string]: string;
    };
    createdAt: string;
    updatedAt: string;
    extractedFromUrl?: string;
    autoExtractionScore?: number;
}
export interface ValuationMethodResult {
    methodName: 'scorecard' | 'berkus' | 'vc' | 'dcf-ltg' | 'dcf-multiples' | 'evaldam-score';
    lowEstimate: number;
    midEstimate: number;
    highEstimate: number;
    reasoning: string;
    sources: string[];
    confidence: 'high' | 'medium' | 'low';
    assumptions: Record<string, string | number>;
    proprietary?: {
        internalPercentile?: number;
        industryGrowthPremium?: number;
        teamExitHistory?: boolean;
        moatStrength?: number;
        customerConcentrationRisk?: number;
        marketTimingScore?: number;
    };
}
export interface BlendedValuation {
    lowRange: number;
    highRange: number;
    weightedAverage: number;
    methodBreakdown: {
        [key: string]: {
            estimate: number;
            weight: number;
        };
    };
    sensitivityAnalysis: {
        metric: string;
        scenario: string;
        impactOnValuation: number;
    }[];
    keyReasons: string[];
}
export interface ValuationResult {
    id: string;
    startupId: string;
    userId: string;
    methods: ValuationMethodResult[];
    blended: BlendedValuation;
    dataCompleteness: number;
    confidenceLevel: 'high' | 'medium' | 'low';
    generatedAt: string;
    generatedByModel: string;
}
export interface ReportSection {
    title: string;
    content: string;
}
export interface ValuationReport {
    id: string;
    valuationId: string;
    startupId: string;
    userId: string;
    executiveSummary: string;
    methodology: ReportSection[];
    methodBreakdown: ReportSection[];
    assumptions: ReportSection;
    appendix: ReportSection;
    generatedAt: string;
    reportVersion: string;
    onePagerUrl?: string;
    fullReportUrl?: string;
}
export interface ExtractedProfileData {
    autoExtracted: Partial<StartupProfile>;
    extractionConfidence: number;
    extractedFields: string[];
    missingCriticalFields: string[];
}
export interface ExtractProfileRequest {
    pdfBase64?: string;
    websiteUrl?: string;
    linkedinUrl?: string;
}
export interface ValuateRequest {
    startupId: string;
}
export interface GenerateReportRequest {
    valuationId: string;
}
export interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    stripeCustomerId?: string;
    createdAt: string;
}
export interface Subscription {
    userId: string;
    stripeSubscriptionId: string;
    status: 'active' | 'past_due' | 'canceled' | 'unpaid';
    currentPeriodEnd: string;
    pricePerMonth: number;
}
//# sourceMappingURL=index.d.ts.map