import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Startup Comparables & Peer Benchmarks",
  description:
    "Find startup comparables by stage, sector, ARR, growth, and valuation context to defend valuation assumptions before investor conversations.",
  keywords:
    "startup comparables, comparable companies for valuation, valuation benchmarks, Indian startup valuation comparables, startup peer analysis, investor valuation defense",
  alternates: {
    canonical: "https://equidamai.com/comparable-companies",
    languages: {
      "en-IN": "https://equidamai.com/comparable-companies",
      "en-US": "https://equidamai.com/comparable-companies",
      "en-GB": "https://equidamai.com/comparable-companies",
      "en-AE": "https://equidamai.com/comparable-companies",
      "x-default": "https://equidamai.com/comparable-companies",
    },
  },
  openGraph: {
    title: "Startup Comparables & Peer Benchmarks",
    description:
      "Search comparable companies and use peer context to pressure-test valuation assumptions before investor conversations.",
    url: "https://equidamai.com/comparable-companies",
    type: "website",
    siteName: "Evaldam AI",
    images: [
      {
        url: "https://equidamai.com/comparable-companies/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Evaldam AI startup comparables and peer benchmarks",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Startup Comparables & Peer Benchmarks",
    description: "Search startup comparables by stage, sector, ARR, growth, and valuation context.",
    images: ["https://equidamai.com/comparable-companies/opengraph-image"],
  },
};

export default function ComparableCompaniesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
