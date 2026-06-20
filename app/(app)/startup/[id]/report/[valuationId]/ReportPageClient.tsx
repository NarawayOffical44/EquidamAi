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
  name === "dcf-ltg" ? "DCF - Long-Term Growth" :
  name === "dcf_ltg" ? "DCF - Long-Term Growth" :
  name === "dcf-multiples" ? "DCF - Exit Multiples" :
  name === "dcf_multiples" ? "DCF - Exit Multiples" :
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-gray-200 pt-4 first:border-t-0 first:pt-0 sm:border-l sm:border-t-0 sm:py-2 sm:pl-4 sm:first:border-l-0 sm:first:pl-0">
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums tracking-[-0.3px] text-gray-950">{value}</p>
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
      <div className="mb-2 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
        <label className="text-sm font-bold text-gray-900">{label}</label>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${value >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
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

function MethodRangeChart({
  methods,
  valueFormatter,
}: {
  methods: any[];
  valueFormatter: (value: number) => string;
}) {
  const rows = methods
    .filter((method) => method?.methodName)
    .map((method) => {
      const mid = Number(method.midEstimate || 0);
      const low = Number(method.lowEstimate || mid || 0);
      const high = Number(method.highEstimate || mid || low || 0);
      return {
        key: method.methodName,
        label: methodLabel(method.methodName),
        low: Math.min(low, mid || low, high),
        mid: mid || low || high,
        high: Math.max(high, mid || high, low),
      };
    })
    .filter((row) => Number.isFinite(row.mid) && row.mid > 0);

  if (!rows.length) return null;

  const allValues = rows.flatMap((row) => [row.low, row.mid, row.high]).filter((value) => Number.isFinite(value));
  const rawMin = Math.min(...allValues, 0);
  const rawMax = Math.max(...allValues, 1);
  const rawRange = rawMax - rawMin;
  const minValue = rawMin > 0 && rawRange < rawMax * 0.45 ? rawMin * 0.76 : 0;
  const maxValue = rawMax + Math.max(rawRange * 0.12, rawMax * 0.1, 1);
  const span = Math.max(maxValue - minValue, 1);
  const width = 920;
  const rowHeight = 44;
  const height = 46 + rows.length * rowHeight;
  const xStart = 250;
  const xEnd = 735;
  const xFor = (value: number) => xStart + ((value - minValue) / span) * (xEnd - xStart);

  return (
    <div className="mb-6 overflow-x-auto border-y border-gray-200 py-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full min-w-[760px]" role="img" aria-label="Valuation method range chart">
        <line x1={xStart} x2={xEnd} y1={24} y2={24} stroke="#e5e7eb" />
        <text x={xStart} y={15} className="fill-gray-400 text-[11px] font-bold">
          {valueFormatter(minValue)}
        </text>
        <text x={xEnd} y={15} textAnchor="end" className="fill-gray-400 text-[11px] font-bold">
          {valueFormatter(maxValue)}
        </text>
        {rows.map((row, index) => {
          const y = 48 + index * rowHeight;
          const lowX = xFor(row.low);
          const highX = xFor(row.high);
          const midX = xFor(row.mid);

          return (
            <g key={row.key}>
              <text x={0} y={y + 4} className="fill-gray-900 text-[13px] font-bold">
                {row.label}
              </text>
              <line x1={xStart} x2={xEnd} y1={y} y2={y} stroke="#f1f5f9" strokeWidth="8" strokeLinecap="round" />
              <line x1={lowX} x2={highX} y1={y} y2={y} stroke="#99f6e4" strokeWidth="8" strokeLinecap="round" />
              <circle cx={midX} cy={y} r={6} fill="#0f766e" stroke="#ffffff" strokeWidth="3">
                <title>{`${row.label}: ${valueFormatter(row.mid)}`}</title>
              </circle>
              <text x={width} y={y + 4} textAnchor="end" className="fill-gray-900 text-[12px] font-bold">
                {valueFormatter(row.mid)}
              </text>
            </g>
          );
        })}
      </svg>
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
  const [markdownDownloading, setMarkdownDownloading] = useState(false);
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
  const [copyError, setCopyError] = useState("");
  const [shareError, setShareError] = useState("");
  const supabase = createClient();

  const shareUrl = typeof window !== 'undefined' && shareToken ? `${window.location.origin}/share/${shareToken}` : '';

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      setCopyError("Failed to copy link. Please copy it manually.");
      setTimeout(() => setCopyError(""), 3000);
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
      setShareError("Failed to update share link. Please try again.");
      setTimeout(() => setShareError(""), 3000);
    } finally {
      setShareLoading(false);
    }
  };

  const handleShareSocial = (platform: 'twitter' | 'linkedin') => {
    if (workspaceRole !== "admin") return;
    if (!shareUrl) return;
    const methodCount = valuation?.methods?.filter((m: any) => m?.methodName).length || 0;
    const text = `Check out ${startup?.company_name || 'this startup'}'s valuation report - ${methodCount || "multiple"} methods, benchmarked, and investor-ready on Evaldam AI`;

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
      setReportLoadError(e instanceof Error ? e.message : "PDF download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const downloadMarkdown = async () => {
    if (!valuationIdParam || markdownDownloading) return;
    setMarkdownDownloading(true);
    try {
      const res = await fetch(`/api/valuations/${valuationIdParam}/markdown`);
      if (!res.ok) throw new Error("Failed to generate Markdown export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const disposition = res.headers.get("Content-Disposition") || "";
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
      const a = document.createElement("a");
      a.href = url;
      a.download = filenameMatch?.[1] || `${startup?.company_name || "valuation"}-report.md`;
      a.click();
      URL.revokeObjectURL(url);
      trackFeatureUsage("report_markdown_downloaded", {
        valuation_id: valuationIdParam,
        company_name: startup?.company_name || "Startup",
      });
    } catch (e) {
      setReportLoadError(e instanceof Error ? e.message : "Markdown export failed. Please try again.");
    } finally {
      setMarkdownDownloading(false);
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
  const valuationLow = Number(valuation.blended.lowRange || 0);
  const valuationHigh = Number(valuation.blended.highRange || 0);
  const valuationMid = Number(valuation.blended.weightedAverage || 0);
  const methodChartMax = Math.max(
    valuationHigh,
    valuationMid,
    valuationLow,
    ...(valuation.methods || []).map((method: any) => Number(method.highEstimate || method.midEstimate || 0)),
    1
  );
  const valuationChartMax = Math.max(methodChartMax, valuationHigh * 1.08, 1);
  const percent = (value: number, max = methodChartMax) => Math.min(100, Math.max(0, (Number(value || 0) / max) * 100));

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Nav */}
      <header className="bg-white/95 backdrop-blur border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link href={`/startup/${startupId}`} className="flex items-center gap-2.5 hover:opacity-70 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 tracking-tight">Evaldam AI</span>
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
              onClick={downloadMarkdown}
              disabled={!valuationIdParam || markdownDownloading}
              className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              {markdownDownloading ? (
                <><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />Preparing...</>
              ) : (
                <><FileText className="w-4 h-4" />Markdown</>
              )}
            </button>
            <button
              onClick={downloadPDF}
              disabled={!valuationIdParam || downloading}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
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

      {(shareError || copyError) && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-center text-sm font-semibold text-red-700">
          {shareError || copyError}
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
        {/* Header Section */}
        <div className="mb-8 border-b border-gray-200 pb-8">
          <Link href={`/startup/${startupId}`} className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 transition-colors hover:text-primary">
            <ArrowLeft className="w-4 h-4" /> Back to Startup
          </Link>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500">
                {stageLabel && <span>{stageLabel}</span>}
                <span className="h-1 w-1 rounded-full bg-gray-300" />
                <span>{new Date(reportDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
              </div>
              <h1 className="text-2xl font-bold leading-tight text-gray-950 sm:text-3xl">
                {startup?.company_name || "Startup"} Valuation
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-gray-600">Indicative valuation using {methodCount || "multiple"} method{methodCount === 1 ? "" : "s"}, evidence quality checks, and investor-readiness signals.</p>
            </div>
            <div className={`w-fit rounded-lg border px-3 py-2 text-xs font-bold ${getConfidenceColor(valuation.confidenceLevel)}`}>
              {(valuation.confidenceLevel || "Medium").charAt(0).toUpperCase() + (valuation.confidenceLevel || "Medium").slice(1)} confidence
            </div>
          </div>
        </div>

        {/* Primary Valuation Summary */}
        <div className="mb-8 border-b border-gray-200 pb-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
            {/* Left: Valuation Figure */}
            <div className="flex flex-col justify-center">
              <p className="mb-4 text-xs font-semibold text-primary">Pre-money valuation range</p>
              <div className="mb-6 flex flex-wrap items-end gap-x-5 gap-y-2">
                <div className="text-5xl font-bold tracking-[-0.04em] text-gray-950 sm:text-6xl">
                  ${((valuation.blended.lowRange || 0) / 1_000_000).toFixed(0)}M
                </div>
                <div className="pb-2 text-sm font-bold text-gray-400">to</div>
                <div className="text-5xl font-bold tracking-[-0.04em] text-primary sm:text-6xl">
                  ${((valuation.blended.highRange || 0) / 1_000_000).toFixed(0)}M
                </div>
              </div>
              <div className="mb-6 border-y border-gray-200 py-5">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <p className="text-xs font-semibold text-gray-600">Valuation range map</p>
                  <p className="text-xs font-bold text-gray-500">Midpoint {fmt(valuationMid)}</p>
                </div>
                <div className="relative h-12">
                  <div className="absolute left-0 right-0 top-5 h-2 bg-gray-100" />
                  <div
                    className="absolute top-5 h-2 bg-primary/35"
                    style={{
                      left: `${percent(valuationLow, valuationChartMax)}%`,
                      width: `${Math.max(3, percent(valuationHigh, valuationChartMax) - percent(valuationLow, valuationChartMax))}%`,
                    }}
                  />
                  <div
                    className="absolute top-1 h-10 w-px bg-gray-950"
                    style={{ left: `${percent(valuationMid, valuationChartMax)}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 text-xs font-semibold text-gray-500">
                  <span>{fmt(valuationLow)}</span>
                  <span className="text-center text-gray-700">{fmt(valuationMid)}</span>
                  <span className="text-right">{fmt(valuationHigh)}</span>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                <MetricCard label="Weighted Average" value={`$${((valuation.blended.weightedAverage || 0) / 1_000_000).toFixed(2)}M`} />
                <MetricCard label="Methods Used" value={String(methodCount)} />
                <MetricCard label="Confidence" value={`${confidencePercent}%`} />
              </div>
            </div>

            {/* Right: Report Status */}
            <div className="border-t border-gray-200 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <div className="space-y-5">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="text-xs font-semibold text-gray-500">Data completeness</p>
                    <p className="text-sm font-bold tabular-nums text-gray-950">{valuation.dataCompleteness || 0}%</p>
                  </div>
                  <div className="h-1.5 bg-gray-100">
                    <div className="h-1.5 bg-primary" style={{ width: `${valuation.dataCompleteness || 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="text-xs font-semibold text-gray-500">Investor readiness</p>
                    <p className="text-sm font-bold tabular-nums text-gray-950">{confidencePercent}%</p>
                  </div>
                  <div className="h-1.5 bg-gray-100">
                    <div className="h-1.5 bg-gray-950" style={{ width: `${confidencePercent}%` }} />
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs font-semibold leading-5 text-gray-500">
                    Confidence and completeness are directional signals for diligence readiness.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 flex gap-1 overflow-x-auto border-b border-gray-200">
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
              className={`border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
                activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-950"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "evidence" && (
          <div className="mb-12 border-b border-gray-200 pb-10">
            {supplementalDataError && (
              <div className="mb-5 flex items-start gap-2 border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{supplementalDataError}. Showing stored valuation data instead.</span>
              </div>
            )}
            <div className="mb-5 flex items-start gap-3">
              <ShieldCheck className="mt-1 h-6 w-6 text-primary" />
              <div>
                <h2 className="text-base font-bold text-gray-900">Evidence and Assumptions Trail</h2>
                <p className="mt-1 text-sm text-gray-600">Method outputs, assumptions, and stored inputs used to support this valuation version.</p>
              </div>
            </div>
            <div className="grid gap-4 border-y border-gray-200 py-4 md:grid-cols-3">
              <MetricCard label="Method rows" value={String(evidenceData?.methods?.length || valuation.methods?.length || 0)} />
              <MetricCard label="Evidence items" value={String(evidenceData?.evidence?.length || 0)} />
              <MetricCard label="Versions" value={String(evidenceData?.versions?.length || 1)} />
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-gray-500">Review status</p>
                <p className="mt-2 text-sm font-bold text-gray-900">{String(valuation.reportData?.reviewStatus?.status || "system_generated_unreviewed").replace(/_/g, " ")}</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">{valuation.reportData?.reviewStatus?.note || "Professional reviewer sign-off has not been recorded for this valuation."}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-gray-500">Market data status</p>
                <p className="mt-2 text-sm font-bold text-gray-900">{String(sourceAudit.marketDataStatus || "method_level_sources_used").replace(/_/g, " ")}</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">Fallback benchmarks, when used, are explicitly labelled so users know what must be verified before relying on the report as a professional opinion.</p>
              </div>
            </div>
            <div className="mt-8">
              <h3 className="font-bold text-gray-900">Assumptions and Provenance</h3>
              <div className="mt-4 overflow-x-auto border-y border-gray-200">
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
                <div key={`${method.method_name || method.methodName}-${index}`} className="border-t border-gray-200 pt-4">
                  <p className="font-bold text-gray-900">{method.method_display_name || methodLabel(method.method_name || method.methodName || "method")}</p>
                  <p className="mt-2 text-xs leading-relaxed text-gray-600">
                    {method.methodology_explanation || method.key_factors_explanation || method.reasoning || "Method output stored with this valuation."}
                  </p>
                  {method.assumptions && (
                    <pre className="mt-3 max-h-32 overflow-auto border border-gray-200 bg-gray-50 p-3 text-[11px] text-gray-600">
                      {JSON.stringify(method.assumptions, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
            {valuation.reportData?.inputFingerprint && (
              <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                <strong>Repeatability:</strong> input fingerprint {valuation.reportData.inputFingerprint}. Same saved inputs and methodology reuse this report.
              </div>
            )}
          </div>
        )}

        {activeTab === "methodology" && (
          <div className="mb-12 border-b border-gray-200 pb-10">
            {supplementalDataError && (
              <div className="mb-5 flex items-start gap-2 border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{supplementalDataError}. Some methodology details may be unavailable.</span>
              </div>
            )}
            <div className="mb-5 flex items-start gap-3">
              <FileText className="mt-1 h-6 w-6 text-primary" />
              <div>
                <h2 className="text-base font-bold text-gray-900">Methodology Trail</h2>
                <p className="mt-1 text-sm text-gray-600">Documentation for methods, verification checklist, and data sources relevant to this valuation.</p>
              </div>
            </div>
            <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
              {(methodologyData?.methodology?.methods || []).map((method: any, index: number) => (
                <div key={`${method.method}-${index}`} className="border-t border-gray-200 pt-4">
                  <p className="font-bold text-gray-900">{method.name || methodLabel(method.method || "method")}</p>
                  <p className="mt-1 text-xs font-semibold uppercase text-primary">{method.type || "Valuation method"}</p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{method.description || "Method documentation available for this valuation."}</p>
                  {method.formula && <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-gray-700">{method.formula}</p>}
                </div>
              ))}
            </div>
            {methodologyData?.importantNote && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                {methodologyData.importantNote}
              </div>
            )}
          </div>
        )}

        {activeTab === "scenarios" && (
          <div className="mb-12 border-b border-gray-200 pb-10">
            <h2 className="mb-2 text-base font-bold text-gray-900">Interactive Scenario Simulator</h2>
            <p className="mb-6 text-sm text-gray-600">Adjust growth and exit multiple assumptions to see an indicative impact on the current midpoint. This is a planning simulator, not a saved valuation version.</p>
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="space-y-6">
                <ScenarioSlider label="Growth assumption change" value={growthDelta} setValue={setGrowthDelta} />
                <ScenarioSlider label="Exit multiple change" value={multipleDelta} setValue={setMultipleDelta} />
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                <p className="text-xs font-semibold text-primary">Scenario range</p>
                <p className="mt-3 text-2xl font-bold text-gray-900">{fmt(scenarioLow)} - {fmt(scenarioHigh)}</p>
                <p className="mt-1 text-sm font-semibold text-primary">Mid-point {fmt(scenarioMid)}</p>
                <p className="mt-4 text-xs leading-relaxed text-gray-600">Create a new report from the startup workspace if these assumptions should become part of the official valuation trail.</p>
              </div>
            </div>
          </div>
        )}

        {/* Key Drivers */}
        {activeTab === "overview" && (
          <div className="mb-12 space-y-10">
            <section className="border-b border-gray-200 pb-10">
              <div className="mb-5">
                <p className="text-xs font-semibold text-primary">Basis of valuation</p>
                <h2 className="mt-1 text-base font-bold text-gray-900">Valuation Basis</h2>
              </div>
              <div className="grid gap-x-8 gap-y-5 lg:grid-cols-2">
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs font-semibold text-gray-500">Purpose</p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-700">Founder and investor discussion support for an indicative pre-money startup valuation.</p>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs font-semibold text-gray-500">Valuation date</p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-700">{new Date(reportDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs font-semibold text-gray-500">Standard / scope</p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-700">Indicative startup valuation analysis using recognized early-stage and venture valuation methods. This is not a statutory valuation certificate.</p>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs font-semibold text-gray-500">Limitations</p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-700">Actual negotiated valuation may differ based on due diligence, investor appetite, deal terms, control rights, and market timing.</p>
                </div>
              </div>
            </section>

            <section className="border-b border-gray-200 pb-10">
              <div className="mb-5 flex items-start gap-3">
                <ShieldCheck className="mt-1 h-6 w-6 text-primary" />
                <div>
                  <h2 className="text-base font-bold text-gray-900">Evidence Quality</h2>
                  <p className="mt-1 text-sm text-gray-600">{valuation.dataCompleteness || 0}% data completeness with {(valuation.confidenceLevel || "medium").toLowerCase()} confidence.</p>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-bold text-emerald-900">Evidence strengths</p>
                  <ul className="mt-3 space-y-2 text-sm text-emerald-950">
                    {(evidenceStrengths.length ? evidenceStrengths : ["Core valuation range and method outputs are available."]).map((item, index) => <li key={index}>{item}</li>)}
                  </ul>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-bold text-amber-900">Evidence gaps</p>
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
          <div className="mb-12 border-b border-gray-200 pb-10">
            <h2 className="mb-5 text-base font-bold text-gray-900">Valuation Methods Comparison</h2>
            <MethodRangeChart methods={valuation.methods} valueFormatter={fmt} />
            <div className="divide-y divide-gray-200 border-y border-gray-200">
              {valuation.methods.filter((m: any) => m?.methodName).map((method: any) => (
                <div
                  key={method.methodName}
                  className="cursor-pointer py-5 transition-colors hover:bg-gray-50"
                  onClick={() => setExpandedMethod(expandedMethod === method.methodName ? null : method.methodName)}
                >
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1.1fr)_minmax(220px,1fr)_minmax(130px,0.45fr)_minmax(145px,0.6fr)_auto] sm:items-center">
                    <h3 className="text-sm font-bold text-gray-900">{methodLabel(method.methodName)}</h3>
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-gray-500">Low-mid-high</p>
                        <p className="text-[10px] font-bold text-gray-500">{fmt(method.midEstimate || 0)}</p>
                      </div>
                      <div className="relative h-4">
                        <div className="absolute left-0 right-0 top-1.5 h-1 bg-gray-100" />
                        <div
                          className="absolute top-1.5 h-1 bg-primary/35"
                          style={{
                            left: `${percent(Number(method.lowEstimate || 0))}%`,
                            width: `${Math.max(2, percent(Number(method.highEstimate || 0)) - percent(Number(method.lowEstimate || 0)))}%`,
                          }}
                        />
                        <div
                          className="absolute top-0 h-4 w-px bg-gray-950"
                          style={{ left: `${percent(Number(method.midEstimate || 0))}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Midpoint</p>
                      <p className="mt-1 text-lg font-bold tabular-nums text-gray-950">{fmt(method.midEstimate || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Range</p>
                      <p className="mt-1 text-sm font-semibold tabular-nums text-gray-700">${((method.lowEstimate || 0) / 1_000_000).toFixed(1)}M - ${((method.highEstimate || 0) / 1_000_000).toFixed(1)}M</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <span className="text-xs font-semibold text-gray-500">{method.confidence}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedMethod === method.methodName ? "rotate-180" : ""}`} />
                    </div>
                  </div>

                  {expandedMethod === method.methodName && (
                    <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                      {method.reasoning && (
                        <p className="text-xs leading-relaxed text-gray-700">{method.reasoning.substring(0, 300)}{method.reasoning.length > 300 ? "..." : ""}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Quality */}
        {activeTab === "overview" && <div className="mb-12 border-b border-gray-200 pb-10">
          <div className="flex items-start gap-4">
            <Lock className="mt-1 h-6 w-6 flex-shrink-0 text-primary" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Report Quality Metrics</h3>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Data Completeness</p>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${valuation.dataCompleteness}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{valuation.dataCompleteness}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Methods Used</p>
                  <p className="text-2xl font-bold text-primary">{methodCount}</p>
                  <p className="text-xs text-gray-500">Methods available in this report</p>
                </div>
              </div>
            </div>
          </div>
        </div>}

        {/* Final CTA */}
        <div className="relative border-y border-gray-200 py-10 text-center">
          <div>
            <h3 className="mb-3 text-lg font-bold text-gray-950">Ready for Your Investors?</h3>
            <p className="mx-auto mb-8 max-w-xl text-gray-600">Download the complete professional report with detailed analysis across all valuation methods.</p>
            <button
              onClick={downloadPDF}
              disabled={!valuationIdParam || downloading}
              className="mx-auto flex items-center gap-3 rounded-xl bg-primary px-8 py-4 font-bold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              {downloading ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Generating PDF...</>
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
