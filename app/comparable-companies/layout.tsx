import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comparable Companies for Startup Valuation",
  description:
    "Find startup comparables by stage, sector, ARR, growth, and valuation context to defend valuation assumptions before investor conversations.",
  keywords:
    "startup comparables, comparable companies for valuation, valuation benchmarks, Indian startup valuation comparables, startup peer analysis, investor valuation defense",
  openGraph: {
    title: "Startup Comparables for Valuation Defense",
    description:
      "Search comparable companies and use peer context to pressure-test valuation assumptions before investor conversations.",
    url: "https://equidamai.com/comparable-companies",
    type: "website",
  },
};

export default function ComparableCompaniesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
