'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Check, ArrowRight, AlertCircle, PartyPopper, Menu, X, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { CurrencyToggle, useCurrency } from '@/components/CurrencyToggle';
import { Currency, getPricing, formatPrice } from '@/lib/utils/currency';

function PricingContent() {
  const TEAL = '#00b2b2';
  const TEAL_DARK = '#007a7a';
  const NAV_DARK = '#111827';

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { currency, updateCurrency, isLoaded: currencyLoaded } = useCurrency();
  const searchParams = useSearchParams();
  const noSub = searchParams.get('noSub') === 'true';
  const justSignedUp = searchParams.get('signup') === 'true';

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

  const handleSelectPlan = (plan: 'founder' | 'advisor') => {
    window.location.href = `/checkout?plan=${plan}&billingCycle=${billingCycle}&currency=${currency}`;
  };

  const currencyPricing = getPricing(currency as Currency);

  const faqs = [
    { q: 'Can I try Evaldam for free?', a: 'Yes! The Explore plan is completely free forever. You get 1 startup profile, 1 valuation report, and see the valuation range. Perfect for trying us out before upgrading.' },
    { q: 'How does the AI valuation work?', a: 'Upload your pitch deck or company info, and our AI extracts key data and runs 6 professional valuation methods simultaneously — delivering a blended result with full methodology transparency in under 60 seconds.' },
    { q: 'What are Indian market comparables?', a: 'We benchmark against real Indian startup data — NSE/BSE companies, recent M&A deals, and angel/seed investments. Your valuation uses live RBI rates and India-specific risk adjustments.' },
    { q: 'Can I edit and regenerate reports?', a: 'Absolutely. Edit any startup data, adjust methodological assumptions, and regenerate valuations instantly. Unlimited revisions are included in Founder and Advisor plans.' },
    { q: 'How do I share my report with investors?', a: 'Generate a shareable investor link (Founder plan+). Investors can view your full 6-method breakdown without signing up. You control expiry and access.' },
    { q: 'Is there a free trial?', a: "Yes — create a free account and run your first free valuation immediately. No credit card needed. Upgrade to Founder ($60/yr) when you need the full investor-ready report." },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <Image src="/logo.png" alt="Evaldam AI" width={32} height={32} className="rounded-md" />
            </Link>

            <div className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
              <a href="/#valuation" className="hover:text-gray-900 transition-colors">Valuation</a>
              <Link href="/pricing" className="font-bold text-primary transition-colors">Pricing</Link>
              <a href="/#features" className="hover:text-gray-900 transition-colors">Features</a>
              <Link href="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
              <Link href="/login" className="hover:text-gray-900 transition-colors">Login</Link>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <Link href="/login">
                <button className="px-4 py-2 text-sm font-semibold text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                  Get a demo
                </button>
              </Link>
              <Link href="/signup">
                <button className="px-4 py-2 text-sm font-bold text-white rounded transition-opacity hover:opacity-90" style={{ background: TEAL }}>
                  Start Free
                </button>
              </Link>
            </div>

            <button className="md:hidden p-2 text-gray-500" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 px-6 py-4 space-y-3 bg-white">
            {["Valuation", "Features", "Contact"].map((item) => (
              <a key={item} href="/#" className="block text-sm font-medium text-gray-600 hover:text-gray-900" onClick={() => setMobileOpen(false)}>{item}</a>
            ))}
            <div className="pt-3 border-t border-gray-100 flex gap-2">
              <Link href="/login" className="flex-1"><button className="w-full py-2 text-sm font-semibold border border-gray-300 rounded">Login</button></Link>
              <Link href="/signup" className="flex-1"><button className="w-full py-2 text-sm font-bold text-white rounded" style={{ background: TEAL }}>Start Free</button></Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── ALERTS ── */}
      {(noSub || justSignedUp) && (
        <div className="max-w-7xl mx-auto px-6 pt-6">
          {noSub && (
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-2.5 text-sm font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              No active subscription found. Choose a plan to access the platform.
            </div>
          )}
          {justSignedUp && !noSub && (
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-2.5 text-sm font-medium">
              <PartyPopper className="w-4 h-4 flex-shrink-0" />
              Account created! Choose a plan to start your first valuation.
            </div>
          )}
        </div>
      )}

      {/* ── HEADER ── */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight">
          Professional Startup Valuation Plans
        </h1>
        <p className="text-lg text-gray-600 mb-2">Methodology-backed. Indian market data.</p>
        <p className="text-lg text-gray-600 mb-10">Investor-ready in 60 seconds.</p>

        {/* Currency Toggle */}
        {currencyLoaded && <CurrencyToggle onCurrencyChange={updateCurrency} initialCurrency={currency as Currency} forceShow={true} />}

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-0 bg-gray-100 rounded-lg p-1">
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

      {/* ── PRICING CARDS ── */}
      <div className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Explore (Free) */}
          <div className={`rounded-2xl p-8 flex flex-col transition-all ${currentPlan === 'free' ? 'bg-blue-50 border-2 border-blue-400 shadow-lg' : 'bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 hover:shadow-lg hover:border-gray-300'}`}>
            {currentPlan === 'free' && (
              <div className="absolute -top-3 right-6 bg-blue-500 text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Your Plan
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-xl font-black text-gray-900 mb-1">Explore</h3>
              <p className="text-sm text-gray-500">Try it free</p>
            </div>
            <div className="mb-7">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-gray-900">₹0</span>
                <span className="text-gray-400 text-sm font-medium">/forever</span>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Perfect to try it out</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1 text-sm">
              <li className="flex items-start gap-3"><Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} /><span className="text-gray-600">1 startup profile</span></li>
              <li className="flex items-start gap-3"><Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} /><span className="text-gray-600">1 valuation report</span></li>
              <li className="flex items-start gap-3"><Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} /><span className="text-gray-600">Valuation range only</span></li>
              <li className="flex items-start gap-3"><Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} /><span className="text-gray-600">4 of 6 methods</span></li>
              <li className="flex items-start gap-3"><X className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-300" /><span className="text-gray-400">PDF export</span></li>
              <li className="flex items-start gap-3"><X className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-300" /><span className="text-gray-400">AI pitch deck extraction</span></li>
            </ul>
            {currentPlan === 'free' ? (
              <button disabled className="w-full py-3 text-sm font-bold rounded-lg bg-gray-200 text-gray-500 cursor-not-allowed">
                ✓ Your Current Plan
              </button>
            ) : (
              <Link href="/signup">
                <button className="w-full py-3 text-sm font-bold rounded-lg transition-all border-2 border-gray-300 hover:border-gray-400 text-gray-800">
                  Start Free
                </button>
              </Link>
            )}
          </div>

          {/* Founder */}
          <div className={`rounded-2xl p-8 flex flex-col transition-all ${currentPlan === 'founder' ? 'bg-blue-50 border-2 border-blue-400 shadow-lg' : 'bg-white border border-gray-200 hover:shadow-lg hover:border-gray-300'}`}>
            {currentPlan === 'founder' && (
              <div className="absolute -top-3 right-6 bg-blue-500 text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Your Plan
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-xl font-black text-gray-900 mb-1">Founder</h3>
              <p className="text-sm text-gray-500">For fundraising founders</p>
            </div>
            <div className="mb-7">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-gray-900">
                  {billingCycle === 'monthly' ? formatPrice(Math.round(currencyPricing.pro_annual / 12), currency as Currency) : formatPrice(currencyPricing.pro_annual, currency as Currency)}
                </span>
                <span className="text-gray-400 text-sm font-medium">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">3 startup profiles</p>
            </div>
            <ul className="space-y-2.5 mb-8 flex-1 text-sm">
              <li className="flex items-start gap-3"><Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} /><span className="text-gray-600">3 startup profiles</span></li>
              <li className="flex items-start gap-3"><Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} /><span className="text-gray-600">All 6 valuation methods</span></li>
              <li className="flex items-start gap-3"><Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} /><span className="text-gray-600">AI pitch deck extraction</span></li>
              <li className="flex items-start gap-3"><Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} /><span className="text-gray-600">AI assumptions chat</span></li>
              <li className="flex items-start gap-3"><Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} /><span className="text-gray-600">Indian market comparables</span></li>
              <li className="flex items-start gap-3"><Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} /><span className="text-gray-600">Full PDF reports</span></li>
              <li className="flex items-start gap-3"><Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} /><span className="text-gray-600">Shareable investor link</span></li>
            </ul>
            {currentPlan === 'founder' ? (
              <button disabled className="w-full py-3 text-sm font-bold text-gray-800 border-2 border-gray-300 rounded-lg bg-gray-200 text-gray-500 cursor-not-allowed">
                ✓ Your Current Plan
              </button>
            ) : (
              <button
                onClick={() => handleSelectPlan('founder')}
                className="w-full py-3 text-sm font-bold text-gray-800 border-2 border-gray-300 rounded-lg hover:border-gray-500 transition-colors flex items-center justify-center gap-2"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Advisor (Featured) */}
          <div className="relative rounded-2xl p-8 flex flex-col transition-all" style={{ background: currentPlan === 'advisor' ? '#e0f5f5' : TEAL, boxShadow: currentPlan === 'advisor' ? '0 20px 25px -5px rgba(0,178,178,0.2)' : '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="text-[11px] font-black uppercase tracking-wide whitespace-nowrap text-white px-4 py-1.5 rounded-full" style={{ background: currentPlan === 'advisor' ? TEAL : TEAL_DARK }}>
                {currentPlan === 'advisor' ? 'Your Plan' : 'Most Popular'}
              </span>
            </div>
            <div className="mb-6">
              <h3 className={`text-xl font-black mb-1 ${currentPlan === 'advisor' ? 'text-gray-900' : 'text-white'}`}>Advisor</h3>
              <p className={`text-sm ${currentPlan === 'advisor' ? 'text-gray-600' : 'text-white/70'}`}>For CAs, accelerators & angels</p>
            </div>
            <div className="mb-7">
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-black ${currentPlan === 'advisor' ? 'text-gray-900' : 'text-white'}`}>
                  {billingCycle === 'monthly' ? formatPrice(Math.round(currencyPricing.plus_annual / 12), currency as Currency) : formatPrice(currencyPricing.plus_annual, currency as Currency)}
                </span>
                <span className={`text-sm font-medium ${currentPlan === 'advisor' ? 'text-gray-600' : 'text-white/60'}`}>/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
              <p className={`text-xs mt-1.5 ${currentPlan === 'advisor' ? 'text-gray-600' : 'text-white/60'}`}>15 startup profiles</p>
            </div>
            <ul className="space-y-2.5 mb-8 flex-1 text-sm">
              <li className={`flex items-start gap-3 ${currentPlan === 'advisor' ? 'text-gray-700' : 'text-white/90'}`}><Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${currentPlan === 'advisor' ? 'text-gray-900' : 'text-white'}`} /><span>Everything in Founder, plus:</span></li>
              <li className={`flex items-start gap-3 ${currentPlan === 'advisor' ? 'text-gray-700' : 'text-white/90'}`}><Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${currentPlan === 'advisor' ? 'text-gray-900' : 'text-white'}`} /><span>15 startup profiles</span></li>
              <li className={`flex items-start gap-3 ${currentPlan === 'advisor' ? 'text-gray-700' : 'text-white/90'}`}><Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${currentPlan === 'advisor' ? 'text-gray-900' : 'text-white'}`} /><span>Portfolio dashboard</span></li>
              <li className={`flex items-start gap-3 ${currentPlan === 'advisor' ? 'text-gray-700' : 'text-white/90'}`}><Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${currentPlan === 'advisor' ? 'text-gray-900' : 'text-white'}`} /><span>Team seats (up to 3)</span></li>
              <li className={`flex items-start gap-3 ${currentPlan === 'advisor' ? 'text-gray-700' : 'text-white/90'}`}><Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${currentPlan === 'advisor' ? 'text-gray-900' : 'text-white'}`} /><span>Advanced analytics</span></li>
              <li className={`flex items-start gap-3 ${currentPlan === 'advisor' ? 'text-gray-700' : 'text-white/90'}`}><Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${currentPlan === 'advisor' ? 'text-gray-900' : 'text-white'}`} /><span>White-label PDFs</span></li>
            </ul>
            {currentPlan === 'advisor' ? (
              <button disabled className="w-full py-3 text-sm font-black rounded-lg cursor-not-allowed" style={{ background: '#d0d0d0', color: '#666666' }}>
                ✓ Your Current Plan
              </button>
            ) : (
              <button
                onClick={() => handleSelectPlan('advisor')}
                className="w-full py-3 text-sm font-black rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                style={{ background: currentPlan === 'advisor' ? TEAL : 'white', color: currentPlan === 'advisor' ? 'white' : TEAL_DARK }}
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Enterprise */}
          <div className={`rounded-2xl p-8 flex flex-col transition-all ${currentPlan === 'enterprise' ? 'bg-blue-50 border-2 border-blue-400 shadow-lg' : 'bg-white border border-gray-200 hover:shadow-lg hover:border-gray-300'}`}>
            {currentPlan === 'enterprise' && (
              <div className="absolute -top-3 right-6 bg-blue-500 text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Your Plan
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-xl font-black text-gray-900 mb-1">Enterprise</h3>
              <p className="text-sm text-gray-500">For VCs &amp; platforms</p>
            </div>
            <div className="mb-7">
              <div className="text-4xl font-black text-gray-900">Custom</div>
              <p className="text-xs text-gray-400 mt-1.5">Tailored to your needs</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1 text-sm">
              <li className="flex items-start gap-3"><Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} /><span className="text-gray-600">Unlimited startup profiles</span></li>
              <li className="flex items-start gap-3"><Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} /><span className="text-gray-600">Full white-label platform</span></li>
              <li className="flex items-start gap-3"><Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} /><span className="text-gray-600">API access</span></li>
              <li className="flex items-start gap-3"><Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} /><span className="text-gray-600">Bulk processing</span></li>
              <li className="flex items-start gap-3"><Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} /><span className="text-gray-600">Dedicated account manager</span></li>
            </ul>
            {currentPlan === 'enterprise' ? (
              <button disabled className="w-full py-3 text-sm font-bold text-center border-2 border-gray-300 rounded-lg bg-gray-200 text-gray-500 cursor-not-allowed">
                ✓ Your Current Plan
              </button>
            ) : (
              <a
                href="/contact"
                className="w-full py-3 text-sm font-bold text-center border-2 border-gray-300 rounded-lg hover:border-gray-500 transition-colors block"
                style={{ color: '#374151' }}
              >
                Contact Sales
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── TRUST LINE ── */}
      <div className="bg-gray-50 py-12 border-y border-gray-200">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-sm text-gray-600 leading-relaxed">
            <strong>Same methodology a CA would use.</strong> Live RBI rates. Real Indian market data. <strong>Results in 60 seconds.</strong>
          </p>
        </div>
      </div>

      {/* ── COMPARISON TABLE ── */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-black text-gray-900 mb-10 text-center">Feature Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-4 font-black text-gray-900">Feature</th>
                <th className="text-center py-4 px-4 font-bold text-gray-700">Explore</th>
                <th className="text-center py-4 px-4 font-bold text-gray-700">Founder</th>
                <th className="text-center py-4 px-4 font-bold text-gray-700">Advisor</th>
                <th className="text-center py-4 px-4 font-bold text-gray-700">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Startup profiles', explore: '1', founder: '3', advisor: '15', enterprise: '∞' },
                { feature: 'Valuation methods', explore: '4/6', founder: '6/6', advisor: '6/6', enterprise: '6/6' },
                { feature: 'Full PDF report', explore: false, founder: true, advisor: true, enterprise: true },
                { feature: 'AI pitch extraction', explore: false, founder: true, advisor: true, enterprise: true },
                { feature: 'Indian comparables', explore: false, founder: true, advisor: true, enterprise: true },
                { feature: 'Shareable investor link', explore: false, founder: true, advisor: true, enterprise: true },
                { feature: 'Currency toggle', explore: false, founder: true, advisor: true, enterprise: true },
                { feature: 'Methodological assumptions', explore: false, founder: true, advisor: true, enterprise: true },
                { feature: 'White-label PDFs', explore: false, founder: false, advisor: true, enterprise: true },
                { feature: 'API access', explore: false, founder: false, advisor: false, enterprise: true },
                { feature: 'Portfolio dashboard', explore: false, founder: false, advisor: true, enterprise: true },
              ].map(({ feature, explore, founder, advisor, enterprise }) => (
                <tr key={feature} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-700 font-medium">{feature}</td>
                  <td className="text-center py-3 px-4">{typeof explore === 'boolean' ? (explore ? <Check className="w-4 h-4 mx-auto" style={{ color: TEAL }} /> : <span className="text-gray-300">—</span>) : <span className="text-sm font-semibold text-gray-900">{explore}</span>}</td>
                  <td className="text-center py-3 px-4">{typeof founder === 'boolean' ? (founder ? <Check className="w-4 h-4 mx-auto" style={{ color: TEAL }} /> : <span className="text-gray-300">—</span>) : <span className="text-sm font-semibold text-gray-900">{founder}</span>}</td>
                  <td className="text-center py-3 px-4">{typeof advisor === 'boolean' ? (advisor ? <Check className="w-4 h-4 mx-auto" style={{ color: TEAL }} /> : <span className="text-gray-300">—</span>) : <span className="text-sm font-semibold text-gray-900">{advisor}</span>}</td>
                  <td className="text-center py-3 px-4">{typeof enterprise === 'boolean' ? (enterprise ? <Check className="w-4 h-4 mx-auto" style={{ color: TEAL }} /> : <span className="text-gray-300">—</span>) : <span className="text-sm font-semibold text-gray-900">{enterprise}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── FAQ ── */}
      <section className="border-t border-gray-100 bg-gray-50 py-20">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-black text-gray-900 mb-10 text-center tracking-tight">Frequently asked</h2>
          <div className="space-y-3">
            {faqs.map(({ q, a }, i) => (
              <div key={q} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  className="w-full text-left px-6 py-4 flex items-center justify-between gap-4"
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

      {/* ── FOOTER CTA ── */}
      <section className="py-20 text-center" style={{ background: NAV_DARK }}>
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-black text-white mb-3 leading-snug">
            Not sure which plan?
          </h2>
          <p className="mb-10 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Start free. Upgrade when you need your investor-ready report.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <button className="px-8 py-3 text-sm font-bold text-white rounded hover:opacity-90 transition-opacity" style={{ background: TEAL }}>
                START FREE
              </button>
            </Link>
            <a href="/contact" className="px-8 py-3 text-sm font-bold text-white border-2 border-white/30 rounded hover:border-white transition-colors block">
              TALK TO US
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={null}>
      <PricingContent />
    </Suspense>
  );
}
