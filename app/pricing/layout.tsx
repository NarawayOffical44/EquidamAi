import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Startup Valuation Pricing for Reports & API Credits",
  description: "Compare Evaldam plans for free previews, founder reports, Startup AI, advisor workspaces, enterprise programs, API credits, and investor-ready PDFs.",
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
