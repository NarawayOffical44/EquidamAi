import type { Metadata } from "next";
import { IndiaFinanceAiChat } from "../india-finance-ai/IndiaFinanceAiChat";

const pageUrl = "https://equidamai.com/india-startup-ai";

export const metadata: Metadata = {
  title: "Evaldam Startup AI for Indian Founders",
  description:
    "Chat with Evaldam Startup AI for Indian startup questions across fundraising, dilution, ESOP, CCPS, CCD, runway, valuation, term sheets, and investor-readiness.",
  keywords: [
    "Evaldam Startup AI",
    "India Startup AI",
    "Indian startup assistant",
    "startup advice AI India",
    "startup guidance AI India",
    "fundraising AI for Indian startups",
    "startup fundraising assistant India",
    "startup dilution India",
    "CCPS CCD startup India",
    "ESOP dilution India",
    "startup runway AI",
    "term sheet AI India",
    "founder assistant AI",
    "Indian startup valuation AI",
  ],
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "Evaldam Startup AI for Indian Founders",
    description:
      "Ask focused Indian startup questions before investor conversations: fundraising terms, dilution, ESOP, CCPS, CCD, runway, valuation, and investor pushback.",
    url: pageUrl,
    type: "website",
    siteName: "Evaldam AI",
    images: [
      {
        url: "https://equidamai.com/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Evaldam Startup AI for Indian founders",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Evaldam Startup AI | Indian Startup Assistant",
    description:
      "A focused AI chat for Indian startup fundraising, dilution, ESOP, CCPS, CCD, runway, valuation, and investor-readiness.",
    images: ["https://equidamai.com/opengraph-image"],
  },
};

const indiaStartupAiJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": `${pageUrl}#software`,
  name: "Evaldam Startup AI",
  alternateName: "India Startup AI",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: pageUrl,
  publisher: { "@id": "https://equidamai.com/#organization" },
  description:
    "AI chat for Indian startup questions across fundraising, dilution, ESOP, CCPS, CCD, runway, valuation, term sheets, and investor-readiness.",
  featureList: [
    "Indian startup fundraising questions",
    "Dilution, ownership, and cap table explanations",
    "ESOP, CCPS, CCD, and term-sheet context",
    "Runway, burn, and investor-readiness prompts",
    "Startup valuation support",
    "Founder decision support for Indian startups",
    "Plan-based question limits inside Evaldam",
  ],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Preview access with higher limits included in Evaldam plans.",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://equidamai.com",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Evaldam Startup AI",
      item: pageUrl,
    },
  ],
};

const jsonLd = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");

export default function IndiaStartupAiPage() {
  return (
    <div className="h-screen overflow-hidden bg-white text-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(indiaStartupAiJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd) }} />
      <IndiaFinanceAiChat />
    </div>
  );
}
