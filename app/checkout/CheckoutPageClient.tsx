'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, CreditCard, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Currency, formatPrice, getPricing } from '@/lib/utils/currency';
import { trackCheckoutRequest } from '@/lib/analytics/ga4';
import { getLeadAttribution } from '@/lib/leads/client-attribution';
import { writeStartupProfilePrefill } from '@/lib/startup-profile-prefill';
import { getBenchmarkPersonalization, normalizeBenchmarkCountry } from '@/lib/personalization/country-benchmarks';

const PENDING_CHECKOUT_KEY = 'evaldam_pending_checkout';
const PENDING_CHECKOUT_TTL_MS = 30 * 60 * 1000;

type BillingCycle = 'monthly' | 'annual';
type CheckoutAttribution = ReturnType<typeof getLeadAttribution>;
type PendingCheckout = {
  plan?: string;
  billingCycle?: string;
  currency?: string;
  country?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  useCase?: string;
  createdAt?: number;
};
type GuestLead = {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  useCase: string;
};
type RazorpayCheckoutResponse = {
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
type RazorpayPaymentFailure = {
  error?: {
    description?: string;
    reason?: string;
  };
};
type RazorpayInstance = {
  open: () => void;
  on: (event: 'payment.failed', callback: (response: RazorpayPaymentFailure) => void) => void;
};

const CHECKOUT_START_ERROR = 'Could not start secure payment. Please try again.';
const CHECKOUT_CONFIRMING_ERROR = 'Payment is still being confirmed. Please refresh in a moment.';
const CHECKOUT_FAILED_ERROR = 'Payment was not completed. Please try again.';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

function normalizeCheckoutPlan(plan: string | null) {
  if (plan === 'advisor' || plan === 'plus' || plan === 'agency') return 'agency';
  return 'startup';
}

function normalizeBillingCycle(billingCycle: string | null): BillingCycle {
  return billingCycle === 'monthly' ? 'monthly' : 'annual';
}

function normalizeCheckoutCurrency(currency: string | null): Currency {
  const normalized = String(currency || '').trim().toUpperCase();
  if (normalized === 'INR' || normalized === 'EUR') return normalized;
  return 'USD';
}

function inferCountryFromCurrency(currency: Currency) {
  if (currency === 'INR') return 'IN';
  if (currency === 'EUR') return 'EU';
  return '';
}

function normalizeCheckoutCountry(country: string | null, currency: Currency) {
  const normalized = normalizeBenchmarkCountry(country || inferCountryFromCurrency(currency));
  return normalized === 'GLOBAL' ? '' : normalized;
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

function checkoutErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (!message) return 'Could not complete checkout. Please try again.';

  if (/configured|environment|schema|metadata|signature|razorpay|stripe|supabase|database/i.test(message)) {
    return 'Could not complete checkout. Refresh this page and try again. If payment was deducted, your plan will keep activating automatically.';
  }

  return message;
}

function normalizeRazorpayContact(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return '';

  const normalized = trimmed
    .replace(/[()\-\s]/g, '')
    .replace(/(?!^\+)\D/g, '');

  return /^\+?\d{8,15}$/.test(normalized) ? normalized : '';
}

async function maybeStartRazorpayCheckout(params: {
  plan: string;
  billingCycle: BillingCycle;
  currency: Currency;
  country?: string;
  attribution: CheckoutAttribution;
  lead?: GuestLead;
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
      country: params.country,
      attribution: params.attribution,
      lead: params.lead,
    }),
  });

  const orderData = await orderResponse.json().catch(() => ({}));
  if (!orderResponse.ok) {
    if (orderData.code === 'PAYMENT_UNAVAILABLE') return false;
    throw new Error(orderData.error || CHECKOUT_START_ERROR);
  }

  if (orderData.checkoutMode === 'subscription_update' && orderData.redirectUrl) {
    window.location.href = orderData.redirectUrl;
    return true;
  }

  const loaded = await loadRazorpayScript();
  const RazorpayCheckout = window.Razorpay;
  if (!loaded || !RazorpayCheckout) {
    throw new Error(CHECKOUT_START_ERROR);
  }

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    let paymentCallbackReceived = false;
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    const paymentReference = orderData.checkoutMode === 'subscription'
      ? { subscription_id: orderData.subscriptionId }
      : { order_id: orderData.orderId };

    const amountFields = orderData.checkoutMode === 'subscription'
      ? {}
      : {
          amount: orderData.amount,
          currency: orderData.currency,
        };

    const razorpay = new RazorpayCheckout({
      key: orderData.keyId,
      name: orderData.name || 'Evaldam AI',
      description: orderData.description || 'Evaldam AI plan access',
      ...amountFields,
      ...paymentReference,
      prefill: {
        name: params.prefill.name || orderData.prefill?.name || '',
        email: params.prefill.email || orderData.prefill?.email || '',
        contact: normalizeRazorpayContact(params.prefill.contact) || normalizeRazorpayContact(orderData.prefill?.contact) || '',
      },
      theme: {
        color: '#007a7a',
      },
      modal: {
        ondismiss: () => {
          if (!paymentCallbackReceived) fail(new Error(CHECKOUT_FAILED_ERROR));
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
          const verifyData = await verifyResponse.json().catch(() => ({}));
          if (!verifyResponse.ok || !verifyData.success) {
            throw new Error(verifyData.error || CHECKOUT_CONFIRMING_ERROR);
          }

          settled = true;
          window.location.href = verifyData.redirectUrl || '/success?provider=razorpay';
          resolve();
        } catch (error) {
          fail(error instanceof Error ? error : new Error(CHECKOUT_CONFIRMING_ERROR));
        }
      },
    });

    razorpay.on('payment.failed', (response) => {
      void response;
      fail(new Error(CHECKOUT_FAILED_ERROR));
    });

    razorpay.open();
  });

  return true;
}

