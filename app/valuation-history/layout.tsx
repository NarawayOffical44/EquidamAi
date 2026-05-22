import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Valuation History",
  description: "View your complete startup valuation history. Track valuation changes over time and monitor your company's growth trajectory.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Valuation History",
    description: "Track your startup valuation changes over time",
    url: "https://equidamai.com/valuation-history",
    type: "website",
  },
};

export default function ValuationHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
