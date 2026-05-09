import {
  GitHubComparablePattern,
  GitHubIdeaStageValuation,
  GitHubRepoInput,
  GitHubRepoSignals,
  GitHubStartupCategory,
  GitHubValuationScore,
} from "@/types/github-valuation";

const CATEGORY_PATTERNS: GitHubComparablePattern[] = [
  {
    name: "Sentry / PostHog pattern",
    category: "devtools",
    pattern: "Open-source developer product expands into hosted SaaS and enterprise plans.",
    whyRelevant: "Developer adoption can create bottom-up distribution before revenue exists.",
  },
  {
    name: "Supabase / Vercel pattern",
    category: "devtools",
    pattern: "Developer workflow tool becomes a managed platform with usage-based monetization.",
    whyRelevant: "Clear path from repo usage to hosted infrastructure revenue.",
  },
  {
    name: "LangChain / Hugging Face pattern",
    category: "ai-infra",
    pattern: "AI developer framework monetizes through cloud, enterprise, and ecosystem services.",
    whyRelevant: "AI tooling can command premium early-stage interest when adoption is fast.",
  },
  {
    name: "HashiCorp / GitLab pattern",
    category: "open-source-library",
    pattern: "Open-source infrastructure project builds enterprise workflow and support revenue.",
    whyRelevant: "Strong OSS credibility can become a procurement wedge if the buyer is clear.",
  },
  {
    name: "Snyk / Semgrep pattern",
    category: "security",
    pattern: "Security developer tool grows from technical adoption into team and enterprise budgets.",
    whyRelevant: "Security pain has urgent budget if the project maps to compliance or risk reduction.",
  },
  {
    name: "ClickHouse / Neon pattern",
    category: "data-infra",
    pattern: "Data infrastructure project monetizes through managed cloud and scale features.",
    whyRelevant: "Operational data tools can support venture-scale outcomes with strong usage pull.",
  },
  {
    name: "QuantConnect / Alpaca pattern",
    category: "fintech-trading",
    pattern: "Trading infrastructure converts technical users into API, brokerage, data, or hosted strategy revenue.",
    whyRelevant: "Algorithmic trading projects need trust, compliance clarity, and proven user outcomes before valuation expands.",
  },
  {
    name: "TradingView ecosystem pattern",
    category: "fintech-trading",
    pattern: "Trading tools monetize through community, workflow, alerts, integrations, and premium features.",
    whyRelevant: "Community and repeat workflow matter more than raw code volume in trading-tool startups.",
  },
  {
    name: "Open-source quant library pattern",
    category: "fintech-trading",
    pattern: "A technical library becomes commercial only after packaging, documentation, data integrations, and user proof.",
    whyRelevant: "For a repo with little public adoption, value should stay close to prototype/IP option value.",
  },
];

export function valueGitHubIdeaStageStartup(
  repo: GitHubRepoSignals,
  input: GitHubRepoInput
): GitHubIdeaStageValuation {
  const category = classifyCategory(repo, input);
  const score = scoreRepo(repo, input, category);
  const valuation = mapScoreToValuation(score.total, input.geography || "global", repo, input);
  const comparablePatterns = selectComparablePatterns(category);

  return {
    repo,
    category,
    thesis: buildThesis(repo, input, category),
    score,
    valuation,
    comparablePatterns,
    analystReview: buildAnalystReview(repo, input, category, score, valuation),
    valuationFeedback: buildValuationFeedback(repo, input, category, score, valuation),
    valueDrivers: buildValueDrivers(repo, input, score),
    investorRisks: buildInvestorRisks(repo, input, score),
    milestonesToIncreaseValuation: buildMilestones(repo, input, category),
    assumptions: buildAssumptions(input),
    methodology:
      "Idea-stage valuation using Berkus-style risk reduction, Scorecard-style benchmark adjustment, and comparable startup pattern matching. GitHub activity is treated as evidence for product execution and market pull, not as a standalone asset value.",
  };
}

