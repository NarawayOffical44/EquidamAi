export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardPage from './DashboardPageClient';

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage Evaldam AI startup valuation workspaces, reports, and account activity.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <DashboardPage />;
}
