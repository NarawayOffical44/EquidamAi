import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shared Startup Valuation Report | Evaldam AI",
  description: "Investor-ready startup valuation report shared from Evaldam AI.",
  robots: {
    index: false,
    follow: false,
  },
};

const fmt = (value?: number | null) =>
  value ? `$${(value / 1_000_000).toFixed(2)}M` : "Not available";

export default async function SharedReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: valuation } = await admin
    .from("valuations")
    .select("*")
    .eq("share_token", token)
    .eq("is_public", true)
    .single();

  if (!valuation) notFound();

  const { data: startup } = await admin
    .from("startups")
    .select("company_name, stage, industry, description")
    .eq("id", valuation.startup_id)
    .single();

  const methods = Array.isArray(valuation.methods_results) ? valuation.methods_results : [];
  const reasons = Array.isArray(valuation.key_reasons) ? valuation.key_reasons : [];

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="font-black text-gray-900">Evaldam</Link>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
            Shared investor report
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
            {startup?.stage?.replace(/-/g, " ") || "Startup valuation"}
          </p>
          <h1 className="text-4xl font-black text-gray-900">
            {startup?.company_name || "Startup"} Valuation Report
          </h1>
          <p className="mt-3 max-w-3xl text-gray-600">
            {startup?.description || "Shared valuation summary generated with Evaldam AI."}
          </p>
        </div>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-xs font-black uppercase tracking-wide text-gray-400">Low range</p>
            <p className="mt-2 text-2xl font-black text-gray-900">{fmt(valuation.blended_low_range)}</p>
          </div>
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-5">
            <p className="text-xs font-black uppercase tracking-wide text-primary">Weighted average</p>
            <p className="mt-2 text-2xl font-black text-gray-900">{fmt(valuation.blended_weighted_average)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-xs font-black uppercase tracking-wide text-gray-400">High range</p>
            <p className="mt-2 text-2xl font-black text-gray-900">{fmt(valuation.blended_high_range)}</p>
          </div>
        </section>

        <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-black text-gray-900">Key valuation drivers</h2>
          {reasons.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {reasons.map((reason: string, index: number) => (
                <li key={index} className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{reason}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-gray-500">No key reasons were included in this shared report.</p>
          )}
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-black text-gray-900">Method breakdown</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {methods.slice(0, 6).map((method: any, index: number) => (
              <div key={index} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <p className="font-bold text-gray-900">{method.methodName || method.name || `Method ${index + 1}`}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {fmt(method.valuation || method.weightedValue || method.value)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
