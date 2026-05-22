/**
 * PDF Generation Endpoint
 * GET ?valuationId=xxx — returns PDF binary for direct download
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import {
  buildReportDataFromValuation,
  renderValuationReportPdf,
  sanitizePdfFilename,
} from '@/lib/pdf/pdf-service';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getAuthenticatedUser,
  getValuationWorkspaceAccess,
  paidWorkspaceRequiredResponse,
  unauthorizedResponse,
} from '@/lib/team/access';
import {
  getAiLimitMessage,
  getAiUsageAccess,
  recordAiUsageUseIfAvailable,
} from '@/lib/india-finance-ai/usage-limits';
import { getPlanLimits, normalizePlanKey, UNLIMITED_LIMIT } from '@/lib/plans/plan-limits';

export const runtime = 'nodejs';

class PdfRenderTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`PDF generation timed out after ${Math.round(timeoutMs / 1000)} seconds`);
    this.name = 'PdfRenderTimeoutError';
  }
}

function getPdfRenderTimeoutMs() {
  const configured = Number(process.env.PDF_RENDER_TIMEOUT_MS || 45000);
  return Number.isFinite(configured) && configured >= 5000 ? configured : 45000;
}

function withPdfTimeout<T>(work: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new PdfRenderTimeoutError(timeoutMs)), timeoutMs);
  });

  return Promise.race([work, timeoutPromise]).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const valuationId = searchParams.get('valuationId');

  if (!valuationId) {
    return NextResponse.json({ error: 'Missing valuationId' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return unauthorizedResponse();
    const adminClient = createAdminClient();
    const valuationAccess = await getValuationWorkspaceAccess(adminClient, user.id, valuationId);
    if (!valuationAccess) return paidWorkspaceRequiredResponse();

    const { data: valuation, error } = await adminClient
      .from('valuations')
      .select(`
        *,
        startups (
          company_name, stage, industry,
          website_url, description
        )
      `)
      .eq('id', valuationId)
      .single();

    if (error || !valuation) {
      logger.error('Valuation not found for PDF', { valuationId, error });
      return NextResponse.json({ error: 'Valuation not found' }, { status: 404 });
    }

    const planKey = normalizePlanKey(valuationAccess.access.plan, valuationAccess.access.planActive);
    const planLimits = getPlanLimits(planKey, true);

    if (planLimits.reportsPerMonth < UNLIMITED_LIMIT) {
      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'authenticated';
      const usageAccess = await getAiUsageAccess({
        supabase,
        sessionToken: `report:${valuationAccess.access.workspaceId}`,
        ip,
        feature: 'report_download',
        planOverride: planKey,
        usageKeyOverride: `workspace:${valuationAccess.access.workspaceId}`,
        userIdOverride: valuationAccess.access.workspaceId,
      });
      const reservation = await recordAiUsageUseIfAvailable(usageAccess.key, usageAccess.usage);

      if (!reservation.allowed) {
        return NextResponse.json(
          {
            error: getAiLimitMessage(reservation.usage),
            usage: reservation.usage,
            upgradeUrl: '/pricing?plan=startup',
          },
          { status: 429 }
        );
      }
    }

    const reportData = buildReportDataFromValuation(valuation, planKey);
    const buffer = await withPdfTimeout(
      renderValuationReportPdf(reportData),
      getPdfRenderTimeoutMs()
    );

    const filename = sanitizePdfFilename(reportData.companyName);

    logger.info('PDF generated', { valuationId, company: reportData.companyName, bytes: buffer.length });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    logger.error('PDF generation error', err);
    if (err instanceof PdfRenderTimeoutError) {
      return NextResponse.json({ error: err.message }, { status: 504 });
    }
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
