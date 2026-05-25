export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { IndiaFinanceAiChat } from "@/app/india-finance-ai/IndiaFinanceAiChat";

export const metadata: Metadata = {
  title: "Startup AI",
  description: "Chat with Evaldam Startup AI from your authenticated workspace.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function StartupAiPage() {
  return (
    <div className="h-screen overflow-hidden bg-white text-gray-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Evaldam AI" width={32} height={32} className="rounded-md" />
            <span className="hidden text-sm font-black text-gray-900 sm:inline">Evaldam</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/dashboard" className="text-sm font-semibold text-gray-600 transition-colors hover:text-primary">
              Dashboard
            </Link>
            <Link href="/comparable-companies" className="text-sm font-semibold text-gray-600 transition-colors hover:text-primary">
              Comparables
            </Link>
            <Link href="/methodology" className="text-sm font-semibold text-gray-600 transition-colors hover:text-primary">
              Methodology
            </Link>
            <Link href="/startup-ai" className="text-sm font-semibold text-primary">
              Startup AI
            </Link>
            <Link href="/pricing#api-credits" className="text-sm font-semibold text-gray-600 transition-colors hover:text-primary">
              API Credits
            </Link>
          </nav>
        </div>
      </header>
      <IndiaFinanceAiChat embedded showHistorySidebar />
    </div>
  );
}
