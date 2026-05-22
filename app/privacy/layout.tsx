import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read the Evaldam AI privacy policy for how startup valuation data, account information, analytics, and payment-related information are handled.",
  alternates: {
    canonical: "https://equidamai.com/privacy",
  },
  openGraph: {
    title: "Privacy Policy | Evaldam AI",
    description: "How Evaldam AI handles startup valuation data, account information, analytics, and payment-related information.",
    url: "https://equidamai.com/privacy",
    type: "website",
    siteName: "Evaldam AI",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
