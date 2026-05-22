export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import CheckoutPage from './CheckoutPageClient';

export const metadata: Metadata = {
  title: "Complete Your Checkout",
  description: "Complete your Evaldam AI plan details and checkout for startup valuation reports and founder workflows.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <CheckoutPage />;
}
