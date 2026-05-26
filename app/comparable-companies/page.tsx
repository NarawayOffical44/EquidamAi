"use client";

import Link from "next/link";
import { useState } from "react";
import { BarChart3, ChevronRight, Database, Filter, Search, ShieldCheck, TrendingUp } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

type ComparableCompany = {
  id: string;
  company_name?: string;
  industry?: string;
  stage?: string;
  founded_year?: number;
  country?: string;
  arr?: number;
  growth_rate?: number;
  latest_valuation?: number;
  exit_type?: string;
  exit_value?: number;
};

const industries = ["saas", "ai", "fintech", "deeptech", "other"];
const stages = ["pre-revenue", "seed", "series-a", "series-b+"];

const comparablesJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": "https://equidamai.com/comparable-companies#tool",
  name: "Startup Comparables & Peer Benchmarks",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://equidamai.com/comparable-companies",
  publisher: { "@id": "https://equidamai.com/#organization" },
  description:
    "Startup comparables tool for filtering peer companies by stage, sector, ARR, growth, valuation context, and investor-readiness.",
  featureList: [
    "Comparable company search",
    "Stage and sector filters",
    "ARR and growth context",
    "Valuation benchmark support",
    "Investor valuation defense workflow",
  ],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

const comparablesBreadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://equidamai.com",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Startup Comparables",
      item: "https://equidamai.com/comparable-companies",
    },
  ],
};

