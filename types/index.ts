// Core startup profile types
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
  amount: number; // in USD
  date: string;
  investors?: string[];
  valuation?: number; // post-money
}

export interface StartupProfile {
  id: string;
  userId: string;
  companyName: string;
  tagline?: string;
  websiteUrl?: string;
  pitchDeckUrl?: string;

  // Company basics
  stage: CompanyStage;
  industry: Industry;
  founded?: string;
  headquarters?: string;

  // Team
  team: TeamMember[];
  founderAchievements?: FounderAchievement[];
  teamPreviousExits?: { memberName: string; company: string; exitValue?: number; year?: number }[]; // For proprietary scoring
  teamExperienceYears?: number; // Average years of startup experience

  // Programs
  accelerators?: AcceleratorProgram[];

  // Traction metrics
  runwayMonths?: number; // Months of runway remaining
  monthlyRecurringRevenue?: number; // MRR
  annualRecurringRevenue?: number; // ARR
  recentMonthlyRevenue?: number;
  monthlyGrowthRate?: number; // % monthly growth
  customerCount?: number;
  grossMargin?: number; // %
  customerConcentration?: number; // % revenue from top customer (risk factor)

  // Market & opportunity
  totalAddressableMarket?: number; // SAM/TAM in USD
  marketDescription?: string;
  competitiveAdvantage?: string;
  patentCount?: number; // Patent/IP strength
  moatScore?: number; // 0-100 self-rated via prompt box

  // Funding history
  fundingHistory?: FundingRound[];
  totalFunded?: number;

  // Proprietary Scoring Context (entered via sidebar prompt boxes)
  customValuationContext?: Record<string, string>; // { 'scorecard': 'Consider X...', 'market-timing': '...' }
  additionalFactors?: { [key: string]: string }; // Investor-specific scoring criteria

  // Profile metadata
  createdAt: string;
  updatedAt: string;
  extractedFromUrl?: string; // PDF or website source
  autoExtractionScore?: number; // 0-100 indicating extraction confidence
}

// Valuation method results
export interface ValuationMethodResult {
  methodName: 'scorecard' | 'berkus' | 'vc' | 'dcf-ltg' | 'dcf-multiples' | 'evaldam-score';
  lowEstimate: number;
  midEstimate: number;
  highEstimate: number;
  reasoning: string; // Detailed step-by-step breakdown with citations
  sources: string[]; // URLs and citations
  confidence: 'high' | 'medium' | 'low'; // Based on data quality
  assumptions: Record<string, string | number>; // Key assumptions used
  proprietary?: {
    internalPercentile?: number; // 0-100: how startup ranks vs similar DB startups
    industryGrowthPremium?: number; // % premium for industry growth rate
    teamExitHistory?: boolean; // Previous founder exits found
    moatStrength?: number; // 0-100 moat rating
    customerConcentrationRisk?: number; // % discount for concentration
    marketTimingScore?: number; // 0-100
  };
}

export interface BlendedValuation {
  lowRange: number;
  highRange: number;
  weightedAverage: number;

  methodBreakdown: {
    [key: string]: { estimate: number; weight: number };
  };

  sensitivityAnalysis: {
    metric: string;
    scenario: string; // e.g., "+10% growth"
    impactOnValuation: number; // % change
  }[];

  keyReasons: string[]; // 3-4 bullet points for VC summary
}

export interface ValuationResult {
  id: string;
  startupId: string;
  userId: string;

  // Individual method results
  methods: ValuationMethodResult[];

  // Final blended result
  blended: BlendedValuation;

  // Quality metrics
  dataCompleteness: number; // 0-100%
  confidenceLevel: 'high' | 'medium' | 'low';

  // Metadata
  generatedAt: string;
  generatedByModel: string; // e.g., "claude-3-5-sonnet"
}

// Report types
export interface ReportSection {
  title: string;
  content: string; // Markdown format
}

export interface ValuationReport {
  id: string;
  valuationId: string;
  startupId: string;
  userId: string;

  // Report sections
  executiveSummary: string;
  methodology: ReportSection[];
  methodBreakdown: ReportSection[]; // One per method
  assumptions: ReportSection;
  appendix: ReportSection;

  // Metadata
  generatedAt: string;
  reportVersion: string;

  // PDFs
  onePagerUrl?: string; // Generated PDF
  fullReportUrl?: string; // Generated PDF
}

// UI/Form state
export interface ExtractedProfileData {
  autoExtracted: Partial<StartupProfile>;
  extractionConfidence: number;
  extractedFields: string[];
  missingCriticalFields: string[];
}

// API request/response types
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

// User & Auth
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
  pricePerMonth: number; // $99
}
