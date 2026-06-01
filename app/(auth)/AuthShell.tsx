"use client";

import type { ReactNode } from "react";
import { BarChart3, FileText, MessageSquareText, ShieldCheck } from "lucide-react";
import { AuthBackButton } from "./AuthBackButton";

const workspaceSignals = [
  { label: "6-method valuation", value: "Report ready", Icon: FileText },
  { label: "Startup AI", value: "Context aware", Icon: MessageSquareText },
  { label: "Audit trail", value: "Evidence saved", Icon: ShieldCheck },
];

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
            <h2 className="max-w-xl text-[2.05rem] font-black leading-[1.08] text-gray-950 xl:text-[2.45rem]">
              Defensible valuation workflows without spreadsheet drift.
            </h2>
            <p className="mt-3 max-w-lg text-[14px] leading-6 text-gray-600">
              Model assumptions, compare valuation methods, preserve evidence, and bring Startup AI into the same workspace.
            </p>

            <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 text-gray-950">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500">Seed valuation range</p>
                  <p className="mt-1 text-xl font-black text-gray-950">$1.4M - $2.1M</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-primary">
                  <BarChart3 className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-4 space-y-2.5">
                {[
                  { label: "Market evidence", width: "84%", color: "bg-primary" },
                  { label: "Traction quality", width: "68%", color: "bg-emerald-500" },
                  { label: "Risk calibration", width: "76%", color: "bg-amber-500" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold text-gray-600">
                      <span>{item.label}</span>
                      <span>{item.width}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div className={`h-2 rounded-full ${item.color}`} style={{ width: item.width }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-3">
              {workspaceSignals.map(({ label, value, Icon }) => (
                <div key={label} className="rounded-lg border border-gray-200 bg-white p-3.5">
                  <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  <p className="mt-2.5 text-sm font-bold text-gray-950">{label}</p>
                  <p className="mt-1 text-xs text-gray-500">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="flex min-h-screen items-center justify-center px-4 py-4 sm:px-6 lg:min-h-dvh lg:px-8 lg:py-4">
          <div className="w-full max-w-[448px]">
            <div className="mb-3 flex justify-end">
              <AuthBackButton />
            </div>

            <div className="mb-3">
              <p className="mb-1.5 text-[11px] font-bold text-primary">{eyebrow}</p>
              <h1 className="text-[1.55rem] font-black leading-[1.08] text-gray-950 sm:text-[1.8rem]">
                {title}
              </h1>
              <p className="mt-2 text-[13px] leading-5 text-gray-600">{description}</p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5 [&_a.btn]:!shadow-none [&_button.btn]:!shadow-none">
              {children}
            </div>

            {footer ? <div className="mt-3">{footer}</div> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
