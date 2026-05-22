export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import StartupDashboard from './StartupDashboardClient';

export const metadata: Metadata = {
  title: "Startup Valuation Workspace",
  description: "View and update a startup valuation workspace, saved assumptions, evidence, and report history in Evaldam AI.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <StartupDashboard />;
}
