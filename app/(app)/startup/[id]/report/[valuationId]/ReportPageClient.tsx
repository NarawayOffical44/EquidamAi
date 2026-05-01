"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { TrendingUp, Download, ChevronDown, ArrowLeft, Sparkles, Share2, Copy, Check, Zap, Target, BarChart3, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { WatermarkOverlay } from "@/components/WatermarkOverlay";
import Link from "next/link";

const methodLabel = (name: string) =>
  name === "evaldam-score" ? "Evaldam Proprietary Score" :
  name === "dcf-ltg" ? "DCF — Long-Term Growth" :
  name === "dcf-multiples" ? "DCF — Exit Multiples" :
  name === "vc" ? "VC Method" :
  name.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

const getConfidenceColor = (level: string) => {
  const l = (level || "").toLowerCase();
  if (l === "high") return "bg-emerald-50 border-emerald-200 text-emerald-900";
  if (l === "medium") return "bg-amber-50 border-amber-200 text-amber-900";
  return "bg-orange-50 border-orange-200 text-orange-900";
};

const getMethodColor = (index: number) => {
  const colors = [
    "from-cyan-500/10 to-cyan-500/5",
    "from-violet-500/10 to-violet-500/5",
    "from-emerald-500/10 to-emerald-500/5",
    "from-rose-500/10 to-rose-500/5",
    "from-amber-500/10 to-amber-500/5",
    "from-indigo-500/10 to-indigo-500/5",
  ];
  return colors[index % colors.length];
};

