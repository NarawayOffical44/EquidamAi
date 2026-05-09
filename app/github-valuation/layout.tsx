import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free GitHub Repo Startup Valuation",
  description: "Value a public GitHub repository as an idea-stage startup. Evaldam reviews execution quality, market potential, adoption signals, monetization clarity, investor risks, and comparable startup patterns.",
  keywords: [
    "GitHub repo valuation",
    "open source startup valuation",
    "idea stage startup valuation",
    "developer tool startup valuation",
    "AI repo valuation",
    "GitHub startup calculator",
    "Berkus method repo valuation",
    "Scorecard method startup valuation",
  ],
  alternates: {
    canonical: "https://equidamai.com/github-valuation",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://equidamai.com/github-valuation",
    title: "Free GitHub Repo Startup Valuation",
    description: "Estimate what a public GitHub repo could be worth as an idea-stage startup using execution, traction, monetization, and comparable startup signals.",
    siteName: "Evaldam AI",
    images: [
      {
        url: "https://equidamai.com/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Evaldam AI GitHub repo startup valuation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free GitHub Repo Startup Valuation",
    description: "Turn a public GitHub repo into an idea-stage startup valuation preview.",
    images: ["https://equidamai.com/opengraph-image"],
  },
};

export default function GitHubValuationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
