/**
 * PDF Generation Endpoint
 * GET ?valuationId=xxx — returns PDF binary for direct download
 */

import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { ReportData } from '@/lib/pdf/report-template';
import { buildReportDocument } from '@/lib/pdf/react-pdf-report';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const valuationId = searchParams.get('valuationId');

  if (!valuationId) {
    return NextResponse.json({ error: 'Missing valuationId' }, { status: 400 });
  }

  try {
    const supabase = await createClient();

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
      .single();

    if (error || !valuation) {
      logger.error('Valuation not found for PDF', { valuationId, error });
      return NextResponse.json({ error: 'Valuation not found' }, { status: 404 });
    }

    const startup = valuation.startups as any;
    const rd = valuation.report_data as any;

    const reportData: ReportData = {
      companyName: startup?.company_name || rd?.startupProfile?.companyName || 'Unknown',
      stage: startup?.stage || rd?.startupProfile?.stage || 'seed',
      industry: startup?.industry || rd?.startupProfile?.industry,
      website: startup?.website_url || rd?.startupProfile?.websiteUrl,
      description: startup?.description || rd?.startupProfile?.description,
      blendedLow: valuation.blended_low_range || 0,
      blendedHigh: valuation.blended_high_range || 0,
      blendedAverage: valuation.blended_weighted_average || 0,
      confidenceLevel: valuation.confidence_level || 'medium',
      dataCompleteness: valuation.data_completeness || 70,
      methods: (valuation.methods_results || rd?.methodBreakdown || []).filter((m: any) => m?.methodName),
      keyReasons: valuation.key_reasons || rd?.executiveSummary?.keyReasons || [],
      executiveSummary: rd?.executiveSummary,
      sensitivityAnalysis: rd?.sensitivityAnalysis,
      detailedAnalysis: rd?.detailedAnalysis,
      professionalCitation: rd?.professionalCitation,
      generatedAt: rd?.generatedAt || valuation.created_at,
      valuationId: valuation.id,
    };

    const doc = buildReportDocument(reportData);
    const buffer = await renderToBuffer(doc);

    const filename = `${reportData.companyName.replace(/[^a-z0-9]/gi, '-')}-valuation.pdf`;

    logger.info('PDF generated', { valuationId, company: reportData.companyName });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    logger.error('PDF generation error', err);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
