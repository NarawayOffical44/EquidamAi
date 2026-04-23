'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ArrowRight, LogIn, AlertCircle, PartyPopper, Sparkles } from 'lucide-react';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const searchParams = useSearchParams();
  const noSub = searchParams.get('noSub') === 'true';
  const justSignedUp = searchParams.get('signup') === 'true';

  const handleSelectPlan = (plan: 'pro' | 'plus') => {
    window.location.href = `/checkout?plan=${plan}&billingCycle=${billingCycle}`;
  };

  const pricing = {
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
    { q: 'How does the AI valuation work?', a: 'Upload your pitch deck or company info, and our AI extracts key data and runs 5 professional valuation methods simultaneously — delivering a blended result with full methodology transparency in under 60 seconds.' },
    { q: 'Can I add more startups later?', a: 'Yes — upgrade anytime. Your plan determines how many active startup profiles you can manage simultaneously.' },
    { q: 'Can I download the reports?', a: 'Yes. All reports are available as PDFs — both one-page summaries and full 25–35 page professional reports with charts and analysis.' },
    { q: 'Can I edit and regenerate reports?', a: 'Absolutely. Edit any startup data and regenerate valuations instantly. Unlimited revisions are included in all plans.' },
    { q: 'Is there a free trial?', a: 'Yes — create an account and explore the platform. Choose a plan when you\'re ready to run your first full valuation.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container-max px-container h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-[14px] h-[14px] text-white" />
            </div>
            <span className="font-bold text-gray-900 tracking-tight">Evaldam AI</span>
          </Link>
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <LogIn className="w-4 h-4" />
            Sign In
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div className="container-max px-container pt-16 pb-10 text-center">
        {noSub && (
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-2.5 mb-6 text-sm font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            No active subscription found. Choose a plan to access the platform.
          </div>
        )}
        {justSignedUp && !noSub && (
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-2.5 mb-6 text-sm font-medium">
            <PartyPopper className="w-4 h-4 flex-shrink-0" />
            Account created! Choose a plan to start your first valuation.
          </div>
        )}

        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">Simple, transparent pricing</h1>
        <p className="text-lg text-gray-500 mb-8">Professional startup valuations for every stage.</p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-3 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${billingCycle === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${billingCycle === 'annual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Annual
            <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">Save 10%</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container-max px-container pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">

          {/* Pro */}
          <div className="bg-white border border-gray-200 rounded-2xl p-7 flex flex-col hover:shadow-md transition-shadow">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-1">Pro</h3>
              <p className="text-sm text-gray-500">For individual founders</p>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900">${billingCycle === 'monthly' ? pricing.pro.monthly : pricing.pro.annual}</span>
                <span className="text-gray-500 text-sm">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Up to {pricing.pro.startups} startup profiles</p>
            </div>
            <ul className="space-y-2.5 mb-8 flex-1">
              {pricing.pro.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">{f}</span>
                </li>
              ))}
            </ul>
            <button onClick={() => handleSelectPlan('pro')} className="btn btn-secondary w-full flex items-center justify-center gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Plus (Featured) */}
          <div className="relative bg-gray-950 border border-gray-900 rounded-2xl p-7 flex flex-col shadow-xl">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-1">Plus</h3>
              <p className="text-sm text-gray-400">For growing teams</p>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">${billingCycle === 'monthly' ? pricing.plus.monthly : pricing.plus.annual}</span>
                <span className="text-gray-400 text-sm">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Up to {pricing.plus.startups} startup profiles</p>
            </div>
            <ul className="space-y-2.5 mb-8 flex-1">
              {pricing.plus.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-300">{f}</span>
                </li>
              ))}
            </ul>
            <button onClick={() => handleSelectPlan('plus')} className="btn btn-primary w-full flex items-center justify-center gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Enterprise */}
          <div className="bg-white border border-gray-200 rounded-2xl p-7 flex flex-col hover:shadow-md transition-shadow">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-1">Enterprise</h3>
              <p className="text-sm text-gray-500">For VCs &amp; platforms</p>
            </div>
            <div className="mb-6">
              <div className="text-4xl font-bold text-gray-900">Custom</div>
              <p className="text-xs text-gray-400 mt-1">Tailored to your needs</p>
            </div>
            <ul className="space-y-2.5 mb-8 flex-1">
              {pricing.enterprise.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">{f}</span>
                </li>
              ))}
            </ul>
            <a href="/contact" className="btn btn-secondary w-full text-center">Contact Sales</a>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="border-t border-gray-100 py-section bg-gray-50">
        <div className="container-sm px-container">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Frequently asked</h2>
          <div className="space-y-5">
            {faqs.map(({ q, a }) => (
              <div key={q} className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">{q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-gray-950 py-section">
        <div className="container-sm px-container text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Ready for professional valuations?</h2>
          <p className="text-gray-400 mb-8">Join founders raising in the US, UK and UAE who trust Evaldam.</p>
          <button
            onClick={() => { window.location.href = '/signup'; }}
            className="btn btn-primary btn-lg flex items-center gap-2 mx-auto"
          >
            Start Free Trial <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
