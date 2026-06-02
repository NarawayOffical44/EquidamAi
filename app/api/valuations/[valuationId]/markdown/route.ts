import { NextRequest, NextResponse } from "next/server";
import {
  buildReportDataFromValuation,
  renderValuationReportMarkdown,
  sanitizeMarkdownFilename,
} from "@/lib/pdf/pdf-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  getAuthenticatedUser,
  getValuationWorkspaceAccess,
  paidWorkspaceRequiredResponse,
  unauthorizedResponse,
} from "@/lib/team/access";
import { normalizePlanKey } from "@/lib/plans/plan-limits";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ valuationId: string }> }
) {
  try {
    const { valuationId } = await params;
    if (!valuationId) {
      return NextResponse.json({ error: "Missing valuation ID." }, { status: 400 });
    }

    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return unauthorizedResponse();

    const adminClient = createAdminClient();
    const valuationAccess = await getValuationWorkspaceAccess(adminClient, user.id, valuationId);
    if (!valuationAccess) return paidWorkspaceRequiredResponse();

    const { data: valuation, error } = await adminClient
      .from("valuations")
      .select(`
        *,
        startups (
          company_name, stage, industry,
          website_url, description,
          arr, mrr, total_revenue, runway_months, monthly_growth_rate,
          customer_count, total_addressable_market, total_addressable_market_usd,
          team_size, ceo_name, total_funding_raised, competitive_advantage,
          profile_data
        )
      `)
      .eq("id", valuationId)
      .single();

    if (error || !valuation) {
      logger.error("Valuation not found for Markdown export", { valuationId, error });
      return NextResponse.json({ error: "Valuation report was not found." }, { status: 404 });
    }

    const planKey = normalizePlanKey(valuationAccess.access.plan, valuationAccess.access.planActive);
    const reportData = buildReportDataFromValuation(valuation, planKey);
    const markdown = renderValuationReportMarkdown(reportData);
    const filename = sanitizeMarkdownFilename(reportData.companyName);

    logger.info("Markdown report generated", {
      valuationId,
      company: reportData.companyName,
      bytes: Buffer.byteLength(markdown, "utf8"),
    });

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    logger.error("Markdown report generation error", error);
    return NextResponse.json({ error: "Could not generate Markdown export." }, { status: 500 });
  }
}
