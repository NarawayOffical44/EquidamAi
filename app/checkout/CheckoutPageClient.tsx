'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrice, getPricing, Currency } from '@/lib/utils/currency';
import { trackCheckoutRequest } from '@/lib/analytics/ga4';
import { getLeadAttribution } from '@/lib/leads/client-attribution';

const PENDING_CHECKOUT_KEY = 'evaldam_pending_checkout';
const PENDING_CHECKOUT_TTL_MS = 30 * 60 * 1000;

type BillingCycle = 'monthly' | 'annual';
type CheckoutAttribution = ReturnType<typeof getLeadAttribution>;
type RazorpayCheckoutResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
type RazorpayInstance = {
  open: () => void;
  on: (event: 'payment.failed', callback: (response: any) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

function normalizeCheckoutPlan(plan: string | null) {
  if (plan === 'advisor' || plan === 'plus' || plan === 'agency') return 'agency';
  return 'startup';
}

function normalizeBillingCycle(billingCycle: string | null) {
  return billingCycle === 'monthly' ? 'monthly' : 'annual';
}

function buildCheckoutPath(plan: string, billingCycle: string, currency: string) {
  const params = new URLSearchParams({ plan, billingCycle, currency });
  return `/checkout?${params.toString()}`;
}

function buildSignupCheckoutHref(checkoutPath: string, plan: string, billingCycle: string, currency: string, email: string) {
  const params = new URLSearchParams({
    next: checkoutPath,
    plan,
    billingCycle,
    currency,
  });
  if (email.trim()) params.set('email', email.trim().toLowerCase());
  return `/signup?${params.toString()}`;
}

function loadRazorpayScript() {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise<boolean>((resolve) => {
    const existingScript = document.getElementById('razorpay-checkout-script') as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true), { once: true });
      existingScript.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

async function startStripeCheckout(params: {
  plan: string;
  billingCycle: BillingCycle;
  currency: Currency;
  attribution: CheckoutAttribution;
}) {
  const stripeResponse = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan: params.plan,
      billingCycle: params.billingCycle,
      currency: params.currency,
      attribution: params.attribution,
    }),
  });

  const stripeData = await stripeResponse.json();
  if (!stripeResponse.ok || !stripeData.url) {
    throw new Error(stripeData.error || 'Payment checkout failed');
  }

  window.location.href = stripeData.url;
}

async function maybeStartRazorpayCheckout(params: {
  plan: string;
  billingCycle: BillingCycle;
  currency: Currency;
  attribution: CheckoutAttribution;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
}) {
  const orderResponse = await fetch('/api/razorpay/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan: params.plan,
      billingCycle: params.billingCycle,
      currency: params.currency,
      attribution: params.attribution,
    }),
  });

  const orderData = await orderResponse.json();
  if (!orderResponse.ok) {
    if (orderData.code === 'RAZORPAY_NOT_CONFIGURED') return false;
    throw new Error(orderData.error || 'Payment checkout failed');
  }

  const loaded = await loadRazorpayScript();
  const RazorpayCheckout = window.Razorpay;
  if (!loaded || !RazorpayCheckout) {
    throw new Error('Payment checkout could not load. Please try again.');
  }

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    let paymentCallbackReceived = false;
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    const razorpay = new RazorpayCheckout({
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: orderData.name || 'Evaldam AI',
      description: orderData.description || 'Evaldam AI subscription',
      order_id: orderData.orderId,
      prefill: {
        name: params.prefill.name || '',
        email: params.prefill.email || orderData.prefill?.email || '',
        contact: params.prefill.contact || '',
      },
      notes: {
        plan: params.plan,
        billingCycle: params.billingCycle,
      },
      theme: {
        color: '#007a7a',
      },
      modal: {
        ondismiss: () => {
          if (!paymentCallbackReceived) fail(new Error('Payment cancelled'));
        },
      },
      handler: async (response: RazorpayCheckoutResponse) => {
        paymentCallbackReceived = true;
        try {
          const verifyResponse = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          });
          const verifyData = await verifyResponse.json();
          if (!verifyResponse.ok || !verifyData.success) {
            throw new Error(verifyData.error || 'Payment verification failed');
          }

          settled = true;
          window.location.href = verifyData.redirectUrl || '/success?provider=razorpay';
          resolve();
        } catch (error) {
          fail(error instanceof Error ? error : new Error('Payment verification failed'));
        }
      },
    });

    razorpay.on('payment.failed', (response: any) => {
      fail(new Error(response?.error?.description || response?.error?.reason || 'Payment failed'));
    });

    razorpay.open();
  });

  return true;
}

