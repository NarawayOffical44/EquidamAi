"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, TrendingUp, Filter, Database, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function ComparableCompaniesPage() {
  const [industry, setIndustry] = useState("saas");
  const [stage, setStage] = useState("seed");
  const [arrMin, setArrMin] = useState("");
  const [arrMax, setArrMax] = useState("");
  const [loading, setLoading] = useState(false);
  const [comparables, setComparables] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const industries = ["saas", "ai", "fintech", "deeptech", "other"];
  const stages = ["pre-revenue", "seed", "series-a", "series-b+"];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);

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
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      {/* HERO */}
      <section className="py-14 md:py-20 px-6 bg-gradient-to-br from-primary/5 to-cyan-500/5 border-b border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary mb-5">
            Benchmarking workspace
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight leading-tight">Comparable Companies Database</h1>
          <p className="text-gray-600 max-w-2xl text-lg leading-relaxed">
            Search comparable company records from the connected benchmark database. Use peer context to sanity-check valuation assumptions.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mt-8 max-w-4xl">
            {[
              { icon: <Database className="w-4 h-4" />, label: "Stage and sector filters" },
              { icon: <TrendingUp className="w-4 h-4" />, label: "ARR and growth context" },
              { icon: <ShieldCheck className="w-4 h-4" />, label: "Used in valuation rationale" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm">
                <span className="text-primary">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEARCH SECTION */}
      <section className="py-12 px-6 max-w-6xl mx-auto">
        <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-gray-900">Search Comparables</h2>
              <p className="text-sm text-gray-500 mt-1">Start broad, then narrow by ARR when you have enough peers.</p>
            </div>
            <Filter className="w-5 h-5 text-gray-400" />
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Industry */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none bg-white"
              >
                {industries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind.charAt(0).toUpperCase() + ind.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Stage */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Funding Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none bg-white"
              >
                {stages.map((st) => (
                  <option key={st} value={st}>
                    {st.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                  </option>
                ))}
              </select>
            </div>

            {/* ARR Min */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Min ARR (USD)</label>
              <input
                type="number"
                value={arrMin}
                onChange={(e) => setArrMin(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none bg-white"
              />
            </div>

            {/* ARR Max */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Max ARR (USD)</label>
              <input
                type="number"
                value={arrMax}
                onChange={(e) => setArrMax(e.target.value)}
                placeholder="No limit"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-primary text-white font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
          >
            <Search className="w-5 h-5" />
            {loading ? "Searching..." : "Search Comparables"}
          </button>
        </form>
      </section>

      {/* RESULTS */}
      {searched && (
        <section className="py-12 px-6 max-w-6xl mx-auto">
          <h2 className="text-2xl font-black text-gray-900 mb-6">
            {comparables.length} Companies Found
          </h2>

          {comparables.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-gray-300 bg-gray-50">
              <p className="text-gray-700 font-semibold">No comparable companies found.</p><p className="text-gray-500 text-sm mt-1">Try widening the ARR range or selecting a broader stage.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comparables.map((company) => (
                <div key={company.id} className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-shadow sm:p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Left: Company Info */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{company.company_name}</h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>
                          <span className="font-semibold text-gray-700">Industry:</span> {company.industry}
                        </p>
                        <p>
                          <span className="font-semibold text-gray-700">Stage:</span> {company.stage}
                        </p>
                        {company.founded_year && (
                          <p>
                            <span className="font-semibold text-gray-700">Founded:</span> {company.founded_year}
                          </p>
                        )}
                        {company.country && (
                          <p>
                            <span className="font-semibold text-gray-700">Country:</span> {company.country}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Metrics */}
                    <div className="space-y-3">
                      {company.arr && (
                        <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-semibold text-gray-600">ARR</span>
                          <span className="font-bold text-gray-900">${(company.arr / 1000000).toFixed(1)}M</span>
                        </div>
                      )}
                      {company.growth_rate && (
                        <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-semibold text-gray-600">Growth Rate</span>
                          <span className="font-bold text-green-600">{company.growth_rate}% MoM</span>
                        </div>
                      )}
                      {company.latest_valuation && (
                        <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-semibold text-gray-600">Valuation</span>
                          <span className="font-bold text-gray-900">${(company.latest_valuation / 1000000).toFixed(0)}M</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Exit Info */}
                  {company.exit_type && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm">
                        <span className="font-semibold text-gray-700">Exit:</span>
                        <span className="ml-2 px-2 py-1 bg-cyan-50 text-cyan-700 rounded text-xs font-bold">
                          {company.exit_type.toUpperCase()}
                        </span>
                        {company.exit_value && ` for $${(company.exit_value / 1000000).toFixed(0)}M`}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* -- CTA -- */}
      <section className="py-16 px-6 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black text-gray-900 mb-4">Compare Your Startup</h2>
          <p className="text-gray-600 mb-8">
            Use these comparable companies with your own metrics to understand your market position and valuation fairness.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/free-valuation">
              <button className="w-full px-8 py-3 text-sm font-bold text-gray-900 border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors sm:w-auto">
                Try Free Valuation
              </button>
            </Link>
            <Link href="/signup">
              <button className="w-full px-8 py-3 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90 bg-primary sm:w-auto">
                Choose Plan
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}


