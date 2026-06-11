"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { BarChart3, FileText, MessageSquareText, TrendingUp, Percent, GitBranch } from "lucide-react";
import { AuthBackButton } from "./AuthBackButton";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl lg:min-h-dvh lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)]">
        <aside className="hidden min-h-0 flex-col border-r border-gray-200 bg-white px-8 py-4 text-gray-950 lg:flex xl:px-12">
          <div className="flex min-h-0 flex-1 flex-col justify-center py-3">
            <p className="mb-2 text-xs font-semibold text-primary">Evaldam AI Workspace</p>
            <h2 className="max-w-xl text-[2.05rem] font-bold leading-[1.08] text-gray-950 xl:text-[2.45rem]">
              Your startup&apos;s financial story — modeled, explained, and tracked.
            </h2>
            <p className="mt-3 max-w-lg text-[14px] leading-6 text-gray-600">
              Know your number. Understand your dilution. Walk into every investor conversation with a defensible position and a shareable report.
            </p>

            {/* AI assistant conversation preview */}
            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <MessageSquareText className="h-3 w-3 text-primary" />
                </div>
                <p className="text-xs font-bold text-gray-700">Startup AI</p>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-end">
                  <p className="max-w-[80%] rounded-xl rounded-tr-sm bg-primary/10 px-3 py-2 text-xs text-gray-800">
                    If I raise $1.5M at $6M pre-money, what does my ESOP pool look like post-round?
                  </p>
                </div>
                <div className="flex justify-start">
                  <p className="max-w-[85%] rounded-xl rounded-tl-sm bg-gray-50 px-3 py-2 text-xs leading-relaxed text-gray-700">
                    At $6M pre-money, a $1.5M raise gives investors 20% of post-money. If you refresh the ESOP to 15% post-round, founder dilution is 35% combined. Your effective ownership moves from 72% to ~51.5%.
                  </p>
                </div>
                <div className="flex justify-end">
                  <p className="max-w-[80%] rounded-xl rounded-tr-sm bg-primary/10 px-3 py-2 text-xs text-gray-800">
                    What valuation would keep me above 60%?
                  </p>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-gray-50 px-3 py-2 text-xs leading-relaxed text-gray-700">
                    <p>At 15% ESOP post-round, you need pre-money above $8.75M to retain 60%+.</p>
                    <p className="mt-1 font-semibold text-primary">Run the full model →</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Key signals */}
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {[
                { Icon: BarChart3, label: "6-method valuation", sub: "Defensible range" },
                { Icon: Percent, label: "Dilution modeling", sub: "Round by round" },
                { Icon: FileText, label: "Shareable report", sub: "Investor-ready" },
              ].map(({ Icon, label, sub }) => (
                <div key={label} className="rounded-xl border border-gray-200 bg-white p-3">
                  <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  <p className="mt-2 text-[11px] font-bold leading-tight text-gray-950">{label}</p>
                  <p className="mt-0.5 text-[10px] text-gray-500">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="flex min-h-screen items-center justify-center px-4 py-4 sm:px-6 lg:min-h-dvh lg:px-8 lg:py-4">
          <div className="w-full max-w-[448px]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <Link href="/" aria-label="Go to Evaldam AI home" className="inline-flex items-center gap-2 rounded-xl text-sm font-bold text-gray-900 transition-colors hover:text-primary">
                <Image src="/logo.png" alt="Evaldam AI" width={30} height={30} className="rounded-lg" />
                <span>Evaldam AI</span>
              </Link>
              <AuthBackButton />
            </div>

            <div className="mb-3">
              <p className="mb-1.5 text-[11px] font-bold text-primary">{eyebrow}</p>
              <h1 className="text-[1.55rem] font-bold leading-[1.08] text-gray-950 sm:text-[1.8rem]">
                {title}
              </h1>
              <p className="mt-2 text-[13px] leading-5 text-gray-600">{description}</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 [&_a.btn]:!shadow-none [&_button.btn]:!shadow-none">
              {children}
            </div>

            {footer ? <div className="mt-3">{footer}</div> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
