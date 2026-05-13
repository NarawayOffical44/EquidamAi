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
        url: 'https://equidamai.com/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Evaldam AI startup valuation pricing',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Professional Startup Valuation Plans',
    images: ['https://equidamai.com/opengraph-image'],
    description: 'Explore free, Founder ₹4,999/yr, Advisor ₹9,999/yr, Enterprise custom pricing.',
  },
};

const faqs = [
  { q: 'Can I preview Evaldam before paying?', a: 'Yes. Use the website valuation preview to see a directional range before choosing a paid plan for the full workspace and report flow.' },
  { q: 'How does the AI valuation work?', a: 'Upload your pitch deck or company info, and our AI extracts key data and runs 6 professional valuation methods simultaneously — delivering a blended result with full methodology transparency in under 60 seconds.' },
  { q: 'What are Indian market comparables?', a: 'We benchmark against real Indian startup data — NSE/BSE companies, recent M&A deals, and angel/seed investments. Your valuation uses live RBI rates and India-specific risk adjustments.' },
  { q: 'Can I edit and regenerate reports?', a: 'Absolutely. Edit any startup data, adjust methodological assumptions, and regenerate valuations instantly. Unlimited revisions are included in Founder and Advisor plans.' },
  { q: 'How do I share my report with investors?', a: 'Download the investor-ready PDF report and share it directly. The report includes the six-method breakdown, key assumptions, sensitivity analysis, and evidence trail.' },
  { q: 'Do I need a paid plan for the platform dashboard?', a: "Yes. Dashboard access, startup workspaces, full reports, saved assumptions, and PDF exports require an active paid plan." },
];

export default function PricingPage() {
  return (
    <Suspense fallback={null}>
      <PricingClient faqs={faqs} />
    </Suspense>
  );
}
