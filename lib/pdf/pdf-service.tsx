import { renderToBuffer } from "@react-pdf/renderer";
import { buildReportDocument } from "@/lib/pdf/react-pdf-report";
import type { ReportData } from "@/lib/pdf/report-template";

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
  const startup = valuation.startups || {};
  const rd = valuation.report_data || {};
  const startupProfile = rd.startupProfile || {};

  return {
    companyName: startup.company_name || startupProfile.companyName || "Unknown",
    stage: startup.stage || startupProfile.stage || "seed",
    industry: startup.industry || startupProfile.industry,
    website: startup.website_url || startupProfile.websiteUrl,
    description: startup.description || startupProfile.description,
    blendedLow: Number(valuation.blended_low_range || 0),
    blendedHigh: Number(valuation.blended_high_range || 0),
    blendedAverage: Number(valuation.blended_weighted_average || 0),
    confidenceLevel: valuation.confidence_level || "medium",
    dataCompleteness: valuation.data_completeness || 70,
    methods: (valuation.methods_results || rd.methodBreakdown || []).filter((m: any) => m?.methodName),
    keyReasons: valuation.key_reasons || rd.executiveSummary?.keyReasons || [],
    executiveSummary: rd.executiveSummary,
    sensitivityAnalysis: rd.sensitivityAnalysis,
    detailedAnalysis: rd.detailedAnalysis,
    professionalCitation: rd.professionalCitation,
    generatedAt: rd.generatedAt || valuation.created_at || undefined,
    valuationId: valuation.id,
    isFreePlan: userPlan === "free",
  };
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