function classifyCategory(repo: GitHubRepoSignals, input: GitHubRepoInput): GitHubStartupCategory {
  const text = [
    repo.name,
    repo.fullName,
    repo.description,
    repo.topics.join(" "),
    repo.readmeText.slice(0, 4000),
    input.market,
    input.intendedCustomer,
    input.monetizationPlan,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/\b(ai|llm|agent|rag|model|embedding|inference|ml|machine learning)\b/.test(text)) return "ai-infra";
  if (/\b(algo|algorithmic|trading|trade|quant|backtest|backtesting|broker|brokerage|stock|stocks|crypto|forex|market data|portfolio)\b/.test(text)) return "fintech-trading";
  if (/\b(security|vulnerability|auth|oauth|sast|secret|compliance|privacy)\b/.test(text)) return "security";
  if (/\b(database|postgres|analytics|warehouse|etl|pipeline|data|vector)\b/.test(text)) return "data-infra";
  if (/\b(cli|sdk|api|developer|devtool|framework|deploy|ci|cd|observability)\b/.test(text)) return "devtools";
  if (/\b(productivity|workflow|automation|notes|calendar|task)\b/.test(text)) return "productivity";
  if (/\b(saas|crm|billing|dashboard|workspace|platform)\b/.test(text)) return "saas";
  if (repo.hasPackageManifest) return "open-source-library";
  return "other";
}

function scoreRepo(
  repo: GitHubRepoSignals,
  input: GitHubRepoInput,
  category: GitHubStartupCategory
): GitHubValuationScore {
  const readme = repo.readmeText.toLowerCase();
  const ideaClarity = cap(
    4 +
      (repo.description ? 3 : 0) +
      (repo.topics.length >= 3 ? 2 : repo.topics.length) +
      (/problem|why|use case|features|quickstart/.test(readme) ? 4 : 0) +
      (input.intendedCustomer ? 2 : 0),
    15
  );

  const technicalExecution = cap(
    4 +
      (repo.hasPackageManifest ? 3 : 0) +
      (repo.hasDocs ? 3 : 0) +
      (repo.hasTests ? 3 : 0) +
      (repo.hasDockerfile ? 2 : 0) +
      (repo.releaseCount > 0 ? 2 : 0) +
      (recentlyActive(repo.pushedAt) ? 3 : 0) +
      Math.min(3, Math.floor(repo.commitCount / 25)),
    20
  );

  const marketPotential = cap(
    marketBase(category) +
      (input.market ? 3 : 0) +
      (input.intendedCustomer ? 3 : 0) +
      (/enterprise|teams|business|developers|companies|workflow/.test(readme) ? 3 : 0),
    20
  );

  const tractionSignal = cap(
    Math.min(8, Math.log10(repo.stars + 1) * 3) +
      Math.min(3, Math.log10(repo.forks + 1) * 1.8) +
      Math.min(2, repo.contributorCount / 5) +
      (repo.subscribers > 10 ? 1 : 0) +
      (input.knownUsers ? 2 : 0),
    15
  );

  const monetizationPotential = cap(
    3 +
      (input.monetizationPlan ? 4 : 0) +
      (repo.hasDemoOrWebsite ? 2 : 0) +
      (/pricing|enterprise|cloud|hosted|support|api key|billing|paid/.test(readme) ? 4 : 0) +
      (["devtools", "ai-infra", "security", "data-infra", "saas"].includes(category) ? 2 : 0),
    15
  );

  const defensibility = cap(
    2 +
      (repo.stars >= 1000 ? 2 : repo.stars >= 100 ? 1 : 0) +
      (repo.contributorCount >= 10 ? 2 : repo.contributorCount >= 3 ? 1 : 0) +
      (repo.license ? 1 : 0) +
      (/plugin|integration|ecosystem|protocol|benchmark|dataset|compiler|runtime/.test(readme) ? 3 : 0),
    10
  );

  const founderSignal = cap(
    (input.founderCommitment === "full-time" ? 3 : input.founderCommitment === "part-time" ? 1 : 0) +
      (recentlyActive(repo.pushedAt) ? 1 : 0) +
      (repo.contributorCount > 0 ? 1 : 0),
    5
  );

  return {
    ideaClarity: Math.round(ideaClarity),
    technicalExecution: Math.round(technicalExecution),
    marketPotential: Math.round(marketPotential),
    tractionSignal: Math.round(tractionSignal),
    monetizationPotential: Math.round(monetizationPotential),
    defensibility: Math.round(defensibility),
    founderSignal: Math.round(founderSignal),
    total: Math.round(
      ideaClarity +
        technicalExecution +
        marketPotential +
        tractionSignal +
        monetizationPotential +
        defensibility +
        founderSignal
    ),
  };
}

