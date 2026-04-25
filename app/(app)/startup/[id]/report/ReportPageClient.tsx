"use client";


import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { TrendingUp, Download, ChevronDown, ArrowLeft, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const methodLabel = (name: string) =>
  name === "evaldam-score" ? "Evaldam Proprietary Score" :
  name === "dcf-ltg" ? "DCF — Long-Term Growth" :
  name === "dcf-multiples" ? "DCF — Exit Multiples" :
  name === "vc" ? "VC Method" :
  name.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

export default function ReportPage() {
  const params = useParams();
  const startupId = params.id as string;
  const [valuation, setValuation] = useState<any>(null);
  const [valuationId, setValuationId] = useState<string | null>(null);
  const [startup, setStartup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMethod, setExpandedMethod] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: startupData } = await supabase.from("startups").select("*").eq("id", startupId).single();
        if (startupData) setStartup(startupData);

        const { data: vd } = await supabase
          .from("valuations")
          .select("*")
          .eq("startup_id", startupId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (vd) {
          setValuationId(vd.id);
          setValuation({
            blended: {
              lowRange: vd.blended_low_range,
              highRange: vd.blended_high_range,
              weightedAverage: vd.blended_weighted_average,
              keyReasons: vd.key_reasons || [],
            },
            methods: vd.methods_results || [],
            confidenceLevel: vd.confidence_level,
            dataCompleteness: vd.data_completeness,
          });
        }
      } catch { /* noop */ }
      finally { setLoading(false); }
    };
    if (startupId) load();
  }, [startupId]);

  const downloadPDF = async () => {
    if (!valuationId || downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/pdf/generate?valuationId=${valuationId}`);
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${startup?.company_name || "valuation"}-report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };
  const fmt = (v: number) => `$${(v / 1_000_000).toFixed(2)}M`;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">Loading valuation report...</p>
      </div>
    </div>
  );

  if (!valuation) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Valuation not found</h2>
        <Link href="/dashboard" className="text-primary text-sm hover:underline">← Back to Dashboard</Link>
      </div>
    </div>
  );

  const stageLabel = startup?.stage?.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) || "";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900 tracking-tight">Evaldam AI</span>
          </div>
          <button
            onClick={downloadPDF}
            disabled={!valuationId || downloading}
            className="btn btn-primary btn-sm flex items-center gap-1.5 disabled:opacity-40"
          >
            {downloading ? (
              <><div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />Generating...</>
            ) : (
              <><Download className="w-3.5 h-3.5" />Download PDF</>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 pb-16">
        {/* Back */}
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-700 mb-8 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{startup?.company_name || "Startup"} — Valuation Report</h1>
          <p className="text-sm text-gray-400 mt-0.5">{stageLabel} · Generated by Evaldam AI</p>
        </div>

        {/* Valuation highlight */}
        <div className="bg-white border border-gray-200 rounded-2xl p-7 mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Pre-Money Valuation Range</p>
          <div className="text-4xl font-bold text-gray-900 mb-1">
            ${((valuation.blended.lowRange || 0) / 1_000_000).toFixed(1)}M – $
            {((valuation.blended.highRange || 0) / 1_000_000).toFixed(1)}M
          </div>
          <p className="text-primary font-semibold text-lg mb-5">
            Weighted Average: ${((valuation.blended.weightedAverage || 0) / 1_000_000).toFixed(2)}M
          </p>
          <div className="flex gap-4 flex-wrap">
            <span className="badge badge-neutral">{(valuation.confidenceLevel || "medium").toUpperCase()} Confidence</span>
            <span className="badge badge-neutral">6 Methods</span>
            <span className="badge badge-neutral">Data {valuation.dataCompleteness}% complete</span>
          </div>
        </div>

        {/* Key reasons */}
        {valuation.blended.keyReasons?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Key Valuation Drivers</h2>
            <ul className="space-y-3">
              {valuation.blended.keyReasons.map((r: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm">
                  <TrendingUp className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Method breakdown */}
        {valuation.methods?.filter((m: any) => m?.methodName).length > 0 && (
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Methods Breakdown</h2>
            <div className="space-y-2">
              {valuation.methods.filter((m: any) => m?.methodName).map((method: any) => (
                <div key={method.methodName} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedMethod(expandedMethod === method.methodName ? null : method.methodName)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900 text-sm">{methodLabel(method.methodName)}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{fmt(method.midEstimate || 0)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-xs text-gray-400">
                        <span className="font-medium text-gray-700">
                          ${((method.lowEstimate || 0) / 1_000_000).toFixed(1)}M – ${((method.highEstimate || 0) / 1_000_000).toFixed(1)}M
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-300 transition-transform ${expandedMethod === method.methodName ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {expandedMethod === method.methodName && (
                    <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2">Confidence: <strong>{method.confidence}</strong></p>
                      {method.reasoning && (
                        <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-line">{method.reasoning.substring(0, 500)}{method.reasoning.length > 500 ? "..." : ""}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sensitivity */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Sensitivity Analysis</h2>
          <div className="space-y-1.5 text-sm">
            {[
              { label: "+10% annual growth", value: "+15%", positive: true },
              { label: "-10% annual growth", value: "-12%", positive: false },
              { label: "+1x exit multiple", value: "+20%", positive: true },
              { label: "-1x exit multiple", value: "-20%", positive: false },
              { label: "Bull market conditions", value: "+30%", positive: true },
              { label: "Bear market conditions", value: "-25%", positive: false },
            ].map(({ label, value, positive }) => (
              <div key={label} className="flex justify-between px-4 py-2.5 bg-gray-50 rounded-lg">
                <span className="text-gray-600">{label}</span>
                <span className={`font-semibold ${positive ? "text-green-600" : "text-red-500"}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <h3 className="font-bold text-gray-900 mb-1">Ready for investor meetings?</h3>
          <p className="text-gray-500 text-sm mb-5">Download the full professional PDF report to share with investors.</p>
          <button
            onClick={downloadPDF}
            disabled={!valuationId || downloading}
            className="btn btn-primary flex items-center gap-2 mx-auto disabled:opacity-40"
          >
            {downloading ? (
              <><div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />Generating PDF...</>
            ) : (
              <><Download className="w-4 h-4" />Download Full Report (PDF)</>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
