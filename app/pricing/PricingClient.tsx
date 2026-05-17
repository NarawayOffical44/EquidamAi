'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { CurrencyToggle, useCurrency } from '@/components/CurrencyToggle';
import { Currency, getPricing, getDynamicPricing, formatPrice, type PricingTier } from '@/lib/utils/currency';

const TEAL = '#00b2b2';
const TEAL_DARK = '#007a7a';
const NAV_DARK = '#111827';

interface PricingClientProps {
  faqs: Array<{ q: string; a: string }>;
}

export function PricingClient({ faqs }: PricingClientProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currencyPricing, setCurrencyPricing] = useState<PricingTier | null>(null);
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
            .select('plan')
            .eq('id', user.id)
            .single();
          setCurrentPlan(userData?.plan || null);
        }
      } catch (err) {
        console.error('Failed to load user plan:', err);
      } finally {
        setLoading(false);
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

  const handleSelectPlan = async (plan: 'founder' | 'advisor') => {
    const checkoutPlan = plan === 'founder' ? 'pro' : 'plus';
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = `/signup?plan=${checkoutPlan}&billingCycle=${billingCycle}&currency=${currency}`;
      return;
    }
    window.location.href = `/checkout?plan=${checkoutPlan}&billingCycle=${billingCycle}&currency=${currency}`;
  };

  // Use dynamic pricing if loaded, fallback to static pricing
  const displayPricing = currencyPricing || getPricing(currency as Currency);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_38%,#ffffff_100%)] text-gray-900">
      <Navbar />

      {/* -- HEADER -- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 md:pt-16 pb-8 md:pb-14 text-center">
        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary mb-5">
          Founder and advisor plans
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-4 tracking-tight">
          Plans for founders preparing to raise
        </h1>
        <div className="mx-auto max-w-2xl">
          <p className="text-lg text-gray-600 mb-2">Do not walk into investor conversations with only a guessed number.</p>
          <p className="text-lg text-gray-600 mb-10">Build a defensible valuation, PDF report, assumptions trail, and Evaldam Startup AI support.</p>
        </div>

        {/* Currency Toggle */}
        <div className="mb-5 flex justify-center">
          {currencyLoaded && <CurrencyToggle onCurrencyChange={updateCurrency} initialCurrency={currency as Currency} />}
        </div>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-0 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setBillingCycle('monthly')}
            className="px-5 py-2 rounded-md text-sm font-semibold transition-all"
            style={billingCycle === 'monthly'
              ? { background: 'white', color: '#111827', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
              : { background: 'transparent', color: '#6b7280' }
            }
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className="px-5 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2"
            style={billingCycle === 'annual'
              ? { background: 'white', color: '#111827', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
              : { background: 'transparent', color: '#6b7280' }
            }
          >
            Annual
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: TEAL_DARK, background: '#e0f5f5' }}>
              Save 10%
            </span>
          </button>
        </div>
      </div>

      {/* -- PRICING CARDS -- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-14 md:pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 items-stretch">
          {/* Explore */}
          <div className={`rounded-lg p-5 sm:p-6 flex flex-col transition-all min-h-[520px] ${currentPlan === 'free' ? 'bg-blue-50 border-2 border-blue-400 shadow-lg' : 'bg-white border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-gray-300'}`}>
            <div className="mb-6">
              <h3 className="text-xl font-black text-gray-900 mb-1">Explore</h3>
              <p className="text-sm text-gray-500">Website preview</p>
            </div>
            <div className="mb-7">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-gray-900">{formatPrice(0, currency as Currency)}</span>
                <span className="text-gray-400 text-sm font-medium">/forever</span>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Lead capture preview tool</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1 text-sm">
              {['Website-only valuation preview', 'Evaldam Startup AI: 3 questions/day', 'Lead-capture result by email', 'No saved startup workspace', 'No evidence trail or PDF'].map(f => (
                <li key={f} className="flex items-start gap-3"><Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} /><span className="text-gray-600">{f}</span></li>
              ))}
            </ul>
            {currentPlan === 'free' ? (
              <button disabled className="w-full py-3 text-sm font-bold rounded-lg bg-gray-200 text-gray-500 cursor-not-allowed">
                Your Current Plan
              </button>
            ) : (
              <Link href="/free-valuation">
                <button className="w-full py-3 text-sm font-bold rounded-lg transition-all border border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50 text-gray-800">
                  Run Preview
                </button>
              </Link>
            )}
          </div>

          {/* Founder */}
          <div className={`rounded-lg p-5 sm:p-6 flex flex-col transition-all min-h-[520px] ${currentPlan === 'pro' ? 'bg-blue-50 border-2 border-blue-400 shadow-lg' : 'bg-white border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-gray-300'}`}>
            <div className="mb-6">
              <h3 className="text-xl font-black text-gray-900 mb-1">Founder</h3>
              <p className="text-sm text-gray-500">For a live fundraise</p>
            </div>
            <div className="mb-7">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-gray-900">
                  {billingCycle === 'monthly' ? formatPrice(Math.round(displayPricing.pro_annual / 12), currency as Currency) : formatPrice(displayPricing.pro_annual, currency as Currency)}
                </span>
                <span className="text-gray-400 text-sm font-medium">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">3 startup profiles</p>
            </div>
            <ul className="space-y-2.5 mb-8 flex-1 text-sm">
              {['3 startup profiles', 'Evaldam Startup AI: 100 questions/month', 'All 6 valuation methods', 'Investor-ready PDF report', 'Readiness score before generation', 'Assumptions and evidence trail', 'Verified input checklist', 'Scenario and sensitivity analysis', 'Indian market comparables', 'Report history and versioning'].map(f => (
                <li key={f} className="flex items-start gap-3"><Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} /><span className="text-gray-600">{f}</span></li>
              ))}
            </ul>
            {currentPlan === 'pro' ? (
              <button disabled className="w-full py-3 text-sm font-bold text-gray-800 border-2 border-gray-300 rounded-lg bg-gray-200 text-gray-500 cursor-not-allowed">
                Your Current Plan
              </button>
            ) : (
              <button
                onClick={() => handleSelectPlan('founder')}
                className="w-full py-3 text-sm font-bold text-gray-800 border border-gray-300 rounded-lg hover:border-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Advisor (Featured) */}
          <div className="relative rounded-lg p-5 sm:p-6 flex flex-col transition-all min-h-[520px] lg:-mt-4 lg:mb-4 ring-4 ring-primary/10" style={{ background: currentPlan === 'plus' ? '#e0f5f5' : TEAL, boxShadow: currentPlan === 'plus' ? '0 20px 25px -5px rgba(0,178,178,0.2)' : '0 24px 40px -16px rgba(0,122,122,0.65)' }}>
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="text-[11px] font-black uppercase tracking-wide whitespace-nowrap text-white px-4 py-1.5 rounded-full" style={{ background: currentPlan === 'advisor' ? TEAL : TEAL_DARK }}>
                {currentPlan === 'plus' ? 'Your Plan' : 'Most Popular'}
              </span>
            </div>
            <div className="mb-6">
              <h3 className={`text-xl font-black mb-1 ${currentPlan === 'plus' ? 'text-gray-900' : 'text-white'}`}>Advisor</h3>
              <p className={`text-sm ${currentPlan === 'plus' ? 'text-gray-600' : 'text-white/70'}`}>For advisors and portfolios</p>
            </div>
            <div className="mb-7">
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-black ${currentPlan === 'plus' ? 'text-gray-900' : 'text-white'}`}>
                  {billingCycle === 'monthly' ? formatPrice(Math.round(displayPricing.plus_annual / 12), currency as Currency) : formatPrice(displayPricing.plus_annual, currency as Currency)}
                </span>
                <span className={`text-sm font-medium ${currentPlan === 'plus' ? 'text-gray-600' : 'text-white/60'}`}>/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
              <p className={`text-xs mt-1.5 ${currentPlan === 'plus' ? 'text-gray-600' : 'text-white/60'}`}>15 startup profiles</p>
            </div>
            <ul className="space-y-2.5 mb-8 flex-1 text-sm">
              {['Everything in Founder, plus:', '15 startup profiles', 'Evaldam Startup AI: 300 questions/month', 'Advisor workspace view', 'Advisor workflow support', 'Professional review workflow', 'Client-ready approval status', 'Priority support'].map(f => (
                <li key={f} className={`flex items-start gap-3 ${currentPlan === 'plus' ? 'text-gray-700' : 'text-white/90'}`}><Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${currentPlan === 'plus' ? 'text-gray-900' : 'text-white'}`} /><span>{f}</span></li>
              ))}
            </ul>
            {currentPlan === 'plus' ? (
              <button disabled className="w-full py-3 text-sm font-black rounded-lg cursor-not-allowed" style={{ background: '#d0d0d0', color: '#666666' }}>
                Your Current Plan
              </button>
            ) : (
              <button
                onClick={() => handleSelectPlan('advisor')}
                className="w-full py-3 text-sm font-black rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                style={{ background: currentPlan === 'plus' ? TEAL : 'white', color: currentPlan === 'plus' ? 'white' : TEAL_DARK }}
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Enterprise */}
          <div className={`rounded-lg p-5 sm:p-6 flex flex-col transition-all min-h-[520px] ${currentPlan === 'enterprise' ? 'bg-blue-50 border-2 border-blue-400 shadow-lg' : 'bg-white border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-gray-300'}`}>
            <div className="mb-6">
              <h3 className="text-xl font-black text-gray-900 mb-1">Enterprise</h3>
              <p className="text-sm text-gray-500">For VCs &amp; platforms</p>
            </div>
            <div className="mb-7">
              <div className="text-4xl font-black text-gray-900">Custom</div>
              <p className="text-xs text-gray-400 mt-1.5">Tailored to your needs</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1 text-sm">
              {['Unlimited startup profiles', 'High-limit Evaldam Startup AI', 'Enterprise team seats', 'Reviewer/admin queue', 'Bulk processing workflows', 'Custom benchmark support', 'Implementation support'].map(f => (
                <li key={f} className="flex items-start gap-3"><Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} /><span className="text-gray-600">{f}</span></li>
              ))}
            </ul>
            {currentPlan === 'enterprise' ? (
              <button disabled className="w-full py-3 text-sm font-bold text-center border-2 border-gray-300 rounded-lg bg-gray-200 text-gray-500 cursor-not-allowed">
                Your Current Plan
              </button>
            ) : (
              <a
                href="/contact"
                className="w-full py-3 text-sm font-bold text-center border border-gray-300 rounded-lg hover:border-gray-500 hover:bg-gray-50 transition-colors block"
                style={{ color: '#374151' }}
              >
                Contact Sales
              </a>
            )}
          </div>
        </div>
      </div>

      {/* -- TRUST LINE -- */}
      <div className="bg-white py-12 border-y border-gray-200">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-600 leading-relaxed shadow-sm">
            <strong>Built for valuation conversations.</strong> Methods, assumptions, comparables, sensitivity, and investor-ready output in one place.
          </p>
        </div>
      </div>

      {/* -- COMPARISON TABLE -- */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-black text-gray-900 mb-10 text-center">Feature Comparison</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-4 px-4 font-black text-gray-900">Feature</th>
                <th className="text-center py-4 px-4 font-bold text-gray-700">Explore</th>
                <th className="text-center py-4 px-4 font-bold text-gray-700">Founder</th>
                <th className="text-center py-4 px-4 font-bold text-gray-700">Advisor</th>
                <th className="text-center py-4 px-4 font-bold text-gray-700">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Startup profiles', explore: '1', founder: '3', advisor: '15', enterprise: 'Unlimited' },
                { feature: 'Evaldam Startup AI questions', explore: '3/day', founder: '100/mo', advisor: '300/mo', enterprise: 'Custom' },
                { feature: 'Valuation methods', explore: '4/6', founder: '6/6', advisor: '6/6', enterprise: '6/6' },
                { feature: 'Full PDF report', explore: false, founder: true, advisor: true, enterprise: true },
                { feature: 'Readiness score before generation', explore: false, founder: true, advisor: true, enterprise: true },
                { feature: 'Evidence and assumptions trail', explore: false, founder: true, advisor: true, enterprise: true },
                { feature: 'Proof document checklist', explore: false, founder: true, advisor: true, enterprise: true },
                { feature: 'Scenario and sensitivity analysis', explore: false, founder: true, advisor: true, enterprise: true },
                { feature: 'AI pitch extraction', explore: false, founder: true, advisor: true, enterprise: true },
                { feature: 'Indian comparables', explore: false, founder: true, advisor: true, enterprise: true },
                { feature: 'Report history and versioning', explore: false, founder: true, advisor: true, enterprise: true },
                { feature: 'Professional review status', explore: false, founder: false, advisor: true, enterprise: true },
                { feature: 'Currency toggle', explore: false, founder: true, advisor: true, enterprise: true },
                { feature: 'Methodological assumptions', explore: false, founder: true, advisor: true, enterprise: true },
                { feature: 'Team invitation workflow', explore: false, founder: false, advisor: false, enterprise: true },
                { feature: 'Bulk valuation workflows', explore: false, founder: false, advisor: false, enterprise: true },
                { feature: 'Custom benchmark support', explore: false, founder: false, advisor: false, enterprise: true },
              ].map(({ feature, explore, founder, advisor, enterprise }) => (
                <tr key={feature} className="border-b border-gray-100 hover:bg-primary/5">
                  <td className="py-3 px-4 text-gray-700 font-medium">{feature}</td>
                  <td className="text-center py-3 px-4">{typeof explore === 'boolean' ? (explore ? <Check className="w-4 h-4 mx-auto" style={{ color: TEAL }} /> : <span className="text-gray-300">-</span>) : <span className="text-sm font-semibold text-gray-900">{explore}</span>}</td>
                  <td className="text-center py-3 px-4">{typeof founder === 'boolean' ? (founder ? <Check className="w-4 h-4 mx-auto" style={{ color: TEAL }} /> : <span className="text-gray-300">-</span>) : <span className="text-sm font-semibold text-gray-900">{founder}</span>}</td>
                  <td className="text-center py-3 px-4">{typeof advisor === 'boolean' ? (advisor ? <Check className="w-4 h-4 mx-auto" style={{ color: TEAL }} /> : <span className="text-gray-300">-</span>) : <span className="text-sm font-semibold text-gray-900">{advisor}</span>}</td>
                  <td className="text-center py-3 px-4">{typeof enterprise === 'boolean' ? (enterprise ? <Check className="w-4 h-4 mx-auto" style={{ color: TEAL }} /> : <span className="text-gray-300">-</span>) : <span className="text-sm font-semibold text-gray-900">{enterprise}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* -- FAQ -- */}
      <section className="border-t border-gray-100 bg-gray-50 py-10 md:py-20">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-black text-gray-900 mb-10 text-center tracking-tight">Frequently asked</h2>
          <div className="space-y-3">
            {faqs.map(({ q, a }, i) => (
              <div key={q} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <button
                  className="w-full text-left px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-4"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-gray-900 text-sm">{q}</span>
                  {openFaq === i
                    ? <ChevronUp className="w-4 h-4 flex-shrink-0 text-gray-400" />
                    : <ChevronDown className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  }
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 border-t border-gray-100">
                    <p className="text-gray-500 text-sm leading-relaxed pt-4">{a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- FOOTER CTA -- */}
      <section className="py-10 md:py-20 text-center" style={{ background: NAV_DARK }}>
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-black text-white mb-3 leading-snug">
            Not sure which plan?
          </h2>
          <p className="mb-10 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Use the preview, then choose a paid plan when you need the full valuation workspace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <button className="px-8 py-3 text-sm font-bold text-white rounded-lg hover:opacity-90 transition-opacity" style={{ background: TEAL }}>
                RUN PREVIEW
              </button>
            </Link>
            <a href="/contact" className="px-8 py-3 text-sm font-bold text-white border-2 border-white/30 rounded-lg hover:border-white transition-colors block">
              TALK TO US
            </a>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