function mapScoreToValuation(
  total: number,
  geography: string,
  repo: GitHubRepoSignals,
  input: GitHubRepoInput
) {
  const ranges = [
    { max: 25, low: 25000, mid: 125000, high: 250000, label: "weak idea or unclear product" },
    { max: 45, low: 250000, mid: 500000, high: 750000, label: "prototype with limited startup signal" },
    { max: 60, low: 750000, mid: 1300000, high: 2000000, label: "credible idea-stage startup" },
    { max: 75, low: 2000000, mid: 3500000, high: 5000000, label: "strong pre-seed candidate" },
    { max: 90, low: 5000000, mid: 7500000, high: 10000000, label: "high-potential seed candidate" },
    { max: 100, low: 10000000, mid: 14000000, high: 18000000, label: "exceptional early startup signal" },
  ];
  const hasPublicTraction = repo.stars >= 25 || repo.forks >= 5 || repo.contributorCount >= 3 || Boolean(input.knownUsers);
  const hasCommercialClarity = Boolean(input.intendedCustomer || input.monetizationPlan);
  const unvalidatedPrototype = !hasPublicTraction && !hasCommercialClarity;
  const band = unvalidatedPrototype
    ? { max: 25, low: 25000, mid: 125000, high: 250000, label: "prototype with no market validation yet" }
    : ranges.find((range) => total <= range.max) || ranges[ranges.length - 1];
  const multiplier = geography === "india" ? 0.45 : geography === "eu" ? 0.8 : 1;
  const confidence = unvalidatedPrototype ? "low" : total >= 76 ? "high" : total >= 50 ? "medium" : "low";

  return {
    low: Math.round(band.low * multiplier),
    mid: Math.round(band.mid * multiplier),
    high: Math.round(band.high * multiplier),
    currency: "USD" as const,
    confidence: confidence as "low" | "medium" | "high",
    stageInterpretation: band.label,
  };
}

function selectComparablePatterns(category: GitHubStartupCategory): GitHubComparablePattern[] {
  const direct = CATEGORY_PATTERNS.filter((pattern) => pattern.category === category);
  return [...direct, ...CATEGORY_PATTERNS.filter((pattern) => pattern.category !== category)].slice(0, 3);
}

function buildThesis(repo: GitHubRepoSignals, input: GitHubRepoInput, category: GitHubStartupCategory): string {
  const customer = input.intendedCustomer || inferCustomer(category);
  const monetization = input.monetizationPlan || inferMonetization(category);
  return `${repo.fullName} looks like an idea-stage ${category.replace(/-/g, " ")} startup candidate for ${customer}. The most plausible path is ${monetization}, with GitHub evidence supporting product execution and early market interest rather than current company value.`;
}

function buildValueDrivers(repo: GitHubRepoSignals, input: GitHubRepoInput, score: GitHubValuationScore): string[] {
  const drivers = [];
  if (repo.stars === 0 && repo.forks === 0) {
    drivers.push("Public value is currently prototype-led: there is code to inspect, but no visible community adoption yet.");
  }
  if (repo.primaryLanguage) drivers.push(`Primary implementation language is ${repo.primaryLanguage}, which helps assess technical depth and hiring fit.`);
  if (score.technicalExecution >= 14) drivers.push("Working technical artifact with documentation, packaging, and recent development activity.");
  if (repo.stars >= 100) drivers.push(`${repo.stars.toLocaleString()} stars and ${repo.forks.toLocaleString()} forks provide early developer validation.`);
  if (repo.contributorCount >= 3) drivers.push(`${repo.contributorCount} contributors reduce single-maintainer risk.`);
  if (input.intendedCustomer) drivers.push(`Customer hypothesis is explicit: ${input.intendedCustomer}.`);
  if (input.monetizationPlan) drivers.push(`Commercial path is stated: ${input.monetizationPlan}.`);
  if (repo.hasDemoOrWebsite) drivers.push("Demo or project website improves product discoverability.");
  return drivers.length ? drivers : ["Repo provides a concrete prototype that can be evaluated beyond a slide-deck idea."];
}

