'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  const plan = searchParams.get('plan') || 'pro';
  const billingCycle = searchParams.get('billingCycle') || 'monthly';

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          router.push(`/signup?redirectTo=/checkout?plan=${plan}&billingCycle=${billingCycle}`);
          return;
        }

        setUser(authUser);
        setLoading(false);
      } catch (err) {
        setError('Failed to load user');
        setLoading(false);
      }
    };

    getUser();
  }, [supabase, plan, billingCycle, router]);

  const handleCheckout = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          plan,
          billingCycle,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Checkout failed');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-neutral-300">Setting up checkout...</p>
        </div>
      </div>
    );
  }

  const planDetails: Record<string, any> = {
    pro: {
      name: 'Pro Plan',
      monthlyPrice: 99,
      annualPrice: 1069,
      startups: 3,
    },
    plus: {
      name: 'Plus Plan',
      monthlyPrice: 199,
      annualPrice: 2159,
      startups: 15,
    },
  };

  const details = planDetails[plan] || planDetails.pro;
  const price =
    billingCycle === 'annual' ? details.annualPrice : details.monthlyPrice;
  const displayPrice = price.toFixed(2);

  return (
    <div className="min-h-screen bg-neutral-900">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Complete Your Purchase</h1>
          <p className="text-neutral-400">Review and confirm your subscription</p>
        </div>

        {/* Order Summary */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-6">Order Summary</h2>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between pb-4 border-b border-neutral-700">
              <div>
                <p className="text-white font-medium">{details.name}</p>
                <p className="text-sm text-neutral-400">
                  {details.startups} startup profiles
                </p>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">${displayPrice}</p>
                <p className="text-sm text-neutral-400">
                  {billingCycle === 'annual' ? 'per year' : 'per month'}
                </p>
              </div>
            </div>

            {billingCycle === 'annual' && (
              <div className="bg-green-900/20 border border-green-700/30 rounded p-3">
                <p className="text-sm text-green-300">
                  Saving ${(details.monthlyPrice * 1.2).toFixed(0)}/year with annual billing
                </p>
              </div>
            )}
          </div>

          <div className="bg-neutral-700/50 rounded p-4 text-sm text-neutral-300 mb-6">
            <p className="font-medium text-white mb-2">What's included:</p>
            <ul className="space-y-2">
              <li>✓ {details.startups} active startup profiles</li>
              <li>✓ Professional AI valuations (6 methods)</li>
              <li>✓ One-page VC summary PDFs</li>
              <li>✓ Full professional reports (25-35 pages)</li>
              <li>✓ Evaldam Proprietary Score</li>
              {plan === 'plus' && (
                <>
                  <li>✓ Advanced analytics dashboard</li>
                  <li>✓ Team collaboration (3 seats)</li>
                </>
              )}
            </ul>
          </div>

          <div className="text-sm text-neutral-400 mb-6">
            <p>
              Your subscription will renew automatically. You can cancel anytime in your account settings.
            </p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-700/30 rounded p-4 mb-6">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full px-6 py-3 bg-primary text-black font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Complete Purchase
                <span>→</span>
              </>
            )}
          </button>
        </div>

        {/* FAQ */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Questions?</h3>
          <div className="space-y-4 text-sm text-neutral-400">
            <div>
              <p className="font-medium text-white mb-1">Is there a free trial?</p>
              <p>We offer a 7-day free trial. No credit card required.</p>
            </div>
            <div>
              <p className="font-medium text-white mb-1">Can I upgrade later?</p>
              <p>Yes! Upgrade from Pro to Plus anytime. We'll prorate the difference.</p>
            </div>
            <div>
              <p className="font-medium text-white mb-1">What payment methods do you accept?</p>
              <p>We accept all major credit and debit cards via Stripe.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
