import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";
import { renderValuationReportPdf } from "@/lib/pdf/pdf-service";
import type { ReportData } from "@/lib/pdf/report-template";
import { withLeadAttribution } from "@/lib/leads/attribution";
import { insertLead } from "@/lib/leads/store";

export const runtime = "nodejs";

const SampleReportLeadSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  companyName: z.string().min(1, "Company name is required"),
  attribution: z.unknown().optional(),
});

const sampleReportData: ReportData = {
  companyName: "NimbusPay Technologies",
  stage: "series-a",
  industry: "B2B SaaS / fintech",
  website: "https://example.com",
  description: "A sample startup used to show Evaldam's investor-ready valuation report structure.",
  blendedLow: 9_800_000,
  blendedHigh: 17_600_000,
  blendedAverage: 13_400_000,
  confidenceLevel: "high",
  dataCompleteness: 86,
  valuationId: "sample-report",
  generatedAt: new Date("2026-05-13T00:00:00.000Z").toISOString(),
  isFreePlan: false,
  methods: [
    {
      methodName: "scorecard",
      lowEstimate: 9_200_000,
      midEstimate: 12_400_000,
      highEstimate: 15_600_000,
      confidence: "high",
      reasoning: "Strong team, clear market segment, and early traction support an above-baseline scorecard outcome.",
    },
    {
      methodName: "berkus",
      lowEstimate: 5_800_000,
      midEstimate: 7_200_000,
      highEstimate: 8_900_000,
      confidence: "medium",
      reasoning: "The product, management, and strategic relationship milestones are meaningfully developed.",
    },
    {
      methodName: "vc",
      lowEstimate: 12_100_000,
      midEstimate: 16_200_000,
      highEstimate: 21_400_000,
      confidence: "medium",
      reasoning: "Exit-case valuation is supported by growth assumptions, but remains sensitive to terminal multiples.",
    },
    {
      methodName: "dcf-ltg",
      lowEstimate: 8_300_000,
      midEstimate: 11_700_000,
      highEstimate: 15_100_000,
      confidence: "medium",
      reasoning: "Cash-flow visibility is improving, but long-term margin assumptions still require monitoring.",
    },
    {
      methodName: "dcf-multiples",
      lowEstimate: 10_400_000,
      midEstimate: 14_900_000,
      highEstimate: 19_300_000,
      confidence: "medium",
      reasoning: "Revenue multiple context supports a higher case if retention and expansion evidence hold.",
    },
    {
      methodName: "evaldam-score",
      lowEstimate: 11_600_000,
      midEstimate: 16_000_000,
      highEstimate: 21_800_000,
      confidence: "high",
      reasoning: "Execution quality, market timing, and evidence quality increase the weighted outcome.",
    },
  ],
  keyReasons: [
    "Revenue traction and expansion potential support a defensible base case.",
    "Comparable SaaS and fintech benchmarks create a credible valuation range.",
    "The high case depends on stronger retention, margin, and enterprise pipeline evidence.",
  ],
  executiveSummary: {
    blendedRange: { low: 9_800_000, mid: 13_400_000, high: 17_600_000 },
    keyReasons: [
      "The model blends six methods instead of relying on one headline multiple.",
      "Evidence quality is strong enough for a structured investor discussion.",
      "Sensitivity analysis shows which assumptions move valuation most.",
    ],
    methodologyNote: "Sample output using Evaldam's structured valuation workflow.",
    confidenceRating: "high",
  },
  sensitivityAnalysis: [
    { variable: "Monthly growth", scenario: "Growth falls by 20%", impact: -1_700_000, percentageChange: -13 },
    { variable: "Gross margin", scenario: "Margin expands by 8 points", impact: 1_150_000, percentageChange: 9 },
    { variable: "Exit multiple", scenario: "Multiple compression", impact: -2_000_000, percentageChange: -15 },
  ],
  detailedAnalysis: {
    industryAnalysis: "B2B fintech software remains attractive where customers show repeat usage and compliance-driven retention.",
    comparableCompanies: ["Vertical payments SaaS", "Embedded finance workflow tools", "SMB finance automation platforms"],
    marketContext: "Investors are rewarding evidence quality, revenue durability, and credible expansion paths.",
  },
  basisOfValuation: {
    purpose: "Sample report for founders evaluating Evaldam before subscribing.",
    valuationDate: "May 13, 2026",
    standard: "Indicative startup valuation analysis for fundraising discussion support.",
    dataSources: [
      "Sample founder inputs",
      "Evaldam valuation method assumptions",
      "Comparable company context",
      "Sensitivity and evidence quality checks",
    ],
    limitations: [
      "This is a sample report and not a signed valuation opinion.",
      "Actual company reports depend on founder-provided inputs and available evidence.",
      "The output does not replace legal, tax, investment, or certified valuation advice.",
    ],
  },
  evidenceQuality: {
    label: "Strong",
    summary: "86% sample data completeness with high model confidence.",
    strengths: [
      "Revenue, growth, market, and team inputs are present.",
      "Six method outputs are available for triangulation.",
      "Key assumptions and sensitivities are documented.",
    ],
    gaps: [
      "Customer retention cohorts should be independently verified.",
      "Enterprise pipeline timing should be reviewed before using the high case.",
    ],
  },
  investorObjections: [
    "How durable is the revenue expansion assumption?",
    "Which comparable companies are closest to this startup?",
    "What proof supports the high-case multiple?",
    "Which assumptions should be verified before a term sheet discussion?",
  ],
  nextValueLevers: [
    "Add retention cohorts and expansion revenue evidence.",
    "Document enterprise pipeline conversion assumptions.",
    "Refresh comparable context before investor meetings.",
    "Keep each report version tied to the exact input set used.",
  ],
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = SampleReportLeadSchema.parse(body);
    const { fullName, email, phone, companyName, attribution } = validatedData;

    const adminClient = createAdminClient();
    const ipAddress = request.headers.get("x-forwarded-for") || null;
    const metadata = withLeadAttribution(request, {
      fullName,
      useCase: "Requested sample valuation report download",
      type: "sample_report_download",
      source: "sample_report_download",
      report: "sample_valuation_report",
    }, attribution);

    const { error: dbError } = await insertLead(adminClient, {
      email,
      phone: phone || null,
      company_name: companyName,
      website_url: JSON.stringify(metadata),
      metadata,
      ip_address: ipAddress,
      country: null,
      city: null,
      isp: null,
      valuation_low: null,
      valuation_mid: null,
      valuation_high: null,
    });

    if (dbError) {
      logger.error("Failed to save sample report lead", {
        error: dbError.message,
        email,
        companyName,
      });

      return NextResponse.json(
        { error: "Failed to save your request. Please try again." },
        { status: 500 }
      );
    }

    const buffer = await renderValuationReportPdf(sampleReportData);

    logger.info("Sample report downloaded", { email, companyName, bytes: buffer.length });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="evaldam-sample-valuation-report.pdf"',
        "Content-Length": String(buffer.length),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    logger.error("Sample report lead API error", {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid form data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Could not download the sample report. Please try again." },
      { status: 500 }
    );
  }
}
