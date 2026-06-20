/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  Document, Page, Text, View, StyleSheet, Image,
  Svg, Rect, Line, G, Defs, LinearGradient, Stop,
} from "@react-pdf/renderer";
import { methodDescription, methodDisplayName, type ReportData } from "./report-template";

// ─── Logo ─────────────────────────────────────────────────────────────────────
const EVALDAM_LOGO_SRC = (() => {
  try {
    const logo = readFileSync(join(process.cwd(), "public", "logo.png"));
    const mime = logo[0] === 0xff && logo[1] === 0xd8 ? "image/jpeg" : "image/png";
    return `data:${mime};base64,${logo.toString("base64")}`;
  } catch { return ""; }
})();

// ─── Types ────────────────────────────────────────────────────────────────────
type ReportMethod = ReportData["methods"][number] & {
  blendWeight?: number; methodWeight?: number; weight?: number;
  method_display_name?: string;
  methodology_explanation?: string; key_factors_explanation?: string;
};
type InsightItem = NonNullable<ReportData["investorView"]>["tractionQuality"][number];

// ─── Design Tokens ────────────────────────────────────────────────────────────
// Brand: primary teal #007a7a, dark teal #005f5f, light teal #00b2b2
const BRAND  = "#007a7a";   // primary teal - key accents, section tags, blended result
const BRAND2 = "#005f5f";   // dark teal - cover strip, card borders
const BRAND3 = "#00b2b2";   // light teal - gradients, range fills
const VIOLET = BRAND2;      // alias - method mid values, secondary card borders
const TEAL   = "#0d9488";   // near-brand supporting teal
const INK    = "#111827";
const SLATE  = "#374151";
const MUTED  = "#6b7280";
const LIGHT  = "#9ca3af";
const RULE   = "#e5e7eb";
const SURF   = "#f9fafb";
const WHITE  = "#ffffff";
const GREEN  = "#065f46";
const RED    = "#991b1b";
const AMBER  = "#92400e";

// A4 content width after 48pt side padding
const CONTENT_W = 499;

// react-pdf SVG Text has a union-type issue with fontFamily/fontSize as direct props.
// Cast to any via this tiny wrapper so chart components stay readable.
type SvgTProps = { x: number; y: number; fontSize?: number; fill?: string; fontFamily?: string; textAnchor?: string; children: string };
const SvgText = (p: SvgTProps) => <Text {...(p as unknown as object)} />;

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Page shells
  page:        { fontFamily: "Helvetica", fontSize: 9.5, color: INK, backgroundColor: WHITE },
  coverPage:   { fontFamily: "Helvetica", fontSize: 9.5, color: INK, backgroundColor: WHITE, flexDirection: "column" },

  // Running header
  runningHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                   paddingLeft: 48, paddingRight: 48, paddingTop: 18, paddingBottom: 12,
                   borderBottomWidth: 1, borderBottomColor: RULE },
  runningFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                   paddingLeft: 48, paddingRight: 48, paddingTop: 10, paddingBottom: 18,
                   borderTopWidth: 1, borderTopColor: RULE },
  content:      { flex: 1, paddingLeft: 48, paddingRight: 48, paddingTop: 28, paddingBottom: 20 },

  row: { flexDirection: "row" },

  // Section labels
  sectionTag:  { fontSize: 7, color: BRAND, letterSpacing: 2.5, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  sectionTitle:{ fontSize: 22, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 4, lineHeight: 1.1 },
  sectionRule: { height: 2, width: 36, backgroundColor: BRAND, marginBottom: 18 },
  sectionSub:  { fontSize: 9, color: MUTED, lineHeight: 1.65, marginBottom: 20 },

  // Hero box (Executive Summary key number)
  heroBox: { backgroundColor: SURF, borderRadius: 10, borderWidth: 1, borderColor: RULE,
             borderTopWidth: 3, borderTopColor: BRAND, padding: 22, marginBottom: 18 },

  // Stat boxes
  statBox: { flex: 1, backgroundColor: WHITE, borderWidth: 1, borderColor: RULE, borderRadius: 8,
             padding: 14, alignItems: "center", marginRight: 8 },
  statLabel: { fontSize: 7, color: MUTED, letterSpacing: 1, fontFamily: "Helvetica-Bold", marginBottom: 5 },
  statValue: { fontSize: 15, fontFamily: "Helvetica-Bold", color: INK },

  // Driver rows
  driverRow: { flexDirection: "row", paddingTop: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: RULE },

  // Tables
  th:  { flexDirection: "row", backgroundColor: SURF, paddingTop: 7, paddingBottom: 7,
         paddingLeft: 10, paddingRight: 10, borderBottomWidth: 1, borderBottomColor: RULE },
  tr:  { flexDirection: "row", paddingTop: 8, paddingBottom: 8, paddingLeft: 10, paddingRight: 10,
         borderBottomWidth: 1, borderBottomColor: RULE },
  trAlt: { flexDirection: "row", paddingTop: 8, paddingBottom: 8, paddingLeft: 10, paddingRight: 10,
           borderBottomWidth: 1, borderBottomColor: RULE, backgroundColor: SURF },
  thCell: { fontSize: 7, fontFamily: "Helvetica-Bold", color: MUTED, letterSpacing: 0.8 },
  td:  { fontSize: 8.5, color: SLATE },

  // Cards (left-bordered)
  card: { backgroundColor: WHITE, borderWidth: 1, borderColor: RULE, borderRadius: 8,
          borderLeftWidth: 3, borderLeftColor: VIOLET, padding: 14, marginBottom: 10 },

  // Chips
  chip: { backgroundColor: "#e6f7f7", color: BRAND, borderRadius: 12, paddingTop: 4, paddingBottom: 4,
          paddingLeft: 9, paddingRight: 9, marginRight: 6, marginBottom: 6, fontSize: 8,
          fontFamily: "Helvetica-Bold" },

  // Insight rows
  insightRow: { backgroundColor: SURF, borderRadius: 5, padding: 8, marginBottom: 5 },

  // Prompt (data missing)
  prompt: { backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a", borderRadius: 7,
            padding: 10, marginBottom: 10 },

  // Disclaimer box
  disclaimer: { backgroundColor: SURF, borderWidth: 1, borderColor: RULE, borderRadius: 10,
                padding: 22, marginTop: 16 },

  // Watermark
  watermarkOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                      alignItems: "center", justifyContent: "center" },
  watermarkName: { fontSize: 72, color: INK, opacity: 0.04, letterSpacing: 2, fontFamily: "Helvetica-Bold" },
  watermarkLogo: { width: 240, height: 240, borderRadius: 24, opacity: 0.03, marginBottom: 16 },

  // TOC
  tocTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 4 },
  tocRow:   { flexDirection: "row", alignItems: "center", paddingTop: 10, paddingBottom: 10,
              borderBottomWidth: 1, borderBottomColor: RULE },
  tocNum:   { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: BRAND, width: 32 },
  tocLabel: { fontSize: 10, color: SLATE, flex: 1 },
  tocTag:   { fontSize: 8, color: MUTED },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt  = (v: number) => `$${((v || 0) / 1_000_000).toFixed(2)}M`;
