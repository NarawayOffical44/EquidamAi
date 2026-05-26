/* eslint-disable jsx-a11y/alt-text -- @react-pdf Image does not support alt; watermark text labels the logo. */
import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { methodDescription, methodDisplayName, type ReportData } from "./report-template";

const EVALDAM_LOGO_SRC = (() => {
  try {
    const logo = readFileSync(join(process.cwd(), "public", "logo.png"));
    const mime = logo[0] === 0xff && logo[1] === 0xd8 && logo[2] === 0xff ? "image/jpeg" : "image/png";
    return `data:${mime};base64,${logo.toString("base64")}`;
  } catch {
    return "";
  }
})();

type ReportMethod = ReportData["methods"][number] & {
  blendWeight?: number;
  methodWeight?: number;
  weight?: number;
  method_display_name?: string;
  methodology_explanation?: string;
  key_factors_explanation?: string;
};

type InsightItem = NonNullable<ReportData["investorView"]>["tractionQuality"][number];

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: "#1e293b", backgroundColor: "#ffffff" },
  coverPage: { backgroundColor: "#0f172a", padding: 60, flexDirection: "column" },
  pad: { padding: 52 },
  row: { flexDirection: "row" },
  sectionTag: { fontSize: 8, color: "#6366f1", letterSpacing: 1.5, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  sectionTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 4 },
  sectionSub: { fontSize: 10, color: "#64748b", marginBottom: 24 },
  highlightBox: { backgroundColor: "#6366f1", borderRadius: 10, padding: 24, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: "#f8fafc", borderRadius: 8, padding: 12, alignItems: "center", marginRight: 8 },
  statLabel: { fontSize: 8, color: "#94a3b8", letterSpacing: 1, marginBottom: 4 },
  statValue: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#0f172a" },
  reasonRow: { flexDirection: "row", backgroundColor: "#f8fafc", borderRadius: 6, padding: 10, marginBottom: 6 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f1f5f9", padding: 8 },
  tableHeaderCell: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#64748b", letterSpacing: 0.8 },
  tableRow: { flexDirection: "row", padding: 8, borderBottom: "1px solid #f1f5f9" },
  tableRowAlt: { flexDirection: "row", padding: 8, borderBottom: "1px solid #f1f5f9", backgroundColor: "#f8fafc" },
  tableCell: { fontSize: 9.5, color: "#334155" },
  methodCard: { backgroundColor: "#f8fafc", borderRadius: 10, padding: 14, marginBottom: 10 },
  methodNumBox: { flex: 1, backgroundColor: "#ffffff", borderRadius: 6, padding: 8, alignItems: "center", marginRight: 6 },
  methodNumLabel: { fontSize: 7.5, color: "#94a3b8", letterSpacing: 0.8, marginBottom: 3 },
  methodNumValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#4f46e5" },
  darkBox: { backgroundColor: "#0f172a", borderRadius: 10, padding: 24, marginTop: 16 },
  barTrack: { backgroundColor: "#e2e8f0", borderRadius: 3, height: 7 },
  barFill: { backgroundColor: "#6366f1", borderRadius: 3, height: 7 },
  promptBox: { backgroundColor: "#fff7ed", borderWidth: 1, borderColor: "#fed7aa", borderRadius: 8, padding: 12, marginBottom: 10 },
  promptTitle: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: "#9a3412", marginBottom: 4 },
  promptText: { fontSize: 9.5, color: "#9a3412", lineHeight: 1.55 },
  chip: { backgroundColor: "#eef2ff", color: "#4338ca", borderRadius: 12, paddingTop: 4, paddingBottom: 4, paddingLeft: 9, paddingRight: 9, marginRight: 6, marginBottom: 6, fontSize: 8.5, fontFamily: "Helvetica-Bold" },
  insightLine: { backgroundColor: "#ffffff", borderRadius: 5, padding: 7, marginBottom: 5 },
  watermarkOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  watermarkLogo: { width: 256, height: 256, borderRadius: 28, opacity: 0.035, marginBottom: 20 },
  watermarkName: { fontSize: 76, color: "#0f172a", opacity: 0.055, letterSpacing: 2.2, fontFamily: "Helvetica-Bold" },
});

