'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, ArrowRight, AlertCircle, PartyPopper, Menu, X, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function PricingContent() {
  // Color constants (from globals.css theme)
  const TEAL = '#00b2b2';
  const TEAL_DARK = '#007a7a';
  const NAV_DARK = '#111827';

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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

  const handleSelectPlan = (plan: 'pro' | 'plus') => {
    window.location.href = `/checkout?plan=${plan}&billingCycle=${billingCycle}`;
  };

  const pricing = {
    free: {
      monthly: 0,
      annual: 0,
      startups: 1,
      reports: 3,
      features: [
        '1 active startup profile',
        '3 evaluation reports',
        'AI auto-fill from pitch deck',
        'Basic valuation reports',
        'Export as PDF',
        'Then upgrade for unlimited',
      ],
    },
    pro: {
      monthly: 99,
      annual: Math.round(99 * 12 * 0.9),
      startups: 3,
      features: [
        '3 active startup profiles',
        'Unlimited revisions per profile',
        'AI auto-fill from pitch deck',
        'One-page VC summary (PDF)',
        'Full professional report (PDF)',
        'Basic analytics',
      ],
    },
    plus: {
      monthly: 199,
      annual: Math.round(199 * 12 * 0.9),
      startups: 15,
      features: [
        '15 active startup profiles',
        'Unlimited revisions per profile',
        'AI auto-fill from pitch deck',
        'One-page VC summary (PDF)',
        'Full professional report (PDF)',
        'Advanced analytics',
        'Startup portfolio management',
        'Team seats (up to 3)',
      ],
    },
    enterprise: {
      features: [
        'Unlimited startup profiles',
        'White-label platform',
        'API access',
        'Bulk processing',
        'Dedicated account manager',
        'Custom SLA & support',
      ],
    },
  };

  const faqs = [
    { q: 'Is there a free plan?', a: 'Yes! The Free plan includes 1 startup profile and 3 evaluation reports. Once you hit your limit, upgrade to Pro or Plus for unlimited reports and more startup profiles.' },
    { q: 'How does the AI valuation work?', a: 'Upload your pitch deck or company info, and our AI extracts key data and runs 5 professional valuation methods simultaneously — delivering a blended result with full methodology transparency in under 60 seconds.' },
    { q: 'Can I add more startups later?', a: 'Yes — upgrade anytime. Your plan determines how many active startup profiles you can manage simultaneously.' },
    { q: 'Can I download the reports?', a: 'Yes. All reports are available as PDFs — both one-page summaries and full 25–35 page professional reports with charts and analysis.' },
    { q: 'Can I edit and regenerate reports?', a: 'Absolutely. Edit any startup data and regenerate valuations instantly. Unlimited revisions are included in all plans.' },
    { q: 'Is there a free trial?', a: "Yes — create an account and explore the platform. Choose a plan when you're ready to run your first full valuation." },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-black tracking-tight text-primary">
              evaldam
            </Link>

            <div className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
              <a href="/#valuation" className="hover:text-gray-900 transition-colors">Valuation</a>
              <Link href="/pricing" className="font-bold text-primary transition-colors">Pricing</Link>
              <a href="/#customers" className="hover:text-gray-900 transition-colors">Customers</a>
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
                  Buy Now
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
            {["Valuation", "Customers", "Resources"].map((item) => (
              <a key={item} href="/#" className="block text-sm font-medium text-gray-600 hover:text-gray-900" onClick={() => setMobileOpen(false)}>{item}</a>
            ))}
            <div className="pt-3 border-t border-gray-100 flex gap-2">
              <Link href="/login" className="flex-1"><button className="w-full py-2 text-sm font-semibold border border-gray-300 rounded">Login</button></Link>
              <Link href="/signup" className="flex-1"><button className="w-full py-2 text-sm font-bold text-white rounded" style={{ background: TEAL }}>Buy Now</button></Link>
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
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-gray-500 mb-10">Professional startup valuations for every stage.</p>

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

          {/* Free */}
          <div className={`rounded-2xl p-8 flex flex-col transition-all ${currentPlan === 'free' ? 'bg-blue-50 border-2 border-blue-400 shadow-lg' : 'bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 hover:shadow-lg hover:border-gray-300'}`}>
            {currentPlan === 'free' && (
              <div className="absolute -top-3 right-6 bg-blue-500 text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Your Plan
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-xl font-black text-gray-900 mb-1">Free</h3>
              <p className="text-sm text-gray-500">Get started now</p>
            </div>
            <div className="mb-7">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-gray-900">$0</span>
                <span className="text-gray-400 text-sm font-medium">/forever</span>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Perfect to try it out</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {pricing.free.features.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} />
                  <span className="text-sm text-gray-600">{f}</span>
                </li>
              ))}
            </ul>
            {currentPlan === 'free' ? (
              <button disabled className="w-full py-3 text-sm font-bold rounded-lg bg-gray-200 text-gray-500 cursor-not-allowed">
                ✓ Your Current Plan
              </button>
            ) : (
              <Link href="/signup">
                <button className="w-full py-3 text-sm font-bold rounded-lg transition-all border-2 border-gray-300 hover:border-gray-400 text-gray-800">
                  Sign Up Free
                </button>
              </Link>
            )}
          </div>

          {/* Pro */}
          <div className={`rounded-2xl p-8 flex flex-col transition-all ${currentPlan === 'pro' ? 'bg-blue-50 border-2 border-blue-400 shadow-lg' : 'bg-white border border-gray-200 hover:shadow-lg hover:border-gray-300'}`}>
            {currentPlan === 'pro' && (
              <div className="absolute -top-3 right-6 bg-blue-500 text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Your Plan
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-xl font-black text-gray-900 mb-1">Pro</h3>
              <p className="text-sm text-gray-500">For individual founders</p>
            </div>
            <div className="mb-7">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-gray-900">
                  ${billingCycle === 'monthly' ? pricing.pro.monthly : pricing.pro.annual}
                </span>
                <span className="text-gray-400 text-sm font-medium">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Up to {pricing.pro.startups} startup profiles</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {pricing.pro.features.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} />
                  <span className="text-sm text-gray-600">{f}</span>
                </li>
              ))}
            </ul>
            {currentPlan === 'pro' ? (
              <button disabled className="w-full py-3 text-sm font-bold text-gray-800 border-2 border-gray-300 rounded-lg bg-gray-200 text-gray-500 cursor-not-allowed">
                ✓ Your Current Plan
              </button>
            ) : (
              <button
                onClick={() => handleSelectPlan('pro')}
                className="w-full py-3 text-sm font-bold text-gray-800 border-2 border-gray-300 rounded-lg hover:border-gray-500 transition-colors flex items-center justify-center gap-2"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Plus (Featured) */}
          <div className="relative rounded-2xl p-8 flex flex-col transition-all" style={{ background: currentPlan === 'plus' ? '#e0f5f5' : TEAL, boxShadow: currentPlan === 'plus' ? '0 20px 25px -5px rgba(0,178,178,0.2)' : '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="text-[11px] font-black uppercase tracking-wide whitespace-nowrap text-white px-4 py-1.5 rounded-full" style={{ background: currentPlan === 'plus' ? TEAL : TEAL_DARK }}>
                {currentPlan === 'plus' ? 'Your Plan' : 'Most Popular'}
              </span>
            </div>
            <div className="mb-6">
              <h3 className={`text-xl font-black mb-1 ${currentPlan === 'plus' ? 'text-gray-900' : 'text-white'}`}>Plus</h3>
              <p className={`text-sm ${currentPlan === 'plus' ? 'text-gray-600' : 'text-white/70'}`}>For growing teams</p>
            </div>
            <div className="mb-7">
              <div className="flex items-baseline gap-1">
                <span className={`text-5xl font-black ${currentPlan === 'plus' ? 'text-gray-900' : 'text-white'}`}>
                  ${billingCycle === 'monthly' ? pricing.plus.monthly : pricing.plus.annual}
                </span>
                <span className={`text-sm font-medium ${currentPlan === 'plus' ? 'text-gray-600' : 'text-white/60'}`}>/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
              <p className={`text-xs mt-1.5 ${currentPlan === 'plus' ? 'text-gray-600' : 'text-white/60'}`}>Up to {pricing.plus.startups} startup profiles</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {pricing.plus.features.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${currentPlan === 'plus' ? 'text-gray-900' : 'text-white'}`} />
                  <span className={`text-sm ${currentPlan === 'plus' ? 'text-gray-700' : 'text-white/90'}`}>{f}</span>
                </li>
              ))}
            </ul>
            {currentPlan === 'plus' ? (
              <button disabled className="w-full py-3 text-sm font-black rounded-lg cursor-not-allowed" style={{ background: '#d0d0d0', color: '#666666' }}>
                ✓ Your Current Plan
              </button>
            ) : (
              <button
                onClick={() => handleSelectPlan('plus')}
                className="w-full py-3 text-sm font-black rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                style={{ background: currentPlan === 'plus' ? TEAL : 'white', color: currentPlan === 'plus' ? 'white' : TEAL_DARK }}
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
              <div className="text-5xl font-black text-gray-900">Custom</div>
              <p className="text-xs text-gray-400 mt-1.5">Tailored to your needs</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {pricing.enterprise.features.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TEAL }} />
                  <span className="text-sm text-gray-600">{f}</span>
                </li>
              ))}
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

      {/* ── FAQ ── */}
      <section className="border-t border-gray-100 bg-gray-50 py-20">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-black text-gray-900 mb-10 text-center tracking-tight">
            Frequently asked
          </h2>
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
          <p className="text-xs font-black uppercase tracking-widest mb-5" style={{ color: TEAL }}>GET STARTED NOW</p>
          <h2 className="text-3xl font-black text-white mb-3 leading-snug">
            Ready for professional valuations?
          </h2>
          <p className="mb-10 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Join founders raising in the US, UK and UAE who trust Evaldam.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <button className="px-8 py-3 text-sm font-bold text-white border-2 border-white/30 rounded hover:border-white transition-colors">
                GET A DEMO
              </button>
            </Link>
            <button
              onClick={() => { window.location.href = '/signup'; }}
              className="px-8 py-3 text-sm font-bold text-white rounded hover:opacity-90 transition-opacity"
              style={{ background: TEAL }}
            >
              START FREE TRIAL
            </button>
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
