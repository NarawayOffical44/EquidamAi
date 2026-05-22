import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PricingClient } from './PricingClient';

export const metadata: Metadata = {
  title: 'Startup Valuation Plans',
  description: 'Pricing by buying moment: free preview, founder report path, Startup plan, Agency / Investor workspace, Enterprise programs, and API credits.',
  keywords: ['startup valuation pricing', 'professional valuation plans', 'Indian startup valuation', 'funding valuation tool', 'VC valuation methods'],
  openGraph: {
    title: 'Startup Valuation Plans',
    description: 'Free preview, founder report path, Startup plan, Advisor / Investor workspace, Enterprise programs, and API credits.',
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
    title: 'Startup Valuation Plans',
    images: ['https://equidamai.com/opengraph-image'],
    description: 'Choose the Evaldam path for your buying moment: founder report, team workspace, portfolio program, or API credits.',
  },
};

const faqs = [
  { q: 'Can I preview Evaldam before paying?', a: 'Yes. Use the website valuation preview and Evaldam Startup AI with preview limits before choosing a paid plan for the full workspace and report flow.' },
  { q: 'Is Evaldam Startup AI sold separately?', a: 'No. Evaldam Startup AI is included with Evaldam plans. Visitors can try it with hard limits, and paid plans include higher monthly limits.' },
  { q: 'How does the AI valuation work?', a: 'Upload your pitch deck or company info, and our AI extracts key data and runs 6 professional valuation methods simultaneously, delivering a blended result with full methodology transparency.' },
  { q: 'What are Indian market comparables?', a: 'We benchmark against real Indian startup data: NSE/BSE companies, recent M&A deals, and angel/seed investments. Your valuation uses live RBI rates and India-specific risk adjustments.' },
  { q: 'Can I edit and regenerate reports?', a: 'Absolutely. Edit any startup data, adjust methodological assumptions, and regenerate valuations instantly. Unlimited revisions are included in Startup and Agency / Investor plans.' },
  { q: 'How do I share my report with investors?', a: 'Download the investor-ready PDF report and share it directly. The report includes the six-method breakdown, key assumptions, sensitivity analysis, and evidence trail.' },
  { q: 'Do I need a paid plan for the platform dashboard?', a: "No. Free accounts can use one lifetime startup workspace with watermarked PDF limits. Paid plans unlock Evaldam AI Score, more capacity, teams, and advanced workflows." },
];

export default function PricingPage() {
  return (
    <Suspense fallback={null}>
      <PricingClient faqs={faqs} />
    </Suspense>
  );
}
