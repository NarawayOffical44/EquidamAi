import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Evaldam AI | Affordable Startup Valuation Plans",
  description: "Transparent pricing for professional startup valuations. Free tier (1 startup, 3 reports), Pro ($99/mo), Plus ($199/mo), and Enterprise. Start free, upgrade anytime.",
  keywords: "startup valuation pricing, affordable pricing plans, valuation software cost, startup evaluation pricing",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://equidamai.com/pricing",
  },
};

export default function PricingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
