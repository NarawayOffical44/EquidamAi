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
        url: "https://equidamai.com/logo.png",
        width: 360,
        height: 360,
        alt: "Evaldam AI Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "FAQ | Evaldam AI",
    description: "Common questions about Evaldam AI startup valuations, reports, pricing, and subscriptions.",
    images: ["https://equidamai.com/logo.png"],
  },
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
