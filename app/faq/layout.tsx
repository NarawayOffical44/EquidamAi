import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | Evaldam AI",
  description: "Answers to common questions about Evaldam AI startup quotas, valuation reports, pricing, subscriptions, and account workflows.",
  alternates: {
    canonical: "https://equidamai.com/faq",
  },
  openGraph: {
    title: "FAQ | Evaldam AI",
    description: "Common questions about Evaldam AI startup valuations, reports, pricing, and subscriptions.",
    url: "https://equidamai.com/faq",
    type: "website",
    siteName: "Evaldam AI",
    images: [
      {
        url: "https://equidamai.com/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Evaldam AI startup valuation FAQ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ | Evaldam AI",
    description: "Common questions about Evaldam AI startup valuations, reports, pricing, and subscriptions.",
    images: ["https://equidamai.com/opengraph-image"],
  },
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
