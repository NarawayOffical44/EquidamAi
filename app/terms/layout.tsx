import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Read the Evaldam AI terms and conditions for using the startup valuation platform, reports, accounts, and related services.",
  alternates: {
    canonical: "https://equidamai.com/terms",
  },
  openGraph: {
    title: "Terms and Conditions | Evaldam AI",
    description: "Terms for using Evaldam AI startup valuation platform, reports, accounts, and related services.",
    url: "https://equidamai.com/terms",
    type: "website",
    siteName: "Evaldam AI",
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
