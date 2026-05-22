'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Plus } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { CurrencyToggle, useCurrency } from '@/components/CurrencyToggle';
import { Currency, getPricing, getDynamicPricing, formatPrice, type PricingTier } from '@/lib/utils/currency';
import { PLAN_LIMITS, formatLimitValue } from '@/lib/plans/plan-limits';
import { API_MAX_TOP_UP_USD, API_MIN_TOP_UP_USD } from '@/lib/developer-api/pricing';

const TEAL = '#007a7a';
const TEAL_DARK = '#005f5f';

interface PricingClientProps {
  faqs: Array<{ q: string; a: string }>;
}

export function PricingClient({ faqs }: PricingClientProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [currencyPricing, setCurrencyPricing] = useState<PricingTier | null>(null);
  const [apiCreditAmount, setApiCreditAmount] = useState('5');
  const [apiCreditLoading, setApiCreditLoading] = useState(false);
  const [apiCreditError, setApiCreditError] = useState('');
  const { currency, updateCurrency, isLoaded: currencyLoaded } = useCurrency();

  // Load user plan
  useEffect(() => {
    const loadUserPlan = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('plan, plan_active')
            .eq('id', user.id)
            .single();
          setCurrentPlan(userData?.plan_active ? userData?.plan || null : 'free');
        }
      } catch (err) {
        console.error('Failed to load user plan:', err);
      }
    };
    loadUserPlan();
  }, []);

  // Load dynamic pricing based on currency
  useEffect(() => {
    const loadDynamicPricing = async () => {
      try {
        const pricing = await getDynamicPricing(currency as Currency);
        setCurrencyPricing(pricing);
      } catch (err) {
        console.error('Failed to load dynamic pricing:', err);
        // Fallback to static pricing
        setCurrencyPricing(getPricing(currency as Currency));
      }
    };

    if (currencyLoaded) {
      loadDynamicPricing();
    }
  }, [currency, currencyLoaded]);

  const buildCheckoutPath = (plan: 'startup' | 'agency') => {
    const params = new URLSearchParams({
      plan,
      billingCycle,
      currency,
    });
    return `/checkout?${params.toString()}`;
  };

  const handleSelectPlan = (plan: 'startup' | 'agency') => {
    window.location.href = buildCheckoutPath(plan);
  };

  const handleApiCreditCheckout = async () => {
    const amountUsd = Number(apiCreditAmount);
    if (!Number.isFinite(amountUsd) || amountUsd < API_MIN_TOP_UP_USD) {
      setApiCreditError(`Minimum API credit top-up is $${API_MIN_TOP_UP_USD}.`);
      return;
    }
    if (amountUsd > API_MAX_TOP_UP_USD) {
      setApiCreditError(`Maximum API credit top-up is $${API_MAX_TOP_UP_USD.toLocaleString()}.`);
      return;
    }

    setApiCreditLoading(true);
    setApiCreditError('');
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/signup?next=api-credits';
        return;
      }

      const response = await fetch('/api/developer/credits/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountUsd }),
      });
      const data = await response.json();
      if (response.status === 403) {
        window.location.href = '/onboarding';
        return;
      }
      if (!response.ok) throw new Error(data.error || 'Failed to start checkout');
      if (data.url) window.location.href = data.url;
    } catch (error) {
      setApiCreditError(error instanceof Error ? error.message : 'Failed to start checkout');
      setApiCreditLoading(false);
    }
  };

  // Use dynamic pricing if loaded, fallback to static pricing
  const displayPricing = currencyPricing || getPricing(currency as Currency);
  const isStartupPlan = currentPlan === 'pro' || currentPlan === 'startup';
  const isAgencyPlan = currentPlan === 'plus' || currentPlan === 'agency';
  const renderComparisonValue = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="ml-auto block h-4 w-4 text-primary" />
      ) : (
        <span className="text-gray-300">-</span>
      );
    }

    return <span className="font-mono text-sm font-semibold text-gray-900 tabular-nums">{value}</span>;
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <main>
      {/* -- HEADER -- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 md:pt-16 pb-8 md:pb-14 text-center">
        <div className="inline-flex items-center rounded-full border border-primary/20 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary mb-5">
          Free preview, founder reports, team plans, and API credits
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-4">
          Choose by buying moment
        </h1>
        <div className="mx-auto max-w-2xl">
          <p className="text-lg text-gray-600 mb-2">Prepare a defensible valuation range before your investor conversation.</p>
          <p className="text-lg text-gray-600 mb-10">Start with a preview or report path, then upgrade when you need edits, scenarios, history, teams, or API usage.</p>
        </div>

        {/* Currency Toggle */}
        <div className="mb-5 flex justify-center">
          {currencyLoaded && <CurrencyToggle onCurrencyChange={updateCurrency} initialCurrency={currency as Currency} />}
        </div>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-0 rounded-[4px] border border-gray-300 bg-white p-1">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className="px-5 py-2 rounded-[2px] text-sm font-semibold transition-all"
            style={billingCycle === 'monthly'
              ? { background: 'white', color: TEAL_DARK, border: '1px solid rgba(0,178,178,0.22)' }
              : { background: 'transparent', color: '#6b7280' }
            }
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className="px-5 py-2 rounded-[2px] text-sm font-semibold transition-all flex items-center gap-2"
            style={billingCycle === 'annual'
              ? { background: 'white', color: TEAL_DARK, border: '1px solid rgba(0,178,178,0.22)' }
              : { background: 'transparent', color: '#6b7280' }
            }
          >
            Annual
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-[2px] border border-primary/20 bg-white" style={{ color: TEAL_DARK }}>
              Save 10%
            </span>
          </button>
        </div>
      </div>

      {/* -- PRICING CARDS -- */}
      <div id="plans" className="max-w-7xl mx-auto px-4 sm:px-6 pb-14 md:pb-24 scroll-mt-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5 items-stretch">
          {/* Free */}
          <div className={`rounded-lg bg-white p-5 flex flex-col transition-all min-h-[520px] ${currentPlan === 'free' ? 'border-2 border-primary' : 'border border-gray-300 hover:border-gray-400'}`}>
            <div className="mb-6">
              <h3 className="text-xl font-black text-gray-900 mb-1">Free Preview</h3>
              <p className="text-sm text-gray-500">First valuation signal before a buying decision</p>
            </div>
            <div className="mb-7">
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-4xl font-bold text-gray-900 tabular-nums">{formatPrice(0, currency as Currency)}</span>
                <span className="text-gray-400 text-sm font-medium">/forever</span>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">1 startup with watermarked reports</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1 text-sm">
              {['5 valuation previews/month', '1 lifetime startup', '5-method valuation report', '3 watermarked PDF downloads/month', 'Evaldam Startup AI: 10 questions/month', 'No Evaldam AI Score', 'No team members'].map(f => (
                <li key={f} className="flex items-start gap-3"><Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} /><span className="text-gray-600">{f}</span></li>
              ))}
            </ul>
            {currentPlan === 'free' ? (
              <button disabled className="w-full py-3 text-sm font-bold rounded-lg border border-gray-300 bg-white text-gray-500 cursor-not-allowed">
                Your Current Plan
              </button>
            ) : (
              <Link href="/free-valuation" className="block w-full py-3 text-center text-sm font-bold rounded-lg transition-all border border-gray-300 bg-white hover:border-primary hover:text-primary text-gray-800">
                Start Free Preview
              </Link>
            )}
          </div>

          {/* Startup */}
          <div className={`rounded-lg bg-white p-5 flex flex-col transition-all min-h-[520px] ${isStartupPlan ? 'border-2 border-primary' : 'border border-gray-300 hover:border-gray-400'}`}>
            <div className="mb-6">
              <h3 className="text-xl font-black text-gray-900 mb-1">Startup</h3>
              <p className="text-sm text-gray-500">For founders iterating through an active raise</p>
            </div>
            <div className="mb-7">
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-3xl sm:text-4xl font-bold text-gray-900 tabular-nums">
                  {billingCycle === 'monthly' ? formatPrice(displayPricing.pro_price, currency as Currency) : formatPrice(displayPricing.pro_annual, currency as Currency)}
                </span>
                <span className="text-gray-400 text-sm font-medium">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">1 startup profile</p>
            </div>
            <ul className="space-y-2.5 mb-8 flex-1 text-sm">
              {['1 startup profile', 'Unlimited valuation previews', 'Evaldam Startup AI: 100 questions/month', 'Evaldam AI Score', 'All 6 valuation methods', 'Investor-ready PDF report', 'Readiness score before generation', 'Assumptions and evidence trail', 'Verified input checklist', 'Scenario and sensitivity analysis', 'Indian market comparables', 'Report history and versioning'].map(f => (
                <li key={f} className="flex items-start gap-3"><Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} /><span className="text-gray-600">{f}</span></li>
              ))}
            </ul>
            {isStartupPlan ? (
              <button disabled className="w-full py-3 text-sm font-bold border border-gray-300 rounded-lg bg-white text-gray-500 cursor-not-allowed">
                Your Current Plan
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSelectPlan('startup')}
                className="w-full py-3 text-sm font-bold text-gray-800 border border-gray-300 rounded-lg hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Agency (Featured) */}
          <div className="relative rounded-lg border border-gray-300 border-t-4 border-t-primary bg-white p-5 flex flex-col transition-all min-h-[520px] xl:-mt-4 xl:mb-4">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="text-[11px] font-black uppercase tracking-wide whitespace-nowrap text-white px-4 py-1.5 rounded-lg" style={{ background: isAgencyPlan ? TEAL : TEAL_DARK }}>
                {isAgencyPlan ? 'Your Plan' : 'Most Popular'}
              </span>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-black mb-1 text-gray-900">Agency / Investor</h3>
              <p className="text-sm text-gray-600">For repeat client and portfolio workflows</p>
            </div>
            <div className="mb-7 -mx-5 bg-white px-5 py-4">
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-3xl sm:text-4xl font-bold text-gray-900 tabular-nums">
                  {billingCycle === 'monthly' ? formatPrice(displayPricing.plus_price, currency as Currency) : formatPrice(displayPricing.plus_annual, currency as Currency)}
                </span>
                <span className="text-sm font-medium text-gray-600">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
              <p className="text-xs mt-1.5 text-gray-600">10 startup profiles</p>
            </div>
            <ul className="space-y-2.5 mb-8 flex-1 text-sm">
              {['Everything in Startup, plus:', '10 startup profiles', '5 team members', 'Evaldam Startup AI: 500 questions/month', 'Portfolio dashboard', 'Portfolio workspace view', 'Investor and agency workflows', 'Professional review workflow', 'Client-ready approval status', 'Priority support'].map(f => (
                <li key={f} className="flex items-start gap-3 text-gray-700"><Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" /><span>{f}</span></li>
              ))}
            </ul>
            {isAgencyPlan ? (
              <button disabled className="w-full py-3 text-sm font-black rounded-lg border border-gray-300 bg-white text-gray-500 cursor-not-allowed">
                Your Current Plan
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSelectPlan('agency')}
                className="w-full py-3 text-sm font-black rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                style={{ background: TEAL, color: 'white' }}
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Enterprise */}
          <div className={`rounded-lg bg-white p-5 flex flex-col transition-all min-h-[520px] ${currentPlan === 'enterprise' ? 'border-2 border-primary' : 'border border-gray-300 hover:border-gray-400'}`}>
            <div className="mb-6">
              <h3 className="text-xl font-black text-gray-900 mb-1">Enterprise</h3>
              <p className="text-sm text-gray-500">Cohorts, portfolios, controls, and custom support</p>
            </div>
            <div className="mb-7">
              <div className="font-mono text-3xl sm:text-4xl font-bold text-gray-900">Custom</div>
              <p className="text-xs text-gray-400 mt-1.5">Tailored to your needs</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1 text-sm">
              {['Unlimited startup profiles', 'High-limit Evaldam Startup AI', 'Unlimited team members', 'White-label options', 'Advanced controls', 'Reviewer/admin queue', 'Bulk processing workflows', 'Custom benchmark support', 'Implementation support'].map(f => (
                <li key={f} className="flex items-start gap-3"><Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} /><span className="text-gray-600">{f}</span></li>
              ))}
            </ul>
            {currentPlan === 'enterprise' ? (
              <button disabled className="w-full py-3 text-sm font-bold text-center border border-gray-300 rounded-lg bg-white text-gray-500 cursor-not-allowed">
                Your Current Plan
              </button>
            ) : (
              <a
                href="/contact"
                className="w-full py-3 text-sm font-bold text-center border border-gray-300 rounded-lg hover:border-primary hover:text-primary transition-colors block"
                style={{ color: '#374151' }}
              >
                Contact Sales
              </a>
            )}
          </div>
        </div>
      </div>

      {/* -- TRUST LINE -- */}
      <div className="bg-white py-12 border-y border-gray-300">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="rounded-[4px] border border-gray-300 bg-white px-5 py-4 text-sm text-gray-600 leading-relaxed">
            <strong>Built for valuation conversations.</strong> Methods, assumptions, comparables, sensitivity, and investor-ready output in one place.
          </p>
        </div>
      </div>

      {/* -- API CREDITS -- */}
      <section id="api-credits" className="bg-white border-b border-gray-300 py-10 scroll-mt-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="rounded-[4px] border border-gray-300 bg-white p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-900">Startup valuation API credits</h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  Add valuation intelligence to fintech, fundraising, cap table, lending, accelerator, or marketplace workflows.
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  New users will be routed through signup and account onboarding before checkout.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:min-w-64">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <label htmlFor="api-credit-amount" className="sr-only">API credit top-up amount in USD</label>
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">$</span>
                    <input
                      id="api-credit-amount"
                      type="number"
                      inputMode="decimal"
                      min={API_MIN_TOP_UP_USD}
                      max={API_MAX_TOP_UP_USD}
                      step="1"
                      value={apiCreditAmount}
                      onChange={(event) => setApiCreditAmount(event.target.value)}
                      className="input pl-7"
                      aria-describedby="api-credit-help"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleApiCreditCheckout()}
                    disabled={apiCreditLoading}
                    className="btn btn-primary whitespace-nowrap disabled:opacity-50"
                  >
                    {apiCreditLoading ? 'Opening...' : 'Add Credits'}
                  </button>
                </div>
                {apiCreditError && <p className="form-error text-sm">{apiCreditError}</p>}
                <p id="api-credit-help" className="text-xs text-gray-500">
                  Minimum ${API_MIN_TOP_UP_USD}. Maximum ${API_MAX_TOP_UP_USD.toLocaleString()}. API credits are separate from subscription plans.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -- COMPARISON TABLE -- */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-black text-gray-900 mb-10 text-center">Feature Comparison</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-300 bg-white" tabIndex={0} aria-label="Pricing feature comparison">
          <table className="w-full min-w-[780px] text-sm">
            <thead>
              <tr className="border-b border-gray-300 bg-white">
                <th className="sticky left-0 z-10 bg-white text-left py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Feature</th>
                <th className="text-right py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Free</th>
                <th className="text-right py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Startup</th>
                <th className="text-right py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Agency</th>
                <th className="text-right py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Valuation preview', explore: '5/mo', founder: 'Unlimited', advisor: 'Unlimited', enterprise: 'Unlimited' },
                { feature: 'Startup profiles', explore: '1 lifetime', founder: String(PLAN_LIMITS.startup.startupProfiles), advisor: String(PLAN_LIMITS.agency.startupProfiles), enterprise: formatLimitValue(PLAN_LIMITS.enterprise.startupProfiles) },
                { feature: 'Team members', explore: 'No team', founder: 'No team', advisor: 'Up to 5', enterprise: 'Unlimited' },
                { feature: 'Evaldam Startup AI questions', explore: '10/mo', founder: `${PLAN_LIMITS.startup.aiQuestions.limit}/mo`, advisor: `${PLAN_LIMITS.agency.aiQuestions.limit}/mo`, enterprise: 'High limit' },
                { feature: 'Valuation methods', explore: '5/6', founder: '6/6', advisor: '6/6', enterprise: '6/6' },
                { feature: 'Full PDF report', explore: '3/mo watermarked', founder: true, advisor: true, enterprise: true },
                { feature: 'Evaldam AI Score', explore: false, founder: true, advisor: true, enterprise: true },
                { feature: 'Readiness score before generation', explore: false, founder: true, advisor: true, enterprise: true },
                { feature: 'Evidence and assumptions trail', explore: false, founder: true, advisor: true, enterprise: true },
                { feature: 'Proof document checklist', explore: false, founder: true, advisor: true, enterprise: true },
                { feature: 'Scenario and sensitivity analysis', explore: false, founder: true, advisor: true, enterprise: true },
                { feature: 'AI pitch extraction', explore: false, founder: true, advisor: true, enterprise: true },
                { feature: 'Indian comparables', explore: false, founder: true, advisor: true, enterprise: true },
                { feature: 'Report history and versioning', explore: false, founder: true, advisor: true, enterprise: true },
                { feature: 'Portfolio dashboard', explore: false, founder: false, advisor: true, enterprise: 'Advanced' },
                { feature: 'Professional review status', explore: false, founder: false, advisor: true, enterprise: true },
                { feature: 'Currency toggle', explore: false, founder: true, advisor: true, enterprise: true },
                { feature: 'Methodological assumptions', explore: false, founder: true, advisor: true, enterprise: true },
                { feature: 'Team invitation workflow', explore: false, founder: false, advisor: '5 members', enterprise: 'Unlimited' },
                { feature: 'White-label reports', explore: false, founder: false, advisor: false, enterprise: true },
                { feature: 'Bulk valuation workflows', explore: false, founder: false, advisor: false, enterprise: true },
                { feature: 'Custom benchmark support', explore: false, founder: false, advisor: false, enterprise: true },
              ].map(({ feature, explore, founder, advisor, enterprise }) => (
                <tr key={feature} className="border-b border-gray-300">
                  <td className="sticky left-0 bg-white py-3 px-4 text-gray-700 font-medium">{feature}</td>
                  <td className="text-right py-3 px-4">{renderComparisonValue(explore)}</td>
                  <td className="text-right py-3 px-4">{renderComparisonValue(founder)}</td>
                  <td className="text-right py-3 px-4">{renderComparisonValue(advisor)}</td>
                  <td className="text-right py-3 px-4">{renderComparisonValue(enterprise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* -- FAQ -- */}
      <section className="border-t border-gray-300 bg-white py-10 md:py-20">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-black text-gray-900 mb-10 text-center">Frequently asked</h2>
          <div className="border-y border-gray-300">
            {faqs.map(({ q, a }, i) => (
              <div key={q} className="border-b border-gray-300 last:border-b-0">
                <button
                  type="button"
                  className="w-full text-left px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-4"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-gray-900 text-sm">{q}</span>
                  <Plus className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${openFaq === i ? 'rotate-45' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-gray-500 text-sm leading-relaxed pt-4">{a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- FOOTER CTA -- */}
      <section className="border-t border-gray-300 bg-white py-10 md:py-20 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-black text-gray-900 mb-3 leading-snug">
            Not sure which plan?
          </h2>
          <p className="mb-10 text-sm text-gray-600">
            Use the preview, then choose a paid plan when you need the full valuation workspace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/free-valuation" className="block rounded-[4px] px-8 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity" style={{ background: TEAL }}>
              RUN PREVIEW
            </Link>
            <a href="/contact" className="block rounded-[4px] border border-gray-400 px-8 py-3 text-sm font-bold text-gray-800 transition-colors hover:border-primary hover:text-primary">
              TALK TO US
            </a>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </div>
  );
}

