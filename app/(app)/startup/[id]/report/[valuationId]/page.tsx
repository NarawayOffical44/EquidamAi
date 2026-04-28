export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import ReportPage from './ReportPageClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; valuationId: string }>;
}): Promise<Metadata> {
  const { id, valuationId } = await params;

  return {
    title: 'Startup Valuation Report | Evaldam AI',
    description: 'Professional AI-powered startup valuation report with 6 valuation methods, sensitivity analysis, and investor-ready insights.',
    openGraph: {
      title: 'Startup Valuation Report | Evaldam AI',
      description: 'Professional AI-powered startup valuation report generated with 6 professional methods.',
      type: 'website',
      images: [
        {
          url: 'https://evaldam.ai/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Startup Valuation Report',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Startup Valuation Report',
      description: 'Professional AI-powered valuation with 6 methods, benchmarking & analysis.',
    },
  };
}

export default function Page() {
  return <ReportPage />;
}
