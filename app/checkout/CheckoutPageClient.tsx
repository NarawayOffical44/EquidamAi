'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrice, getPricing, Currency } from '@/lib/utils/currency';
import { trackCheckoutRequest } from '@/lib/analytics/ga4';
import { getLeadAttribution } from '@/lib/leads/client-attribution';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const plan = searchParams.get('plan') || 'founder';
  const billingCycle = searchParams.get('billingCycle') || 'annual';
  const currency = (searchParams.get('currency') || 'USD') as Currency;

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    useCase: '',
  });

  const pricing = getPricing(currency);
  const planDetails: Record<string, any> = {
    founder: {
      name: 'Founder Plan',
      priceAnnual: pricing.pro_annual,
      priceMonthly: pricing.pro_price,
      startups: 3,
    },
    advisor: {
      name: 'Advisor Plan',
      priceAnnual: pricing.plus_annual,
      priceMonthly: pricing.plus_price,
      startups: 15,
    },
    pro: {
      name: 'Founder Plan',
      priceAnnual: pricing.pro_annual,
      priceMonthly: pricing.pro_price,
      startups: 3,
    },
    plus: {
      name: 'Advisor Plan',
      priceAnnual: pricing.plus_annual,
      priceMonthly: pricing.plus_price,
      startups: 15,
    },
  };

  const details = planDetails[plan] || planDetails.founder;
  const normalizedPlan = plan === 'advisor' ? 'plus' : plan === 'founder' ? 'pro' : plan;
  const displayPrice =
    billingCycle === 'annual'
      ? formatPrice(details.priceAnnual, currency)
      : formatPrice(details.priceMonthly, currency);

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
        window.localStorage.setItem('evaldam_pending_checkout', JSON.stringify({
          plan: normalizedPlan,
          billingCycle,
          currency,
          email: formData.email,
        }));
        router.push(`/signup?plan=${normalizedPlan}&billingCycle=${billingCycle}&currency=${currency}`);
        return;
      }

      const stripeResponse = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: normalizedPlan,
          billingCycle,
          currency,
          attribution,
        }),
      });

      const stripeData = await stripeResponse.json();
      if (!stripeResponse.ok || !stripeData.url) {
        throw new Error(stripeData.error || 'Payment checkout failed');
      }

      window.location.href = stripeData.url;
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
                Questions? Email us at <strong>support@evaldam.com</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
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
                <li>✓ All 6 valuation methods</li>
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
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="John Doe"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@company.com"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+91 9876543210"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="Your Startup Inc."
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                What will you use Evaldam for? *
              </label>
              <textarea
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
      </div>
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
