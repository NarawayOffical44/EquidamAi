import { NextRequest, NextResponse } from "next/server";
import { StartupProfile, ValuationResult, ValuationReport } from "@/types";
import {
  generateFullReport,
  generateOnePagerSummary,
} from "@/lib/claude/generateReport";
import { createClient } from "@/lib/supabase/server";
import { requirePaidUser } from "@/lib/auth/paid-access";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const { valuation, profile, userId } = body as {
      valuation?: unknown;
      profile?: StartupProfile;
      userId?: string;
    };

    if (!valuation || !profile || !userId) {
      return NextResponse.json(
        { error: "Missing valuation, profile, or user ID" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const paidAccess = await requirePaidUser(supabase);
    if (!paidAccess.ok) return paidAccess.response;
    const { user } = paidAccess;

    if (user.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