const formatOption = (value: string) =>
  value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const formatMoney = (value?: number) => {
  if (!value) return "Not disclosed";
  if (value >= 1000000) return `$${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
};

export default function ComparableCompaniesPage() {
  const [industry, setIndustry] = useState("saas");
  const [stage, setStage] = useState("seed");
  const [arrMin, setArrMin] = useState("");
  const [arrMax, setArrMax] = useState("");
  const [loading, setLoading] = useState(false);
  const [comparables, setComparables] = useState<ComparableCompany[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setSearched(true);
    setError("");

    try {
      const params = new URLSearchParams({
        industry,
        stage,
        ...(arrMin && { arrMin }),
        ...(arrMax && { arrMax }),
        limit: "50",
      });

      const response = await fetch(`/api/comparable-companies?${params}`);
      const data = await response.json();

      if (data.success) {
        setComparables(data.data || []);
      } else {
        setComparables([]);
        setError(data.error || "Could not fetch comparable companies.");
      }
    } catch (err) {
      console.error("Search failed:", err);
      setComparables([]);
      setError("Could not fetch comparable companies. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(comparablesJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(comparablesBreadcrumbJsonLd) }} />
      <Navbar />

      <section className="border-b border-slate-200/60 bg-white px-4 py-12 sm:px-6 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-[2px] border border-slate-200/60 bg-white px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-gray-500">
            <Database className="h-3.5 w-3.5" />
            Comparable research
          </div>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_1px_360px] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-3xl font-black leading-tight text-gray-950 sm:text-5xl">
                Find comparables that help defend your valuation.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
                Search stage, sector, ARR, growth, and valuation context before investor conversations. Use the closest peer set to pressure-test assumptions, not to copy a number.
              </p>
            </div>
            <div className="hidden h-full border-l border-slate-200/60 lg:block" />
            <div className="rounded-[2px] border border-slate-200/60 bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Best used for</p>
              <div className="mt-4 space-y-3">
                {[
                  "Explaining why a valuation range is reasonable",
                  "Checking ARR and growth against nearby peers",
                  "Preparing investor pushback before the meeting",
                ].map((item) => (
                  <div key={item} className="flex gap-3 text-sm font-semibold text-gray-700">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: <Filter className="h-4 w-4" />, label: "Filter by stage and sector" },
              { icon: <TrendingUp className="h-4 w-4" />, label: "Compare ARR and growth context" },
              { icon: <BarChart3 className="h-4 w-4" />, label: "Support investor-ready rationale" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 rounded-[2px] border border-slate-200/60 bg-white px-4 py-3 text-sm font-semibold text-gray-700">
                <span className="text-primary">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:py-10">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <form onSubmit={handleSearch} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-gray-950">Search peers</h2>
                <p className="mt-1 text-sm text-gray-500">Start broad, then narrow by ARR.</p>
              </div>
              <Filter className="h-5 w-5 text-gray-400" />
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="comparable-industry" className="mb-2 block text-sm font-bold text-gray-900">Industry</label>
                <select
                  id="comparable-industry"
                  value={industry}
                  onChange={(event) => setIndustry(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                >
                  {industries.map((item) => (
                    <option key={item} value={item}>
                      {formatOption(item)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="comparable-stage" className="mb-2 block text-sm font-bold text-gray-900">Funding stage</label>
                <select
                  id="comparable-stage"
                  value={stage}
                  onChange={(event) => setStage(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                >
                  {stages.map((item) => (
                    <option key={item} value={item}>
                      {formatOption(item)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="comparable-arr-min" className="mb-2 block text-sm font-bold text-gray-900">Min ARR</label>
                  <input
                    id="comparable-arr-min"
                    type="number"
                    inputMode="numeric"
                    value={arrMin}
                    onChange={(event) => setArrMin(event.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>

                <div>
                  <label htmlFor="comparable-arr-max" className="mb-2 block text-sm font-bold text-gray-900">Max ARR</label>
                  <input
                    id="comparable-arr-max"
                    type="number"
                    inputMode="numeric"
                    value={arrMax}
                    onChange={(event) => setArrMax(event.target.value)}
                    placeholder="No limit"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <TrendingUp className="h-4 w-4 animate-pulse" /> : <Search className="h-4 w-4" />}
              {loading ? "Searching peers..." : "Search comparables"}
            </button>
            <p className="mt-3 text-xs leading-relaxed text-gray-500">
              Comparable data is a directional input for valuation discussions. Use it with assumptions, method weights, and company-specific risk.
            </p>
          </form>
        </aside>

        <section className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-gray-500">Current peer set</p>
              <h2 className="mt-1 text-xl font-black text-gray-950">
                {searched ? `${comparables.length} companies found` : "Ready to search"}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {[formatOption(industry), formatOption(stage), arrMin || arrMax ? "ARR filtered" : "All ARR"].map((chip) => (
                <span key={chip} className="rounded-sm border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-600">
                  {chip}
                </span>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-amber-900">
              {error}
            </div>
          )}

          {!searched ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-black text-gray-950">Use comparables as evidence, not decoration.</h3>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {[
                  { title: "Match the business", text: "Stage, sector, revenue model, and growth quality matter more than a famous logo." },
                  { title: "Explain the gap", text: "If your startup deserves a premium or discount, show the assumption behind it." },
                  { title: "Connect to the report", text: "Use the peer set with valuation methods, sensitivity, and investor-ready notes." },
                ].map((item) => (
                  <div key={item.title} className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="font-black text-gray-900">{item.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : comparables.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
              <p className="font-bold text-gray-800">No close peer set found.</p>
              <p className="mt-1 text-sm text-gray-500">Widen the ARR range or choose a broader stage to avoid over-filtering.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto" tabIndex={0} aria-label="Comparable companies results">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white">
                    <tr>
                      {["Company", "Stage", "ARR", "Growth", "Valuation", "Market"].map((heading) => (
                        <th key={heading} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-500">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {comparables.map((company) => (
                      <tr key={company.id} className="transition">
                        <td className="px-4 py-4">
                          <p className="font-black text-gray-950">{company.company_name || "Unnamed company"}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {company.founded_year ? `Founded ${company.founded_year}` : "Founded year unavailable"}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-gray-700">{company.stage || "-"}</td>
                        <td className="px-4 py-4 text-sm font-bold text-gray-900">{formatMoney(company.arr)}</td>
                        <td className="px-4 py-4 text-sm font-bold text-green-700">
                          {company.growth_rate ? `${company.growth_rate}% MoM` : "-"}
                        </td>
                        <td className="px-4 py-4 text-sm font-bold text-gray-900">{formatMoney(company.latest_valuation)}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          <p className="font-semibold text-gray-800">{company.industry || "-"}</p>
                          <p className="mt-1 text-xs text-gray-500">{company.country || "Market unavailable"}</p>
                          {company.exit_type && (
                            <p className="mt-2 inline-flex rounded-full border border-primary/20 bg-white px-2 py-1 text-xs font-bold uppercase text-primary">
                              {company.exit_type}
                              {company.exit_value ? ` ${formatMoney(company.exit_value)}` : ""}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-6 rounded-lg border border-primary/20 bg-white p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-black text-gray-950">Turn peer context into a valuation story.</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  Build the report when you need methods, assumptions, comparables, sensitivity, and notes in one investor-ready view.
                </p>
              </div>
              <Link href="/free-valuation" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[2px] bg-primary px-5 py-3 text-sm font-bold text-white transition hover:opacity-90">
                Start valuation <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
