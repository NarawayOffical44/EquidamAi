import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Startup Valuation Checker | Evaldam AI",
  description: "Get an instant free startup valuation in 60 seconds. No signup required. Powered by AI using 2 professional valuation methods. Perfect for Indian startups.",
  keywords: "free startup valuation, startup valuation checker, instant valuation, AI valuation, startup evaluation tool, Indian startup valuation free",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://equidamai.com/free-valuation",
    title: "Free Startup Valuation Checker - Get Instant Results",
    description: "Check your startup valuation instantly with AI. No signup, no credit card required. Results in 60 seconds.",
    siteName: "Evaldam AI",
    images: [
      {
        url: "https://equidamai.com/logo.png",
        width: 360,
        height: 360,
        alt: "Evaldam AI Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Startup Valuation Checker",
    description: "Get your startup valued instantly. No signup. No credit card. Pure AI-powered results.",
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
