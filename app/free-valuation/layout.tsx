import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Startup Valuation Checker",
  description: "Get a free startup valuation preview instantly. No signup required. Uses public website signals and 4 valuation methods, with an upgrade path to the full 6-method investor-ready report.",
  keywords: "free startup valuation, startup valuation checker, instant valuation, AI valuation, startup evaluation tool, Indian startup valuation free, pre money valuation calculator, startup valuation India",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://equidamai.com/free-valuation",
    title: "Free Startup Valuation Checker",
    description: "Check your startup valuation instantly with AI. No signup, no credit card required. No guesswork.",
    siteName: "Evaldam AI",
    images: [
      {
        url: "https://equidamai.com/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Evaldam AI free startup valuation checker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Startup Valuation Checker",
    description: "Get a free startup valuation preview from public website signals. No signup. No credit card. Upgrade for the full investor-ready report.",
    images: ["https://equidamai.com/opengraph-image"],
  },
  alternates: {
    canonical: "https://equidamai.com/free-valuation",
  },
};

export default function FreeValuationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