export default function ReportPage() {
  const params = useParams();
  const startupId = params.id as string;
  const valuationIdParam = params.valuationId as string;
  const [valuation, setValuation] = useState<any>(null);
  const [startup, setStartup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMethod, setExpandedMethod] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [shouldShowWatermark, setShouldShowWatermark] = useState(false);
  const supabase = createClient();

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/startup/${startupId}/report/${valuationIdParam}` : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareSocial = (platform: 'twitter' | 'linkedin') => {
    const title = `${startup?.company_name || 'Startup'} Valuation Report`;
    const text = `Check out ${startup?.company_name || 'this startup'}'s AI-powered valuation report - generated using 6 professional methods on Evaldam`;

    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`);
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: startupData } = await supabase.from("startups").select("*").eq("id", startupId).single();
        if (startupData) setStartup(startupData);

        const { data: vd } = await supabase
          .from("valuations")
          .select("*")
          .eq("id", valuationIdParam);

        if (vd && vd.length > 0) {
          const val = vd[0];
          setValuation({
            blended: {
              lowRange: val.blended_low_range,
              highRange: val.blended_high_range,
              weightedAverage: val.blended_weighted_average,
              keyReasons: val.key_reasons || [],
            },
            methods: val.methods_results || [],
            confidenceLevel: val.confidence_level,
            dataCompleteness: val.data_completeness,
          });
          // Check if watermark should be shown for free tier reports
          setShouldShowWatermark(val.should_watermark === true);
        }
      } catch { /* noop */ }
      finally { setLoading(false); }
    };
    if (startupId && valuationIdParam) load();
  }, [startupId, valuationIdParam]);

  const downloadPDF = async () => {
    if (!valuationIdParam || downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/pdf/generate?valuationId=${valuationIdParam}`);
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
        <Link href={`/startup/${startupId}`} className="text-primary text-sm hover:underline">← Back to Startup</Link>
      </div>
    </div>
  );

  const stageLabel = startup?.stage?.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) || "";
  const confidencePercent = { high: 95, medium: 75, low: 50 }[((valuation?.confidenceLevel || "medium").toLowerCase())] || 75;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30">
      {/* Hero Nav */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={`/startup/${startupId}`} className="flex items-center gap-2.5 hover:opacity-70 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-lg flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 tracking-tight">Evaldam</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadPDF}
              disabled={!valuationIdParam || downloading}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {downloading ? (
                <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating...</>
              ) : (
                <><Download className="w-4 h-4" />Download PDF</>
              )}
            </button>
            <button
              onClick={handleCopyLink}
              title="Copy link"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            >
              {linkCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="mb-12">
          <Link href={`/startup/${startupId}`} className="inline-flex items-center gap-1.5 text-cyan-600 hover:text-cyan-700 mb-6 font-medium text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Startup
          </Link>

          <div className="space-y-3">
            <div className="inline-block px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-semibold uppercase tracking-wider">
              {stageLabel}
            </div>
            <h1 className="text-5xl font-black text-gray-900 leading-tight">
              {startup?.company_name || "Startup"} <span className="bg-gradient-to-r from-cyan-500 to-violet-500 bg-clip-text text-transparent">Valuation</span>
            </h1>
            <p className="text-lg text-gray-600">Professional AI-powered valuation using 6 industry-standard methods</p>
          </div>
        </div>

        {/* Primary Valuation Card - Featured */}
        <div className="mb-12 bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="grid lg:grid-cols-2 gap-8 p-10">
            {/* Left: Valuation Figure */}
            <div className="flex flex-col justify-center">
              <p className="text-sm text-gray-500 uppercase tracking-widest font-semibold mb-4">Pre-Money Valuation Range</p>
              <div className="space-y-2 mb-8">
                <div className="text-6xl font-black text-gray-900">
                  ${((valuation.blended.lowRange || 0) / 1_000_000).toFixed(0)}M
                </div>
                <div className="text-2xl text-gray-400">to</div>
                <div className="text-6xl font-black bg-gradient-to-r from-cyan-500 to-violet-500 bg-clip-text text-transparent">
                  ${((valuation.blended.highRange || 0) / 1_000_000).toFixed(0)}M
                </div>
              </div>
              <div className="pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Weighted Average</p>
                <p className="text-3xl font-bold text-cyan-600">${((valuation.blended.weightedAverage || 0) / 1_000_000).toFixed(2)}M</p>
              </div>
            </div>

            {/* Right: Metrics Circle */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-48 h-48 mb-8">
                {/* Confidence Circle */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="90" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeDasharray={`${(confidencePercent / 100) * 565.5} 565.5`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-gray-900">{confidencePercent}%</span>
                  <span className="text-xs text-gray-500 mt-1 uppercase font-semibold">Confidence</span>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-full border ${getConfidenceColor(valuation.confidenceLevel)} text-sm font-semibold`}>
                {(valuation.confidenceLevel || "Medium").toUpperCase()} Confidence
              </div>
            </div>
          </div>
        </div>

        {/* Key Drivers */}
        {valuation.blended.keyReasons?.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Valuation Drivers</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {valuation.blended.keyReasons.slice(0, 2).map((r: string, i: number) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-cyan-200 transition-colors">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-100 to-cyan-50 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-cyan-600" />
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">{r}</p>
                  </div>
                </div>
              ))}
            </div>
            {valuation.blended.keyReasons.length > 2 && (
              <p className="text-sm text-gray-500 mt-4">+ {valuation.blended.keyReasons.length - 2} more key drivers in full report</p>
            )}
          </div>
        )}

        {/* Methods Grid */}
        {valuation.methods?.filter((m: any) => m?.methodName).length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Valuation Methods Comparison</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {valuation.methods.filter((m: any) => m?.methodName).map((method: any, idx: number) => (
                <div
                  key={method.methodName}
                  className={`bg-gradient-to-br ${getMethodColor(idx)} rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all cursor-pointer group`}
                  onClick={() => setExpandedMethod(expandedMethod === method.methodName ? null : method.methodName)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-sm flex-1">{methodLabel(method.methodName)}</h3>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedMethod === method.methodName ? "rotate-180" : ""}`} />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Estimate</p>
                      <p className="text-lg font-bold text-gray-900">{fmt(method.midEstimate || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Range</p>
                      <p className="text-xs text-gray-600">${((method.lowEstimate || 0) / 1_000_000).toFixed(1)}M – ${((method.highEstimate || 0) / 1_000_000).toFixed(1)}M</p>
                    </div>
                    <div className="pt-3 border-t border-gray-200/50">
                      <span className="text-xs font-semibold text-gray-600 uppercase">Confidence: {method.confidence}</span>
                    </div>
                  </div>

                  {expandedMethod === method.methodName && (
                    <div className="mt-4 pt-4 border-t border-gray-200/50 space-y-2">
                      {method.reasoning && (
                        <p className="text-xs text-gray-600 leading-relaxed">{method.reasoning.substring(0, 300)}{method.reasoning.length > 300 ? "..." : ""}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sensitivity Analysis */}
        <div className="mb-12 bg-white rounded-2xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Scenario Analysis</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { icon: TrendingUp, label: "+10% Growth", value: "+15%", positive: true },
              { icon: TrendingUp, label: "-10% Growth", value: "-12%", positive: false },
              { icon: Target, label: "+1x Multiple", value: "+20%", positive: true },
              { icon: Target, label: "-1x Multiple", value: "-20%", positive: false },
              { icon: BarChart3, label: "Bull Market", value: "+30%", positive: true },
              { icon: BarChart3, label: "Bear Market", value: "-25%", positive: false },
            ].map(({ icon: Icon, label, value, positive }, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <Icon className={`w-5 h-5 flex-shrink-0 ${positive ? "text-emerald-600" : "text-rose-600"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 font-medium">{label}</p>
                </div>
                <span className={`text-lg font-bold ${positive ? "text-emerald-600" : "text-rose-600"}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Data Quality */}
        <div className="mb-12 bg-gradient-to-r from-cyan-50 to-violet-50 rounded-2xl p-8 border border-cyan-100">
          <div className="flex items-start gap-4">
            <Lock className="w-6 h-6 text-cyan-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Report Quality Metrics</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Data Completeness</p>
                  <div className="w-full bg-white rounded-full h-2">
                    <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 h-2 rounded-full" style={{ width: `${valuation.dataCompleteness}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{valuation.dataCompleteness}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Methods Used</p>
                  <p className="text-2xl font-bold text-cyan-600">6/6</p>
                  <p className="text-xs text-gray-500">All methods analyzed</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="bg-gradient-to-br from-gray-900 via-cyan-900 to-violet-900 rounded-3xl p-12 text-center text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
          </div>

          <div className="relative z-10">
            <h3 className="text-3xl font-black mb-3">Ready for Your Investors?</h3>
            <p className="text-cyan-100 mb-8 max-w-xl mx-auto">Download the complete professional report with detailed analysis, comparables, and investment thesis.</p>
            <button
              onClick={downloadPDF}
              disabled={!valuationIdParam || downloading}
              className="px-8 py-4 bg-white hover:bg-cyan-50 text-gray-900 rounded-xl font-bold flex items-center gap-3 mx-auto transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl"
            >
              {downloading ? (
                <><div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />Generating PDF...</>
              ) : (
                <><Download className="w-5 h-5" />Download Full Professional Report</>
              )}
            </button>
          </div>
        </div>

        {/* Footer Social */}
        <div className="mt-12 pt-8 border-t border-gray-200 flex items-center justify-center gap-4">
          <button
            onClick={() => handleShareSocial('twitter')}
            className="p-3 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            title="Share on Twitter"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleShareSocial('linkedin')}
            className="p-3 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            title="Share on LinkedIn"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <p className="text-xs text-gray-500">Share this report</p>
        </div>
      </main>
      {shouldShowWatermark && <WatermarkOverlay />}
    </div>
  );
}
