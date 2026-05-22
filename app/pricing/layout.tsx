import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Startup Valuation Pricing",
  description: "Pricing by buying moment: free valuation preview, founder report path, Startup plan, Agency / Investor workspace, Enterprise programs, and API credits.",
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
