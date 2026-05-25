export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import ReportPage from './ReportPageClient';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser, getValuationWorkspaceAccess } from '@/lib/team/access';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Startup Valuation Report',
    description: 'Startup valuation report with 6 professional methods, sensitivity analysis, assumptions trail, and investor-ready insights.',
    openGraph: {
      title: 'Startup Valuation Report | Evaldam AI',
      description: 'Startup valuation report with 6 professional methods — benchmarked, assumption-backed, and investor-ready.',
      type: 'website',
      images: [
        {
          url: 'https://equidamai.com/opengraph-image',
          width: 1200,
          height: 630,
          alt: 'Evaldam AI valuation report',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
    title: 'Startup Valuation Report',
    description: 'Startup valuation with 6 methods, benchmarking, and sensitivity analysis — ready for investor conversations.',
    images: ['https://equidamai.com/opengraph-image'],
  },
};
}

type ReportPageProps = {
  params: Promise<{ id: string; valuationId: string }>;
};

export default async function Page({ params }: ReportPageProps) {
  const { id, valuationId } = await params;
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) redirect('/login');

  const access = await getValuationWorkspaceAccess(createAdminClient(), user.id, valuationId);
  if (!access) redirect('/pricing?plan=startup&reason=report');
  if (access.valuation.startup_id !== id) redirect(`/startup/${access.valuation.startup_id}/report/${valuationId}`);

  return <ReportPage />;
}
