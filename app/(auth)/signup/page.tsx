export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import SignupPage from './SignupPageClient';

export const metadata: Metadata = {
  title: "Create Your Evaldam Account",
  description: "Create an Evaldam AI account to build startup valuation profiles, run valuation reports, and prepare for fundraising conversations.",
  alternates: {
    canonical: "https://equidamai.com/signup",
  },
  openGraph: {
    title: "Create Your Evaldam Account",
    description: "Create an Evaldam AI account to build startup valuation profiles, run valuation reports, and prepare for fundraising conversations.",
    url: "https://equidamai.com/signup",
    type: "website",
    siteName: "Evaldam AI",
    images: [
      {
        url: "https://equidamai.com/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Create an Evaldam AI account",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Create Your Evaldam Account",
    description: "Create an Evaldam AI account for startup valuations.",
    images: ["https://equidamai.com/opengraph-image"],
  },
};

export default function Page() {
  return <SignupPage />;
}