async function startCheckout(params: {
  plan: string;
  billingCycle: BillingCycle;
  currency: Currency;
  country?: string;
  attribution: CheckoutAttribution;
  lead?: GuestLead;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
}) {
  const razorpayStarted = await maybeStartRazorpayCheckout(params);
  if (!razorpayStarted) {
    throw new Error('Secure payment is temporarily unavailable. Please try again shortly.');
  }
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticatedEmail, setAuthenticatedEmail] = useState<string | null>(null);
  const [authenticatedName, setAuthenticatedName] = useState<string | null>(null);
  const supabase = createClient();

  const plan = searchParams.get('plan') || 'startup';
  const billingCycle = normalizeBillingCycle(searchParams.get('billingCycle'));
  const currency = normalizeCheckoutCurrency(searchParams.get('currency'));
  const country = normalizeCheckoutCountry(searchParams.get('country'), currency);
  const pricing = getPricing(currency);
  const benchmarkContext = getBenchmarkPersonalization(country);
  const normalizedPlan = normalizeCheckoutPlan(plan);
  const isAgency = normalizedPlan === 'agency';
  const details = {
    name: isAgency ? 'Agency / Investor Plan' : 'Startup Plan',
    price: isAgency
      ? billingCycle === 'annual'
        ? pricing.plus_annual
        : pricing.plus_price
      : billingCycle === 'annual'
        ? pricing.pro_annual
        : pricing.pro_price,
    startups: isAgency ? 10 : 1,
    seats: isAgency ? '5 team seats' : 'Solo workspace',
  };
  const displayPrice = formatPrice(details.price, currency);
  const periodLabel = billingCycle === 'annual' ? 'year' : 'month';
  const isRecurringCheckout = billingCycle === 'monthly' || normalizedPlan === 'agency';
  const checkoutTypeLabel = isRecurringCheckout ? 'Auto-renewing subscription' : 'One-time annual access';
  const checkoutTypeDescription = isRecurringCheckout
    ? 'This plan renews automatically until cancelled from Settings.'
    : 'This Startup annual checkout is a one-time purchase for one year of access.';

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    useCase: '',
  });

  useEffect(() => {
    let cancelled = false;

    const loadCheckoutState = async () => {
      try {
        const pendingRaw = window.localStorage.getItem(PENDING_CHECKOUT_KEY);
        if (pendingRaw) {
          const pending = JSON.parse(pendingRaw) as PendingCheckout;
          const createdAt = typeof pending.createdAt === 'number' ? pending.createdAt : 0;

          if (!createdAt || Date.now() - createdAt > PENDING_CHECKOUT_TTL_MS) {
            window.localStorage.removeItem(PENDING_CHECKOUT_KEY);
          } else {
            const pendingPlan = normalizeCheckoutPlan(pending.plan || null);
            const pendingBillingCycle = normalizeBillingCycle(pending.billingCycle || null);
            const pendingCurrency = normalizeCheckoutCurrency(pending.currency || null);
            const pendingCountry = normalizeCheckoutCountry(pending.country || null, pendingCurrency);

            if (
              pendingPlan === normalizedPlan &&
              pendingBillingCycle === billingCycle &&
              pendingCurrency === currency &&
              pendingCountry === country
            ) {
              setFormData((current) => ({
                fullName: current.fullName || pending.fullName || '',
                email: current.email || pending.email || '',
                phone: current.phone || pending.phone || '',
                companyName: current.companyName || pending.companyName || '',
                useCase: current.useCase || pending.useCase || '',
              }));
            }
          }
        }

        const supabaseClient = createClient();
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();
        if (cancelled) return;

        setAuthenticatedEmail(user?.email || null);
        setAuthenticatedName(typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null);
        if (user?.email) {
          setFormData((current) => ({ ...current, email: current.email || user.email || '' }));
        }
      } catch (err) {
        if (!cancelled) setError(checkoutErrorMessage(err));
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    };

    void loadCheckoutState();

    return () => {
      cancelled = true;
    };
  }, [billingCycle, country, currency, normalizedPlan]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const attribution = getLeadAttribution();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      trackCheckoutRequest({
        plan: normalizedPlan,
        billingCycle,
        currency,
        country,
      });

      if (user) {
        await startCheckout({
          plan: normalizedPlan,
          billingCycle,
          currency,
          country,
          attribution,
          prefill: {
            name: formData.fullName || authenticatedName || '',
            email: user.email || authenticatedEmail || formData.email,
            contact: formData.phone,
          },
        });
        window.localStorage.removeItem(PENDING_CHECKOUT_KEY);
        return;
      }

      if (
        !formData.fullName.trim() ||
        !formData.email.trim() ||
        !formData.phone.trim() ||
        !formData.companyName.trim() ||
        !formData.useCase.trim()
      ) {
        throw new Error('Please fill in all required fields');
      }

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
          country,
          attribution,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Could not save checkout details. Please try again.');
      }

      window.localStorage.setItem(
        PENDING_CHECKOUT_KEY,
        JSON.stringify({
          plan: normalizedPlan,
          billingCycle,
          currency,
          country,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          companyName: formData.companyName,
          useCase: formData.useCase,
          createdAt: new Date().getTime(),
        })
      );
      writeStartupProfilePrefill({
        companyName: formData.companyName,
        source: 'checkout',
      });

      await startCheckout({
        plan: normalizedPlan,
        billingCycle,
        currency,
        country,
        attribution,
        lead: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          companyName: formData.companyName,
          useCase: formData.useCase,
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
      });
    } catch (err) {
      setError(checkoutErrorMessage(err));
      setLoading(false);
    }
  };

  const includedItems = [
    `${details.startups} startup ${details.startups === 1 ? 'profile' : 'profiles'}`,
    details.seats,
    '6 valuation methods',
    'Investor-ready PDF reports',
    'Startup AI and evidence trail',
  ];

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-[1fr_420px] lg:px-8 lg:py-12">
        <section className="p-0 sm:p-2">
          <div className="mb-8 border-b border-gray-100 pb-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Secure checkout</p>
              <h1 className="mt-2 text-3xl font-black leading-tight text-gray-950">Complete your Evaldam plan</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                Confirm your details, then pay securely through Razorpay. Your plan is activated after payment confirmation.
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                Benchmark context: {benchmarkContext.countryLabel}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {authChecked && authenticatedEmail ? (
              <div className="border-b border-gray-200 pb-4">
                <p className="text-sm font-bold text-gray-950">Signed in as {authenticatedEmail}</p>
                <p className="mt-1 text-xs leading-5 text-gray-600">Payment will activate this workspace.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Full name" id="checkout-full-name">
                  <input
                    id="checkout-full-name"
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Your name"
                    autoComplete="name"
                    required
                    className="input h-11"
                  />
                </Field>

                <Field label="Email" id="checkout-email">
                  <input
                    id="checkout-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="you@company.com"
                    autoComplete="email"
                    required
                    className="input h-11"
                  />
                </Field>

                <Field label="Phone number" id="checkout-phone">
                  <input
                    id="checkout-phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 9876543210"
                    autoComplete="tel"
                    required
                    className="input h-11"
                  />
                </Field>

                <Field label="Company name" id="checkout-company-name">
                  <input
                    id="checkout-company-name"
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Company name"
                    autoComplete="organization"
                    required
                    className="input h-11"
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Use case" id="checkout-use-case">
                    <textarea
                      id="checkout-use-case"
                      name="useCase"
                      value={formData.useCase}
                      onChange={handleInputChange}
                      placeholder="Fundraising, investor comparables, board reporting..."
                      rows={4}
                      required
                      className="input min-h-24 resize-none py-3"
                    />
                  </Field>
                </div>
              </div>
            )}

            {error ? (
              <div className="border-l-2 border-red-500 pl-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : null}

            <button type="submit" disabled={loading || !authChecked} className="btn btn-primary h-12 w-full gap-2 text-sm">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Opening secure payment...
                </>
              ) : (
                <>
                  Pay {displayPrice} securely
                  <CreditCard className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>

            <p className="text-center text-xs leading-5 text-gray-500">
              You will be redirected to Razorpay. After a successful payment, we verify the transaction and activate the plan.
            </p>
          </form>
        </section>

        <aside className="h-fit border-l border-gray-200 bg-white p-6 lg:sticky lg:top-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-500">Order summary</p>
              <h2 className="mt-2 text-xl font-black text-gray-950">{details.name}</h2>
            </div>
            <span className="text-xs font-black uppercase text-primary">
              {billingCycle}
            </span>
          </div>

          <div className="border-y border-gray-200 py-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-500">Total due today</p>
                <p className="mt-1 text-4xl font-black text-gray-950">{displayPrice}</p>
              </div>
              <p className="pb-1 text-sm font-semibold text-gray-500">per {periodLabel}</p>
            </div>
          </div>

          <div className="mt-4 border-b border-gray-200 pb-4">
            <p className="text-sm font-bold text-gray-950">{checkoutTypeLabel}</p>
            <p className="mt-1 text-xs leading-5 text-gray-500">{checkoutTypeDescription}</p>
            <p className="mt-2 text-xs font-semibold text-gray-500">
              {benchmarkContext.headlineContext}
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {includedItems.map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                <span className="flex h-5 w-5 items-center justify-center text-emerald-700">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                {item}
              </div>
            ))}
          </div>

        </aside>
      </main>
    </div>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      {children}
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
