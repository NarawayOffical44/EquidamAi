"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AlertCircle, Download, ChevronDown, ArrowLeft, Sparkles, Share2, Copy, Check, Lock, FileText, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { WatermarkOverlay } from "@/components/WatermarkOverlay";
import { SignalAnalysisPanel } from "@/components/SignalAnalysisPanel";
import type { SignalAnalysis } from "@/lib/valuation/signal-analysis";
import Link from "next/link";
import { trackReportDownload, trackFeatureUsage } from "@/lib/analytics/ga4";

const methodLabel = (name: string) =>
  name === "evaldam-score" || name === "evaldam_score" ? "Evaldam Supporting Score" :
  name === "dcf-ltg" ? "DCF — Long-Term Growth" :
  name === "dcf_ltg" ? "DCF — Long-Term Growth" :
  name === "dcf-multiples" ? "DCF — Exit Multiples" :
  name === "dcf_multiples" ? "DCF — Exit Multiples" :
  name === "comparables" ? "Comparable Company Method" :
  name === "vc" || name === "vc_method" ? "VC Method" :
  name.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

const methodKey = (method: any) => method?.methodName || method?.method_name || method?.name || "";
const visibleMethodsForPlan = (methods: any[] = [], isFreeReport: boolean) =>
  isFreeReport ? methods.filter((method) => !["evaldam-score", "evaldam_score"].includes(methodKey(method))) : methods;

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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-gray-900">{value}</p>
    </div>
  );
}

