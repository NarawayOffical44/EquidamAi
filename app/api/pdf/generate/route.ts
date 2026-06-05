/**
 * PDF Generation Endpoint
 * GET ?valuationId=xxx - returns PDF binary for direct download
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import {
  buildReportDataFromValuation,
  renderValuationReportPdf,
  sanitizePdfFilename,
} from '@/lib/pdf/pdf-service';
import { sendReviewRequestEmail } from '@/lib/email/lifecycle-handler';
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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

async function maybeSendReviewRequestEmail(params: {
  adminClient: ReturnType<typeof createAdminClient>;
  request: NextRequest;
  user: any;
  valuation: any;
  valuationId: string;
  companyName: string;
}) {
  const email = params.user?.email;
  if (!email) return;

  const { data: account, error } = await params.adminClient
    .from('users')
    .select('email, full_name, billing_metadata')
    .eq('id', params.user.id)
    .maybeSingle();

  if (error) {
    logger.warn('Could not load account before review request email', { valuationId: params.valuationId, error });
    return;
  }

  const metadata = asRecord(account?.billing_metadata);
  const reviewRequests = asRecord(metadata.review_requests);
  const reviewKey = `pdf:${params.valuationId}`;
  if (reviewRequests[reviewKey]) return;

  const requestedAt = new Date().toISOString();
  const { error: updateError } = await params.adminClient
    .from('users')
    .update({
      billing_metadata: {
        ...metadata,
        review_requests: {
          ...reviewRequests,
          [reviewKey]: requestedAt,
        },
      },
    })
    .eq('id', params.user.id);

  if (updateError) {
    logger.warn('Could not mark review request email', { valuationId: params.valuationId, error: updateError });
    return;
  }

  const userName =
    account?.full_name ||
    params.user?.user_metadata?.full_name ||
    account?.email?.split('@')[0] ||
    email.split('@')[0] ||
    'there';
  const reportUrl = new URL(`/startup/${params.valuation.startup_id}/report/${params.valuationId}`, params.request.url).toString();

  sendReviewRequestEmail(email, userName, params.companyName, reportUrl).catch((sendError) => {
    logger.warn('Review request email failed', {
      valuationId: params.valuationId,
      error: sendError instanceof Error ? sendError.message : String(sendError),
    });
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
          website_url, description,
          arr, mrr, total_revenue, runway_months, monthly_growth_rate,
          customer_count, total_addressable_market, total_addressable_market_usd,
          team_size, ceo_name, total_funding_raised, competitive_advantage,
          profile_data
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

    const shouldTrackDownload = planLimits.reportsPerMonth < UNLIMITED_LIMIT;
    const usageAccess = shouldTrackDownload
      ? await getAiUsageAccess({
          supabase,
          sessionToken: `report:${valuationAccess.access.workspaceId}`,
          ip:
            request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            request.headers.get('x-real-ip') ||
            'authenticated',
          feature: 'report_download',
          planOverride: planKey,
          usageKeyOverride: `workspace:${valuationAccess.access.workspaceId}`,
          userIdOverride: valuationAccess.access.workspaceId,
        })
      : null;

    if (usageAccess && usageAccess.usage.used >= usageAccess.usage.limit) {
      return NextResponse.json(
        {
          error: getAiLimitMessage({ ...usageAccess.usage, remaining: 0, upgradeRequired: true }),
          usage: { ...usageAccess.usage, remaining: 0, upgradeRequired: true },
          upgradeUrl: '/pricing?plan=startup',
        },
        { status: 429 }
      );
    }

    if (usageAccess) {
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
    await maybeSendReviewRequestEmail({
      adminClient,
      request,
      user,
      valuation,
      valuationId,
      companyName: reportData.companyName,
    });

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
