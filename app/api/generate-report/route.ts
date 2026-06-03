import { NextRequest, NextResponse } from "next/server";
import { StartupProfile, ValuationResult, ValuationReport } from "@/types";
import {
  generateFullReport,
  generateOnePagerSummary,
} from "@/lib/claude/generateReport";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePaidUser } from "@/lib/auth/paid-access";
import {
  getAiLimitMessage,
  getAiUsageAccess,
  recordAiUsageUseIfAvailable,
} from "@/lib/india-finance-ai/usage-limits";

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
    if (!valuationData.id || !valuationData.startupId) {
      return NextResponse.json(
        { error: "Saved valuation is required" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const { data: savedValuation, error: valuationError } = await adminClient
      .from("valuations")
      .select("id, startup_id, user_id, inputs_snapshot")
      .eq("id", valuationData.id)
      .eq("user_id", user.id)
      .maybeSingle<{
        id: string;
        startup_id: string;
        user_id: string;
        inputs_snapshot?: unknown;
      }>();

    if (valuationError || !savedValuation) {
      return NextResponse.json({ error: "Valuation not found" }, { status: 404 });
    }

    if (savedValuation.startup_id !== valuationData.startupId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const usageAccess = await getAiUsageAccess({
      supabase,
      sessionToken: `report:${user.id}`,
      ip:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "authenticated",
      feature: "report_download",
      usageKeyOverride: `user:${user.id}`,
      userIdOverride: user.id,
    });
    const reservation = await recordAiUsageUseIfAvailable(usageAccess.key, usageAccess.usage);
    if (!reservation.allowed) {
      return NextResponse.json(
        {
          error: getAiLimitMessage(reservation.usage),
          usage: reservation.usage,
          upgradeUrl: "/subscription?plan=startup",
        },
        { status: 429 }
      );
    }

    const trustedProfile = buildTrustedProfile(savedValuation.inputs_snapshot, profile, {
      startupId: savedValuation.startup_id,
      userId: user.id,
    });
    const trustedValuation: ValuationResult = {
      ...valuationData,
      id: savedValuation.id,
      startupId: savedValuation.startup_id,
      userId: user.id,
    };

    console.log(
      `[Report] Generating reports for ${trustedProfile.companyName}...`
    );

    // Generate both reports in parallel
    const [fullReport, onePagerMarkdown] = await Promise.all([
      generateFullReport(trustedProfile, trustedValuation),
      generateOnePagerSummary(trustedProfile, trustedValuation),
    ]);

    const report: ValuationReport = {
      id: `report_${Date.now()}`,
      valuationId: trustedValuation.id,
      startupId: trustedValuation.startupId,
      userId: user.id,
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

function buildTrustedProfile(
  snapshot: unknown,
  fallback: StartupProfile,
  identity: { startupId: string; userId: string }
): StartupProfile {
  const snapshotRecord = asRecord(snapshot);
  const candidate = Object.keys(snapshotRecord).length ? snapshotRecord : asRecord(fallback);

  return {
    ...(candidate as Partial<StartupProfile>),
    id: identity.startupId,
    userId: identity.userId,
    companyName: stringValue(candidate.companyName) || fallback.companyName,
    stage: normalizeStage(candidate.stage || fallback.stage),
    industry: normalizeIndustry(candidate.industry || fallback.industry),
    team: Array.isArray(candidate.team) ? candidate.team as StartupProfile["team"] : fallback.team || [],
    createdAt: stringValue(candidate.createdAt) || fallback.createdAt || new Date().toISOString(),
    updatedAt: stringValue(candidate.updatedAt) || fallback.updatedAt || new Date().toISOString(),
  };
}

function normalizeStage(value: unknown): StartupProfile["stage"] {
  return value === "pre-revenue" || value === "seed" || value === "series-a" || value === "series-b+"
    ? value
    : "seed";
}

function normalizeIndustry(value: unknown): StartupProfile["industry"] {
  return value === "saas" || value === "ai" || value === "fintech" || value === "deeptech" || value === "other"
    ? value
    : "other";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
