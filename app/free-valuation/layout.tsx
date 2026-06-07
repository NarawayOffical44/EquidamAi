import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Startup Valuation Calculator | Free Pre-Money Valuation",
  description: "Use Evaldam's startup valuation calculator to get a free directional pre-money valuation from public website signals, then add complete startup details for a professional valuation report.",
  keywords: [
    "startup valuation calculator",
    "free startup valuation",
    "free startup valuation calculator",
    "startup valuation",
    "pre money valuation calculator",
    "free pre money valuation",
    "startup valuation checker",
    "startup valuation India",
    "startup valuation report",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://equidamai.com/free-valuation",
    title: "Startup Valuation Calculator | Free Pre-Money Valuation",
    description: "Get a free directional startup valuation from public website signals, then add full startup details after signup for a professional report.",
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
    title: "Startup Valuation Calculator | Free Pre-Money Valuation",
    description: "Get a free startup valuation from public website signals. Create an account to build the full valuation report.",
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