const fmt = (v: number) => `$${((v || 0) / 1_000_000).toFixed(2)}M`;
const fmtS = (v: number) => `$${((v || 0) / 1_000_000).toFixed(1)}M`;
const fmtK = (v: number) => {
  const n = Math.abs(v || 0);
  return n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}K`;
};

const cleanText = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const methodName = (m: ReportMethod) => methodDisplayName[m.methodName] || cleanText(m.method_display_name) || m.methodName;
const methodSummary = (m: ReportMethod) =>
  cleanText(m.methodology_explanation) ||
  cleanText(m.key_factors_explanation) ||
  methodDescription[m.methodName] ||
  cleanText(m.reasoning) ||
  "Method output included in the blended valuation with assumptions stored in the valuation record.";
const fmtImpact = (impact: number) => `${impact >= 0 ? "+" : "-"}${fmtK(impact)}`;
const fmtPct = (pct: number) => `${pct > 0 ? "+" : ""}${Number.isFinite(pct) ? pct.toFixed(Math.abs(pct) < 10 ? 1 : 0) : "0"}%`;

function FreePlanWatermark() {
  return (
    <View fixed style={s.watermarkOverlay}>
      {EVALDAM_LOGO_SRC ? <Image src={EVALDAM_LOGO_SRC} style={s.watermarkLogo} /> : null}
      <Text style={s.watermarkName}>Evaldam AI</Text>
    </View>
  );
}

function CompletionPrompt({ title, children }: { title: string; children: string }) {
  return (
    <View style={s.promptBox} wrap={false}>
      <Text style={s.promptTitle}>{title}</Text>
      <Text style={s.promptText}>{children}</Text>
    </View>
  );
}

function InsightList({ items }: { items: InsightItem[] }) {
  return (
    <View>
      {items.map((item, i) => (
        <View key={`${item.label}-${i}`} style={s.insightLine} wrap={false}>
          <Text style={{ fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 2 }}>{item.label}</Text>
          <Text style={{ fontSize: 8.3, color: item.status === "available" ? "#334155" : "#9a3412", lineHeight: 1.35 }}>
            {item.value || item.message || "To generate this item, add the required information in the dashboard."}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function buildReportDocument(data: ReportData) {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const stage = (data.stage || "seed").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const reportId = data.valuationId ? `EVD-${data.valuationId.substring(0, 8).toUpperCase()}` : `EVD-${Date.now()}`;
  const methods = (data.methods || []).filter(m => m?.methodName && (m?.midEstimate ?? 0) > 0) as ReportMethod[];
  const maxMid = methods.reduce((acc, m) => Math.max(acc, m.midEstimate || 0), 1);
  const confColor = data.confidenceLevel === "high" ? "#166534" : data.confidenceLevel === "medium" ? "#854d0e" : "#991b1b";
  const isFreePlan = data.isFreePlan === true;
  const detailedAnalysis = data.detailedAnalysis || {};
  const industryAnalysis = cleanText(detailedAnalysis.industryAnalysis);
  const marketContext = cleanText(detailedAnalysis.marketContext);
  const comparables = (detailedAnalysis.comparableCompanies || []).map(cleanText).filter(Boolean).slice(0, 8);
  const sensitivityRows = (data.sensitivityAnalysis || [])
    .filter(row => cleanText(row.variable) || cleanText(row.scenario) || typeof row.impact === "number")
    .slice(0, 8);
  const investorObjections = (data.investorObjections || []).map(cleanText).filter(Boolean);
  const nextValueLevers = (data.nextValueLevers || []).map(cleanText).filter(Boolean);
  const investorView = data.investorView || {
    thesis: "To generate the investor thesis, add customer proof, revenue signals, market size, and team credibility in the dashboard.",
    stageLens: `To generate a stronger ${stage} stage lens, add the stage-specific traction fields in the dashboard.`,
    marketStory: "To generate the market and competition story, add market description, target segment, competitors, and why the company wins in the dashboard.",
    teamCredibility: "To generate team credibility, add founder background, key hires, domain experience, and execution proof in the dashboard.",
    tractionQuality: [],
    financialOutlook: [],
    capitalEfficiency: [],
    useOfFunds: [],
    riskSummary: investorObjections,
  };

  const methodWeight = (m: ReportMethod) => {
    const raw = m?.weight ?? m?.blendWeight ?? m?.methodWeight;
    if (typeof raw === "number") return raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
    return Math.round(100 / Math.max(methods.length, 1));
  };

  const safePct = (val: number) => {
    const n = Math.round(((val || 0) / maxMid) * 100);
    return isNaN(n) || n < 0 ? 0 : n > 100 ? 100 : n;
  };

  return (
    <Document title={`Valuation Report — ${data.companyName}`} author="Evaldam AI">

      {/* PAGE 1: COVER */}
      <Page size="A4" style={[s.page, s.coverPage]}>
        {isFreePlan && <FreePlanWatermark />}
        <View style={[s.row, { justifyContent: "space-between", marginBottom: 56 }]}>
          <Text style={{ fontSize: 15, fontFamily: "Helvetica-Bold", color: "#ffffff" }}>Evaldam AI</Text>
          <Text style={{ fontSize: 9, color: "#475569", letterSpacing: 1.5 }}>CONFIDENTIAL</Text>
        </View>

        <Text style={{ fontSize: 9, color: "#a5b4fc", letterSpacing: 1.5, marginBottom: 16 }}>PRE-MONEY VALUATION REPORT</Text>
        <Text style={{ fontSize: 36, fontFamily: "Helvetica-Bold", color: "#ffffff", marginBottom: 8, lineHeight: 1.2 }}>{data.companyName}</Text>
        <Text style={{ fontSize: 13, color: "#94a3b8", marginBottom: 40 }}>{stage}{data.industry ? ` · ${data.industry}` : ""}</Text>

        <View style={[s.row, { marginBottom: 30 }]}>
          {[
            ["WEIGHTED AVERAGE", fmt(data.blendedAverage), "Pre-Money Valuation"],
            ["VALUATION RANGE", `${fmtS(data.blendedLow)} – ${fmtS(data.blendedHigh)}`, "Low — High bound"],
            ["CONFIDENCE", (data.confidenceLevel || "MEDIUM").toUpperCase(), `Data: ${data.dataCompleteness || 0}% complete`],
          ].map(([label, value, sub], i) => (
            <View key={i} style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 10, padding: 18, marginRight: i < 2 ? 10 : 0 }}>
              <Text style={{ fontSize: 8, color: "#64748b", letterSpacing: 1, marginBottom: 4 }}>{label}</Text>
              <Text style={{ fontSize: i === 0 ? 18 : 14, fontFamily: "Helvetica-Bold", color: "#ffffff", marginBottom: 2 }}>{value}</Text>
              <Text style={{ fontSize: 9, color: "#6366f1" }}>{sub}</Text>
            </View>
          ))}
        </View>

        {(data.keyReasons || []).slice(0, 3).map((r, i) => (
          <Text key={i} style={{ fontSize: 10, color: "#64748b", marginBottom: 5 }}>{i + 1}. {r}</Text>
        ))}

        <View style={[s.row, { justifyContent: "space-between", marginTop: 40 }]}>
          <View>
            <Text style={{ fontSize: 9, color: "#475569" }}>Report ID: {reportId}</Text>
            <Text style={{ fontSize: 9, color: "#475569" }}>Generated: {today}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 9, color: "#475569" }}>Evaldam AI Professional Valuation Engine</Text>
            <Text style={{ fontSize: 9, color: "#475569" }}>{methods.length}-Method Blended Analysis</Text>
          </View>
        </View>
      </Page>

      {/* PAGE 2: EXECUTIVE SUMMARY */}
      <Page size="A4" style={[s.page, s.pad]}>
        {isFreePlan && <FreePlanWatermark />}
        <Text style={s.sectionTag}>SECTION 1</Text>
        <Text style={s.sectionTitle}>Executive Summary</Text>
        <Text style={s.sectionSub}>Indicative pre-money valuation of {data.companyName} using {methods.length} valuation method{methods.length === 1 ? "" : "s"} and stored evidence quality checks.</Text>

        <View style={s.highlightBox}>
          <Text style={{ fontSize: 8, color: "#c7d2fe", letterSpacing: 1, marginBottom: 6 }}>PRE-MONEY VALUATION — WEIGHTED AVERAGE</Text>
          <Text style={{ fontSize: 34, fontFamily: "Helvetica-Bold", color: "#ffffff", marginBottom: 12 }}>{fmt(data.blendedAverage)}</Text>
          <View style={s.row}>
            {[
              ["Low Bound", fmt(data.blendedLow)],
              ["High Bound", fmt(data.blendedHigh)],
              ["Methods", String(methods.length)],
            ].map(([label, val], i) => (
              <View key={i} style={{ marginRight: 28 }}>
                <Text style={{ fontSize: 9, color: "#c7d2fe", marginBottom: 2 }}>{label}</Text>
                <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", color: "#ffffff" }}>{val}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[s.row, { marginBottom: 20 }]}>
          {[
            ["CONFIDENCE", (data.confidenceLevel || "MEDIUM").toUpperCase(), confColor],
            ["DATA QUALITY", `${data.dataCompleteness || 0}%`, "#0f172a"],
            ["STAGE", stage, "#0f172a"],
          ].map(([label, val, color], i) => (
            <View key={i} style={[s.statBox, i === 2 ? { marginRight: 0 } : {}]}>
              <Text style={s.statLabel}>{label}</Text>
              <Text style={[s.statValue, { color: color as string }]}>{val}</Text>
            </View>
          ))}
        </View>

        <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 12 }}>Key Valuation Drivers</Text>
        {(data.keyReasons || []).map((r, i) => (
          <View key={i} style={s.reasonRow}>
            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: "#6366f1", width: 16, flexShrink: 0 }}>{i + 1}.</Text>
            <Text style={{ fontSize: 10, color: "#334155", lineHeight: 1.6, flex: 1 }}>{r}</Text>
          </View>
        ))}
      </Page>

      {/* PAGE 3: METHODS OVERVIEW */}
      <Page size="A4" style={[s.page, s.pad]}>
        {isFreePlan && <FreePlanWatermark />}
        <Text style={s.sectionTag}>SECTION 2</Text>
        <Text style={s.sectionTitle}>Valuation Methods Overview</Text>
        <Text style={s.sectionSub}>All methods run in parallel. Final valuation blended using stage-weighted averaging.</Text>

        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderCell, { flex: 3 }]}>METHOD</Text>
          <Text style={[s.tableHeaderCell, { flex: 1.5, textAlign: "right" }]}>LOW</Text>
          <Text style={[s.tableHeaderCell, { flex: 1.5, textAlign: "right" }]}>MID</Text>
          <Text style={[s.tableHeaderCell, { flex: 1.5, textAlign: "right" }]}>HIGH</Text>
          <Text style={[s.tableHeaderCell, { flex: 1, textAlign: "center" }]}>WEIGHT</Text>
        </View>
        {methods.map((m, i) => (
          <View key={m.methodName} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
            <Text style={[s.tableCell, { flex: 3, fontFamily: "Helvetica-Bold" }]}>{methodName(m)}</Text>
            <Text style={[s.tableCell, { flex: 1.5, textAlign: "right", color: "#64748b" }]}>{fmt(m.lowEstimate)}</Text>
            <Text style={[s.tableCell, { flex: 1.5, textAlign: "right", fontFamily: "Helvetica-Bold", color: "#4f46e5" }]}>{fmt(m.midEstimate)}</Text>
            <Text style={[s.tableCell, { flex: 1.5, textAlign: "right", color: "#64748b" }]}>{fmt(m.highEstimate)}</Text>
            <Text style={[s.tableCell, { flex: 1, textAlign: "center" }]}>{methodWeight(m)}%</Text>
          </View>
        ))}
        <View style={[s.tableRow, { backgroundColor: "#f0f4ff" }]}>
          <Text style={[s.tableCell, { flex: 3, fontFamily: "Helvetica-Bold", color: "#4338ca" }]}>BLENDED RESULT</Text>
          <Text style={[s.tableCell, { flex: 1.5, textAlign: "right", color: "#4338ca" }]}>{fmt(data.blendedLow)}</Text>
          <Text style={[s.tableCell, { flex: 1.5, textAlign: "right", fontFamily: "Helvetica-Bold", color: "#4338ca" }]}>{fmt(data.blendedAverage)}</Text>
          <Text style={[s.tableCell, { flex: 1.5, textAlign: "right", color: "#4338ca" }]}>{fmt(data.blendedHigh)}</Text>
          <Text style={[s.tableCell, { flex: 1, textAlign: "center", color: "#4338ca" }]}>100%</Text>
        </View>

        <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: "#0f172a", marginTop: 28, marginBottom: 14 }}>Methods Visualization</Text>
        {methods.map(m => {
          const pct = safePct(m.midEstimate);
          return (
            <View key={m.methodName} style={{ marginBottom: 10 }}>
              <View style={[s.row, { justifyContent: "space-between", marginBottom: 3 }]}>
                <Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#334155" }}>{methodName(m)}</Text>
                <Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#6366f1" }}>{fmt(m.midEstimate)}</Text>
              </View>
              <View style={s.barTrack}>
                <View style={[s.barFill, { width: `${pct}%` }]} />
              </View>
            </View>
          );
        })}
      </Page>

      {/* PAGE 4: METHOD DETAIL */}
      <Page size="A4" style={[s.page, s.pad]}>
        {isFreePlan && <FreePlanWatermark />}
        <Text style={s.sectionTag}>SECTION 3</Text>
        <Text style={s.sectionTitle}>Detailed Method Analysis</Text>
        <Text style={s.sectionSub}>Methodology, data sources, and calculations for each valuation method.</Text>

        {methods.map((m) => (
          <View key={m.methodName} style={s.methodCard} wrap={false}>
            <View style={[s.row, { justifyContent: "space-between", alignItems: "center", marginBottom: 4 }]}>
              <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: "#0f172a" }}>{methodName(m)}</Text>
              <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: "#6366f1" }}>{fmt(m.midEstimate)}</Text>
            </View>
            <Text style={{ fontSize: 9, color: "#475569", lineHeight: 1.6, marginBottom: 10 }}>{methodSummary(m)}</Text>
            <View style={[s.row, { marginBottom: 8 }]}>
              {[["LOW", fmt(m.lowEstimate), "#64748b"], ["MID", fmt(m.midEstimate), "#4f46e5"], ["HIGH", fmt(m.highEstimate), "#64748b"]].map(([label, val, color], i) => (
                <View key={i} style={[s.methodNumBox, i === 2 ? { marginRight: 0 } : {}]}>
                  <Text style={s.methodNumLabel}>{label} ESTIMATE</Text>
                  <Text style={[s.methodNumValue, { color: color as string, fontSize: i === 1 ? 13 : 11 }]}>{val}</Text>
                </View>
              ))}
            </View>
            {m.reasoning && (
              <Text style={{ fontSize: 9, color: "#64748b", lineHeight: 1.6, backgroundColor: "#ffffff", padding: 8, borderRadius: 6 }}>
                {(m.reasoning as string).substring(0, 300)}{(m.reasoning as string).length > 300 ? "..." : ""}
              </Text>
            )}
            <View style={[s.row, { justifyContent: "space-between", marginTop: 8, paddingTop: 8 }]}>
              <Text style={{ fontSize: 8.5, color: "#94a3b8" }}>Weight: {methodWeight(m)}%</Text>
              <Text style={{ fontSize: 8.5, color: "#94a3b8" }}>Confidence: {(m.confidence || "medium").toUpperCase()}</Text>
            </View>
          </View>
        ))}
      </Page>

      {/* PAGE 5: MARKET ANALYSIS */}
      <Page size="A4" style={[s.page, s.pad]}>
        {isFreePlan && <FreePlanWatermark />}
        <Text style={s.sectionTag}>SECTION 4</Text>
        <Text style={s.sectionTitle}>Market Analysis</Text>
        <Text style={s.sectionSub}>Market narrative, comparable companies, and context used to ground the valuation.</Text>

        {industryAnalysis ? (
          <View style={s.methodCard}>
            <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 6 }}>Industry Analysis</Text>
            <Text style={{ fontSize: 9.5, color: "#475569", lineHeight: 1.7 }}>{industryAnalysis}</Text>
          </View>
        ) : (
          <CompletionPrompt title="Industry analysis not generated">
            To generate this section, add market description, target segment, and industry context in the dashboard.
          </CompletionPrompt>
        )}

        {marketContext ? (
          <View style={s.methodCard}>
            <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 6 }}>Market Context</Text>
            <Text style={{ fontSize: 9.5, color: "#475569", lineHeight: 1.7 }}>{marketContext}</Text>
          </View>
        ) : (
          <CompletionPrompt title="Market context not generated">
            To generate this section, add competition, market timing, recent benchmarks, and why now in the dashboard.
          </CompletionPrompt>
        )}

        <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: "#0f172a", marginTop: 6, marginBottom: 10 }}>Comparable Companies</Text>
        {comparables.length > 0 ? (
          <View style={[s.row, { flexWrap: "wrap", marginBottom: 12 }]}>
            {comparables.map((company, i) => (
              <Text key={`${company}-${i}`} style={s.chip}>{company}</Text>
            ))}
          </View>
        ) : (
          <CompletionPrompt title="Comparable companies not generated">
            To generate this section, add comparable companies or relevant market benchmarks in the dashboard.
          </CompletionPrompt>
        )}
      </Page>

      {/* PAGE 6: SENSITIVITY */}
      <Page size="A4" style={[s.page, s.pad]}>
        {isFreePlan && <FreePlanWatermark />}
        <Text style={s.sectionTag}>SECTION 5</Text>
        <Text style={s.sectionTitle}>Sensitivity Analysis</Text>
        <Text style={s.sectionSub}>Bull, base, and downside-style scenarios showing how valuation changes when important assumptions move.</Text>

        {sensitivityRows.length > 0 ? (
          <>
            <View style={s.tableHeader}>
              <Text style={[s.tableHeaderCell, { flex: 1.5 }]}>VARIABLE</Text>
              <Text style={[s.tableHeaderCell, { flex: 2 }]}>SCENARIO</Text>
              <Text style={[s.tableHeaderCell, { flex: 1, textAlign: "right" }]}>CHANGE</Text>
              <Text style={[s.tableHeaderCell, { flex: 1.2, textAlign: "right" }]}>IMPACT</Text>
            </View>
            {sensitivityRows.map((row, i) => {
              const positive = (row.percentageChange || 0) >= 0;
              return (
                <View key={`${row.variable}-${row.scenario}-${i}`} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                  <Text style={[s.tableCell, { flex: 1.5, fontFamily: "Helvetica-Bold" }]}>{cleanText(row.variable) || "Assumption"}</Text>
                  <Text style={[s.tableCell, { flex: 2, color: "#475569" }]}>{cleanText(row.scenario) || "Scenario"}</Text>
                  <Text style={[s.tableCell, { flex: 1, textAlign: "right", color: positive ? "#166534" : "#991b1b", fontFamily: "Helvetica-Bold" }]}>{fmtPct(row.percentageChange || 0)}</Text>
                  <Text style={[s.tableCell, { flex: 1.2, textAlign: "right", color: positive ? "#166534" : "#991b1b", fontFamily: "Helvetica-Bold" }]}>{fmtImpact(row.impact || 0)}</Text>
                </View>
              );
            })}
          </>
        ) : (
          <CompletionPrompt title="Sensitivity analysis not generated">
            To generate this section, add revenue, growth, runway, burn, gross margin, and key assumption details in the dashboard.
          </CompletionPrompt>
        )}
      </Page>

      {/* PAGE 7: INVESTOR CASE COMPLETION */}
      <Page size="A4" style={[s.page, s.pad]}>
        {isFreePlan && <FreePlanWatermark />}
        <Text style={s.sectionTag}>SECTION 6</Text>
        <Text style={s.sectionTitle}>Investor Case Completion</Text>
        <Text style={s.sectionSub}>Stage-specific founder and investor view. Missing data is shown as a dashboard action so the report stays complete without inventing information.</Text>

        <View style={s.methodCard}>
          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 6 }}>Investor Thesis</Text>
          <Text style={{ fontSize: 9.5, color: "#475569", lineHeight: 1.7 }}>{investorView.thesis}</Text>
        </View>
        <View style={[s.row, { marginBottom: 12 }]}>
          <View style={[s.methodCard, { flex: 1, marginRight: 8 }]}>
            <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 6 }}>Stage Lens</Text>
            <Text style={{ fontSize: 9, color: "#475569", lineHeight: 1.6 }}>{investorView.stageLens}</Text>
          </View>
          <View style={[s.methodCard, { flex: 1, marginRight: 0 }]}>
            <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 6 }}>Team Credibility</Text>
            <Text style={{ fontSize: 9, color: "#475569", lineHeight: 1.6 }}>{investorView.teamCredibility}</Text>
          </View>
        </View>
        <View style={[s.row, { marginBottom: 10 }]}>
          <View style={[s.methodCard, { flex: 1, marginRight: 8 }]}>
            <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 8 }}>Traction Quality</Text>
            <InsightList items={investorView.tractionQuality} />
          </View>
          <View style={[s.methodCard, { flex: 1, marginRight: 0 }]}>
            <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 8 }}>Financial Outlook</Text>
            <InsightList items={investorView.financialOutlook} />
          </View>
        </View>
        <View style={[s.row, { marginBottom: 10 }]}>
          <View style={[s.methodCard, { flex: 1, marginRight: 8 }]}>
            <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 8 }}>Capital Efficiency</Text>
            <InsightList items={investorView.capitalEfficiency} />
          </View>
          <View style={[s.methodCard, { flex: 1, marginRight: 0 }]}>
            <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 8 }}>Use of Funds and Milestones</Text>
            <InsightList items={investorView.useOfFunds} />
          </View>
        </View>
      </Page>

      {/* PAGE 8: BASIS AND EVIDENCE */}
      <Page size="A4" style={[s.page, s.pad]}>
        {isFreePlan && <FreePlanWatermark />}
        <Text style={s.sectionTag}>SECTION 7</Text>
        <Text style={s.sectionTitle}>Basis of Valuation</Text>
        <Text style={s.sectionSub}>Purpose, scope, data sources, limitations, and evidence quality for this valuation version.</Text>

        <View style={s.methodCard}>
          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 6 }}>Purpose</Text>
          <Text style={{ fontSize: 9.5, color: "#475569", lineHeight: 1.6 }}>{data.basisOfValuation?.purpose || "Founder and investor discussion support for an indicative startup valuation."}</Text>
          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a", marginTop: 12, marginBottom: 6 }}>Valuation Date</Text>
          <Text style={{ fontSize: 9.5, color: "#475569" }}>{data.basisOfValuation?.valuationDate || today}</Text>
          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a", marginTop: 12, marginBottom: 6 }}>Standard / Scope</Text>
          <Text style={{ fontSize: 9.5, color: "#475569", lineHeight: 1.6 }}>{data.basisOfValuation?.standard || "Indicative valuation analysis. Not a statutory valuation certificate."}</Text>
        </View>

        <View style={[s.row, { marginBottom: 12 }]}>
          <View style={[s.methodCard, { flex: 1, marginRight: 8 }]}>
            <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 8 }}>Data Sources</Text>
            {(data.basisOfValuation?.dataSources || []).map((item, i) => (
              <Text key={i} style={{ fontSize: 9, color: "#475569", lineHeight: 1.6, marginBottom: 4 }}>{i + 1}. {item}</Text>
            ))}
          </View>
          <View style={[s.methodCard, { flex: 1, marginRight: 0 }]}>
            <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 8 }}>Limitations</Text>
            {(data.basisOfValuation?.limitations || []).map((item, i) => (
              <Text key={i} style={{ fontSize: 9, color: "#475569", lineHeight: 1.6, marginBottom: 4 }}>{i + 1}. {item}</Text>
            ))}
          </View>
        </View>

        <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 6 }}>Evidence Quality: {data.evidenceQuality?.label || "Moderate"}</Text>
        <Text style={{ fontSize: 9.5, color: "#64748b", marginBottom: 10 }}>{data.evidenceQuality?.summary || "Evidence quality is based on completeness, confidence, and available traction inputs."}</Text>
        <View style={[s.row, { marginBottom: 12 }]}>
          <View style={[s.methodCard, { flex: 1, marginRight: 8 }]}>
            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: "#166534", marginBottom: 6 }}>Strengths</Text>
            {(data.evidenceQuality?.strengths || []).map((item, i) => (
              <Text key={i} style={{ fontSize: 9, color: "#475569", lineHeight: 1.6, marginBottom: 4 }}>- {item}</Text>
            ))}
          </View>
          <View style={[s.methodCard, { flex: 1, marginRight: 0 }]}>
            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: "#854d0e", marginBottom: 6 }}>Gaps</Text>
            {(data.evidenceQuality?.gaps || []).map((item, i) => (
              <Text key={i} style={{ fontSize: 9, color: "#475569", lineHeight: 1.6, marginBottom: 4 }}>- {item}</Text>
            ))}
          </View>
        </View>

        <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 8 }}>Assumptions and Provenance</Text>
        {(data.provenance || []).map((row, i) => (
          <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
            <Text style={[s.tableCell, { flex: 1.5, fontFamily: "Helvetica-Bold" }]}>{row.item}</Text>
            <Text style={[s.tableCell, { flex: 1.5 }]}>{row.value}</Text>
            <Text style={[s.tableCell, { flex: 1.2, color: "#64748b" }]}>{row.source}</Text>
          </View>
        ))}

        <View style={[s.methodCard, { marginTop: 14 }]}>
          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 6 }}>Verification Status</Text>
          <Text style={{ fontSize: 9, color: "#475569", lineHeight: 1.6 }}>
            {data.reviewStatus?.status === "approved"
              ? "This valuation has reviewer approval recorded in the audit trail."
              : "This valuation is system-generated and should be treated as an indicative valuation until reviewed against supporting documents."}
          </Text>
          {data.reviewStatus?.note && (
            <Text style={{ fontSize: 8.5, color: "#64748b", lineHeight: 1.5, marginTop: 5 }}>{data.reviewStatus.note}</Text>
          )}
          {data.sourceAudit?.marketDataStatus && (
            <Text style={{ fontSize: 8.5, color: "#64748b", lineHeight: 1.5, marginTop: 5 }}>Market data status: {data.sourceAudit.marketDataStatus.replace(/_/g, " ")}</Text>
          )}
        </View>
      </Page>

      {/* PAGE 9: INVESTOR READINESS */}
      <Page size="A4" style={[s.page, s.pad]}>
        {isFreePlan && <FreePlanWatermark />}
        <Text style={s.sectionTag}>SECTION 8</Text>
        <Text style={s.sectionTitle}>Investor Readiness</Text>
        <Text style={s.sectionSub}>Likely diligence questions and concrete levers that can improve the next valuation version.</Text>
        <View style={[s.row, { marginBottom: 16 }]}>
          <View style={[s.methodCard, { flex: 1, marginRight: 8 }]}>
            <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 8 }}>Investor Objections</Text>
            {(investorObjections.length ? investorObjections : ["To generate stronger investor objections, add revenue, market, traction, and verification details in the dashboard."]).map((item, i) => (
              <Text key={i} style={{ fontSize: 9.5, color: "#475569", lineHeight: 1.7, marginBottom: 6 }}>{i + 1}. {item}</Text>
            ))}
          </View>
          <View style={[s.methodCard, { flex: 1, marginRight: 0 }]}>
            <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 8 }}>Next Value Levers</Text>
            {(nextValueLevers.length ? nextValueLevers : ["To generate specific value levers, add ARR/MRR, growth, market size, runway, and next milestones in the dashboard."]).map((item, i) => (
              <Text key={i} style={{ fontSize: 9.5, color: "#475569", lineHeight: 1.7, marginBottom: 6 }}>{i + 1}. {item}</Text>
            ))}
          </View>
        </View>
        <View style={s.methodCard}>
          <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 8 }}>Simple Risk Summary</Text>
          {(investorView.riskSummary.length ? investorView.riskSummary : investorObjections).slice(0, 4).map((item, i) => (
            <Text key={`${item}-${i}`} style={{ fontSize: 9.5, color: "#475569", lineHeight: 1.7, marginBottom: 5 }}>{i + 1}. {item}</Text>
          ))}
        </View>
      </Page>

      {/* PAGE 10: REPORT STATEMENT */}
      <Page size="A4" style={[s.page, s.pad]}>
        {isFreePlan && <FreePlanWatermark />}
        <Text style={s.sectionTag}>APPENDIX</Text>
        <Text style={s.sectionTitle}>Report Statement</Text>
        <Text style={s.sectionSub}>Data provenance, report scope, and legal disclaimer.</Text>

        {[
          ["Prof. A. Damodaran, NYU Stern", "WACC, EBITDA multiples, LTG rates (2026)"],
          ["Federal Reserve (2026)", "Risk-free rate 4.2%, Fed Funds 4.5%"],
          ["CB Insights Q1 2026", "Venture funding trends, stage benchmarks"],
          ["PitchBook 2026", "Comparable company multiples and exit data"],
          ["Crunchbase (real-time)", "Funding rounds, comparable exits"],
        ].map(([src, desc], i) => (
          <View key={i} style={[s.row, { padding: 8, backgroundColor: i % 2 === 0 ? "#f8fafc" : "#ffffff" }]}>
            <Text style={[s.tableCell, { flex: 2, fontFamily: "Helvetica-Bold" }]}>{src}</Text>
            <Text style={[s.tableCell, { flex: 3, color: "#64748b" }]}>{desc}</Text>
          </View>
        ))}

        <View style={s.darkBox}>
          <View style={[s.row, { justifyContent: "space-between", marginBottom: 14 }]}>
            <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: "#e2e8f0" }}>Evaldam AI Valuation Analysis Statement</Text>
            <Text style={{ fontSize: 9, color: "#6366f1" }}>{reportId}</Text>
          </View>
          <Text style={{ fontSize: 9, color: "#94a3b8", lineHeight: 1.7, marginBottom: 12 }}>
            This report presents an indicative valuation analysis for {data.companyName}. Outputs are based on provided inputs, stored method assumptions, and available market benchmark context as of {today}. This is not a signed statutory valuation certificate.
          </Text>
          <Text style={{ fontSize: 8, color: "#64748b", lineHeight: 1.7, marginBottom: 16 }}>
            DISCLAIMER: This report is for informational and fundraising purposes only. It does not constitute financial advice, an offer to sell, or a solicitation of any investment. Actual valuations may differ based on negotiation, market conditions, and due diligence. Evaldam AI is not a registered investment adviser or broker-dealer. © {new Date().getFullYear()} Evaldam AI.
          </Text>
          <View style={[s.row, { justifyContent: "space-between", paddingTop: 14 }]}>
            <View>
              <Text style={{ fontSize: 14, color: "#c7d2fe", fontFamily: "Helvetica-Oblique", marginBottom: 3 }}>Evaldam AI Engine</Text>
              <Text style={{ fontSize: 8, color: "#64748b" }}>Automated Professional Valuation System</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: "#e2e8f0", marginBottom: 3 }}>Date of Issue</Text>
              <Text style={{ fontSize: 9, color: "#94a3b8" }}>{today}</Text>
            </View>
          </View>
        </View>

        <Text style={{ fontSize: 9, color: "#94a3b8", textAlign: "center", marginTop: 20 }}>
          CONFIDENTIAL — Prepared exclusively for {data.companyName} and its authorized representatives.
        </Text>
      </Page>

    </Document>
  );
}
