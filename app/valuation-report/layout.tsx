import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Investor-Ready Valuation Report",
  description: "See what is included in Evaldam's startup valuation report for Indian founders, advisors, accelerators, and VCs: six-method analysis, assumptions, comparable context, and investor-ready PDF output.",
  keywords: "startup valuation report, startup valuation India, seed round valuation, startup valuation for advisors, startup valuation for accelerators, startup valuation for VCs, startup valuation consultant alternative",
  alternates: {
    canonical: "https://equidamai.com/valuation-report",
  },
  openGraph: {
    title: "Investor-Ready Valuation Report | Evaldam AI",
    description: "Get investor-ready valuation reports with 6 methods, assumptions, comparable context, and India-focused benchmarks.",
    url: "https://equidamai.com/valuation-report",
    type: "website",
    siteName: "Evaldam AI",
    images: [
      {
        url: "https://equidamai.com/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Evaldam AI investor-ready startup valuation report",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Investor-Ready Valuation Report | Evaldam AI",
    description: "Get startup valuation reports with six methods, assumptions, comparables, and investor-ready PDF output.",
    images: ["https://equidamai.com/opengraph-image"],
  },
};

export default function ValuationReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
