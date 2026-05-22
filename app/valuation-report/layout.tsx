import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Startup Valuation Report for Indian Founders",
  description: "See what is included in Evaldam's startup valuation report for Indian founders, advisors, accelerators, and VCs: six-method analysis, assumptions, comparable context, and investor-ready PDF output.",
  keywords: "startup valuation report, startup valuation India, seed round valuation, startup valuation for advisors, startup valuation for accelerators, startup valuation for VCs, startup valuation consultant alternative",
  openGraph: {
    title: "Valuation Reports for Indian Founders | Evaldam AI",
    description: "Get investor-ready valuation reports with 6 methods, assumptions, comparable context, and India-focused benchmarks.",
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
