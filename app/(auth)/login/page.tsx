export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import LoginPage from './LoginPageClient';

export const metadata: Metadata = {
  title: "Sign In to Evaldam",
  description: "Sign in to your Evaldam AI account to access startup valuation workspaces, reports, and saved assumptions.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "https://equidamai.com/login",
  },
  openGraph: {
    title: "Sign In to Evaldam",
    description: "Sign in to your Evaldam AI account to access startup valuation workspaces, reports, and saved assumptions.",
    url: "https://equidamai.com/login",
    type: "website",
    siteName: "Evaldam AI",
    images: [
      {
        url: "https://equidamai.com/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Sign in to Evaldam AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign In to Evaldam",
    description: "Sign in to your Evaldam AI account.",
    images: ["https://equidamai.com/opengraph-image"],
  },
};

export default function Page() {
  return <LoginPage />;
}
