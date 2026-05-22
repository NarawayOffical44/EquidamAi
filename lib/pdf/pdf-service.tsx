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

export function buildReportDataFromValuation(valuation: ValuationRow, userPlan: string): ReportData {
  const planKey = normalizePlanKey(userPlan, userPlan !== "free");
  const isFreePlan = planKey === "free";
  const startup = valuation.startups || {};
  const rd = valuation.report_data || {};
  const startupProfile = rd.startupProfile || {};
  const methods = (valuation.methods_results || rd.methodBreakdown || [])
    .filter((m: any) => m?.methodName)
    .filter((m: any) => !isFreePlan || m.methodName !== "evaldam-score");
  const sourceAudit = rd.sourceAudit || {};
  const inputTrace = Array.isArray(sourceAudit.inputTrace) ? sourceAudit.inputTrace : [];
  const verificationGaps = Array.isArray(sourceAudit.verificationGaps) ? sourceAudit.verificationGaps : [];
  const dataCompleteness = Number(valuation.data_completeness || 70);
  const confidenceLevel = valuation.confidence_level || "medium";
  const generatedAt = rd.generatedAt || valuation.created_at || new Date().toISOString();
  const arr = Number(startup.arr || startup.annual_recurring_revenue || startupProfile.annualRecurringRevenue || 0);
  const growth = Number(startup.monthly_growth_rate || startupProfile.monthlyGrowthRate || 0);
  const teamSize = Number(startup.team_size || startupProfile.teamSize || startupProfile.team?.length || 0);
  const marketSize = Number(startup.total_addressable_market || startupProfile.totalAddressableMarket || 0);

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
    investorObjections: [
      ...(arr <= 0 ? ["What revenue evidence supports this valuation range?"] : []),
      ...(growth <= 0 ? ["What proof shows demand is growing repeatably?"] : []),
      ...(marketSize <= 0 ? ["Is the market large enough to justify the high case?"] : []),
      ...(verificationGaps.length > 0 ? ["Which founder-provided inputs have independent verification?"] : []),
      "Which assumptions would change the valuation most if challenged?",
    ].slice(0, 4),
    nextValueLevers: [
      ...(arr <= 0 ? ["Add ARR, MRR, pilots, LOIs, or paid customer evidence to anchor the range."] : []),
      ...(growth <= 0 ? ["Add 3-6 months of growth data to defend the upside case."] : []),
      ...(marketSize <= 0 ? ["Add TAM/SAM and target buyer segment to support the ceiling."] : []),
      "Keep valuation versions tied to specific inputs so investor conversations remain repeatable.",
    ].slice(0, 4),
  };
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