function buildValuationFeedback(
  repo: GitHubRepoSignals,
  input: GitHubRepoInput,
  category: GitHubStartupCategory,
  score: GitHubValuationScore,
  valuation: {
    low: number;
    mid: number;
    high: number;
    currency: "USD";
    confidence: "low" | "medium" | "high";
    stageInterpretation: string;
  }
): string[] {
  const feedback: string[] = [];
  const noAdoption = repo.stars === 0 && repo.forks === 0;
  const noCommercialContext = !input.intendedCustomer && !input.monetizationPlan;
  const hasPrototypeSignal = score.technicalExecution >= 8 || repo.commitCount > 0 || repo.hasPackageManifest;

  if (noAdoption && noCommercialContext) {
    feedback.push(
      "The valuation is capped because the repo has no visible GitHub adoption and no stated customer or monetization plan. In investor terms, this is still a prototype option, not a validated startup."
    );
  }

  if (hasPrototypeSignal) {
    feedback.push(
      `The repo still earns value because it shows execution evidence: ${repo.primaryLanguage ? `${repo.primaryLanguage} code, ` : ""}${repo.commitCount} recent commit sample${repo.commitCount === 1 ? "" : "s"} from the GitHub API,${repo.hasPackageManifest ? " package/project structure," : ""}${repo.hasDocs ? " documentation signals," : ""} and a concrete product artifact.`
    );
  }

  if (category === "fintech-trading") {
    feedback.push(
      "Because this appears to be a trading or quant project, investors would require stronger proof than code alone: backtest quality, live or paper-trading results, broker/data integrations, risk controls, and compliance boundaries."
    );
  } else {
    feedback.push(
      `The category is treated as ${category.replace(/-/g, " ")}, so the model compares it against startup patterns where a technical artifact can become a paid product only after buyer and usage proof appear.`
    );
  }

  if (score.tractionSignal <= 2) {
    feedback.push(
      "Traction is the main reason the range stays low: stars, forks, external users, and contributor depth are not yet showing market pull."
    );
  }

  if (score.monetizationPotential <= 5) {
    feedback.push(
      "The next valuation jump would come from commercial clarity: who pays, what they pay for, and why this should become a product instead of remaining a code repository."
    );
  }

  feedback.push(
    `This produces a ${valuation.stageInterpretation} range with ${valuation.confidence} confidence, based on a ${score.total}/100 startup-potential score.`
  );

  return feedback;
}

function buildAnalystReview(
  repo: GitHubRepoSignals,
  input: GitHubRepoInput,
  category: GitHubStartupCategory,
  score: GitHubValuationScore,
  valuation: {
    low: number;
    mid: number;
    high: number;
    currency: "USD";
    confidence: "low" | "medium" | "high";
    stageInterpretation: string;
  }
): {
  verdict: string;
  summary: string;
  fundability: "low" | "medium" | "high";
} {
  const hasAdoption = repo.stars >= 25 || repo.forks >= 5 || repo.contributorCount >= 3 || Boolean(input.knownUsers);
  const hasCommercialClarity = Boolean(input.intendedCustomer || input.monetizationPlan);
  const fundability: "low" | "medium" | "high" = score.total >= 70 && hasAdoption && hasCommercialClarity
    ? "high"
    : score.total >= 50 && (hasAdoption || hasCommercialClarity)
      ? "medium"
      : "low";

  const verdict = fundability === "high"
    ? "Strong startup candidate, but still needs commercial validation before a serious seed round."
    : fundability === "medium"
      ? "Promising technical project, but the fundraising case depends on clearer buyer and usage proof."
      : "Early prototype signal, not yet a fundable startup case on public evidence alone.";

  const summaryParts = [
    `${repo.fullName} is being valued as a ${valuation.stageInterpretation}, not as a mature operating company.`,
    `The strongest signal is ${strongestSignal(score)}; the weakest signal is ${weakestSignal(score)}.`,
  ];

  if (category === "fintech-trading") {
    summaryParts.push("For a trading project, investors will heavily discount the idea until there are credible backtests, live/paper-trading results, risk controls, and a clear compliance position.");
  } else if (!hasAdoption) {
    summaryParts.push("Because public adoption is limited, the current valuation is mostly based on execution effort and optionality rather than market pull.");
  }

  if (!hasCommercialClarity) {
    summaryParts.push("The biggest unlock is a sharper commercial thesis: target buyer, paid workflow, and evidence that users would switch or pay.");
  }

  return {
    verdict,
    summary: summaryParts.join(" "),
    fundability,
  };
}

function strongestSignal(score: GitHubValuationScore) {
  const entries = scoreEntries(score);
  return entries.sort((a, b) => b.percent - a.percent)[0].label.toLowerCase();
}

function weakestSignal(score: GitHubValuationScore) {
  const entries = scoreEntries(score);
  return entries.sort((a, b) => a.percent - b.percent)[0].label.toLowerCase();
}

