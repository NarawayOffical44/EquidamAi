"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { TrendingUp, Calendar, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";


interface ValuationRecord {
  id: string;
  startup_id: string;
  blended_low_range: number;
  blended_high_range: number;
  blended_weighted_average: number;
  created_at: string;
  startups: {
    id: string;
    company_name: string;
    industry: string;
    stage: string;
  };
}

export default function ValuationHistoryPage() {
  const [history, setHistory] = useState<ValuationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: "100",
      });

      if (filter !== "all") {
        params.append("startupId", filter);
      }

      const response = await fetch(`/api/valuations/history?${params}`, {
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        setHistory(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  const groupedByStartup = history.reduce(
    (acc, val) => {
      const key = val.startup_id;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(val);
      return acc;
    },
    {} as Record<string, ValuationRecord[]>
  );

  const startups = Object.values(groupedByStartup).map((vals) => vals[0].startups);
  const uniqueStartups = Array.from(new Map(startups.map((s) => [s.id, s])).values());

  return (
    <div className="public-page min-h-screen bg-white text-gray-900">
      <Navbar />

      <main>

      {/* ── HERO ── */}
      <section className="py-12 px-6 bg-gradient-to-br from-primary/5 to-cyan-500/5 border-b border-gray-200">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-black text-gray-900 mb-3">Valuation History</h1>
          <p className="text-gray-600 max-w-2xl">
            Track how your startup valuations have changed over time. View all historical valuations and monitor your valuation growth trajectory.
          </p>
        </div>
      </section>

      {/* ── FILTER ── */}
      <section className="py-8 px-6 border-b border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <label htmlFor="valuation-history-filter" className="text-sm font-bold text-gray-700">Filter by Startup:</label>
            <select
              id="valuation-history-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:outline-none"
            >
              <option value="all">All Startups</option>
              {uniqueStartups.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.company_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section className="py-12 px-6 max-w-6xl mx-auto">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No valuations yet. Create your first valuation to see history.</p>
            <Link href="/signup" className="mt-4 inline-flex rounded-lg bg-primary px-6 py-3 font-bold text-white transition-opacity hover:opacity-90">
              Get Started
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {history.map((val, idx) => {
              const prevVal = history[idx + 1];
              const change = prevVal
                ? ((val.blended_weighted_average - prevVal.blended_weighted_average) / prevVal.blended_weighted_average) * 100
                : 0;

              return (
                <div key={val.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="grid md:grid-cols-2 gap-6 items-center">
                    {/* Left: Company & Date */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-500">
                          {new Date(val.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{val.startups.company_name}</h3>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">
                          {val.startups.stage}
                        </span>
                        <span className="px-3 py-1 bg-white text-primary text-xs font-bold rounded-full border border-primary/20">
                          {val.startups.industry}
                        </span>
                      </div>
                    </div>

                    {/* Right: Valuation Range */}
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Pre-money Valuation</p>
                      <div className="flex items-baseline gap-3">
                        <div>
                          <div className="text-3xl font-black text-gray-900">
                            ${(val.blended_weighted_average / 1000000).toFixed(1)}M
                          </div>
                          <p className="text-sm text-gray-500">
                            ${(val.blended_low_range / 1000000).toFixed(1)}M - ${(val.blended_high_range / 1000000).toFixed(1)}M
                          </p>
                        </div>
                        {change !== 0 && prevVal && (
                          <div className={`flex items-center gap-1 px-3 py-1 rounded-lg ${change > 0 ? "bg-green-50" : "bg-red-50"}`}>
                            <TrendingUp className={`w-4 h-4 ${change > 0 ? "text-green-700" : "text-red-600"}`} />
                            <span className={`text-sm font-bold ${change > 0 ? "text-green-700" : "text-red-600"}`}>
                              {change > 0 ? "+" : ""}{change.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* View Report */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Link href={`/startup/${val.startup_id}/report/${val.id}`} className="inline-flex items-center gap-2 text-sm font-bold text-primary transition-colors hover:text-primary/80">
                      View Full Report <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── FOOTER ── */}
      </main>

      <footer className="border-t border-gray-200 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          <p>© 2024 Evaldam AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