function ScenarioSlider({
  label,
  value,
  setValue,
}: {
  label: string;
  value: number;
  setValue: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <label className="text-sm font-bold text-gray-900">{label}</label>
        <span className={`rounded-full px-2.5 py-1 text-xs font-black ${value >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {value > 0 ? "+" : ""}{value}%
        </span>
      </div>
      <input
        type="range"
        min={-30}
        max={30}
        step={5}
        value={value}
        onChange={(event) => setValue(Number(event.target.value))}
        className="w-full accent-primary"
      />
      <div className="mt-1 flex justify-between text-[11px] font-semibold text-gray-400">
        <span>-30%</span>
        <span>Base</span>
        <span>+30%</span>
      </div>
    </div>
  );
}

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
  const [shareLoading, setShareLoading] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [shouldShowWatermark, setShouldShowWatermark] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "evidence" | "methodology" | "scenarios">("overview");
  const [evidenceData, setEvidenceData] = useState<any>(null);
  const [methodologyData, setMethodologyData] = useState<any>(null);
  const [reportLoadError, setReportLoadError] = useState("");
  const [supplementalDataError, setSupplementalDataError] = useState("");
  const [growthDelta, setGrowthDelta] = useState(0);
  const [multipleDelta, setMultipleDelta] = useState(0);
  const [workspaceRole, setWorkspaceRole] = useState<"admin" | "member">("admin");
  const supabase = createClient();

  const shareUrl = typeof window !== 'undefined' && shareToken ? `${window.location.origin}/share/${shareToken}` : '';

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareLinkToggle = async () => {
    if (!valuationIdParam || shareLoading) return;
    if (workspaceRole !== "admin") return;
    setShareLoading(true);
    try {
      const nextEnabled = !isPublic;
      const response = await fetch(`/api/valuations/${valuationIdParam}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextEnabled }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update share link");
      setShareToken(data.data.shareToken);
      setIsPublic(data.data.isPublic);
      trackFeatureUsage("investor_share_link_updated", {
        valuation_id: valuationIdParam,
        enabled: data.data.isPublic,
      });
      if (data.data.isPublic && typeof window !== "undefined") {
        await navigator.clipboard.writeText(`${window.location.origin}/share/${data.data.shareToken}`);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setShareLoading(false);
    }
  };

  const handleShareSocial = (platform: 'twitter' | 'linkedin') => {
    if (workspaceRole !== "admin") return;
    if (!shareUrl) return;
    const methodCount = valuation?.methods?.filter((m: any) => m?.methodName).length || 0;
    const text = `Check out ${startup?.company_name || 'this startup'}'s valuation report — ${methodCount || "multiple"} methods, benchmarked, and investor-ready on Evaldam`;

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
        const { data: authData } = await supabase.auth.getUser();
        const { data: startupData } = await supabase.from("startups").select("*").eq("id", startupId).single();
        if (startupData) {
          setStartup(startupData);
          setWorkspaceRole(startupData.user_id === authData.user?.id ? "admin" : "member");
        }

        const { data: vd } = await supabase
          .from("valuations")
          .select("*")
          .eq("id", valuationIdParam)
          .eq("startup_id", startupId);

        if (vd && vd.length > 0) {
          const val = vd[0];
          const isFreeReport = val.should_watermark === true || val.generated_on_tier === "free";
          setValuation({
            blended: {
              lowRange: val.blended_low_range,
              highRange: val.blended_high_range,
              weightedAverage: val.blended_weighted_average,
              keyReasons: val.key_reasons || [],
            },
            methods: visibleMethodsForPlan(val.methods_results || [], isFreeReport),
            confidenceLevel: val.confidence_level,
            dataCompleteness: val.data_completeness,
            reportData: val.report_data || {},
          });
          setShareToken(val.share_token || null);
          setIsPublic(val.is_public === true);
          // Check if watermark should be shown for free tier reports
          setShouldShowWatermark(isFreeReport);
        }

        const [evidenceRes, methodologyRes] = await Promise.allSettled([
          fetch(`/api/valuations/${valuationIdParam}/evidence`).then(async (res) => {
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.error || "Evidence trail could not be loaded");
            return data;
          }),
          fetch(`/api/valuations/${valuationIdParam}/methodology`).then(async (res) => {
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.error || "Methodology details could not be loaded");
            return data;
          }),
        ]);
        if (evidenceRes.status === "fulfilled") setEvidenceData(evidenceRes.value?.data || null);
        if (methodologyRes.status === "fulfilled") setMethodologyData(methodologyRes.value || null);
        const supplementalErrors = [evidenceRes, methodologyRes]
          .filter((result): result is PromiseRejectedResult => result.status === "rejected")
          .map((result) => result.reason instanceof Error ? result.reason.message : "Report support data could not be loaded");
        setSupplementalDataError(supplementalErrors[0] || "");
        setReportLoadError("");
      } catch (error) {
        console.error("Failed to load valuation report:", error);
        setReportLoadError(error instanceof Error ? error.message : "Could not load valuation report");
      }
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
      trackReportDownload({
        companyName: startup?.company_name || "Startup",
        reportType: "full",
        valuationMid: valuation?.blended?.weightedAverage,
      });
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
        {reportLoadError && <p className="mb-3 text-sm text-red-700">{reportLoadError}</p>}
        <Link href={`/startup/${startupId}`} className="text-primary text-sm hover:underline">← Back to Startup</Link>
      </div>
    </div>
  );

  const stageLabel = startup?.stage?.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) || "";
  const reportDate = valuation.reportData?.generatedAt || valuation.reportData?.createdAt || new Date().toISOString();
  const methodCount = valuation.methods?.filter((m: any) => m?.methodName).length || 0;
  const confidenceLevel = ((valuation?.confidenceLevel as string) || "medium").toLowerCase() as "high" | "medium" | "low";
  const confidencePercent = { high: 95, medium: 75, low: 50 }[confidenceLevel] || 75;
  const scenarioMid = Math.max(
    0,
    (valuation.blended.weightedAverage || 0) *
      (1 + growthDelta / 100 * 0.8 + multipleDelta / 100 * 0.6)
  );
  const scenarioLow = scenarioMid * 0.75;
  const scenarioHigh = scenarioMid * 1.25;
  const paidSignalAnalysis: SignalAnalysis = {
    valueDrivers: [
      ...(startup?.arr || startup?.annual_recurring_revenue
        ? [`Revenue signal: $${(((startup.arr || startup.annual_recurring_revenue) as number) / 1_000_000).toFixed(2)}M ARR supports a traction-based valuation.`]
        : []),
      ...(startup?.monthly_growth_rate
        ? [`Growth signal: ${Number(startup.monthly_growth_rate).toFixed(0)}% monthly growth can justify the upper range if repeatable.`]
        : []),
      ...(startup?.team_size
        ? [`Execution signal: ${startup.team_size} team members improves delivery confidence.`]
        : []),
      ...(valuation.blended.keyReasons || []).slice(0, 2),
    ].slice(0, 4),
    evidenceGaps: [
      ...(!startup?.arr && !startup?.annual_recurring_revenue ? ["ARR/revenue is missing, so revenue-based methods are less defensible."] : []),
      ...(!startup?.monthly_growth_rate ? ["Growth history is missing, so upside assumptions need support before investor review."] : []),
      ...(!startup?.total_addressable_market ? ["Market size is missing, which weakens the high-case valuation ceiling."] : []),
      ...(valuation.dataCompleteness < 70 ? ["Data completeness is below investor-grade; the range should be treated as wider until inputs improve."] : []),
    ].slice(0, 4),
    investorObjections: [
      ...(!startup?.arr && !startup?.annual_recurring_revenue ? ["What revenue proof supports this valuation?"] : []),
      ...(!startup?.monthly_growth_rate ? ["What evidence proves demand is growing repeatably?"] : []),
      ...(!startup?.total_addressable_market ? ["Is the market large enough to support the upside case?"] : []),
      "Which assumptions move the valuation the most if challenged?",
    ].slice(0, 4),
    nextValueLevers: [
      ...(!startup?.arr && !startup?.annual_recurring_revenue ? ["Add ARR, MRR, or recent monthly revenue to anchor the range."] : []),
      ...(!startup?.monthly_growth_rate ? ["Add month-by-month growth to defend the upside scenario."] : []),
      ...(!startup?.total_addressable_market ? ["Add TAM/SAM and target buyer segment to support the valuation ceiling."] : []),
      "Use the scenario tab to test the assumptions investors are most likely to challenge.",
    ].slice(0, 4),
    methodSignals: [
      ...(valuation.methods || [])
        .filter((method: any) => method?.methodName && method?.midEstimate)
        .sort((a: any, b: any) => (b.midEstimate || 0) - (a.midEstimate || 0))
        .slice(0, 2)
        .map((method: any, index: number) =>
          `${index === 0 ? "Highest" : "Conservative"} method signal: ${methodLabel(method.methodName)} at ${fmt(method.midEstimate || 0)}.`
        ),
      `Overall confidence is ${valuation.confidenceLevel || "medium"} with ${valuation.dataCompleteness || 0}% data completeness.`,
    ].slice(0, 3),
  };
  const evidenceStrengths = [
    methodCount > 0 ? `${methodCount} valuation method${methodCount === 1 ? "" : "s"} available in the report output.` : "",
    valuation.dataCompleteness >= 75 ? "Input completeness is strong enough for a tighter discussion range." : "",
    startup?.arr || startup?.annual_recurring_revenue ? "Revenue or ARR is available as traction evidence." : "",
    startup?.monthly_growth_rate ? "Growth rate is available for upside checks." : "",
  ].filter(Boolean);
  const sourceAudit = valuation.reportData?.sourceAudit || {};
  const auditInputTrace = Array.isArray(sourceAudit.inputTrace) ? sourceAudit.inputTrace : [];
  const auditGaps: Array<{ label: string; reason: string }> = Array.isArray(sourceAudit.verificationGaps) ? sourceAudit.verificationGaps : [];
  const evidenceGaps: string[] = auditGaps.length
    ? auditGaps.slice(0, 4).map((gap: any) => `${gap.label}: ${gap.reason}`)
    : paidSignalAnalysis.evidenceGaps.length ? paidSignalAnalysis.evidenceGaps : ["No major evidence gaps were detected from the stored valuation inputs."];
  const provenanceRows = [
    ...auditInputTrace
      .filter((entry: any) => ["stage", "industry", "annualRecurringRevenue", "monthlyGrowthRate", "teamSize", "totalAddressableMarket", "runwayMonths", "totalFunded", "competitiveAdvantage", "patentCount"].includes(entry.key))
      .map((entry: any) => ({
        item: entry.label,
        value: entry.value === null || entry.value === undefined || entry.value === "" ? "Not provided" : String(entry.value),
        source: `${String(entry.source || "unknown").replace(/_/g, " ")} - ${entry.verificationStatus || "unverified"} (${entry.confidence || 0}% confidence)`,
      })),
    ...(auditInputTrace.length === 0 ? [
      { item: "Company stage", value: startup?.stage || "Not provided", source: "Founder input" },
      { item: "Industry", value: startup?.industry || "Not provided", source: "Founder input" },
      { item: "ARR", value: startup?.arr || startup?.annual_recurring_revenue ? `$${Number(startup.arr || startup.annual_recurring_revenue).toLocaleString()}` : "Not provided", source: "Founder input" },
      { item: "Monthly growth", value: startup?.monthly_growth_rate ? `${startup.monthly_growth_rate}%` : "Not provided", source: "Founder input" },
      { item: "Team size", value: startup?.team_size ? String(startup.team_size) : "Not provided", source: "Founder input" },
    ] : []),
    { item: "Weighted valuation", value: fmt(valuation.blended.weightedAverage || 0), source: "Calculated" },
    { item: "Confidence", value: valuation.confidenceLevel || "medium", source: "System estimate" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Nav */}
      <header className="bg-white/95 backdrop-blur border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link href={`/startup/${startupId}`} className="flex items-center gap-2.5 hover:opacity-70 transition-opacity">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 tracking-tight">Evaldam</span>
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={handleShareLinkToggle}
              disabled={shareLoading || workspaceRole !== "admin"}
              title={workspaceRole !== "admin" ? "Only the workspace Admin can manage public links" : isPublic ? "Disable investor link" : "Create investor link"}
              className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all disabled:opacity-40 ${
                isPublic ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {shareLoading ? (
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              {isPublic ? "Shared" : "Share"}
            </button>
            <button
              onClick={downloadPDF}
              disabled={!valuationIdParam || downloading}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {downloading ? (
                <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating...</>
              ) : (
                <><Download className="w-4 h-4" />Download PDF</>
              )}
            </button>
            <button
              onClick={handleCopyLink}
              disabled={workspaceRole !== "admin" || !isPublic || !shareToken}
              title={workspaceRole !== "admin" ? "Only the workspace Admin can copy public links" : isPublic ? "Copy investor link" : "Create investor link first"}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {linkCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header Section */}
        <div className="mb-12">
          <Link href={`/startup/${startupId}`} className="inline-flex items-center gap-1.5 text-cyan-600 hover:text-cyan-700 mb-6 font-medium text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Startup
          </Link>

          <div className="space-y-3">
            <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold uppercase tracking-wider">
              {stageLabel}
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight">
              {startup?.company_name || "Startup"} <span className="text-primary">Valuation</span>
            </h1>
            <p className="text-lg text-gray-600">Indicative valuation using {methodCount || "multiple"} method{methodCount === 1 ? "" : "s"}, evidence quality checks, and investor-readiness signals.</p>
          </div>
        </div>

        {/* Primary Valuation Card - Featured */}
        <div className="mb-12 bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="grid lg:grid-cols-2 gap-8 p-5 sm:p-8 lg:p-10">
            {/* Left: Valuation Figure */}
            <div className="flex flex-col justify-center">
              <p className="text-sm text-gray-500 uppercase tracking-widest font-semibold mb-4">Pre-Money Valuation Range</p>
              <div className="space-y-2 mb-8">
                <div className="text-5xl sm:text-6xl font-black text-gray-900">
                  ${((valuation.blended.lowRange || 0) / 1_000_000).toFixed(0)}M
                </div>
                <div className="text-2xl text-gray-400">to</div>
                <div className="text-5xl sm:text-6xl font-black text-primary">
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
                    stroke="#00b2b2"
                    strokeWidth="8"
                    strokeDasharray={`${(confidencePercent / 100) * 565.5} 565.5`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
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

        <div className="mb-8 flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
          {[
            { key: "overview", label: "Overview" },
            { key: "evidence", label: "Evidence Trail" },
            { key: "methodology", label: "Methodology" },
            { key: "scenarios", label: "Scenarios" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as typeof activeTab);
                trackFeatureUsage("report_tab_opened", { tab: tab.key, valuation_id: valuationIdParam });
              }}
              className={`rounded-md px-4 py-2 text-sm font-bold transition-colors ${
                activeTab === tab.key ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "evidence" && (
          <div className="mb-12 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            {supplementalDataError && (
              <div className="mb-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{supplementalDataError}. Showing stored valuation data instead.</span>
              </div>
            )}
            <div className="mb-5 flex items-start gap-3">
              <ShieldCheck className="mt-1 h-6 w-6 text-primary" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Evidence and Assumptions Trail</h2>
                <p className="mt-1 text-sm text-gray-600">Method outputs, assumptions, and stored inputs used to support this valuation version.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard label="Method rows" value={String(evidenceData?.methods?.length || valuation.methods?.length || 0)} />
              <MetricCard label="Evidence items" value={String(evidenceData?.evidence?.length || 0)} />
              <MetricCard label="Versions" value={String(evidenceData?.versions?.length || 1)} />
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-gray-400">Review status</p>
                <p className="mt-2 text-sm font-bold text-gray-900">{String(valuation.reportData?.reviewStatus?.status || "system_generated_unreviewed").replace(/_/g, " ")}</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">{valuation.reportData?.reviewStatus?.note || "Professional reviewer sign-off has not been recorded for this valuation."}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-gray-400">Market data status</p>
                <p className="mt-2 text-sm font-bold text-gray-900">{String(sourceAudit.marketDataStatus || "method_level_sources_used").replace(/_/g, " ")}</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">Fallback benchmarks, when used, are explicitly labelled so users know what must be verified before relying on the report as a professional opinion.</p>
              </div>
            </div>
            <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="font-bold text-gray-900">Assumptions and Provenance</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="pb-2">Item</th>
                      <th className="pb-2">Value</th>
                      <th className="pb-2">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {provenanceRows.map((row) => (
                      <tr key={row.item}>
                        <td className="py-3 font-semibold text-gray-900">{row.item}</td>
                        <td className="py-3 text-gray-700">{row.value}</td>
                        <td className="py-3 text-gray-500">{row.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {(evidenceData?.methods || valuation.methods || []).slice(0, 6).map((method: any, index: number) => (
                <div key={`${method.method_name || method.methodName}-${index}`} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="font-bold text-gray-900">{method.method_display_name || methodLabel(method.method_name || method.methodName || "method")}</p>
                  <p className="mt-2 text-xs leading-relaxed text-gray-600">
                    {method.methodology_explanation || method.key_factors_explanation || method.reasoning || "Method output stored with this valuation."}
                  </p>
                  {method.assumptions && (
                    <pre className="mt-3 max-h-32 overflow-auto rounded-md bg-white p-3 text-[11px] text-gray-600">
                      {JSON.stringify(method.assumptions, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
            {valuation.reportData?.inputFingerprint && (
              <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                <strong>Repeatability:</strong> input fingerprint {valuation.reportData.inputFingerprint}. Same saved inputs and methodology reuse this report.
              </div>
            )}
          </div>
        )}

        {activeTab === "methodology" && (
          <div className="mb-12 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            {supplementalDataError && (
              <div className="mb-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{supplementalDataError}. Some methodology details may be unavailable.</span>
              </div>
            )}
            <div className="mb-5 flex items-start gap-3">
              <FileText className="mt-1 h-6 w-6 text-primary" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Methodology Trail</h2>
                <p className="mt-1 text-sm text-gray-600">Documentation for methods, verification checklist, and data sources relevant to this valuation.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {(methodologyData?.methodology?.methods || []).map((method: any, index: number) => (
                <div key={`${method.method}-${index}`} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="font-bold text-gray-900">{method.name || methodLabel(method.method || "method")}</p>
                  <p className="mt-1 text-xs font-semibold uppercase text-primary">{method.type || "Valuation method"}</p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{method.description || "Method documentation available for this valuation."}</p>
                  {method.formula && <p className="mt-3 rounded-md bg-white p-3 text-xs text-gray-700">{method.formula}</p>}
                </div>
              ))}
            </div>
            {methodologyData?.importantNote && (
              <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                {methodologyData.importantNote}
              </div>
            )}
          </div>
        )}

        {activeTab === "scenarios" && (
          <div className="mb-12 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Interactive Scenario Simulator</h2>
            <p className="mb-6 text-sm text-gray-600">Adjust growth and exit multiple assumptions to see an indicative impact on the current midpoint. This is a planning simulator, not a saved valuation version.</p>
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="space-y-6">
                <ScenarioSlider label="Growth assumption change" value={growthDelta} setValue={setGrowthDelta} />
                <ScenarioSlider label="Exit multiple change" value={multipleDelta} setValue={setMultipleDelta} />
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
                <p className="text-xs font-black uppercase tracking-wide text-primary">Scenario range</p>
                <p className="mt-3 text-2xl font-black text-gray-900">{fmt(scenarioLow)} - {fmt(scenarioHigh)}</p>
                <p className="mt-1 text-sm font-semibold text-primary">Mid-point {fmt(scenarioMid)}</p>
                <p className="mt-4 text-xs leading-relaxed text-gray-600">Create a new report from the startup workspace if these assumptions should become part of the official valuation trail.</p>
              </div>
            </div>
          </div>
        )}

        {/* Key Drivers */}
        {activeTab === "overview" && (
          <div className="mb-12 space-y-6">
            <section className="rounded-lg border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
              <div className="mb-5">
                <p className="text-xs font-black uppercase tracking-wide text-primary">Basis of valuation</p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">Scope, date, sources, and limitations</h2>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-gray-400">Purpose</p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-700">Founder and investor discussion support for an indicative pre-money startup valuation.</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-gray-400">Valuation date</p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-700">{new Date(reportDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-gray-400">Standard / scope</p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-700">Indicative startup valuation analysis using recognized early-stage and venture valuation methods. This is not a statutory valuation certificate.</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-gray-400">Limitations</p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-700">Actual negotiated valuation may differ based on due diligence, investor appetite, deal terms, control rights, and market timing.</p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
              <div className="mb-5 flex items-start gap-3">
                <ShieldCheck className="mt-1 h-6 w-6 text-primary" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Evidence Quality</h2>
                  <p className="mt-1 text-sm text-gray-600">{valuation.dataCompleteness || 0}% data completeness with {(valuation.confidenceLevel || "medium").toLowerCase()} confidence.</p>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-sm font-black text-emerald-900">Evidence strengths</p>
                  <ul className="mt-3 space-y-2 text-sm text-emerald-950">
                    {(evidenceStrengths.length ? evidenceStrengths : ["Core valuation range and method outputs are available."]).map((item, index) => <li key={index}>{item}</li>)}
                  </ul>
                </div>
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                  <p className="text-sm font-black text-amber-900">Evidence gaps</p>
                  <ul className="mt-3 space-y-2 text-sm text-amber-950">
                    {evidenceGaps.map((item, index) => <li key={index}>{item}</li>)}
                  </ul>
                </div>
              </div>
            </section>

            <SignalAnalysisPanel analysis={paidSignalAnalysis} />
          </div>
        )}

        {/* Methods Grid */}
        {activeTab === "overview" && valuation.methods?.filter((m: any) => m?.methodName).length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Valuation Methods Comparison</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {valuation.methods.filter((m: any) => m?.methodName).map((method: any, idx: number) => (
                <div
                  key={method.methodName}
                  className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:border-gray-300 transition-all cursor-pointer group"
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

        {/* Data Quality */}
        {activeTab === "overview" && <div className="mb-12 bg-white rounded-lg p-8 border border-gray-200 shadow-sm">
          <div className="flex items-start gap-4">
            <Lock className="w-6 h-6 text-cyan-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Report Quality Metrics</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Data Completeness</p>
                  <div className="w-full bg-white rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${valuation.dataCompleteness}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{valuation.dataCompleteness}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Methods Used</p>
                  <p className="text-2xl font-bold text-cyan-600">{methodCount}</p>
                  <p className="text-xs text-gray-500">Methods available in this report</p>
                </div>
              </div>
            </div>
          </div>
        </div>}

        {/* Final CTA */}
        <div className="bg-slate-950 rounded-lg p-12 text-center text-white overflow-hidden relative">
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
              className="px-8 py-4 bg-white hover:bg-cyan-50 text-gray-900 rounded-lg font-bold flex items-center gap-3 mx-auto transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl"
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
            disabled={workspaceRole !== "admin" || !isPublic || !shareToken}
            className="p-3 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
            title={workspaceRole !== "admin" ? "Only the workspace Admin can share public links" : isPublic ? "Share on Twitter" : "Create investor link first"}
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleShareSocial('linkedin')}
            disabled={workspaceRole !== "admin" || !isPublic || !shareToken}
            className="p-3 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
            title={workspaceRole !== "admin" ? "Only the workspace Admin can share public links" : isPublic ? "Share on LinkedIn" : "Create investor link first"}
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
