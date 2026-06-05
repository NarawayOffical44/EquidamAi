'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, BarChart3, BriefcaseBusiness, Check, Database, FileText, Globe2, LineChart, Plus, ShieldCheck, Users, X } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { CurrencyToggle, useCurrency } from '@/components/CurrencyToggle';
import { Currency, getPricing, getDynamicPricing, formatPrice, type PricingTier } from '@/lib/utils/currency';
import { PLAN_LIMITS, formatLimitValue } from '@/lib/plans/plan-limits';
import { API_MAX_TOP_UP_USD, API_MIN_TOP_UP_USD } from '@/lib/developer-api/pricing';
import { getBenchmarkPersonalization, normalizeBenchmarkCountry } from '@/lib/personalization/country-benchmarks';
import { trackPricingPlanSelected } from '@/lib/analytics/ga4';

const TEAL = 'var(--primary)';
const TEAL_DARK = 'var(--primary-dark)';

const comparisonGroups = [
  {
    group: 'Methodology',
    rows: [
      { feature: 'Valuation methods', explore: '5/6', founder: '6/6', advisor: '6/6', enterprise: '6/6' },
      { feature: 'Evaldam AI Score', explore: false, founder: true, advisor: true, enterprise: true },
      { feature: 'Method assumptions', explore: false, founder: true, advisor: true, enterprise: true },
      { feature: 'Scenario and sensitivity', explore: false, founder: true, advisor: true, enterprise: true },
    ],
  },
  {
    group: 'Reports',
    rows: [
      { feature: 'Investor-ready PDF', explore: 'Watermarked', founder: true, advisor: true, enterprise: true },
      { feature: 'Evidence trail', explore: false, founder: true, advisor: true, enterprise: true },
      { feature: 'Report history', explore: false, founder: true, advisor: true, enterprise: true },
      { feature: 'White-label reports', explore: false, founder: false, advisor: false, enterprise: true },
    ],
  },
  {
    group: 'Benchmarks',
    rows: [
      { feature: 'Country context', explore: false, founder: true, advisor: true, enterprise: true },
      { feature: 'Comparable context', explore: false, founder: true, advisor: true, enterprise: true },
      { feature: 'Portfolio dashboard', explore: false, founder: false, advisor: true, enterprise: 'Advanced' },
      { feature: 'Custom benchmark support', explore: false, founder: false, advisor: false, enterprise: true },
    ],
  },
  {
    group: 'Workflow',
    rows: [
      { feature: 'Startup profiles', explore: '1 lifetime', founder: String(PLAN_LIMITS.startup.startupProfiles), advisor: String(PLAN_LIMITS.agency.startupProfiles), enterprise: formatLimitValue(PLAN_LIMITS.enterprise.startupProfiles) },
      { feature: 'Team members', explore: 'No team', founder: 'No team', advisor: 'Up to 5', enterprise: 'Unlimited' },
      { feature: 'Startup AI', explore: 'Limited', founder: 'Higher limit', advisor: 'Higher limit', enterprise: 'High limit' },
      { feature: 'Bulk/API workflows', explore: false, founder: false, advisor: false, enterprise: true },
    ],
  },
];

