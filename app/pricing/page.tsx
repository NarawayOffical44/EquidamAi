import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PricingClient } from './PricingClient';
import { PRICING_BY_CURRENCY, type Currency } from '@/lib/utils/currency';

export const metadata: Metadata = {
  title: 'Startup Valuation Pricing for Reports & API Credits',
  description: 'Compare Evaldam plans for free previews, founder reports, Startup AI, advisor workspaces, enterprise programs, API credits, and investor-ready PDFs.',
  keywords: ['startup valuation pricing', 'professional valuation plans', 'Indian startup valuation', 'funding valuation tool', 'VC valuation methods'],
  alternates: {
    canonical: 'https://equidamai.com/pricing',
  },
  openGraph: {
    title: 'Startup Valuation Pricing for Reports & API Credits',
    description: 'Compare free previews, founder reports, Startup AI, advisor workspaces, enterprise programs, API credits, and investor-ready PDFs.',
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
    title: 'Startup Valuation Pricing for Reports & API Credits',
    images: ['https://equidamai.com/opengraph-image'],
    description: 'Choose the Evaldam path for founder reports, team workspaces, portfolio programs, investor-ready PDFs, or API credits.',
  },
};

const faqs = [
  { q: 'Can I preview Evaldam before paying?', a: 'Yes. Use the website valuation preview and Evaldam Startup AI with preview limits before choosing a paid plan for the full workspace and report flow.' },
  { q: 'Is Evaldam Startup AI sold separately?', a: 'No. Evaldam Startup AI is included with Evaldam AI plans. Visitors and free dashboard accounts can try it with limited access, and paid plans include higher limits. The app notifies users when a limit is reached.' },
  { q: 'How does the AI valuation work?', a: 'Upload your pitch deck or company info, and our AI extracts key data and runs 6 professional valuation methods simultaneously, delivering a blended result with full methodology transparency.' },
  { q: 'What market comparables does Evaldam use?', a: 'We benchmark against real company data across 40+ markets — public companies, recent M&A deals, and angel/seed rounds — with country-specific rates and risk adjustments. Coverage runs deep even in emerging markets like India, where most valuation tools stay shallow.' },
  { q: 'Can I edit and regenerate reports?', a: 'Absolutely. Edit any startup data, adjust methodological assumptions, and regenerate valuations instantly. Unlimited revisions are included in Startup and Agency / Investor plans.' },
  { q: 'How do I share my report with investors?', a: 'Download the investor-ready PDF report and share it directly. The report includes the six-method breakdown, key assumptions, sensitivity analysis, and evidence trail.' },
  { q: 'Do I need a paid plan for the platform dashboard?', a: "No. Free accounts can use one lifetime startup workspace with watermarked PDF limits. Paid plans unlock Evaldam AI Score, more capacity, teams, and advanced workflows." },
];

const pricingOfferCurrencies: Currency[] = ["INR", "USD", "EUR"];

const pricingOffers = pricingOfferCurrencies.map((currency) => {
  const pricing = PRICING_BY_CURRENCY[currency];

  return {
    "@type": "AggregateOffer",
    priceCurrency: currency,
    lowPrice: "0",
    highPrice: String(Math.max(pricing.pro_price, pricing.plus_price, pricing.pro_annual, pricing.plus_annual)),
    offerCount: "4",
    url: "https://equidamai.com/pricing",
  };
});

const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": "https://equidamai.com/pricing#pricing",
  name: "Evaldam AI Pricing",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://equidamai.com/pricing",
  publisher: { "@id": "https://equidamai.com/#organization" },
  description:
    "Pricing for Evaldam AI startup valuation reports, Startup AI access, advisor workspaces, enterprise programs, and API credits.",
  offers: pricingOffers,
};

const pricingFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

export default function PricingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingFaqJsonLd) }} />

      {/* Substantial unique explanatory content to address low-value / templated content concerns */}
      <div className="max-w-4xl mx-auto px-4 pt-12 pb-8 sm:px-6 text-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Why pricing at Evaldam is built around real founder workflows</h2>
        <p className="text-base leading-relaxed mb-4">
          Most valuation tools charge for the calculation itself. Evaldam charges for the complete workflow that turns a number into something you can actually use: documented assumptions, comparable reasoning, scenario analysis, investor-ready PDF, and the ability to update the same model over time as your traction changes. The free tier exists so you can prove the value before committing. Paid plans remove limits on reports, team collaboration, API access, and white-label output that professional users and agencies need.
        </p>
        <p className="text-base leading-relaxed mb-4">
          The pricing is deliberately transparent and usage-based where it makes sense (API credits, bulk valuations). There are no hidden “enterprise” fees for basic report generation or methodology access. Every plan includes the same six-method engine; the difference is capacity, collaboration, and export rights. This structure avoids the common pattern of “pay more to unlock the real features” that makes many SaaS pricing pages feel like traps.
        </p>
        <p className="text-base leading-relaxed">
          Founders start on the free preview to see the quality before committing. Paid plans simply remove the artificial limits that get in the way once you decide the output is worth using.
        </p>
      </div>

      <Suspense fallback={null}>
        <PricingClient faqs={faqs} />
      </Suspense>
    </>
  );
}
