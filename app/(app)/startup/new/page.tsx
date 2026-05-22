export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import NewStartupPage from './NewStartupPageClient';

export const metadata: Metadata = {
  title: "Build Your Valuation Profile",
  description: "Create a startup valuation profile in Evaldam AI with company details, stage, market context, traction, and assumptions.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <NewStartupPage />;
}