const fmtS = (v: number) => `$${((v || 0) / 1_000_000).toFixed(1)}M`;
const fmtK = (v: number) => { const n = Math.abs(v || 0); return n >= 1_000_000 ? `$${(n/1e6).toFixed(1)}M` : `$${(n/1000).toFixed(0)}K`; };
const fmtImpact = (n: number) => `${n >= 0 ? "+" : "−"}${fmtK(Math.abs(n))}`;
const fmtPct    = (n: number) => `${n > 0 ? "+" : ""}${Number.isFinite(n) ? n.toFixed(Math.abs(n) < 10 ? 1 : 0) : "0"}%`;
const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const mName = (m: ReportMethod) => methodDisplayName[m.methodName] || clean(m.method_display_name) || m.methodName;
const mNameShort = (m: ReportMethod) => mName(m).split(" ").slice(0, 2).join(" ");
const mSummary = (m: ReportMethod) =>
  clean(m.methodology_explanation) || clean(m.key_factors_explanation) ||
  methodDescription[m.methodName] || clean(m.reasoning) ||
  "Method output included in the blended valuation.";
const confColor = (level: string) =>
  level === "high" ? GREEN : level === "medium" ? AMBER : RED;

// ─── SVG Charts ───────────────────────────────────────────────────────────────

