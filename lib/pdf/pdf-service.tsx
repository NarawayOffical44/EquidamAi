import { renderToBuffer } from "@react-pdf/renderer";
import { buildReportDocument } from "@/lib/pdf/react-pdf-report";
import type { ReportData } from "@/lib/pdf/report-template";
import { normalizePlanKey } from "@/lib/plans/plan-limits";

type ValuationRow = {
  id: string;
  blended_low_range?: number | null;
  blended_high_range?: number | null;
  blended_weighted_average?: number | null;
  confidence_level?: string | null;
  data_completeness?: number | null;
  methods_results?: any[] | null;
  key_reasons?: string[] | null;
  report_data?: any;
  created_at?: string | null;
  startups?: any;
};

type InvestorView = NonNullable<ReportData["investorView"]>;
type InsightItem = InvestorView["tractionQuality"][number];

export function buildReportDataFromValuation(valuation: ValuationRow, userPlan: string): ReportData {
  const planKey = normalizePlanKey(userPlan, userPlan !== "free");
  const isFreePlan = planKey === "free";
  const startup = valuation.startups || {};
  const rd = valuation.report_data || {};
  const startupProfile = rd.startupProfile || {};
  const profileData = asRecord(startup.profile_data || startupProfile.profileData);
  const methods = (valuation.methods_results || rd.methodBreakdown || [])
    .filter((m: any) => m?.methodName)
    .filter((m: any) => !isFreePlan || !["evaldam-score", "evaldam_score"].includes(m.methodName));
  const sourceAudit = rd.sourceAudit || {};
  const inputTrace = Array.isArray(sourceAudit.inputTrace) ? sourceAudit.inputTrace : [];
  const verificationGaps = Array.isArray(sourceAudit.verificationGaps) ? sourceAudit.verificationGaps : [];
  const dataCompleteness = Number(valuation.data_completeness || 70);
  const confidenceLevel = valuation.confidence_level || "medium";
  const generatedAt = rd.generatedAt || valuation.created_at || new Date().toISOString();
  const arr = firstNumber(startup.arr, startup.annual_recurring_revenue, startupProfile.annualRecurringRevenue);
  const mrr = firstNumber(startup.mrr, startupProfile.monthlyRecurringRevenue);
  const recentMonthlyRevenue = firstNumber(startup.total_revenue, startupProfile.recentMonthlyRevenue, arr > 0 ? arr / 12 : 0);
  const growth = firstNumber(startup.monthly_growth_rate, startupProfile.monthlyGrowthRate);
  const teamSize = firstNumber(startup.team_size, startupProfile.teamSize, startupProfile.team?.length);
  const marketSize = firstNumber(startup.total_addressable_market, startup.total_addressable_market_usd, startupProfile.totalAddressableMarket);
  const customerCount = firstNumber(startup.customer_count, startupProfile.customerCount, profileData.customer_count, profileData.active_customers, profileData.early_interest_count);
  const grossMargin = firstNumber(profileData.gross_margin, startupProfile.grossMargin);
  const customerConcentration = firstNumber(profileData.customer_concentration, startupProfile.customerConcentration);
  const customerLossRate = firstNumber(profileData.customer_loss_rate);
  const repeatRevenue = firstNumber(profileData.revenue_from_existing_customers);
  const burnRate = firstNumber(profileData.burn_rate, startupProfile.burnRate);
  const runwayMonths = firstNumber(startup.runway_months, startupProfile.runwayMonths, profileData.runway_months);
  const salesPipeline = firstNumber(profileData.sales_pipeline_value);
  const totalFundingRaised = firstNumber(startup.total_funding_raised, startupProfile.totalFunded, profileData.funding_raised);
  const raiseNeeded = firstNumber(profileData.raise_needed, profileData.target_raise, profileData.next_raise_amount, profileData.funding_required);
  const avgRevenuePerCustomer = firstNumber(profileData.average_revenue_per_customer);
  const avgContractValue = firstNumber(profileData.average_contract_value);
  const cacPayback = firstNumber(profileData.cac_payback_months, profileData.cac_payback);
  const ltvCac = firstNumber(profileData.ltv_cac, profileData.ltv_to_cac);
  const revenueModel = firstString(profileData.revenue_model, startupProfile.revenueModel);
  const nextMilestone = firstString(profileData.next_round_milestone, profileData.product_milestone, profileData.next_growth_area, profileData.profitability_timing);
  const useOfFunds = firstString(profileData.use_of_funds, profileData.planned_use_of_funds);
  const lastRound = firstString(profileData.last_round, startupProfile.lastRound);
  const competitiveAdvantage = firstString(startup.competitive_advantage, startupProfile.competitiveAdvantage, profileData.competitive_moat);
  const patentCount = firstNumber(startupProfile.patentCount, profileData.has_patent ? 1 : 0);
  const founderExits = Array.isArray(startupProfile.teamPreviousExits) ? startupProfile.teamPreviousExits.length : 0;

  const strengths = [
    methods.length > 0 ? `${methods.length} valuation method${methods.length === 1 ? "" : "s"} available in the model output.` : "",
    dataCompleteness >= 75 ? "Input completeness is strong enough for a tighter discussion range." : "",
    arr > 0 ? "Revenue/ARR is available as operating traction evidence." : "",
    growth > 0 ? "Growth rate is available for scenario and upside checks." : "",
  ].filter(Boolean);

  const gaps = [
    arr <= 0 ? "Revenue/ARR was not available, so revenue-based conclusions should be treated cautiously." : "",
    growth <= 0 ? "Growth history was not available, which weakens the upside case." : "",
    marketSize <= 0 ? "Market size was not available, so the valuation ceiling depends on broader stage assumptions." : "",
    dataCompleteness < 70 ? "Data completeness is below investor-grade and should be improved before relying on the range." : "",
  ].filter(Boolean);

  const investorObjections = [
    ...(arr <= 0 ? ["What revenue evidence supports this valuation range?"] : []),
    ...(growth <= 0 ? ["What proof shows demand is growing repeatably?"] : []),
    ...(marketSize <= 0 ? ["Is the market large enough to justify the high case?"] : []),
    ...(verificationGaps.length > 0 ? ["Which founder-provided inputs have independent verification?"] : []),
    "Which assumptions would change the valuation most if challenged?",
  ].slice(0, 4);

  const nextValueLevers = [
    ...(arr <= 0 ? ["Add ARR, MRR, pilots, LOIs, or paid customer evidence to anchor the range."] : []),
    ...(growth <= 0 ? ["Add 3-6 months of growth data to defend the upside case."] : []),
    ...(marketSize <= 0 ? ["Add TAM/SAM and target buyer segment to support the ceiling."] : []),
    "Keep valuation versions tied to specific inputs so investor conversations remain repeatable.",
  ].slice(0, 4);

  const investorView = buildInvestorView({
    companyName: startup.company_name || startupProfile.companyName || "the company",
    stage: startup.stage || startupProfile.stage || "seed",
    industry: startup.industry || startupProfile.industry,
    description: startup.description || startupProfile.description,
    industryAnalysis: rd.detailedAnalysis?.industryAnalysis,
    marketContext: rd.detailedAnalysis?.marketContext,
    arr,
    mrr,
    recentMonthlyRevenue,
    growth,
    teamSize,
    marketSize,
    customerCount,
    grossMargin,
    customerConcentration,
    customerLossRate,
    repeatRevenue,
    burnRate,
    runwayMonths,
    salesPipeline,
    totalFundingRaised,
    raiseNeeded,
    avgRevenuePerCustomer,
    avgContractValue,
    cacPayback,
    ltvCac,
    revenueModel,
    nextMilestone,
    useOfFunds,
    lastRound,
    competitiveAdvantage,
    patentCount,
    founderExits,
    investorObjections,
    evidenceGaps: gaps,
  });

  return {
    companyName: startup.company_name || startupProfile.companyName || "Unknown",
    stage: startup.stage || startupProfile.stage || "seed",
    industry: startup.industry || startupProfile.industry,
    website: startup.website_url || startupProfile.websiteUrl,
    description: startup.description || startupProfile.description,
    blendedLow: Number(valuation.blended_low_range || 0),
    blendedHigh: Number(valuation.blended_high_range || 0),
    blendedAverage: Number(valuation.blended_weighted_average || 0),
    confidenceLevel,
    dataCompleteness,
    methods,
    keyReasons: valuation.key_reasons || rd.executiveSummary?.keyReasons || [],
    executiveSummary: rd.executiveSummary,
    sensitivityAnalysis: rd.sensitivityAnalysis,
    detailedAnalysis: rd.detailedAnalysis,
    investorView,
    professionalCitation: rd.professionalCitation,
    generatedAt,
    valuationId: valuation.id,
    isFreePlan,
    basisOfValuation: {
      purpose: "Founder and investor discussion support for an indicative pre-money startup valuation.",
      valuationDate: new Date(generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      standard: "Indicative startup valuation analysis using recognized early-stage and venture valuation methods. This is not a statutory valuation certificate.",
      dataSources: [
        "Founder-provided startup profile and financial inputs",
        "Field-level input evidence trail stored with this valuation",
        "Calculated outputs from the Evaldam valuation engine",
        "Method assumptions stored with this valuation version",
        "Market benchmarks and public comparable context where available",
      ],
      limitations: [
        "Outputs depend on the accuracy and completeness of provided inputs.",
        "The report does not replace due diligence, a signed valuation opinion, tax advice, or investment advice.",
        "Actual negotiated valuation may differ based on investor demand, deal terms, control rights, and market timing.",
      ],
    },
    evidenceQuality: {
      label: dataCompleteness >= 80 && confidenceLevel === "high" ? "Strong" : dataCompleteness >= 60 ? "Moderate" : "Limited",
      summary: `${dataCompleteness}% data completeness with ${confidenceLevel} model confidence.`,
      strengths: strengths.length ? strengths : ["Core valuation range and method outputs are available."],
      gaps: gaps.length ? gaps : ["No major evidence gaps were detected from the stored valuation inputs."],
    },
    provenance: [
      ...inputTrace
        .filter((entry: any) => ["stage", "industry", "annualRecurringRevenue", "monthlyGrowthRate", "teamSize", "totalAddressableMarket", "runwayMonths", "totalFunded", "competitiveAdvantage", "patentCount"].includes(entry.key))
        .map((entry: any) => ({
          item: entry.label,
          value: formatTraceValue(entry.value, entry.key),
          source: `${formatSource(entry.source)} - ${entry.verificationStatus || "unverified"} (${entry.confidence || 0}% confidence)`,
        })),
      { item: "Weighted valuation", value: `$${Number(valuation.blended_weighted_average || 0).toLocaleString()}`, source: "Calculated" },
      { item: "Confidence level", value: confidenceLevel, source: "System estimate" },
    ],
    sourceAudit,
    reviewStatus: rd.reviewStatus || {
      status: "system_generated_unreviewed",
      note: "Not a signed valuation opinion unless reviewed and approved by a qualified professional.",
    },
    investorObjections,
    nextValueLevers,
  };
}

function buildInvestorView(input: {
  companyName: string;
  stage: string;
  industry?: string;
  description?: string;
  industryAnalysis?: string;
  marketContext?: string;
  arr: number;
  mrr: number;
  recentMonthlyRevenue: number;
  growth: number;
  teamSize: number;
  marketSize: number;
  customerCount: number;
  grossMargin: number;
  customerConcentration: number;
  customerLossRate: number;
  repeatRevenue: number;
  burnRate: number;
  runwayMonths: number;
  salesPipeline: number;
  totalFundingRaised: number;
  raiseNeeded: number;
  avgRevenuePerCustomer: number;
  avgContractValue: number;
  cacPayback: number;
  ltvCac: number;
  revenueModel: string;
  nextMilestone: string;
  useOfFunds: string;
  lastRound: string;
  competitiveAdvantage: string;
  patentCount: number;
  founderExits: number;
  investorObjections: string[];
  evidenceGaps: string[];
}): InvestorView {
  const stage = input.stage || "seed";
  const tractionSignals = [
    input.arr > 0 ? `${formatMoney(input.arr)} ARR` : "",
    input.customerCount > 0 ? `${formatCount(input.customerCount)} customers or demand signals` : "",
    input.growth > 0 ? `${formatPercent(input.growth)} monthly growth` : "",
    input.marketSize > 0 ? `${formatMoney(input.marketSize)} addressable market` : "",
  ].filter(Boolean);

  const thesis = tractionSignals.length
    ? `${input.companyName} can become more valuable if it turns ${tractionSignals.join(", ")} into repeatable growth with controlled execution risk.`
    : `To generate the investor thesis, add customer proof, revenue signals, market size, and team credibility in the dashboard.`;

  const marketStory = firstString(input.marketContext, input.industryAnalysis)
    ? trimSentence(firstString(input.marketContext, input.industryAnalysis), 320)
    : input.marketSize > 0 || input.competitiveAdvantage
      ? `The market case is supported by ${[
          input.marketSize > 0 ? `${formatMoney(input.marketSize)} market size` : "",
          input.competitiveAdvantage ? "a stated competitive advantage" : "",
        ].filter(Boolean).join(" and ")}.`
      : "To generate the market and competition story, add market description, target segment, competitors, and why the company wins in the dashboard.";

  const teamSignals = [
    input.teamSize > 0 ? `${formatCount(input.teamSize)} team member${input.teamSize === 1 ? "" : "s"}` : "",
    input.founderExits > 0 ? "prior founder exit experience" : "",
    input.patentCount > 0 ? `${formatCount(input.patentCount)} patent/IP signal${input.patentCount === 1 ? "" : "s"}` : "",
    input.competitiveAdvantage ? "documented competitive advantage" : "",
  ].filter(Boolean);

  const teamCredibility = teamSignals.length
    ? `Team confidence is supported by ${teamSignals.join(", ")}.`
    : "To generate team credibility, add founder background, key hires, domain experience, and execution proof in the dashboard.";

  const monthlyRevenue = input.mrr || input.recentMonthlyRevenue || (input.arr > 0 ? input.arr / 12 : 0);

  return {
    thesis,
    stageLens: stageLens(stage),
    marketStory,
    teamCredibility,
    tractionQuality: [
      insightNumber("Revenue quality", input.arr || input.mrr || input.recentMonthlyRevenue, () => input.arr > 0 ? `${formatMoney(input.arr)} ARR` : `${formatMoney(monthlyRevenue)} monthly revenue`, "ARR, MRR, or recent monthly revenue"),
      insightNumber("Customers or demand", input.customerCount, value => `${formatCount(value)} customers or demand signals`, "active customers, pilots, LOIs, or waitlist demand"),
      insightNumber("Growth", input.growth, value => `${formatPercent(value)} monthly growth`, "3-6 months of revenue, usage, or customer growth"),
      insightNumber("Retention / churn", input.customerLossRate || input.repeatRevenue, value => input.customerLossRate > 0 ? `${formatPercent(Math.max(0, 100 - value))} implied retention` : `${formatPercent(value)} revenue from existing customers`, "retention, churn, repeat usage, or expansion revenue"),
      insightNumber("Pipeline", input.salesPipeline, value => `${formatMoney(value)} expected sales pipeline`, "qualified pipeline or signed customer pipeline"),
      insightText("Revenue model", input.revenueModel, "revenue model and pricing motion"),
    ],
    financialOutlook: [
      insightNumber("Revenue projection basis", monthlyRevenue && input.growth ? monthlyRevenue : 0, () => `${formatMoney(monthlyRevenue)} monthly revenue at ${formatPercent(input.growth)} monthly growth`, "current revenue and monthly growth"),
      insightNumber("Cash runway", input.runwayMonths, value => `${formatCount(value)} months runway`, "runway and current cash position"),
      insightNumber("Monthly burn", input.burnRate, value => `${formatMoney(value)} monthly burn`, "monthly burn rate"),
      insightNumber("Raise needed", input.raiseNeeded, value => `${formatMoney(value)} target raise`, "target raise amount"),
      breakEvenInsight(monthlyRevenue, input.growth, input.grossMargin, input.burnRate),
    ],
    capitalEfficiency: [
      insightNumber("Gross margin", input.grossMargin, value => `${formatPercent(value)} gross margin`, "gross margin"),
      burnMultipleInsight(input.burnRate, input.arr, input.growth),
      insightNumber("Customer concentration", input.customerConcentration, value => `${formatPercent(value)} from top customer`, "top customer concentration"),
      insightNumber("CAC payback", input.cacPayback, value => `${formatCount(value)} months`, "CAC payback period"),
      insightNumber("LTV/CAC", input.ltvCac, value => `${value.toFixed(1)}x`, "LTV/CAC"),
    ],
    useOfFunds: [
      insightText("Next milestone", input.nextMilestone, "next raise milestone"),
      insightText("Use of funds", input.useOfFunds, "use of funds by product, hiring, sales, compliance, or market expansion"),
      insightNumber("Target raise", input.raiseNeeded, value => `${formatMoney(value)} target raise`, "target raise amount"),
      input.totalFundingRaised > 0 || input.lastRound
        ? available("Funding history", [input.totalFundingRaised > 0 ? formatMoney(input.totalFundingRaised) : "", input.lastRound].filter(Boolean).join(" | "))
        : missing("Funding history", "total raised and last round details"),
    ],
    riskSummary: [
      ...input.investorObjections,
      ...input.evidenceGaps.slice(0, 2),
    ].slice(0, 5),
  };
}

function stageLens(stage: string) {
  const normalized = stage.toLowerCase();
  if (normalized.includes("pre")) {
    return "Pre-revenue lens: investors focus on problem urgency, founder-market fit, product milestone, early demand, and why this team can reach first revenue.";
  }
  if (normalized.includes("series-a")) {
    return "Series A lens: investors focus on repeatable revenue, retention, pipeline quality, sales efficiency, market depth, and team depth beyond the founders.";
  }
  if (normalized.includes("series-b")) {
    return "Growth-stage lens: investors focus on durable growth, margin profile, expansion revenue, capital efficiency, leadership depth, and path to profitability.";
  }
  return "Seed lens: investors focus on early revenue or demand proof, repeatable customer acquisition, strong usage, credible market size, and the milestone this round unlocks.";
}

function available(label: string, value: string): InsightItem {
  return { label, value, status: "available" };
}

function missing(label: string, inputLabel: string): InsightItem {
  return { label, message: `To generate this item, add ${inputLabel} in the dashboard.`, status: "missing" };
}

function insightNumber(label: string, value: number, formatter: (value: number) => string, inputLabel: string): InsightItem {
  return value > 0 ? available(label, formatter(value)) : missing(label, inputLabel);
}

function insightText(label: string, value: string, inputLabel: string): InsightItem {
  return value ? available(label, value) : missing(label, inputLabel);
}

function breakEvenInsight(monthlyRevenue: number, monthlyGrowth: number, grossMargin: number, burnRate: number): InsightItem {
  if (monthlyRevenue <= 0 || monthlyGrowth <= 0 || grossMargin <= 0 || burnRate <= 0) {
    return missing("Break-even timing", "revenue, growth, gross margin, and burn rate");
  }

  const marginRate = grossMargin / 100;
  let revenue = monthlyRevenue;
  for (let month = 0; month <= 60; month += 1) {
    if (revenue * marginRate >= burnRate) {
      return available("Break-even timing", month === 0 ? "At or near break-even on saved inputs" : `About ${month} months on saved inputs`);
    }
    revenue *= 1 + monthlyGrowth / 100;
  }

  return available("Break-even timing", "Beyond 60 months on saved inputs");
}

function burnMultipleInsight(burnRate: number, arr: number, monthlyGrowth: number): InsightItem {
  if (burnRate <= 0 || arr <= 0 || monthlyGrowth <= 0) {
    return missing("Burn multiple", "monthly burn, ARR, and growth");
  }

  const netNewArr = arr * (monthlyGrowth / 100);
  if (netNewArr <= 0) return missing("Burn multiple", "monthly burn, ARR, and growth");
  return available("Burn multiple", `${(burnRate / netNewArr).toFixed(1)}x from saved burn and ARR growth`);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const num = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(num) && num > 0) return num;
  }
  return 0;
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function formatMoney(value: number) {
  const amount = Math.abs(value || 0);
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatCount(value: number) {
  return Math.round(value).toLocaleString();
}

function formatPercent(value: number) {
  return `${value.toFixed(Math.abs(value % 1) > 0 ? 1 : 0)}%`;
}

function trimSentence(value: string, max: number) {
  const text = value.trim();
  return text.length > max ? `${text.substring(0, max)}...` : text;
}

function formatSource(source: string) {
  return source.replace(/_/g, " ");
}

function formatTraceValue(value: unknown, key: string) {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (typeof value === "number") {
    if (/Revenue|Market|Funded|arr|tam/i.test(key)) return `$${value.toLocaleString()}`;
    if (/Growth|Margin|Concentration/i.test(key)) return `${value}%`;
    return value.toLocaleString();
  }
  return String(value);
}

export async function renderValuationReportPdf(reportData: ReportData): Promise<Buffer> {
  const doc = buildReportDocument(reportData);
  const buffer = await renderToBuffer(doc);

  if (!isPdfBuffer(buffer)) {
    throw new Error("PDF renderer returned invalid output");
  }

  return buffer;
}

export function sanitizePdfFilename(companyName: string): string {
  const safeCompanyName = companyName
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${safeCompanyName || "valuation"}-valuation-report.pdf`;
}

function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.length > 4 && buffer.subarray(0, 4).toString("utf8") === "%PDF";
}
