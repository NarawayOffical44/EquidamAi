'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ReportRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const startupId = params.id as string;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const redirectToLatest = async () => {
      const supabase = createClient();
      try {
        const { data: valuations } = await supabase
          .from('valuations')
          .select('id')
          .eq('startup_id', startupId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (valuations && valuations.length > 0) {
          router.push(`/startup/${startupId}/report/${valuations[0].id}`);
        } else {
          router.push(`/startup/${startupId}`);
        }
      } catch {
        router.push(`/startup/${startupId}`);
      } finally {
        setLoading(false);
      }
    };

    if (startupId) {
      redirectToLatest();
    }
  }, [startupId, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">Loading latest report...</p>
      </div>
    </div>
  );
}
