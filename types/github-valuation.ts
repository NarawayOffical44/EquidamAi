export type KnownGitHubStartupCategory =
  | "ai-infra"
  | "devtools"
  | "security"
  | "data-infra"
  | "fintech-trading"
  | "productivity"
  | "saas"
  | "open-source-library"
  | "other";

export type GitHubStartupCategory = KnownGitHubStartupCategory | `custom:${string}`;

export interface GitHubRepoInput {
  repoUrl: string;
  sessionToken?: string;
  intendedCustomer?: string;
  monetizationPlan?: string;
  market?: string;
  founderCommitment?: "part-time" | "full-time" | "unknown";
  knownUsers?: string;
  geography?: "global" | "india" | "us" | "eu";
}

export interface GitHubRepoSignals {
  owner: string;
  name: string;
  fullName: string;
  htmlUrl: string;
  description: string;
  topics: string[];
  primaryLanguage: string | null;
  languages: Record<string, number>;
  license: string | null;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  subscribers: number;
  contributorCount: number;
  commitCount: number;
  releaseCount: number;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  readmeText: string;
  hasPackageManifest: boolean;
  hasDockerfile: boolean;
  hasDocs: boolean;
  hasTests: boolean;
  hasDemoOrWebsite: boolean;
  websiteUrl: string | null;
}

export interface GitHubValuationScore {
  ideaClarity: number;
  technicalExecution: number;
  marketPotential: number;
  tractionSignal: number;
  monetizationPotential: number;
  defensibility: number;
  founderSignal: number;
  total: number;
}

export interface GitHubComparablePattern {
  name: string;
  category: GitHubStartupCategory;
  pattern: string;
  whyRelevant: string;
}

export interface GitHubIdeaStageValuation {
  repo: GitHubRepoSignals;
  category: GitHubStartupCategory;
  thesis: string;
  score: GitHubValuationScore;
  valuation: {
    low: number;
    mid: number;
    high: number;
    currency: "USD";
    confidence: "low" | "medium" | "high";
    stageInterpretation: string;
  };
  comparablePatterns: GitHubComparablePattern[];
  analystReview: {
    verdict: string;
    summary: string;
    fundability: "low" | "medium" | "high";
  };
  valuationFeedback: string[];
  valueDrivers: string[];
  investorRisks: string[];
  milestonesToIncreaseValuation: string[];
  assumptions: string[];
  methodology: string;
}
