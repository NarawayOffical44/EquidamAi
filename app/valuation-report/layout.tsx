import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Professional Valuation Reports | Evaldam AI",
  description: "Discover what's included in Evaldam's professional startup valuation reports. Multi-method analysis, detailed insights, investor-ready format. Download sample report now.",
  keywords: "valuation report, startup report, professional valuation, investor pitch, startup metrics, financial projections",
  openGraph: {
    title: "Professional Valuation Reports | Evaldam AI",
    description: "Get investor-ready valuation reports with 6 methods, detailed analysis, and market benchmarks.",
    url: "https://equidamai.com/valuation-report",
    type: "website",
  },
};

export default function ValuationReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
