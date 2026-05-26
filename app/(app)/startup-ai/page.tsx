export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { StartupAiAppShell } from "./StartupAiAppShell";

export const metadata: Metadata = {
  title: "Startup AI",
  description: "Chat with Evaldam Startup AI from your authenticated workspace.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function StartupAiPage() {
  return <StartupAiAppShell />;
}