function ReportPageMock({ label, tone = 'standard' }: { label: string; tone?: 'standard' | 'benchmark' }) {
  const isBenchmark = tone === 'benchmark';

  return (
    <div className="evaldam-report-3d relative min-h-[280px] rounded-xl border border-gray-200 bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.13)]">
      <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">{label}</p>
          <p className="mt-1 text-sm font-black text-gray-950">Evaldam AI report</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          {isBenchmark ? <BarChart3 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">Pre-money range</p>
          <p className="mt-2 font-mono text-2xl font-black text-gray-950">$8.3M</p>
          <p className="mt-1 text-xs font-bold text-primary">Base $13.6M</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full w-2/3 rounded-full bg-primary" />
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 p-3">
          <div className="flex items-end gap-2">
            {[38, 62, 46, 74, 58].map((height, index) => (
              <div key={height} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className={`w-full rounded-t ${index === 3 ? 'bg-primary' : 'bg-primary/30'}`}
                  style={{ height: `${height}px` }}
                />
                <span className="h-1 w-1 rounded-full bg-gray-400" />
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {['Scorecard', 'VC method', isBenchmark ? 'Peer median' : 'DCF sensitivity'].map((item, index) => (
              <div key={item} className="evaldam-motion-row flex items-center justify-between rounded border border-gray-100 px-2 py-1.5" style={{ animationDelay: `${index * 0.12}s` }}>
                <span className="text-xs font-bold text-gray-600">{item}</span>
                <span className="text-xs font-black text-gray-950">{isBenchmark && index === 2 ? 'Aligned' : 'Ready'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isBenchmark ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {['Country', 'Stage', 'Industry'].map((item) => (
            <div key={item} className="rounded border border-primary/20 bg-primary/5 px-2 py-2 text-center text-[11px] font-black uppercase tracking-wide text-primary">
              {item}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PricingOutputPreview() {
  return (
    <section className="border-y border-gray-300 bg-white py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">What buyers get</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-black leading-tight text-gray-950 md:text-5xl">
              Pricing tied to report value, not just account limits.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-gray-600">
              The paid plans unlock the valuation workspace buyers actually need: methods, evidence, benchmark context, report history, and portfolio workflows.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                ['6 methods', 'Scorecard, checklist, VC, DCF, multiples, Evaldam Score'],
                ['Benchmark context', 'Country, stage, industry, and workspace peers where available'],
                ['Investor output', 'PDF report, evidence trail, assumptions, and version history'],
                ['Portfolio view', 'For agencies, investors, incubators, and accelerators'],
              ].map(([label, text]) => (
                <div key={label} className="rounded-lg border border-gray-300 bg-white p-4">
                  <p className="text-sm font-black text-gray-950">{label}</p>
                  <p className="mt-1 text-xs leading-5 text-gray-600">{text}</p>
                </div>
              ))}
            </div>
            <Link href="/reports/evaldam-sample-valuation-report.pdf" className="mt-8 inline-flex items-center gap-2 rounded-lg border border-gray-950 bg-gray-950 px-5 py-3 text-sm font-bold text-white hover:bg-black">
              View sample report <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="evaldam-3d-stage grid gap-5 md:grid-cols-2">
            <div>
              <ReportPageMock label="Founder report" />
            </div>
            <div className="md:pt-10">
              <ReportPageMock label="Benchmark report" tone="benchmark" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BuyerFitSection() {
  const buyers = [
    { icon: BriefcaseBusiness, title: 'Startup', text: 'One company, active fundraising, report history, and investor conversations.' },
    { icon: LineChart, title: 'VC / Investor', text: 'Compare portfolio companies, readiness, valuations, and peer movement over time.' },
    { icon: Users, title: 'Incubator / Accelerator', text: 'Run consistent valuation workflows across cohorts without rebuilding spreadsheets.' },
    { icon: Database, title: 'Agency', text: 'Client-ready valuation outputs, review status, and repeatable advisory workflows.' },
    { icon: Globe2, title: 'Enterprise', text: 'Bulk processing, APIs, benchmark support, controls, and implementation assistance.' },
  ];

  return (
    <section className="border-b border-gray-300 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Buyer fit</p>
            <h2 className="mt-2 text-2xl font-black text-gray-950 md:text-3xl">Built for the full startup valuation market.</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-gray-600">
            Same valuation core, different workflow depth by plan.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {buyers.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-lg border border-gray-300 bg-white p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-black text-gray-950">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-gray-600">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function inferCountryFromCurrency(currency: string) {
  if (currency === 'INR') return 'IN';
  if (currency === 'EUR') return 'EU';
  return '';
}

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
  const [benchmarkCountry, setBenchmarkCountry] = useState('');
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<'startup' | 'agency' | null>(null);
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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const countryFromUrl = params.get('country');
    const countryFromCache = window.localStorage.getItem('user_country_code');
    const normalized = normalizeBenchmarkCountry(countryFromUrl || countryFromCache || inferCountryFromCurrency(currency));
    setBenchmarkCountry(normalized === 'GLOBAL' ? '' : normalized);
  }, []);

  useEffect(() => {
    if (benchmarkCountry) return;

    const normalized = normalizeBenchmarkCountry(inferCountryFromCurrency(currency));
    if (normalized !== 'GLOBAL') setBenchmarkCountry(normalized);
  }, [benchmarkCountry, currency]);

  const buildCheckoutPath = (plan: 'startup' | 'agency') => {
    const params = new URLSearchParams({
      plan,
      billingCycle,
      currency,
    });
    if (benchmarkCountry) params.set('country', benchmarkCountry);
    return `/checkout?${params.toString()}`;
  };

  const getCheckoutPlanDetails = (plan: 'startup' | 'agency') => {
    const agency = plan === 'agency';
    const price = agency
      ? billingCycle === 'monthly'
        ? displayPricing.plus_price
        : displayPricing.plus_annual
      : billingCycle === 'monthly'
        ? displayPricing.pro_price
        : displayPricing.pro_annual;

    return {
      name: agency ? 'Agency / Investor' : 'Startup',
      price,
      profiles: agency ? '10 startup profiles' : '1 startup profile',
      seats: agency ? '5 team members' : 'Solo workspace',
    };
  };

  const handleSelectPlan = (plan: 'startup' | 'agency') => {
    const details = getCheckoutPlanDetails(plan);
    trackPricingPlanSelected({
      plan,
      billingCycle,
      currency,
      price: details.price,
      country: benchmarkCountry || inferCountryFromCurrency(currency),
    });
    setSelectedCheckoutPlan(plan);
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
  const benchmarkContext = getBenchmarkPersonalization(benchmarkCountry);
  const selectedCheckoutDetails = selectedCheckoutPlan ? getCheckoutPlanDetails(selectedCheckoutPlan) : null;
  const isStartupPlan = currentPlan === 'pro' || currentPlan === 'startup';
  const isAgencyPlan = currentPlan === 'plus' || currentPlan === 'agency';
  const renderComparisonValue = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="ml-auto block h-4 w-4 text-primary" />
      ) : (
        <X className="ml-auto block h-4 w-4 text-gray-300" />
      );
    }

    return <span className="font-mono text-sm font-semibold text-gray-900 tabular-nums">{value}</span>;
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-gray-900">
      <Navbar />

      <main>
      {/* -- HEADER -- */}
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 pb-6 pt-6 text-center sm:px-6 sm:pb-8 sm:pt-10 md:pb-14 md:pt-16">
        <div className="mb-5 inline-flex max-w-full items-center justify-center rounded-full bg-primary px-3 py-1.5 text-center text-xs font-bold uppercase leading-5 tracking-wide text-white">
          Free preview, founder reports, team plans, and API credits
        </div>
        <h1 className="mx-auto mb-4 max-w-4xl text-balance text-center text-3xl font-bold text-gray-950 sm:text-4xl md:text-5xl lg:text-6xl">
          Pick the plan that matches your stage
        </h1>
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-2 text-balance text-lg leading-8 text-gray-600">Prepare a defensible valuation range before your investor conversation.</p>
          <p className="mb-10 text-balance text-lg leading-8 text-gray-600">Start with a preview or report path, then upgrade when you need edits, scenarios, history, teams, or API usage.</p>
        </div>

        {/* Currency Toggle */}
        <div className="mb-5 flex flex-wrap justify-center gap-2">
          {currencyLoaded && <CurrencyToggle onCurrencyChange={updateCurrency} initialCurrency={currency as Currency} />}
        </div>

        {/* Billing toggle */}
        <div className="inline-flex max-w-full items-center gap-0 rounded-lg border border-gray-300 bg-white p-1">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className="px-5 py-2 rounded-[2px] text-sm font-semibold transition-all"
            style={billingCycle === 'monthly'
              ? { background: 'white', color: TEAL_DARK, border: '1px solid rgb(var(--primary-rgb) / 0.22)' }
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
              ? { background: 'white', color: TEAL_DARK, border: '1px solid rgb(var(--primary-rgb) / 0.22)' }
              : { background: 'transparent', color: '#6b7280' }
            }
          >
            Annual
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-[2px] border border-primary/20 bg-white" style={{ color: TEAL_DARK }}>
              Save 10%
            </span>
          </button>
        </div>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
          Benchmark context: {benchmarkContext.countryLabel}
        </p>
      </div>

      {/* -- PRICING CARDS -- */}
      <div id="plans" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-14 sm:px-6 md:pb-24">
        <div className="grid min-w-0 grid-cols-1 items-stretch gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-2 xl:grid-cols-4">
          {/* Free */}
          <div className={`flex min-h-[520px] min-w-0 flex-col overflow-hidden rounded-lg bg-white transition-all ${currentPlan === 'free' ? 'border-2 border-primary' : 'border border-gray-300 hover:border-gray-400'}`}>
            <div className="border-b border-gray-200 bg-slate-50/70 p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-white text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-xl font-bold text-gray-900">Free Preview</h3>
              <p className="text-sm leading-6 text-gray-500">First valuation signal before a buying decision</p>
            </div>
            <div className="border-b border-gray-100 px-5 py-6">
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-4xl font-bold text-gray-900 tabular-nums">{formatPrice(0, currency as Currency)}</span>
                <span className="text-gray-500 text-sm font-medium">/forever</span>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">1 startup with watermarked reports</p>
            </div>
            <ul className="mb-8 flex-1 space-y-3 p-5 text-sm">
              {['5 valuation previews/month', '1 lifetime startup', '5-method valuation report', '3 watermarked PDF downloads/month', 'Limited Evaldam Startup AI access', 'No Evaldam AI Score', 'No team members'].map(f => (
                <li key={f} className="flex items-start gap-3"><Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} /><span className="text-gray-600">{f}</span></li>
              ))}
            </ul>
            {currentPlan === 'free' ? (
              <button disabled className="mx-4 mb-5 w-[calc(100%-2rem)] cursor-not-allowed rounded-lg border border-gray-300 bg-white py-3 text-sm font-bold text-gray-500 sm:mx-5 sm:w-[calc(100%-2.5rem)]">
                Your Current Plan
              </button>
            ) : (
              <Link href="/free-valuation" className="mx-4 mb-5 block w-[calc(100%-2rem)] rounded-lg border border-gray-300 bg-white py-3 text-center text-sm font-bold text-gray-800 transition-all hover:border-primary hover:text-primary sm:mx-5 sm:w-[calc(100%-2.5rem)]">
                Start Free Preview
              </Link>
            )}
          </div>

          {/* Startup */}
          <div className={`flex min-h-[520px] min-w-0 flex-col overflow-hidden rounded-lg bg-white transition-all ${isStartupPlan ? 'border-2 border-primary' : 'border border-gray-300 hover:border-gray-400'}`}>
            <div className="border-b border-gray-200 bg-slate-50/70 p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-white text-primary">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-xl font-bold text-gray-900">Startup</h3>
              <p className="text-sm leading-6 text-gray-500">For founders iterating through an active raise</p>
            </div>
            <div className="border-b border-gray-100 px-5 py-6">
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-3xl sm:text-4xl font-bold text-gray-900 tabular-nums">
                  {billingCycle === 'monthly' ? formatPrice(displayPricing.pro_price, currency as Currency) : formatPrice(displayPricing.pro_annual, currency as Currency)}
                </span>
                <span className="text-gray-500 text-sm font-medium">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">1 startup profile</p>
            </div>
            <ul className="mb-8 flex-1 space-y-2.5 p-5 text-sm">
              {['1 startup profile', 'Unlimited valuation previews', 'Higher Evaldam Startup AI limits', 'Evaldam AI Score', 'All 6 valuation methods', 'Investor-ready PDF report', 'Readiness score before generation', 'Assumptions and evidence trail', 'Verified input checklist', 'Scenario and sensitivity analysis', 'Indian market comparables', 'Report history and versioning'].map(f => (
                <li key={f} className="flex items-start gap-3"><Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} /><span className="text-gray-600">{f}</span></li>
              ))}
            </ul>
            {isStartupPlan ? (
              <button disabled className="mx-4 mb-5 w-[calc(100%-2rem)] cursor-not-allowed rounded-lg border border-gray-300 bg-white py-3 text-sm font-bold text-gray-500 sm:mx-5 sm:w-[calc(100%-2.5rem)]">
                Your Current Plan
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSelectPlan('startup')}
                className="mx-4 mb-5 flex w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-lg border border-gray-300 py-3 text-sm font-bold text-gray-800 transition-colors hover:border-primary hover:text-primary sm:mx-5 sm:w-[calc(100%-2.5rem)]"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Agency (Featured) */}
          <div className="relative flex min-h-[520px] min-w-0 flex-col overflow-hidden rounded-lg border border-gray-300 border-t-4 border-t-primary bg-white shadow-xl shadow-primary/20 transition-all xl:-mt-4 xl:mb-4">
            <div className="absolute left-1/2 top-2 z-10 -translate-x-1/2">
              <span className="text-[11px] font-bold uppercase tracking-wide whitespace-nowrap text-white px-4 py-1.5 rounded-lg" style={{ background: isAgencyPlan ? TEAL : TEAL_DARK }}>
                {isAgencyPlan ? 'Your Plan' : 'Most Popular'}
              </span>
            </div>
            <div className="bg-primary p-4 pt-10 text-white sm:p-5 sm:pt-12">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-xl font-bold text-white">Agency / Investor</h3>
              <p className="text-sm leading-6 text-white/80">For repeat client and portfolio workflows</p>
            </div>
            <div className="border-b border-gray-100 px-5 py-6">
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-3xl sm:text-4xl font-bold text-gray-900 tabular-nums">
                  {billingCycle === 'monthly' ? formatPrice(displayPricing.plus_price, currency as Currency) : formatPrice(displayPricing.plus_annual, currency as Currency)}
                </span>
                <span className="text-sm font-medium text-gray-600">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
              <p className="text-xs mt-1.5 text-gray-600">10 startup profiles</p>
            </div>
            <ul className="mb-8 flex-1 space-y-2.5 p-5 text-sm">
              {['Everything in Startup, plus:', '10 startup profiles', '5 team members', 'Higher Evaldam Startup AI limits', 'Portfolio dashboard', 'Portfolio workspace view', 'Investor and agency workflows', 'Professional review workflow', 'Client-ready approval status', 'Priority support'].map(f => (
                <li key={f} className="flex items-start gap-3 text-gray-700"><Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" /><span>{f}</span></li>
              ))}
            </ul>
            {isAgencyPlan ? (
              <button disabled className="mx-4 mb-5 w-[calc(100%-2rem)] cursor-not-allowed rounded-lg border border-gray-300 bg-white py-3 text-sm font-bold text-gray-500 sm:mx-5 sm:w-[calc(100%-2.5rem)]">
                Your Current Plan
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSelectPlan('agency')}
                className="mx-4 mb-5 flex w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 sm:mx-5 sm:w-[calc(100%-2.5rem)]"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Enterprise */}
          <div className={`flex min-h-[520px] min-w-0 flex-col overflow-hidden rounded-lg bg-white transition-all ${currentPlan === 'enterprise' ? 'border-2 border-primary' : 'border border-gray-300 hover:border-gray-400'}`}>
            <div className="border-b border-gray-200 bg-slate-50/70 p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-white text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-xl font-bold text-gray-900">Enterprise</h3>
              <p className="text-sm leading-6 text-gray-500">Cohorts, portfolios, controls, and custom support</p>
            </div>
            <div className="border-b border-gray-100 px-5 py-6">
              <div className="font-mono text-3xl sm:text-4xl font-bold text-gray-900">Custom</div>
              <p className="text-xs text-gray-500 mt-1.5">Tailored to your needs</p>
            </div>
            <ul className="mb-8 flex-1 space-y-3 p-5 text-sm">
              {['Unlimited startup profiles', 'High-limit Evaldam Startup AI', 'Unlimited team members', 'White-label options', 'Advanced controls', 'Reviewer/admin queue', 'Bulk processing workflows', 'Custom benchmark support', 'Implementation support'].map(f => (
                <li key={f} className="flex items-start gap-3"><Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} /><span className="text-gray-600">{f}</span></li>
              ))}
            </ul>
            {currentPlan === 'enterprise' ? (
              <button disabled className="mx-4 mb-5 w-[calc(100%-2rem)] cursor-not-allowed rounded-lg border border-gray-300 bg-white py-3 text-center text-sm font-bold text-gray-500 sm:mx-5 sm:w-[calc(100%-2.5rem)]">
                Your Current Plan
              </button>
            ) : (
              <a
                href="/contact"
                className="mx-4 mb-5 block w-[calc(100%-2rem)] rounded-lg border border-gray-300 py-3 text-center text-sm font-bold transition-colors hover:border-primary hover:text-primary sm:mx-5 sm:w-[calc(100%-2.5rem)]"
                style={{ color: '#374151' }}
              >
                Contact Sales
              </a>
            )}
          </div>
        </div>
      </div>

      <PricingOutputPreview />

      <BuyerFitSection />

      {/* -- API CREDITS -- */}
      <section id="api-credits" className="bg-white border-b border-gray-300 py-10 scroll-mt-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="rounded-lg border border-gray-300 bg-white p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Startup valuation API credits</h2>
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
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">$</span>
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
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Compare plans</p>
            <h2 className="mt-2 text-3xl font-black text-gray-950">What changes when you upgrade</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-gray-600">
            The important difference is output quality, workflow depth, and portfolio capacity.
          </p>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-300 bg-white" tabIndex={0} aria-label="Pricing feature comparison">
          <table className="w-full min-w-[780px] text-sm">
            <thead>
              <tr className="border-b border-gray-300 bg-white">
                <th className="bg-white text-left py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 md:sticky md:left-0 md:z-10">Feature</th>
                <th className="text-right py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Free</th>
                <th className="text-right py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Startup</th>
                <th className="text-right py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Agency</th>
                <th className="text-right py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {comparisonGroups.flatMap((group) => [
                <tr key={`${group.group}-heading`} className="border-b border-gray-300 bg-gray-50">
                  <td colSpan={5} className="bg-gray-50 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-gray-950 md:sticky md:left-0">
                    {group.group}
                  </td>
                </tr>,
                ...group.rows.map(({ feature, explore, founder, advisor, enterprise }) => (
                  <tr key={feature} className="border-b border-gray-200">
                    <td className="bg-white py-3 px-4 text-gray-800 font-semibold md:sticky md:left-0">{feature}</td>
                    <td className="text-right py-3 px-4">{renderComparisonValue(explore)}</td>
                    <td className="text-right py-3 px-4">{renderComparisonValue(founder)}</td>
                    <td className="text-right py-3 px-4">{renderComparisonValue(advisor)}</td>
                    <td className="text-right py-3 px-4">{renderComparisonValue(enterprise)}</td>
                  </tr>
                )),
              ])}
            </tbody>
          </table>
        </div>
      </div>

      {/* -- FAQ -- */}
      <section className="border-t border-gray-300 bg-white py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="mb-7 text-center text-3xl font-bold text-gray-900">Frequently asked</h2>
          <div className="border-y border-gray-300">
            {faqs.map(({ q, a }, i) => (
              <div key={q} className="border-b border-gray-300 last:border-b-0">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-6"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-sm font-semibold leading-6 text-gray-900">{q}</span>
                  <Plus className={`w-4 h-4 flex-shrink-0 text-gray-500 transition-transform ${openFaq === i ? 'rotate-45' : ''}`} />
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
      <section className="border-t border-gray-300 bg-white py-10 text-center md:py-12">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="mb-4 text-3xl font-bold leading-tight text-gray-900">
            Not sure which plan?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-sm leading-6 text-gray-600">
            Use the preview, then choose a paid plan when you need the full valuation workspace.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/free-valuation" className="inline-flex min-h-12 items-center justify-center rounded-lg px-8 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90" style={{ background: TEAL }}>
              RUN PREVIEW
            </Link>
            <a href="/contact" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-gray-400 px-8 py-3 text-sm font-bold text-gray-800 transition-colors hover:border-primary hover:text-primary">
              TALK TO US
            </a>
          </div>
        </div>
      </section>
      </main>
      {selectedCheckoutPlan && selectedCheckoutDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 px-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="checkout-confirm-title" className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Pricing / Confirm plan / Checkout</p>
            <h2 id="checkout-confirm-title" className="mt-3 text-2xl font-black text-gray-950">Confirm your plan</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Review the selection before moving to secure checkout.
            </p>

            <div className="mt-5 rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-gray-950">{selectedCheckoutDetails.name}</p>
                  <p className="mt-1 text-xs text-gray-500">{selectedCheckoutDetails.profiles} / {selectedCheckoutDetails.seats}</p>
                </div>
                <span className="rounded-lg border border-primary/20 px-2 py-1 text-xs font-black uppercase text-primary">
                  {billingCycle}
                </span>
              </div>
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500">Due today</p>
                <p className="mt-1 font-mono text-3xl font-black text-gray-950">
                  {formatPrice(selectedCheckoutDetails.price, currency as Currency)}
                </p>
                <p className="mt-1 text-xs font-semibold text-gray-500">
                  Benchmark context: {benchmarkContext.countryLabel}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-[auto_1fr]">
              <button
                type="button"
                onClick={() => setSelectedCheckoutPlan(null)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Review pricing
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = buildCheckoutPath(selectedCheckoutPlan);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                Continue to checkout <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

