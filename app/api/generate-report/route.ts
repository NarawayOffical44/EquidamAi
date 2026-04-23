import { NextRequest, NextResponse } from "next/server";
import { ValuationResult, ValuationReport } from "@/types";
import {
  generateFullReport,
  generateOnePagerSummary,
} from "@/lib/claude/generateReport";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { valuation, profile, userId } = body;

    if (!valuation || !profile || !userId) {
      return NextResponse.json(
        { error: "Missing valuation, profile, or user ID" },
        { status: 400 }
      );
    }

    const valuationData = valuation as ValuationResult;

    console.log(
      `[Report] Generating reports for ${profile.companyName}...`
    );

    // Generate both reports in parallel
    const [fullReport, onePagerMarkdown] = await Promise.all([
      generateFullReport(profile, valuationData),
      generateOnePagerSummary(profile, valuationData),
    ]);

    const report: ValuationReport = {
      id: `report_${Date.now()}`,
      valuationId: valuationData.id,
      startupId: valuationData.startupId,
      userId,
      ...fullReport,
    };

    console.log(
      `[Report] Complete. Full report: ~${Math.round(fullReport.methodBreakdown.length + 5)} sections. One-pager: ready for PDF.`
    );

    return NextResponse.json({
      success: true,
      report,
      onePagerMarkdown,
      pdfGenerationUrl: "/api/pdf/generate", // Separate PDF generation endpoint
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      {
        error: "Report generation failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