/** Horizontal range bars: shows low–high spread, mid marker */
function RangeChart({ methods }: { methods: ReportMethod[] }) {
  const W = CONTENT_W, ROW = 30, PAD_TOP = 8;
  const LABEL_W = 130, BAR_W = W - LABEL_W - 62, VAL_W = 60;
  const maxHigh = methods.reduce((a, m) => Math.max(a, m.highEstimate || 0), 1);
  const H = methods.length * ROW + PAD_TOP + 4;

  return (
    <Svg width={W} height={H}>
      {/* Gradient def */}
      <Defs>
        <LinearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={BRAND3} stopOpacity="0.45" />
          <Stop offset="1" stopColor={BRAND} stopOpacity="0.45" />
        </LinearGradient>
        <LinearGradient id="midGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={BRAND3} />
          <Stop offset="1" stopColor={BRAND2} />
        </LinearGradient>
      </Defs>

      {methods.map((m, i) => {
        const y = PAD_TOP + i * ROW;
        const low  = LABEL_W + ((m.lowEstimate  || 0) / maxHigh) * BAR_W;
        const mid  = LABEL_W + ((m.midEstimate  || 0) / maxHigh) * BAR_W;
        const high = LABEL_W + ((m.highEstimate || 0) / maxHigh) * BAR_W;
        const barY = y + 9;

        return (
          <G key={m.methodName}>
            <SvgText x={0} y={barY + 6} fontSize={7.5} fill={SLATE} fontFamily="Helvetica-Bold">{mNameShort(m)}</SvgText>
            <Rect x={LABEL_W} y={barY} width={BAR_W} height={8} rx={4} fill="#f3f4f6" />
            <Rect x={low} y={barY} width={Math.max(high - low, 2)} height={8} rx={4} fill="url(#barGrad)" />
            <Rect x={mid - 2} y={barY - 2} width={4} height={12} rx={2} fill="url(#midGrad)" />
            <SvgText x={low} y={barY + 19} fontSize={6} fill={MUTED} textAnchor="middle">{fmtS(m.lowEstimate)}</SvgText>
            <SvgText x={high} y={barY + 19} fontSize={6} fill={MUTED} textAnchor="middle">{fmtS(m.highEstimate)}</SvgText>
            <SvgText x={W - VAL_W + 4} y={barY + 7} fontSize={8} fill={BRAND} fontFamily="Helvetica-Bold">{fmtS(m.midEstimate)}</SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

/** Tornado chart for sensitivity */
function TornadoChart({ rows }: { rows: Array<{ variable: string; scenario: string; percentageChange: number; impact: number }> }) {
  const W = CONTENT_W, ROW = 24, PAD_TOP = 4;
  const LABEL_W = 120, CENTER = LABEL_W + (W - LABEL_W) / 2;
  const HALF_W = (W - LABEL_W) / 2;
  const maxAbs = rows.reduce((a, r) => Math.max(a, Math.abs(r.percentageChange || 0)), 1);
  const H = rows.length * ROW + PAD_TOP + 16;

  return (
    <Svg width={W} height={H}>
      {/* Center axis */}
      <Line x1={CENTER} y1={0} x2={CENTER} y2={H - 16} stroke={RULE} strokeWidth={1} />

      {rows.map((r, i) => {
        const y = PAD_TOP + i * ROW + 6;
        const abs = Math.abs(r.percentageChange || 0);
        const barLen = (abs / maxAbs) * (HALF_W - 8);
        const pos = (r.percentageChange || 0) >= 0;
        const barX = pos ? CENTER : CENTER - barLen;
        const barColor = pos ? "#16a34a" : "#dc2626";

        return (
          <G key={`${r.variable}-${i}`}>
            <SvgText x={0} y={y + 8} fontSize={7} fill={SLATE} fontFamily="Helvetica-Bold">
              {r.variable.length > 18 ? r.variable.substring(0, 18) + "…" : r.variable}
            </SvgText>
            <Rect x={LABEL_W} y={y + 2} width={W - LABEL_W} height={10} rx={5} fill="#f3f4f6" />
            <Rect x={barX} y={y + 2} width={Math.max(barLen, 2)} height={10} rx={5} fill={barColor} fillOpacity="0.8" />
            <SvgText x={pos ? CENTER + barLen + 4 : CENTER - barLen - 4} y={y + 10} fontSize={6.5}
              fill={barColor} fontFamily="Helvetica-Bold" textAnchor={pos ? "start" : "end"}>
              {fmtPct(r.percentageChange)}
            </SvgText>
          </G>
        );
      })}

      <Rect x={LABEL_W} y={H - 12} width={12} height={8} rx={4} fill="#16a34a" fillOpacity="0.8" />
      <SvgText x={LABEL_W + 16} y={H - 5} fontSize={6} fill={MUTED}>Upside</SvgText>
      <Rect x={LABEL_W + 56} y={H - 12} width={12} height={8} rx={4} fill="#dc2626" fillOpacity="0.8" />
      <SvgText x={LABEL_W + 72} y={H - 5} fontSize={6} fill={MUTED}>Downside</SvgText>
    </Svg>
  );
}

// ─── Page Components ──────────────────────────────────────────────────────────
function FreePlanWatermark() {
  return (
    <View fixed style={s.watermarkOverlay}>
      {EVALDAM_LOGO_SRC ? <Image src={EVALDAM_LOGO_SRC} style={s.watermarkLogo} /> : null}
      <Text style={s.watermarkName}>Evaldam AI</Text>
    </View>
  );
}

function Prompt({ title, body }: { title: string; body: string }) {
  return (
    <View style={s.prompt} wrap={false}>
      <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: AMBER, marginBottom: 3 }}>{title}</Text>
      <Text style={{ fontSize: 8.5, color: "#78350f", lineHeight: 1.55 }}>{body}</Text>
    </View>
  );
}

function SectionHead({ tag, title, sub }: { tag: string; title: string; sub: string }) {
  return (
    <>
      <Text style={s.sectionTag}>{tag}</Text>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionRule} />
      <Text style={s.sectionSub}>{sub}</Text>
    </>
  );
}

function InsightList({ items }: { items: InsightItem[] }) {
  return (
    <View>
      {items.map((it, i) => (
        <View key={`${it.label}-${i}`} style={s.insightRow} wrap={false}>
          <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 2 }}>{it.label}</Text>
          <Text style={{ fontSize: 7.5, color: it.status === "available" ? SLATE : AMBER, lineHeight: 1.35 }}>
            {it.value || it.message || "Add the required data in the dashboard."}
          </Text>
        </View>
      ))}
    </View>
  );
}

function PageLayout({
  children, companyName, reportId, isFreePlan, noHeader,
}: {
  children: React.ReactNode; companyName: string; reportId: string;
  isFreePlan: boolean; noHeader?: boolean;
}) {
  return (
    <Page size="A4" style={s.page}>
      {isFreePlan && <FreePlanWatermark />}

      {!noHeader && (
        <View style={s.runningHeader}>
          <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: INK }}>{companyName} - Valuation Report</Text>
          <Text style={{ fontSize: 7, color: MUTED, letterSpacing: 0.5 }}>CONFIDENTIAL · Evaldam AI</Text>
        </View>
      )}

      <View style={s.content}>{children}</View>

      <View style={s.runningFooter}>
        <Text style={{ fontSize: 7, color: LIGHT }}>Report ID: {reportId}</Text>
        <Text
          style={{ fontSize: 7, color: LIGHT }}
          render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
            `Page ${pageNumber} of ${totalPages}`}
        />
      </View>
    </Page>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function buildReportDocument(data: ReportData) {
  const today  = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const stage  = (data.stage || "seed").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const reportId = data.valuationId ? `EVD-${data.valuationId.substring(0, 8).toUpperCase()}` : `EVD-${Date.now()}`;
  const methods  = (data.methods || []).filter(m => m?.methodName && (m?.midEstimate ?? 0) > 0) as ReportMethod[];
  const maxHigh  = methods.reduce((a, m) => Math.max(a, m.highEstimate || 0), 1);
  const isFreePlan = data.isFreePlan === true;

  const det  = data.detailedAnalysis || {};
  const industry    = clean(det.industryAnalysis);
  const mktContext  = clean(det.marketContext);
  const comparables = (det.comparableCompanies || []).map(clean).filter(Boolean).slice(0, 10);
  const sensRows    = (data.sensitivityAnalysis || [])
    .filter(r => clean(r.variable) || typeof r.impact === "number").slice(0, 10);
  const objections  = (data.investorObjections || []).map(clean).filter(Boolean);
  const levers      = (data.nextValueLevers    || []).map(clean).filter(Boolean);
  const iv = data.investorView || {
    thesis: "Add customer proof, revenue signals, market size, and team credibility in the dashboard.",
    stageLens: `Add stage-specific traction fields for a stronger ${stage} lens.`,
    marketStory: "", teamCredibility: "",
    tractionQuality: [], financialOutlook: [], capitalEfficiency: [], useOfFunds: [],
    riskSummary: objections,
  };

  const mWeight = (m: ReportMethod) => {
    const r = m?.weight ?? m?.blendWeight ?? m?.methodWeight;
    if (typeof r === "number") return r <= 1 ? Math.round(r * 100) : Math.round(r);
    return Math.round(100 / Math.max(methods.length, 1));
  };

  const shell = (children: React.ReactNode, noHeader?: boolean) => (
    <PageLayout companyName={data.companyName} reportId={reportId} isFreePlan={isFreePlan} noHeader={noHeader}>
      {children}
    </PageLayout>
  );

  return (
    <Document title={`Valuation Report - ${data.companyName}`} author="Evaldam AI" subject="Pre-Money Valuation Analysis">

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PAGE 1 - COVER                                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.coverPage}>
        {isFreePlan && <FreePlanWatermark />}

        {/* Hot-pink top bar */}
        <View style={{ height: 5, backgroundColor: BRAND }} />

        <View style={{ flex: 1, paddingLeft: 52, paddingRight: 52, paddingTop: 48, paddingBottom: 40 }}>

          {/* Brand row */}
          <View style={[s.row, { justifyContent: "space-between", alignItems: "center", marginBottom: 60 }]}>
            <View style={[s.row, { alignItems: "center" }]}>
              {EVALDAM_LOGO_SRC && <Image src={EVALDAM_LOGO_SRC} style={{ width: 24, height: 24, borderRadius: 5, marginRight: 8 }} />}
              <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: INK }}>Evaldam AI</Text>
            </View>
            <View style={[s.row, { alignItems: "center" }]}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND, marginRight: 6 }} />
              <Text style={{ fontSize: 7.5, color: MUTED, letterSpacing: 2, fontFamily: "Helvetica-Bold" }}>CONFIDENTIAL</Text>
            </View>
          </View>

          {/* Report type */}
          <Text style={{ fontSize: 8, color: BRAND, letterSpacing: 2.5, fontFamily: "Helvetica-Bold", marginBottom: 20 }}>
            PRE-MONEY VALUATION REPORT
          </Text>

          {/* Company name + stage */}
          <Text style={{ fontSize: 44, fontFamily: "Helvetica-Bold", color: INK, lineHeight: 1.05, marginBottom: 10 }}>
            {data.companyName}
          </Text>
          <Text style={{ fontSize: 13, color: MUTED, marginBottom: 52 }}>
            {stage} Stage{data.industry ? ` · ${data.industry}` : ""}
          </Text>

          {/* Description */}
          {data.description ? (
            <Text style={{ fontSize: 10.5, color: SLATE, lineHeight: 1.7, marginBottom: 40, maxWidth: 380 }}>
              {data.description}
            </Text>
          ) : null}

          {/* Key numbers */}
          <View style={[s.row, { marginBottom: 44 }]}>
            {/* Primary - blended average */}
            <View style={{ flex: 1.5, borderWidth: 1, borderColor: RULE, borderTopWidth: 3,
                           borderTopColor: BRAND, borderRadius: 10, padding: 20, marginRight: 10 }}>
              <Text style={{ fontSize: 7, color: MUTED, letterSpacing: 1.5, fontFamily: "Helvetica-Bold", marginBottom: 8 }}>
                PRE-MONEY VALUATION
              </Text>
              <Text style={{ fontSize: 30, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 4 }}>
                {fmt(data.blendedAverage)}
              </Text>
              <Text style={{ fontSize: 8.5, color: MUTED }}>Weighted average of {methods.length} methods</Text>
            </View>

            {/* Range */}
            <View style={{ flex: 1, borderWidth: 1, borderColor: RULE, borderRadius: 10, padding: 20, marginRight: 10 }}>
              <Text style={{ fontSize: 7, color: MUTED, letterSpacing: 1.5, fontFamily: "Helvetica-Bold", marginBottom: 8 }}>RANGE</Text>
              <Text style={{ fontSize: 15, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 3 }}>
                {fmtS(data.blendedLow)}
              </Text>
              <Text style={{ fontSize: 9, color: LIGHT, marginBottom: 4 }}>to</Text>
              <Text style={{ fontSize: 15, fontFamily: "Helvetica-Bold", color: INK }}>{fmtS(data.blendedHigh)}</Text>
            </View>

            {/* Confidence */}
            <View style={{ flex: 1, borderWidth: 1, borderColor: RULE, borderRadius: 10, padding: 20 }}>
              <Text style={{ fontSize: 7, color: MUTED, letterSpacing: 1.5, fontFamily: "Helvetica-Bold", marginBottom: 8 }}>CONFIDENCE</Text>
              <Text style={{ fontSize: 18, fontFamily: "Helvetica-Bold",
                             color: confColor(data.confidenceLevel), marginBottom: 6 }}>
                {(data.confidenceLevel || "MEDIUM").toUpperCase()}
              </Text>
              <Text style={{ fontSize: 8.5, color: MUTED }}>Data: {data.dataCompleteness || 0}% complete</Text>
            </View>
          </View>

          {/* Key reasons */}
          {(data.keyReasons || []).slice(0, 3).map((r, i) => (
            <View key={i} style={[s.row, { marginBottom: 7, alignItems: "flex-start" }]}>
              <Text style={{ fontSize: 8, color: BRAND, fontFamily: "Helvetica-Bold", marginRight: 10, marginTop: 1 }}>-</Text>
              <Text style={{ fontSize: 9.5, color: SLATE, flex: 1, lineHeight: 1.6 }}>{r}</Text>
            </View>
          ))}

          {/* Footer */}
          <View style={[s.row, { justifyContent: "space-between", marginTop: "auto",
                                  paddingTop: 24, borderTopWidth: 1, borderTopColor: RULE }]}>
            <View>
              <Text style={{ fontSize: 8, color: LIGHT }}>Report ID: {reportId}</Text>
              <Text style={{ fontSize: 8, color: LIGHT }}>Issued: {today}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 8, color: LIGHT }}>Evaldam AI Professional Valuation Engine</Text>
              <Text style={{ fontSize: 8, color: LIGHT }}>6-Method Blended Analysis · 2026 Market Data</Text>
            </View>
          </View>
        </View>
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PAGE 2 - TABLE OF CONTENTS                                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {shell(
        <>
          <Text style={s.tocTitle}>Contents</Text>
          <View style={s.sectionRule} />

          {[
            ["01", "Executive Summary",          "Section 1"],
            ["02", "Valuation Methods Overview", "Section 2"],
            ["03", "Detailed Method Analysis",   "Section 3"],
            ["04", "Market Analysis",            "Section 4"],
            ["05", "Sensitivity Analysis",       "Section 5"],
            ["06", "Investor Case Completion",   "Section 6"],
            ["07", "Basis of Valuation",         "Section 7"],
            ["08", "Investor Readiness",         "Section 8"],
            ["A",  "Report Statement",           "Appendix"],
          ].map(([num, label, tag]) => (
            <View key={num} style={s.tocRow}>
              <Text style={s.tocNum}>{num}</Text>
              <Text style={s.tocLabel}>{label}</Text>
              <Text style={s.tocTag}>{tag}</Text>
            </View>
          ))}

          {/* Report metadata */}
          <View style={[s.row, { marginTop: 36 }]}>
            <View style={[s.card, { flex: 1, marginRight: 8, borderLeftColor: BRAND }]}>
              <Text style={{ fontSize: 8, color: MUTED, fontFamily: "Helvetica-Bold", marginBottom: 4 }}>COMPANY</Text>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: INK }}>{data.companyName}</Text>
              <Text style={{ fontSize: 8.5, color: MUTED, marginTop: 3 }}>{stage} · {data.industry || "Technology"}</Text>
            </View>
            <View style={[s.card, { flex: 1, marginRight: 8, borderLeftColor: VIOLET }]}>
              <Text style={{ fontSize: 8, color: MUTED, fontFamily: "Helvetica-Bold", marginBottom: 4 }}>VALUATION</Text>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: INK }}>{fmt(data.blendedAverage)}</Text>
              <Text style={{ fontSize: 8.5, color: MUTED, marginTop: 3 }}>Range: {fmtS(data.blendedLow)} – {fmtS(data.blendedHigh)}</Text>
            </View>
            <View style={[s.card, { flex: 1, borderLeftColor: TEAL }]}>
              <Text style={{ fontSize: 8, color: MUTED, fontFamily: "Helvetica-Bold", marginBottom: 4 }}>REPORT DATE</Text>
              <Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold", color: INK }}>{today}</Text>
              <Text style={{ fontSize: 8.5, color: MUTED, marginTop: 3 }}>ID: {reportId}</Text>
            </View>
          </View>

          <Text style={{ fontSize: 8, color: LIGHT, marginTop: 28, lineHeight: 1.6 }}>
            This report is prepared for informational and fundraising purposes only. Evaldam AI is not a registered investment adviser. This is an indicative, system-generated valuation analysis, not a statutory certificate.
          </Text>
        </>,
        true,
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PAGE 3 - EXECUTIVE SUMMARY                                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {shell(
        <>
          <SectionHead
            tag="SECTION 1"
            title="Executive Summary"
            sub={`Indicative pre-money valuation of ${data.companyName} using ${methods.length} parallel valuation method${methods.length === 1 ? "" : "s"} with stage-weighted blending and 2026 market data.`}
          />

          {/* Hero box */}
          <View style={s.heroBox}>
            <Text style={{ fontSize: 7.5, color: MUTED, letterSpacing: 1.5, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>
              PRE-MONEY VALUATION - WEIGHTED AVERAGE
            </Text>
            <Text style={{ fontSize: 38, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 14, lineHeight: 1.1 }}>
              {fmt(data.blendedAverage)}
            </Text>
            <View style={[s.row, { borderTopWidth: 1, borderTopColor: RULE, paddingTop: 14 }]}>
              {[
                ["Low Bound",    fmt(data.blendedLow)],
                ["Mid Estimate", fmt(data.blendedAverage)],
                ["High Bound",   fmt(data.blendedHigh)],
                ["Methods",      String(methods.length)],
              ].map(([lbl, val], i) => (
                <View key={i} style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ fontSize: 7, color: MUTED, fontFamily: "Helvetica-Bold", letterSpacing: 0.5, marginBottom: 3 }}>{lbl}</Text>
                  <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: INK }}>{val}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Stats row */}
          <View style={[s.row, { marginBottom: 22 }]}>
            {[
              ["CONFIDENCE",   (data.confidenceLevel || "MEDIUM").toUpperCase(), confColor(data.confidenceLevel)],
              ["DATA QUALITY", `${data.dataCompleteness || 0}%`,                 INK],
              ["STAGE",        stage,                                             INK],
            ].map(([lbl, val, col], i) => (
              <View key={i} style={[s.statBox, i === 2 ? { marginRight: 0 } : {}]}>
                <Text style={s.statLabel}>{lbl}</Text>
                <Text style={[s.statValue, { color: col as string }]}>{val}</Text>
              </View>
            ))}
          </View>

          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 12 }}>Key Valuation Drivers</Text>
          {(data.keyReasons || []).map((r, i) => (
            <View key={i} style={s.driverRow}>
              <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: BRAND, width: 18 }}>{i + 1}.</Text>
              <Text style={{ fontSize: 9, color: SLATE, lineHeight: 1.65, flex: 1 }}>{r}</Text>
            </View>
          ))}

          {data.executiveSummary?.methodologyNote && (
            <View style={[s.card, { borderLeftColor: TEAL, marginTop: 16 }]}>
              <Text style={{ fontSize: 8.5, color: TEAL, lineHeight: 1.65 }}>{data.executiveSummary.methodologyNote}</Text>
            </View>
          )}
        </>,
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PAGE 4 - METHODS OVERVIEW + RANGE CHART                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {shell(
        <>
          <SectionHead
            tag="SECTION 2"
            title="Valuation Methods Overview"
            sub="All methods run in parallel. Final valuation blended using stage-based dynamic weights. Range bars show Low / Mid / High per method."
          />

          {/* Methods table */}
          <View style={s.th}>
            <Text style={[s.thCell, { flex: 3 }]}>METHOD</Text>
            <Text style={[s.thCell, { flex: 1.4, textAlign: "right" }]}>LOW</Text>
            <Text style={[s.thCell, { flex: 1.4, textAlign: "right" }]}>MID</Text>
            <Text style={[s.thCell, { flex: 1.4, textAlign: "right" }]}>HIGH</Text>
            <Text style={[s.thCell, { flex: 0.8, textAlign: "center" }]}>WEIGHT</Text>
            <Text style={[s.thCell, { flex: 0.9, textAlign: "center" }]}>CONFIDENCE</Text>
          </View>
          {methods.map((m, i) => (
            <View key={m.methodName} style={i % 2 === 0 ? s.tr : s.trAlt}>
              <Text style={[s.td, { flex: 3, fontFamily: "Helvetica-Bold" }]}>{mName(m)}</Text>
              <Text style={[s.td, { flex: 1.4, textAlign: "right", color: MUTED }]}>{fmt(m.lowEstimate)}</Text>
              <Text style={[s.td, { flex: 1.4, textAlign: "right", fontFamily: "Helvetica-Bold", color: VIOLET }]}>{fmt(m.midEstimate)}</Text>
              <Text style={[s.td, { flex: 1.4, textAlign: "right", color: MUTED }]}>{fmt(m.highEstimate)}</Text>
              <Text style={[s.td, { flex: 0.8, textAlign: "center" }]}>{mWeight(m)}%</Text>
              <Text style={[s.td, { flex: 0.9, textAlign: "center",
                color: m.confidence === "high" ? GREEN : m.confidence === "medium" ? AMBER : RED }]}>
                {(m.confidence || "MED").toUpperCase()}
              </Text>
            </View>
          ))}
          {/* Blended row */}
          <View style={[s.tr, { backgroundColor: "#e6f7f7" }]}>
            <Text style={[s.td, { flex: 3, fontFamily: "Helvetica-Bold", color: BRAND }]}>BLENDED RESULT</Text>
            <Text style={[s.td, { flex: 1.4, textAlign: "right", color: BRAND }]}>{fmt(data.blendedLow)}</Text>
            <Text style={[s.td, { flex: 1.4, textAlign: "right", fontFamily: "Helvetica-Bold", color: BRAND }]}>{fmt(data.blendedAverage)}</Text>
            <Text style={[s.td, { flex: 1.4, textAlign: "right", color: BRAND }]}>{fmt(data.blendedHigh)}</Text>
            <Text style={[s.td, { flex: 0.8, textAlign: "center", color: BRAND }]}>100%</Text>
            <Text style={[s.td, { flex: 0.9, textAlign: "center", color: confColor(data.confidenceLevel) }]}>
              {(data.confidenceLevel || "MED").toUpperCase()}
            </Text>
          </View>

          {/* SVG Range chart */}
          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: INK, marginTop: 24, marginBottom: 12 }}>
            Valuation Range Visualisation
          </Text>
          <Text style={{ fontSize: 8, color: MUTED, marginBottom: 10 }}>
            Gradient bar shows Low → High spread. Pink marker = weighted mid estimate.
          </Text>
          {methods.length > 0 && <RangeChart methods={methods} />}
        </>,
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PAGE 5 - METHOD DETAIL                                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {shell(
        <>
          <SectionHead
            tag="SECTION 3"
            title="Detailed Method Analysis"
            sub="Methodology explanation, data sources, and calculations for each of the six valuation methods used in this analysis."
          />
          {methods.map((m) => (
            <View key={m.methodName} style={s.card} wrap={false}>
              <View style={[s.row, { justifyContent: "space-between", alignItems: "center", marginBottom: 6 }]}>
                <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: INK }}>{mName(m)}</Text>
                <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", color: VIOLET }}>{fmt(m.midEstimate)}</Text>
              </View>
              <Text style={{ fontSize: 8.5, color: MUTED, lineHeight: 1.65, marginBottom: 10 }}>{mSummary(m)}</Text>

              {/* Low / Mid / High */}
              <View style={[s.row, { marginBottom: 8 }]}>
                {[["LOW", fmt(m.lowEstimate), LIGHT, 11], ["MID", fmt(m.midEstimate), VIOLET, 14], ["HIGH", fmt(m.highEstimate), LIGHT, 11]].map(([lbl, val, col, sz], i) => (
                  <View key={i} style={{ flex: 1, backgroundColor: SURF, borderRadius: 6, padding: 10,
                                         alignItems: "center", marginRight: i < 2 ? 6 : 0 }}>
                    <Text style={{ fontSize: 7, color: MUTED, fontFamily: "Helvetica-Bold", letterSpacing: 0.8, marginBottom: 4 }}>{lbl} ESTIMATE</Text>
                    <Text style={{ fontSize: sz as number, fontFamily: "Helvetica-Bold", color: col as string }}>{val}</Text>
                  </View>
                ))}
              </View>

              {m.reasoning && (
                <Text style={{ fontSize: 8, color: MUTED, lineHeight: 1.6, backgroundColor: WHITE,
                               padding: 9, borderRadius: 6, borderWidth: 1, borderColor: RULE }}>
                  {(m.reasoning as string).substring(0, 320)}{(m.reasoning as string).length > 320 ? "…" : ""}
                </Text>
              )}
              <View style={[s.row, { justifyContent: "space-between", marginTop: 8,
                                     paddingTop: 8, borderTopWidth: 1, borderTopColor: RULE }]}>
                <Text style={{ fontSize: 7.5, color: LIGHT }}>Blend weight: {mWeight(m)}%</Text>
                <Text style={{ fontSize: 7.5, color: LIGHT }}>Confidence: {(m.confidence || "medium").toUpperCase()}</Text>
              </View>
            </View>
          ))}
        </>,
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PAGE 6 - MARKET ANALYSIS                                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {shell(
        <>
          <SectionHead
            tag="SECTION 4"
            title="Market Analysis"
            sub="Industry context, comparable companies, and 2026 market conditions used to benchmark and ground this valuation."
          />

          {industry ? (
            <View style={[s.card, { borderLeftColor: TEAL }]}>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 8 }}>Industry Analysis</Text>
              <Text style={{ fontSize: 9, color: SLATE, lineHeight: 1.75 }}>{industry}</Text>
            </View>
          ) : (
            <Prompt title="Industry analysis not available"
              body="Add market description, target segment, and industry context in the dashboard to generate this section." />
          )}

          {mktContext ? (
            <View style={[s.card, { borderLeftColor: TEAL }]}>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 8 }}>Market Context</Text>
              <Text style={{ fontSize: 9, color: SLATE, lineHeight: 1.75 }}>{mktContext}</Text>
            </View>
          ) : (
            <Prompt title="Market context not available"
              body="Add competition, market timing, and recent benchmarks in the dashboard." />
          )}

          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: INK, marginTop: 6, marginBottom: 10 }}>
            Comparable Companies
          </Text>
          {comparables.length > 0 ? (
            <View style={[s.row, { flexWrap: "wrap" }]}>
              {comparables.map((c, i) => <Text key={`${c}-${i}`} style={s.chip}>{c}</Text>)}
            </View>
          ) : (
            <Prompt title="Comparable companies not available"
              body="Add comparable companies or market benchmarks in the dashboard." />
          )}
        </>,
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PAGE 7 - SENSITIVITY ANALYSIS + TORNADO CHART                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {shell(
        <>
          <SectionHead
            tag="SECTION 5"
            title="Sensitivity Analysis"
            sub="How the valuation changes under different assumptions. Green bars = upside scenarios. Red bars = downside scenarios."
          />

          {sensRows.length > 0 ? (
            <>
              {/* Tornado chart */}
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 10 }}>
                Scenario Impact Visualisation
              </Text>
              <TornadoChart rows={sensRows} />

              {/* Table */}
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: INK, marginTop: 20, marginBottom: 10 }}>
                Scenario Table
              </Text>
              <View style={s.th}>
                <Text style={[s.thCell, { flex: 1.5 }]}>VARIABLE</Text>
                <Text style={[s.thCell, { flex: 2 }]}>SCENARIO</Text>
                <Text style={[s.thCell, { flex: 0.9, textAlign: "right" }]}>CHANGE</Text>
                <Text style={[s.thCell, { flex: 1.1, textAlign: "right" }]}>IMPACT</Text>
              </View>
              {sensRows.map((r, i) => {
                const pos = (r.percentageChange || 0) >= 0;
                return (
                  <View key={`${r.variable}-${r.scenario}-${i}`} style={i % 2 === 0 ? s.tr : s.trAlt}>
                    <Text style={[s.td, { flex: 1.5, fontFamily: "Helvetica-Bold" }]}>{clean(r.variable) || "Assumption"}</Text>
                    <Text style={[s.td, { flex: 2, color: MUTED }]}>{clean(r.scenario) || "Scenario"}</Text>
                    <Text style={[s.td, { flex: 0.9, textAlign: "right", fontFamily: "Helvetica-Bold",
                                          color: pos ? GREEN : RED }]}>{fmtPct(r.percentageChange || 0)}</Text>
                    <Text style={[s.td, { flex: 1.1, textAlign: "right", fontFamily: "Helvetica-Bold",
                                          color: pos ? GREEN : RED }]}>{fmtImpact(r.impact || 0)}</Text>
                  </View>
                );
              })}
            </>
          ) : (
            <Prompt title="Sensitivity analysis not available"
              body="Add revenue, growth, runway, burn, and gross margin in the dashboard to generate scenario analysis." />
          )}
        </>,
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PAGE 8 - INVESTOR CASE COMPLETION                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {shell(
        <>
          <SectionHead
            tag="SECTION 6"
            title="Investor Case Completion"
            sub="Stage-specific investment thesis, team credibility, traction quality, and capital efficiency for investor due diligence."
          />

          <View style={[s.card, { borderLeftColor: BRAND }]}>
            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 8 }}>Investment Thesis</Text>
            <Text style={{ fontSize: 9, color: SLATE, lineHeight: 1.75 }}>{iv.thesis}</Text>
          </View>

          <View style={[s.row, { marginBottom: 10 }]}>
            <View style={[s.card, { flex: 1, marginRight: 8, borderLeftColor: VIOLET }]}>
              <Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 7 }}>Stage Lens</Text>
              <Text style={{ fontSize: 8.5, color: SLATE, lineHeight: 1.65 }}>{iv.stageLens}</Text>
            </View>
            <View style={[s.card, { flex: 1, borderLeftColor: VIOLET }]}>
              <Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 7 }}>Team Credibility</Text>
              <Text style={{ fontSize: 8.5, color: SLATE, lineHeight: 1.65 }}>{iv.teamCredibility}</Text>
            </View>
          </View>

          <View style={[s.row, { marginBottom: 10 }]}>
            <View style={[s.card, { flex: 1, marginRight: 8 }]}>
              <Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 8 }}>Traction Quality</Text>
              <InsightList items={iv.tractionQuality} />
            </View>
            <View style={[s.card, { flex: 1 }]}>
              <Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 8 }}>Financial Outlook</Text>
              <InsightList items={iv.financialOutlook} />
            </View>
          </View>

          <View style={[s.row, { marginBottom: 10 }]}>
            <View style={[s.card, { flex: 1, marginRight: 8 }]}>
              <Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 8 }}>Capital Efficiency</Text>
              <InsightList items={iv.capitalEfficiency} />
            </View>
            <View style={[s.card, { flex: 1 }]}>
              <Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 8 }}>Use of Funds</Text>
              <InsightList items={iv.useOfFunds} />
            </View>
          </View>
        </>,
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PAGE 9 - BASIS OF VALUATION                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {shell(
        <>
          <SectionHead
            tag="SECTION 7"
            title="Basis of Valuation"
            sub="Purpose, scope, data sources, limitations, and evidence quality. Required for investor due diligence and regulatory review."
          />

          {/* Purpose / Date / Scope */}
          <View style={[s.card, { borderLeftColor: TEAL }]}>
            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 6 }}>Purpose</Text>
            <Text style={{ fontSize: 9, color: SLATE, lineHeight: 1.65 }}>
              {data.basisOfValuation?.purpose || "Founder and investor discussion support for an indicative startup pre-money valuation."}
            </Text>
            <View style={[s.row, { marginTop: 14 }]}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 3 }}>Valuation Date</Text>
                <Text style={{ fontSize: 9, color: SLATE }}>{data.basisOfValuation?.valuationDate || today}</Text>
              </View>
              <View style={{ flex: 2 }}>
                <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 3 }}>Standard / Scope</Text>
                <Text style={{ fontSize: 9, color: SLATE, lineHeight: 1.6 }}>
                  {data.basisOfValuation?.standard || "Indicative valuation analysis. Not a statutory valuation certificate."}
                </Text>
              </View>
            </View>
          </View>

          <View style={[s.row, { marginBottom: 12 }]}>
            <View style={[s.card, { flex: 1, marginRight: 8 }]}>
              <Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 8 }}>Data Sources</Text>
              {(data.basisOfValuation?.dataSources || []).map((it, i) => (
                <Text key={i} style={{ fontSize: 8.5, color: SLATE, lineHeight: 1.6, marginBottom: 4 }}>{i + 1}. {it}</Text>
              ))}
            </View>
            <View style={[s.card, { flex: 1 }]}>
              <Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 8 }}>Limitations</Text>
              {(data.basisOfValuation?.limitations || []).map((it, i) => (
                <Text key={i} style={{ fontSize: 8.5, color: SLATE, lineHeight: 1.6, marginBottom: 4 }}>{i + 1}. {it}</Text>
              ))}
            </View>
          </View>

          {/* Evidence quality */}
          <View style={[s.row, { alignItems: "center", marginBottom: 6 }]}>
            <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: INK, marginRight: 10 }}>Evidence Quality:</Text>
            <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: confColor(data.confidenceLevel) }}>
              {data.evidenceQuality?.label || "Moderate"}
            </Text>
          </View>
          <Text style={{ fontSize: 8.5, color: MUTED, marginBottom: 12 }}>
            {data.evidenceQuality?.summary || "Evidence quality is based on completeness, confidence, and available traction inputs."}
          </Text>

          <View style={[s.row, { marginBottom: 12 }]}>
            <View style={[s.card, { flex: 1, marginRight: 8, borderLeftColor: "#16a34a" }]}>
              <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: "#15803d", marginBottom: 8 }}>Strengths</Text>
              {(data.evidenceQuality?.strengths || []).map((it, i) => (
                <Text key={i} style={{ fontSize: 8.5, color: SLATE, lineHeight: 1.6, marginBottom: 4 }}>- {it}</Text>
              ))}
            </View>
            <View style={[s.card, { flex: 1, borderLeftColor: "#f59e0b" }]}>
              <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: AMBER, marginBottom: 8 }}>Gaps</Text>
              {(data.evidenceQuality?.gaps || []).map((it, i) => (
                <Text key={i} style={{ fontSize: 8.5, color: SLATE, lineHeight: 1.6, marginBottom: 4 }}>- {it}</Text>
              ))}
            </View>
          </View>

          {/* Assumptions table */}
          {(data.provenance || []).length > 0 && (
            <>
              <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 8 }}>
                Key Assumptions
              </Text>
              <View style={s.th}>
                <Text style={[s.thCell, { flex: 1.5 }]}>ITEM</Text>
                <Text style={[s.thCell, { flex: 1.5 }]}>VALUE</Text>
                <Text style={[s.thCell, { flex: 1.2 }]}>SOURCE</Text>
              </View>
              {(data.provenance || []).map((r, i) => (
                <View key={i} style={i % 2 === 0 ? s.tr : s.trAlt}>
                  <Text style={[s.td, { flex: 1.5, fontFamily: "Helvetica-Bold" }]}>{r.item}</Text>
                  <Text style={[s.td, { flex: 1.5 }]}>{r.value}</Text>
                  <Text style={[s.td, { flex: 1.2, color: MUTED }]}>{r.source}</Text>
                </View>
              ))}
            </>
          )}
        </>,
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PAGE 10 - INVESTOR READINESS                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {shell(
        <>
          <SectionHead
            tag="SECTION 8"
            title="Investor Readiness"
            sub="Anticipated due diligence questions, concrete value levers, and a summary of key risk factors for the current stage."
          />

          <View style={[s.row, { marginBottom: 12 }]}>
            <View style={[s.card, { flex: 1, marginRight: 8, borderLeftColor: RED }]}>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 10 }}>Investor Objections</Text>
              {(objections.length ? objections : ["Add revenue, market, traction, and verification data in the dashboard to generate realistic objections."]).map((it, i) => (
                <Text key={i} style={{ fontSize: 9, color: SLATE, lineHeight: 1.7, marginBottom: 6 }}>{i + 1}. {it}</Text>
              ))}
            </View>
            <View style={[s.card, { flex: 1, borderLeftColor: GREEN }]}>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 10 }}>Next Value Levers</Text>
              {(levers.length ? levers : ["Add ARR/MRR, growth, market size, runway, and next milestones in the dashboard."]).map((it, i) => (
                <Text key={i} style={{ fontSize: 9, color: SLATE, lineHeight: 1.7, marginBottom: 6 }}>{i + 1}. {it}</Text>
              ))}
            </View>
          </View>

          <View style={[s.card, { borderLeftColor: VIOLET }]}>
            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 10 }}>Risk Summary</Text>
            {(iv.riskSummary.length ? iv.riskSummary : objections).slice(0, 5).map((it, i) => (
              <Text key={`${it}-${i}`} style={{ fontSize: 9, color: SLATE, lineHeight: 1.7, marginBottom: 6 }}>{i + 1}. {it}</Text>
            ))}
          </View>

          {/* Verification block */}
          <View style={[s.card, { borderLeftColor: TEAL, marginTop: 4 }]}>
            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 6 }}>Verification Status</Text>
            <Text style={{ fontSize: 9, color: SLATE, lineHeight: 1.65 }}>
              {data.reviewStatus?.status === "approved"
                ? "This valuation has reviewer approval recorded in the audit trail."
                : "System-generated. Treat as indicative until reviewed against supporting documents."}
            </Text>
            {data.reviewStatus?.note && (
              <Text style={{ fontSize: 8, color: MUTED, marginTop: 5, lineHeight: 1.5 }}>{data.reviewStatus.note}</Text>
            )}
            {data.sourceAudit?.marketDataStatus && (
              <Text style={{ fontSize: 8, color: MUTED, marginTop: 4 }}>
                Market data: {data.sourceAudit.marketDataStatus.replace(/_/g, " ")}
              </Text>
            )}
          </View>
        </>,
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PAGE 11 - REPORT STATEMENT & DISCLAIMER                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {shell(
        <>
          <SectionHead
            tag="APPENDIX"
            title="Report Statement"
            sub="Data provenance, benchmark sources, and legal disclaimer for this valuation version."
          />

          {/* Data sources table */}
          <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 10 }}>Benchmark Data Sources (2026)</Text>
          <View style={s.th}>
            <Text style={[s.thCell, { flex: 2 }]}>SOURCE</Text>
            <Text style={[s.thCell, { flex: 3 }]}>DESCRIPTION</Text>
          </View>
          {[
            ["Prof. A. Damodaran, NYU Stern",  "WACC, EBITDA multiples, long-term growth rates"],
            ["Federal Reserve (2026)",         "Risk-free rate 4.2%; Fed Funds 4.5%"],
            ["CB Insights Q1 2026",            "Venture funding trends, stage benchmarks"],
            ["PitchBook 2026",                 "Comparable company multiples and exit data"],
            ["Crunchbase (real-time)",         "Funding rounds and comparable exit data"],
            ["S&P CapitalIQ",                  "Public SaaS / tech EV/Revenue multiples"],
            ["McKinsey Global AI Index 2026",  "AI sector growth rates and market sizing"],
            ["Gartner Magic Quadrant 2026",    "Technology sector positioning data"],
          ].map(([src, desc], i) => (
            <View key={i} style={i % 2 === 0 ? s.tr : s.trAlt}>
              <Text style={[s.td, { flex: 2, fontFamily: "Helvetica-Bold" }]}>{src}</Text>
              <Text style={[s.td, { flex: 3, color: MUTED }]}>{desc}</Text>
            </View>
          ))}

          {/* Disclaimer box */}
          <View style={s.disclaimer}>
            <View style={[s.row, { justifyContent: "space-between", alignItems: "center", marginBottom: 12 }]}>
              <View style={[s.row, { alignItems: "center" }]}>
                {EVALDAM_LOGO_SRC && <Image src={EVALDAM_LOGO_SRC} style={{ width: 18, height: 18, borderRadius: 4, marginRight: 8 }} />}
                <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: INK }}>Evaldam AI</Text>
              </View>
              <Text style={{ fontSize: 8, color: BRAND, fontFamily: "Helvetica-Bold" }}>{reportId}</Text>
            </View>

            <View style={{ height: 1, backgroundColor: RULE, marginBottom: 12 }} />

            <Text style={{ fontSize: 9, color: SLATE, lineHeight: 1.75, marginBottom: 10 }}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>Report Statement: </Text>
              This report presents an indicative pre-money valuation analysis for {data.companyName}. Outputs are based on data provided by the company, stored method assumptions, and publicly available benchmark context as of {today}. This is not a signed statutory valuation certificate or formal appraisal.
            </Text>

            <Text style={{ fontSize: 8.5, color: MUTED, lineHeight: 1.75, marginBottom: 14 }}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>Disclaimer: </Text>
              This report is prepared for informational and fundraising purposes only. It does not constitute financial advice, an offer to sell securities, or a solicitation of any investment. Actual valuations may differ materially based on negotiation, market conditions, and due diligence findings. Evaldam AI is not a registered investment adviser or broker-dealer under any jurisdiction. © {new Date().getFullYear()} Evaldam AI. All rights reserved.
            </Text>

            <View style={[s.row, { justifyContent: "space-between", alignItems: "center",
                                   paddingTop: 14, borderTopWidth: 1, borderTopColor: RULE }]}>
              <View>
                <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 2 }}>
                  Evaldam AI Engine
                </Text>
                <Text style={{ fontSize: 7.5, color: MUTED }}>Automated Professional Valuation System</Text>
                <Text style={{ fontSize: 7.5, color: MUTED }}>6-Method Blended Analysis</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 8.5, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 2 }}>Date of Issue</Text>
                <Text style={{ fontSize: 8.5, color: MUTED }}>{today}</Text>
              </View>
            </View>
          </View>

          <Text style={{ fontSize: 8, color: LIGHT, textAlign: "center", marginTop: 20 }}>
            CONFIDENTIAL - Prepared exclusively for {data.companyName} and its authorised representatives. Unauthorised reproduction or distribution is strictly prohibited.
          </Text>
        </>,
      )}

    </Document>
  );
}