async function startAuthenticatedCheckout(params: {
  plan: string;
  billingCycle: BillingCycle;
  currency: Currency;
  attribution: CheckoutAttribution;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
}) {
  const razorpayStarted = await maybeStartRazorpayCheckout(params);
  if (!razorpayStarted) {
    await startStripeCheckout(params);
  }
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const plan = searchParams.get('plan') || 'startup';
  const billingCycle = normalizeBillingCycle(searchParams.get('billingCycle'));
  const currency = (searchParams.get('currency') || 'USD') as Currency;

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    useCase: '',
  });

  const pricing = getPricing(currency);
  const normalizedPlan = normalizeCheckoutPlan(plan);
  const planDetails: Record<string, any> = {
    startup: {
      name: 'Startup Plan',
      priceAnnual: pricing.pro_annual,
      priceMonthly: pricing.pro_price,
      startups: 1,
    },
    agency: {
      name: 'Agency / Investor Plan',
      priceAnnual: pricing.plus_annual,
      priceMonthly: pricing.plus_price,
      startups: 10,
    },
    founder: {
      name: 'Startup Plan',
      priceAnnual: pricing.pro_annual,
      priceMonthly: pricing.pro_price,
      startups: 1,
    },
    advisor: {
      name: 'Agency / Investor Plan',
      priceAnnual: pricing.plus_annual,
      priceMonthly: pricing.plus_price,
      startups: 10,
    },
    pro: {
      name: 'Startup Plan',
      priceAnnual: pricing.pro_annual,
      priceMonthly: pricing.pro_price,
      startups: 1,
    },
    plus: {
      name: 'Agency / Investor Plan',
      priceAnnual: pricing.plus_annual,
      priceMonthly: pricing.plus_price,
      startups: 10,
    },
  };

  const details = planDetails[plan] || planDetails.startup;
  const displayPrice =
    billingCycle === 'annual'
      ? formatPrice(details.priceAnnual, currency)
      : formatPrice(details.priceMonthly, currency);

  useEffect(() => {
    let cancelled = false;

    const resumePendingCheckout = async () => {
      try {
        const pendingRaw = window.localStorage.getItem(PENDING_CHECKOUT_KEY);
        if (!pendingRaw) return;

        const pending = JSON.parse(pendingRaw) as {
          plan?: string;
          billingCycle?: string;
          currency?: string;
          email?: string;
          createdAt?: number;
        };
        const createdAt = typeof pending.createdAt === 'number' ? pending.createdAt : 0;
        if (!createdAt || Date.now() - createdAt > PENDING_CHECKOUT_TTL_MS) {
          window.localStorage.removeItem(PENDING_CHECKOUT_KEY);
          return;
        }

        const pendingPlan = normalizeCheckoutPlan(pending.plan || null);
        const pendingBillingCycle = normalizeBillingCycle(pending.billingCycle || null);
        const pendingCurrency = pending.currency || 'USD';
        if (
          pendingPlan !== normalizedPlan ||
          pendingBillingCycle !== billingCycle ||
          pendingCurrency !== currency
        ) {
          return;
        }

        const supabaseClient = createClient();
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user || cancelled) return;

        setLoading(true);
        setError(null);

        await startAuthenticatedCheckout({
          plan: normalizedPlan,
          billingCycle,
          currency,
          attribution: getLeadAttribution(),
          prefill: {
            email: pending.email,
          },
        });

        window.localStorage.removeItem(PENDING_CHECKOUT_KEY);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Checkout failed');
          setLoading(false);
        }
      }
    };

    void resumePendingCheckout();

    return () => {
      cancelled = true;
    };
  }, [billingCycle, currency, normalizedPlan]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (
        !formData.fullName.trim() ||
        !formData.email.trim() ||
        !formData.phone.trim() ||
        !formData.companyName.trim() ||
        !formData.useCase.trim()
      ) {
        throw new Error('Please fill in all required fields');
      }

      const attribution = getLeadAttribution();

      // Save lead to database before payment redirect so high-intent buyers are captured.
      const response = await fetch('/api/leads/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          companyName: formData.companyName,
          useCase: formData.useCase,
          plan: normalizedPlan,
          billingCycle,
          currency,
          attribution,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process checkout');
      }

      trackCheckoutRequest({
        plan: normalizedPlan,
        billingCycle,
        currency,
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const checkoutPath = buildCheckoutPath(normalizedPlan, billingCycle, currency);
        window.localStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify({
          plan: normalizedPlan,
          billingCycle,
          currency,
          email: formData.email,
          createdAt: Date.now(),
        }));
        router.push(buildSignupCheckoutHref(checkoutPath, normalizedPlan, billingCycle, currency, formData.email));
        return;
      }

      await startAuthenticatedCheckout({
        plan: normalizedPlan,
        billingCycle,
        currency,
        attribution,
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 rounded-full p-4">
                <Check className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank You!</h1>
            <p className="text-lg text-gray-600 mb-8">
              Your {details.name} subscription request has been received.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-left">
              <p className="font-semibold text-gray-900 mb-4">What happens next:</p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">1.</span>
                  <span>We've saved your details: <strong>{formData.fullName}</strong> at <strong>{formData.email}</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">2.</span>
                  <span>You will continue to secure payment for the selected plan</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">3.</span>
                  <span>Your account access is handled automatically after payment confirmation</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">4.</span>
                  <span>You can start creating valuations after the subscription is active</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <p className="text-sm text-gray-700">
                <strong>Plan Details:</strong> {details.name} ({billingCycle === 'annual' ? 'Annual' : 'Monthly'}) - {displayPrice}
                {billingCycle === 'annual' ? '/year' : '/month'} • {details.startups} startup profiles
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => router.push('/pricing')}
                className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:border-gray-400 transition"
              >
                Back to Pricing
              </button>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Questions? Email us at <strong>support@equidamai.com</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Details</h1>
          <p className="text-gray-600">Finish your subscription request in 2 minutes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 h-fit">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Your Order</h2>

            <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
              <div className="flex justify-between">
                <div>
                  <p className="text-gray-900 font-medium">{details.name}</p>
                  <p className="text-sm text-gray-500">{details.startups} startup profiles</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-900 font-bold">{displayPrice}</p>
                  <p className="text-sm text-gray-500">
                    {billingCycle === 'annual' ? 'per year' : 'per month'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-sm font-semibold text-gray-900">Includes:</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ {details.startups} startup profiles</li>
                <li>✓ 6 core valuation methods + supporting score</li>
                <li>✓ Professional PDF reports</li>
                <li>✓ Evaldam Startup AI included</li>
                <li>✓ Assumptions and evidence trail</li>
                <li>✓ AI assumptions chat</li>
                <li>✓ Scenario and sensitivity analysis</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> You will continue to secure payment after this step
              </p>
            </div>
          </div>

          {/* Checkout Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="checkout-full-name" className="block text-sm font-semibold text-gray-900 mb-2">
                Full Name *
              </label>
              <input
                id="checkout-full-name"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="John Doe"
                autoComplete="name"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="checkout-email" className="block text-sm font-semibold text-gray-900 mb-2">
                Email *
              </label>
              <input
                id="checkout-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@company.com"
                autoComplete="email"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="checkout-phone" className="block text-sm font-semibold text-gray-900 mb-2">
                Phone Number *
              </label>
              <input
                id="checkout-phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+91 9876543210"
                autoComplete="tel"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="checkout-company-name" className="block text-sm font-semibold text-gray-900 mb-2">
                Company Name *
              </label>
              <input
                id="checkout-company-name"
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="Your Startup Inc."
                autoComplete="organization"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="checkout-use-case" className="block text-sm font-semibold text-gray-900 mb-2">
                What will you use Evaldam for? *
              </label>
              <textarea
                id="checkout-use-case"
                name="useCase"
                value={formData.useCase}
                onChange={handleInputChange}
                placeholder="e.g., Fundraising, Investor comparables, Board presentations..."
                rows={3}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Complete Checkout
                  <span>→</span>
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center">
              * Required fields. Your details are saved before payment so we can follow up if checkout is interrupted.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutContent />
    </Suspense>
  );
}
