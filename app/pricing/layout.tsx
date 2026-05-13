import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Startup Valuation Pricing | Evaldam AI",
  description: "Transparent pricing for defensible startup valuation reports. Explore free, Founder, Advisor, and Enterprise plans with India-focused benchmarks and investor-ready PDFs.",
  keywords: "startup valuation pricing, valuation report pricing, startup valuation plans India, investor-ready valuation report pricing",
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
