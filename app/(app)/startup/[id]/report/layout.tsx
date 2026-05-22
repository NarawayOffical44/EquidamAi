import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Latest Startup Valuation Report",
  description: "Loading the latest Evaldam AI startup valuation report for this workspace.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function StartupReportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
