export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import LoginPage from './LoginPageClient';

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your Evaldam AI account to access startup valuation workspaces, reports, and saved assumptions.",
  openGraph: {
    title: "Login | Evaldam AI",
    description: "Sign in to your Evaldam AI account to access startup valuation workspaces, reports, and saved assumptions.",
    url: "https://equidamai.com/login",
    type: "website",
    siteName: "Evaldam AI",
  },
  twitter: {
    card: "summary",
    title: "Login | Evaldam AI",
    description: "Sign in to your Evaldam AI account.",
  },
};

export default function Page() {
  return <LoginPage />;
}
