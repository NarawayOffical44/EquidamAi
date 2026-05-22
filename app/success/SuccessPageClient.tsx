'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type CheckoutType = 'subscription' | 'api_credit_topup';

function SuccessContent({ checkoutType }: { checkoutType: CheckoutType }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const isApiCreditTopUp = checkoutType === 'api_credit_topup';

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          router.push('/login');
          return;
        }

        setLoading(false);

        // Auto-redirect to dashboard after 3 seconds
        const timer = setTimeout(() => {
          router.push('/dashboard');
        }, 3000);

        return () => clearTimeout(timer);
      } catch (error) {
        console.error('Failed to confirm payment:', error);
        setLoading(false);
      }
    };

    confirmPayment();
  }, [supabase, router]);

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        {loading ? (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-2">Processing Payment</h1>
            <p className="text-neutral-400 mb-4">
              We're confirming your payment. You'll be redirected shortly...
            </p>
          </>
        ) : (
          <>
            <div className="bg-green-900/20 border border-green-700/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
            <p className="text-neutral-400 mb-2">
              {isApiCreditTopUp ? 'Your API credit payment was confirmed.' : 'Welcome to Evaldam. Your subscription is now active.'}
            </p>
            <p className="text-neutral-500 text-sm mb-8">
              {isApiCreditTopUp
                ? "Your wallet will update as soon as Stripe's webhook finishes processing. We're redirecting you to your dashboard..."
                : "You have full access to all features. We're redirecting you to your dashboard..."}
            </p>

            <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-bold text-white mb-4">What's Next?</h3>
              <ol className="text-left space-y-3 text-neutral-300 text-sm">
                <li className="flex gap-3">
                  <span className="bg-primary text-black font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                    1
                  </span>
                  <span>Go to your dashboard</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-primary text-black font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                    2
                  </span>
                  <span>{isApiCreditTopUp ? 'Open Settings > API Usage' : 'Click "Add New Startup"'}</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-primary text-black font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                    3
                  </span>
                  <span>{isApiCreditTopUp ? 'Review wallet balance and API key status' : 'Upload pitch deck or company info'}</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-primary text-black font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                    4
                  </span>
                  <span>{isApiCreditTopUp ? 'Use prepaid credits from your server-side API calls' : 'Generate AI valuation (2-3 minutes)'}</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-primary text-black font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                    5
                  </span>
                  <span>{isApiCreditTopUp ? 'Monitor monthly usage from Settings' : 'Download professional reports'}</span>
                </li>
              </ol>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-6 py-3 bg-primary text-black font-bold rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage({ checkoutType }: { checkoutType: CheckoutType }) {
  return (
    <Suspense fallback={null}>
      <SuccessContent checkoutType={checkoutType} />
    </Suspense>
  );
}
