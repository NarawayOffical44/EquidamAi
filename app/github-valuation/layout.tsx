import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GitHub Repo Valuation Calculator",
  description: "Value a public GitHub repository as an idea-stage startup. Evaldam reviews code execution, adoption signals, market potential, monetization clarity, and the extra startup details needed for a full valuation report.",
  keywords: [
    "GitHub repo valuation",
    "open source startup valuation",
    "idea stage startup valuation",
    "developer tool startup valuation",
    "technical founder startup valuation",
    "developer startup valuation",
    "AI repo valuation",
    "GitHub startup calculator",
    "Berkus method repo valuation",
    "Scorecard method startup valuation",
  ],
  alternates: {
    canonical: "https://equidamai.com/github-valuation",
    languages: {
      "en-IN": "https://equidamai.com/github-valuation",
      "en-US": "https://equidamai.com/github-valuation",
      "en-GB": "https://equidamai.com/github-valuation",
      "en-AE": "https://equidamai.com/github-valuation",
      "x-default": "https://equidamai.com/github-valuation",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://equidamai.com/github-valuation",
    title: "GitHub Repo Valuation Calculator",
    description: "Estimate what a public GitHub repo could be worth as an idea-stage startup, then create a full startup valuation with customer, market, revenue, and founder details.",
    siteName: "Evaldam AI",
    images: [
      {
        url: "https://equidamai.com/github-valuation/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Evaldam AI GitHub repo startup valuation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GitHub Repo Valuation Calculator",
    description: "Turn a public GitHub repo into an idea-stage startup valuation preview for technical founders.",
    images: ["https://equidamai.com/github-valuation/opengraph-image"],
  },
};

export default function GitHubValuationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
