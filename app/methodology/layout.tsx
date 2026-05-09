import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Startup Valuation Methodology",
  description: "Evaldam AI valuation methodology covering Scorecard, Berkus, VC Method, DCF, comparable multiples, assumptions trails, confidence scoring, and repeatable valuation versions.",
  keywords: [
    "startup valuation methodology",
    "Berkus method",
    "Scorecard valuation method",
    "VC method valuation",
    "DCF startup valuation",
    "startup valuation assumptions",
    "pre money valuation methodology",
  ],
  alternates: {
    canonical: "https://equidamai.com/methodology",
  },
  openGraph: {
    type: "article",
    locale: "en_IN",
    url: "https://equidamai.com/methodology",
    title: "Startup Valuation Methodology | Evaldam AI",
    description: "How Evaldam builds defensible startup valuations with six methods, assumptions trails, comparables, and repeatable scoring.",
    siteName: "Evaldam AI",
    images: [
      {
        url: "https://equidamai.com/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Evaldam AI startup valuation methodology",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Startup Valuation Methodology | Evaldam AI",
    description: "Six-method startup valuation methodology with assumptions trails and repeatable scoring.",
    images: ["https://equidamai.com/opengraph-image"],
  },
};

export default function MethodologyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
