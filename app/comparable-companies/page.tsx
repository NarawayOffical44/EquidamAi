"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, Search, TrendingUp, BarChart3, Filter, Download } from "lucide-react";

export default function ComparableCompaniesPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
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
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="Evaldam AI" width={32} height={32} className="rounded-md" />
              <span className="text-sm font-black text-gray-900 tracking-tight">evaldam</span>
            </Link>

            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
              <Link href="/comparable-companies" className="font-bold text-primary">Comparables</Link>
              <Link href="/methodology" className="hover:text-gray-900 transition-colors">Methodology</Link>
              <Link href="/pricing" className="hover:text-gray-900 transition-colors">Pricing</Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
                Sign in
              </Link>
              <Link href="/signup">
                <button className="px-5 py-2 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90 bg-primary">
                  BUY NOW
                </button>
              </Link>
            </div>

            <button className="md:hidden p-2 text-gray-500" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 px-6 py-4 space-y-3 bg-white">
            <Link href="/comparable-companies" className="block text-sm font-bold text-primary">Comparables</Link>
            <Link href="/methodology" className="block text-sm font-medium text-gray-600 hover:text-gray-900">Methodology</Link>
            <Link href="/pricing" className="block text-sm font-medium text-gray-600 hover:text-gray-900">Pricing</Link>
            <div className="pt-3 border-t border-gray-100 flex gap-2">
              <Link href="/login" className="flex-1"><button className="w-full py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg">Sign in</button></Link>
              <Link href="/signup" className="flex-1"><button className="w-full py-2 text-sm font-bold text-white rounded-lg bg-primary">BUY NOW</button></Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="py-12 px-6 bg-gradient-to-br from-primary/5 to-cyan-500/5 border-b border-gray-200">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-black text-gray-900 mb-3">Comparable Companies Database</h1>
          <p className="text-gray-600 max-w-2xl">
            Search real-world comparable companies from our database. See actual valuations, growth rates, and exit outcomes to benchmark your startup.
          </p>
        </div>
      </section>

      {/* ── SEARCH SECTION ── */}
      <section className="py-12 px-6 max-w-6xl mx-auto">
        <form onSubmit={handleSearch} className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <h2 className="text-xl font-black text-gray-900 mb-6">Search Comparables</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Industry */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:outline-none"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:outline-none"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:outline-none"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:outline-none"
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

      {/* ── RESULTS ── */}
      {searched && (
        <section className="py-12 px-6 max-w-6xl mx-auto">
          <h2 className="text-2xl font-black text-gray-900 mb-6">
            {comparables.length} Companies Found
          </h2>

          {comparables.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No comparable companies found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comparables.map((company) => (
                <div key={company.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
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
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-semibold text-gray-600">ARR</span>
                          <span className="font-bold text-gray-900">${(company.arr / 1000000).toFixed(1)}M</span>
                        </div>
                      )}
                      {company.growth_rate && (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-semibold text-gray-600">Growth Rate</span>
                          <span className="font-bold text-green-600">{company.growth_rate}% MoM</span>
                        </div>
                      )}
                      {company.latest_valuation && (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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

      {/* ── CTA ── */}
      <section className="py-16 px-6 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black text-gray-900 mb-4">Compare Your Startup</h2>
          <p className="text-gray-600 mb-8">
            Use these comparable companies with your own metrics to understand your market position and valuation fairness.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/free-valuation">
              <button className="px-8 py-3 text-sm font-bold text-gray-900 border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                Try Free Valuation
              </button>
            </Link>
            <Link href="/signup">
              <button className="px-8 py-3 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90 bg-primary">
                Sign Up Free
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-200 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          <p>© 2024 Evaldam AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
