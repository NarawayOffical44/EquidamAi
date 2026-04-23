"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Download, Share2, ChevronDown } from "lucide-react";
import { EvalDamScoreCard } from "@/components/EvalDamScoreCard";

export default function ReportPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { valuationId?: string };
}) {
  const [valuation, setValuation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMethod, setExpandedMethod] = useState<string | null>(null);

  useEffect(() => {
    const loadValuation = async () => {
      setLoading(true);
      try {
        // Try to load from localStorage first for startups created in this session
        if (typeof window !== "undefined") {
          const storedStartups = localStorage.getItem("startups");
          if (storedStartups) {
            const startups = JSON.parse(storedStartups);
            const startup = startups.find((s: any) => s.id === params.id);
            if (startup && startup.valuation) {
              setValuation(startup.valuation);
              setLoading(false);
              return;
            }
          }
        }

        // If not in localStorage, fetch from API
        if (searchParams.valuationId) {
          const response = await fetch(
            `/api/valuate?valuationId=${searchParams.valuationId}`
          );
          const result = await response.json();
          if (result.success) {
            setValuation(result.valuation);
          }
        }
      } catch (error) {
        console.error("Failed to load valuation:", error);
      } finally {
        setLoading(false);
      }
    };

    loadValuation();
  }, [params.id, searchParams.valuationId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white">Loading Valuation Report...</h2>
        </div>
      </div>
    );
  }

  if (!valuation) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-accent mb-4">Valuation not found</h2>
          <a href="/startup/new" className="text-primary hover:underline">
            Create a new valuation →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">Startup Valuation Report</h1>
            <div className="flex gap-3">
              <button className="px-4 py-2 border border-neutral-700 rounded hover:bg-neutral-800 flex items-center gap-2 text-neutral-300">
                <Download className="w-4 h-4" /> Download
              </button>
              <button className="px-4 py-2 bg-primary text-white rounded hover:opacity-80 flex items-center gap-2">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
          </div>

          {/* Valuation Summary Badge */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-neutral-400 mb-1">Pre-Money Valuation Range</p>
                <div className="text-4xl font-bold text-white mb-2">
                  ${(valuation.blended.lowRange / 1000000).toFixed(1)}M – $
                  {(valuation.blended.highRange / 1000000).toFixed(1)}M
                </div>
                <p className="text-lg font-semibold text-primary">
                  Weighted Average: ${(valuation.blended.weightedAverage / 1000000).toFixed(2)}M
                </p>
              </div>
              <div className="text-right">
                <div className="inline-block bg-accent/20 text-accent px-3 py-1 rounded-full text-sm font-medium">
                  Market-Verified
                </div>
                <p className="text-sm text-neutral-400 mt-2">
                  Based on 5 professional methods
                </p>
                <p className="text-sm text-neutral-400">
                  Data Completeness: {valuation.dataCompleteness}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Evaldam Proprietary Score Card */}
        <EvalDamScoreCard valuation={valuation} />

        {/* Key Reasons */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Key Reasons for This Valuation</h2>
          <ul className="space-y-3">
            {valuation.blended.keyReasons.map(
              (reason: string, idx: number) => (
                <li key={idx} className="flex gap-3">
                  <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-300">{reason}</span>
                </li>
              )
            )}
          </ul>
        </div>

        {/* Method Breakdown */}
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-bold text-white">Valuation Methods Breakdown</h2>
          {valuation.methods.map((method: any) => (
            <div
              key={method.methodName}
              className="bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedMethod(
                    expandedMethod === method.methodName ? null : method.methodName
                  )
                }
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-700 transition-colors"
              >
                <div className="text-left">
                  <h3 className="font-bold capitalize text-white">
                    {method.methodName.replace("-", " ")}
                  </h3>
                  <p className="text-sm text-neutral-400">
                    ${(method.midEstimate / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <p className="text-neutral-400">Range</p>
                    <p className="font-medium text-white">
                      ${(method.lowEstimate / 1000000).toFixed(1)}M–$
                      {(method.highEstimate / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-neutral-500 transition-transform ${
                      expandedMethod === method.methodName ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>
              {expandedMethod === method.methodName && (
                <div className="px-6 py-4 bg-neutral-700/50 border-t border-neutral-700">
                  <p className="text-sm text-neutral-300 mb-2">
                    <strong>Confidence:</strong> {method.confidence}
                  </p>
                  <p className="text-sm text-neutral-400 bg-neutral-800 p-3 rounded border border-neutral-700">
                    {method.methodName === "scorecard" &&
                      "Scoring methodology based on team strength (30%), market size (25%), product/tech (15%), competition (10%), sales (10%), and capital needs (10%)."}
                    {method.methodName === "berkus" &&
                      "Checklist method allocating up to $750k per factor: sound idea, prototype, management team, strategic relationships, and product rollout."}
                    {method.methodName === "vc" &&
                      "VC method back-solving from terminal value (5-7 year projection) using required ROI and market multiples."}
                    {method.methodName === "dcf-ltg" &&
                      "DCF with long-term growth model using Damodaran 2026 parameters (2.5% LTG, 11% WACC)."}
                    {method.methodName === "dcf-multiples" &&
                      "DCF with terminal value estimated via 2026 exit multiples (more reliable for high-growth startups)."}
                    {method.methodName === "evaldam-score" &&
                      "PROPRIETARY: Evaldam Score combines internal database comparison, industry growth premium, team exit history, patent strength, market timing, and moat assessment. This score improves monthly as our database grows."}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sensitivity Analysis */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Sensitivity Analysis</h2>
          <p className="text-sm text-neutral-400 mb-4">
            How valuation changes with key assumptions
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between p-3 bg-neutral-700/50 rounded">
              <span className="text-neutral-300">+10% annual growth</span>
              <span className="text-accent font-medium">+15% valuation</span>
            </div>
            <div className="flex justify-between p-3 bg-neutral-700/50 rounded">
              <span className="text-neutral-300">-10% annual growth</span>
              <span className="text-red-400 font-medium">-12% valuation</span>
            </div>
            <div className="flex justify-between p-3 bg-neutral-700/50 rounded">
              <span className="text-neutral-300">+1x exit multiple</span>
              <span className="text-accent font-medium">+20% valuation</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 rounded-lg p-6 text-center">
          <h3 className="font-bold text-white mb-2">Ready to use this report?</h3>
          <p className="text-neutral-400 mb-4">
            Download the full 25-35 page professional report to share with investors.
          </p>
          <button className="px-6 py-2 bg-primary text-white rounded hover:opacity-80">
            Download Full Report (PDF)
          </button>
        </div>
      </div>
    </div>
  );
}
