import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comparable Companies Database | Evaldam AI",
  description: "Search and analyze real comparable companies from our database. Find startups at similar stages with actual valuations, growth rates, and exit outcomes.",
  keywords: "comparable companies, benchmark startups, valuation comparables, startup data, market data",
  openGraph: {
    title: "Comparable Companies Database",
    description: "Access real comparable company data to benchmark your startup",
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
