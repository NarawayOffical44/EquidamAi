import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shared Startup Valuation Report",
  description: "Investor-ready startup valuation report shared from Evaldam AI.",
  robots: {
    index: false,
    follow: false,
  },
};

const fmt = (value?: number | null) =>
  value ? `$${(value / 1_000_000).toFixed(2)}M` : "Not available";

type ValuationMethod = {
  methodName?: string | null;
  name?: string | null;
  midEstimate?: number | null;
  valuation?: number | null;
  weightedValue?: number | null;
  value?: number | null;
  confidence?: string | null;
};

const isValuationMethod = (value: unknown): value is ValuationMethod =>
  typeof value === "object" && value !== null;

const methodName = (method: ValuationMethod, index: number) =>
  method.methodName?.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) ||
  method.name ||
  `Method ${index + 1}`;

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
    .select("company_name, stage, industry, description, arr, monthly_growth_rate, team_size, total_addressable_market")
    .eq("id", valuation.startup_id)
    .single();

  const methods: ValuationMethod[] = Array.isArray(valuation.methods_results)
    ? (valuation.methods_results as unknown[]).filter(isValuationMethod)
    : [];
  const reasons = Array.isArray(valuation.key_reasons) ? valuation.key_reasons : [];
  const arr = Number(startup?.arr || 0);
  const growth = Number(startup?.monthly_growth_rate || 0);
  const marketSize = Number(startup?.total_addressable_market || 0);
  const methodCount = methods.filter((method) => method.methodName || method.name).length;
  const evidenceStrengths = [
    methodCount > 0 ? `${methodCount} valuation method${methodCount === 1 ? "" : "s"} included.` : "",
    valuation.data_completeness >= 75 ? "Strong input completeness for a founder-facing valuation range." : "",
    arr > 0 ? "Revenue/ARR was provided as traction evidence." : "",
    growth > 0 ? "Growth rate was provided for upside checks." : "",
  ].filter(Boolean);
  const evidenceGaps = [
    arr <= 0 ? "Revenue/ARR was not provided, so revenue-based conclusions are less defensible." : "",
    growth <= 0 ? "Growth history was not provided, which weakens the upside case." : "",
    marketSize <= 0 ? "Market size was not provided, so the high case depends on broader assumptions." : "",
    valuation.data_completeness < 70 ? "Input completeness is below investor-grade and should be improved before relying on the range." : "",
  ].filter(Boolean);
  const investorObjections = [
    ...(arr <= 0 ? ["What revenue evidence supports this valuation range?"] : []),
    ...(growth <= 0 ? ["What proof shows demand is growing repeatably?"] : []),
    ...(marketSize <= 0 ? ["Is the market large enough to justify the high case?"] : []),
    "Which assumptions would change the valuation most if challenged?",
  ].slice(0, 4);
  const nextValueLevers = [
    ...(arr <= 0 ? ["Add ARR, MRR, pilots, LOIs, or paid customer evidence."] : []),
    ...(growth <= 0 ? ["Add 3-6 months of growth data."] : []),
    ...(marketSize <= 0 ? ["Add TAM/SAM and target buyer segment."] : []),
    "Keep valuation versions tied to specific inputs for repeatable investor conversations.",
  ].slice(0, 4);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="font-black text-gray-900">Evaldam AI</Link>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
            Shared investor report
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-8">
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
            {startup?.stage?.replace(/-/g, " ") || "Startup valuation"}
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900">
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
          <p className="text-xs font-black uppercase tracking-wide text-primary">Basis of valuation</p>
          <h2 className="mt-1 text-lg font-black text-gray-900">Scope, sources, and limitations</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-gray-400">Purpose</p>
              <p className="mt-2 text-sm text-gray-700">Indicative pre-money valuation for founder and investor discussion.</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-gray-400">Valuation date</p>
              <p className="mt-2 text-sm text-gray-700">{valuation.created_at ? new Date(valuation.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Not available"}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-gray-400">Data sources</p>
              <p className="mt-2 text-sm text-gray-700">Founder inputs, Evaldam AI method outputs, stored assumptions, and benchmark context where available.</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-gray-400">Limitation</p>
              <p className="mt-2 text-sm text-gray-700">This is not a signed statutory valuation certificate or investment advice.</p>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-black text-gray-900">Evidence quality</h2>
          <p className="mt-2 text-sm text-gray-600">{valuation.data_completeness || 0}% data completeness with {(valuation.confidence_level || "medium").toLowerCase()} confidence.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-sm font-black text-emerald-900">Strengths</p>
              <ul className="mt-3 space-y-2 text-sm text-emerald-950">
                {(evidenceStrengths.length ? evidenceStrengths : ["Core valuation range and method outputs are available."]).map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
              <p className="text-sm font-black text-amber-900">Gaps</p>
              <ul className="mt-3 space-y-2 text-sm text-amber-950">
                {(evidenceGaps.length ? evidenceGaps : ["No major evidence gaps were detected from the stored valuation inputs."]).map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </div>
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
            {methods.slice(0, 6).map((method, index) => (
              <div key={index} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <p className="font-bold text-gray-900">{methodName(method, index)}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {fmt(method.midEstimate || method.valuation || method.weightedValue || method.value)}
                </p>
                {method.confidence && <p className="mt-2 text-xs font-bold uppercase tracking-wide text-gray-400">Confidence: {method.confidence}</p>}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-black text-gray-900">Investor objections</h2>
            <ul className="mt-4 space-y-3 text-sm text-gray-700">
              {investorObjections.map((item, index) => <li key={index} className="rounded-lg bg-gray-50 p-3">{item}</li>)}
            </ul>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-black text-gray-900">Next value levers</h2>
            <ul className="mt-4 space-y-3 text-sm text-gray-700">
              {nextValueLevers.map((item, index) => <li key={index} className="rounded-lg bg-gray-50 p-3">{item}</li>)}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
