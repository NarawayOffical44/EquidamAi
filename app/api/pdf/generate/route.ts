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
import { requirePaidUser } from '@/lib/auth/paid-access';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const valuationId = searchParams.get('valuationId');

  if (!valuationId) {
    return NextResponse.json({ error: 'Missing valuationId' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const paidAccess = await requirePaidUser(supabase);
    if (!paidAccess.ok) return paidAccess.response;
    const { user } = paidAccess;

    const { data: valuation, error } = await supabase
      .from('valuations')
      .select(`
        *,
        startups (
          company_name, stage, industry,
          website_url, description
        )
      `)
      .eq('id', valuationId)
      .eq('user_id', user.id)
      .single();

    if (error || !valuation) {
      logger.error('Valuation not found for PDF', { valuationId, error });
      return NextResponse.json({ error: 'Valuation not found' }, { status: 404 });
    }

    // Check user's plan to determine if watermark is needed
    let userPlan = 'pro'; // default to pro

    const { data: userData } = await supabase
      .from('users')
      .select('plan')
      .eq('id', user.id)
      .single();
    userPlan = userData?.plan || 'pro';

    const reportData = buildReportDataFromValuation(valuation, userPlan);
    const buffer = await renderValuationReportPdf(reportData);

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
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