function scoreEntries(score: GitHubValuationScore) {
  return [
    { label: "idea clarity", value: score.ideaClarity, max: 15 },
    { label: "technical execution", value: score.technicalExecution, max: 20 },
    { label: "market potential", value: score.marketPotential, max: 20 },
    { label: "traction", value: score.tractionSignal, max: 15 },
    { label: "monetization", value: score.monetizationPotential, max: 15 },
    { label: "defensibility", value: score.defensibility, max: 10 },
    { label: "founder signal", value: score.founderSignal, max: 5 },
  ].map((entry) => ({ ...entry, percent: entry.value / entry.max }));
}

function buildInvestorRisks(repo: GitHubRepoSignals, input: GitHubRepoInput, score: GitHubValuationScore): string[] {
  const risks = [];
  if (repo.stars === 0 && repo.forks === 0) risks.push("No visible GitHub adoption yet, so valuation should stay in prototype-option territory.");
  if (!input.intendedCustomer) risks.push("Target buyer is not explicit, which weakens fundability.");
  if (!input.monetizationPlan) risks.push("Monetization path is not yet proven or clearly stated.");
  if (repo.stars < 100) risks.push("Public adoption signal is still limited.");
  if (repo.contributorCount <= 1) risks.push("Maintainer concentration creates execution and continuity risk.");
  if (score.marketPotential < 10) risks.push("Market category is not yet clearly venture-scale from repo evidence alone.");
  if (!repo.license) risks.push("License is unclear, which can complicate commercial use.");
  return risks.slice(0, 5);
}

function buildMilestones(repo: GitHubRepoSignals, input: GitHubRepoInput, category: GitHubStartupCategory): string[] {
  const milestones = [
    "Document a narrow ICP, buyer pain, and budget owner.",
    "Ship a hosted demo or waitlist tied to the repo.",
    "Collect proof of usage: active users, package downloads, pilots, Discord/Slack members, or design partners.",
    "Add a pricing hypothesis and one paid conversion path.",
  ];

  if (category === "fintech-trading") {
    milestones.push("Show audited backtests, live paper-trading results, broker/data integrations, and clear compliance boundaries.");
  }
  if (["devtools", "ai-infra", "data-infra"].includes(category)) {
    milestones.push("Package the project as a managed cloud or API so open-source usage can convert into revenue.");
  }
  if (!repo.hasDocs) milestones.push("Improve onboarding docs and quickstart quality.");
  if (!input.founderCommitment || input.founderCommitment === "unknown") milestones.push("Clarify founder commitment and go-to-market ownership.");
  return milestones.slice(0, 6);
}

function buildAssumptions(input: GitHubRepoInput): string[] {
  return [
    "The output estimates pre-money value if the repo became a startup today.",
    "No current ARR is assumed unless the user provides commercial evidence.",
    `Geography benchmark: ${input.geography || "global"}.`,
    "GitHub stars, forks, and contributors are treated as validation signals, not direct monetary value.",
  ];
}

function marketBase(category: GitHubStartupCategory) {
  const base: Record<string, number> = {
    "ai-infra": 13,
    devtools: 12,
    security: 12,
    "data-infra": 12,
    "fintech-trading": 9,
    saas: 10,
    productivity: 8,
    "open-source-library": 8,
    other: 6,
  };
  return base[category];
}

function inferCustomer(category: GitHubStartupCategory) {
  const customer: Record<string, string> = {
    "ai-infra": "AI builders and engineering teams",
    devtools: "software developers and engineering teams",
    security: "security and platform engineering teams",
    "data-infra": "data and platform teams",
    "fintech-trading": "quant traders, retail algo traders, or fintech engineering teams",
    productivity: "knowledge workers and operations teams",
    saas: "business teams with a repeat workflow",
    "open-source-library": "developers adopting the library in production",
    other: "a narrow early-adopter segment",
  };
  return customer[category] || customer.other;
}

function inferMonetization(category: GitHubStartupCategory) {
  if (["devtools", "ai-infra", "data-infra"].includes(category)) return "a hosted cloud product, usage-based API, or enterprise tier";
  if (category === "fintech-trading") return "paid strategy tooling, hosted backtesting, broker integrations, data add-ons, or managed alerts";
  if (category === "security") return "team plans, enterprise compliance workflows, or managed scanning";
  if (category === "open-source-library") return "support, hosted infrastructure, and commercial extensions";
  return "paid SaaS, services-led pilots, or enterprise support";
}

function recentlyActive(date: string) {
  const pushed = new Date(date).getTime();
  if (!Number.isFinite(pushed)) return false;
  const days = (Date.now() - pushed) / (1000 * 60 * 60 * 24);
  return days <= 90;
}

function cap(value: number, max: number) {
  return Math.max(0, Math.min(max, value));
}
