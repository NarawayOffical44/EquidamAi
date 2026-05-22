export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import SignupPage from './SignupPageClient';

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create an Evaldam AI account to build startup valuation profiles, run valuation reports, and prepare for fundraising conversations.",
  openGraph: {
    title: "Sign Up | Evaldam AI",
    description: "Create an Evaldam AI account to build startup valuation profiles, run valuation reports, and prepare for fundraising conversations.",
    url: "https://equidamai.com/signup",
    type: "website",
    siteName: "Evaldam AI",
  },
  twitter: {
    card: "summary",
    title: "Sign Up | Evaldam AI",
    description: "Create an Evaldam AI account for startup valuations.",
  },
};

export default function Page() {
  return <SignupPage />;
}
