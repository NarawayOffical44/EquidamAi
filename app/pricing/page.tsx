import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PricingClient } from './PricingClient';

export const metadata: Metadata = {
  title: 'Professional Startup Valuation Plans | Evaldam AI',
  description: 'Transparent pricing for professional startup valuations. Explore (free), Founder (₹4,999/yr), Advisor (₹9,999/yr), Enterprise (custom). Indian market data. Investor-ready in 60 seconds.',
  keywords: ['startup valuation pricing', 'professional valuation plans', 'Indian startup valuation', 'funding valuation tool', 'VC valuation methods'],
  openGraph: {
    title: 'Professional Startup Valuation Plans',
    description: 'Methodology-backed. Indian market data. Investor-ready in 60 seconds.',
    type: 'website',
    url: 'https://equidamai.com/pricing',
    siteName: 'Evaldam AI',
    images: [
      {
        url: 'https://equidamai.com/logo.png',
        width: 360,
        height: 360,
        alt: 'Evaldam AI Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Professional Startup Valuation Plans',
    description: 'Explore free, Founder ₹4,999/yr, Advisor ₹9,999/yr, Enterprise custom pricing.',
  },
};

const faqs = [
  { q: 'Can I try Evaldam for free?', a: 'Yes! The Explore plan is completely free forever. You get 1 startup profile, 1 valuation report, and see the valuation range. Perfect for trying us out before upgrading.' },
  { q: 'How does the AI valuation work?', a: 'Upload your pitch deck or company info, and our AI extracts key data and runs 6 professional valuation methods simultaneously — delivering a blended result with full methodology transparency in under 60 seconds.' },
  { q: 'What are Indian market comparables?', a: 'We benchmark against real Indian startup data — NSE/BSE companies, recent M&A deals, and angel/seed investments. Your valuation uses live RBI rates and India-specific risk adjustments.' },
  { q: 'Can I edit and regenerate reports?', a: 'Absolutely. Edit any startup data, adjust methodological assumptions, and regenerate valuations instantly. Unlimited revisions are included in Founder and Advisor plans.' },
  { q: 'How do I share my report with investors?', a: 'Generate a shareable investor link (Founder plan+). Investors can view your full 6-method breakdown without signing up. You control expiry and access.' },
  { q: 'Is there a free trial?', a: "Yes — create a free account and run your first free valuation immediately. No credit card needed. Upgrade to Founder ($60/yr) when you need the full investor-ready report." },
];

export default function PricingPage() {
  return (
    <Suspense fallback={null}>
      <PricingClient faqs={faqs} />
    </Suspense>
  );
}
