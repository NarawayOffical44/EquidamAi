"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildReportDocument = buildReportDocument;
const react_1 = __importDefault(require("react"));
const renderer_1 = require("@react-pdf/renderer");
const s = renderer_1.StyleSheet.create({
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
});
const fmt = (v) => `$${((v || 0) / 1000000).toFixed(2)}M`;
const fmtS = (v) => `$${((v || 0) / 1000000).toFixed(1)}M`;
const MN = {
    scorecard: "Scorecard (Bill Payne)", berkus: "Berkus Checklist", vc: "VC Method",
    "dcf-ltg": "DCF — Long-Term Growth", "dcf-multiples": "DCF — Exit Multiples", "evaldam-score": "Evaldam Score",
};
const MD = {
    scorecard: "Compares the startup to a regional baseline across 6 weighted criteria: team (30%), market (25%), product (15%), competition (10%), marketing (10%), and funding needs (10%).",
    berkus: "Assigns value for 5 milestones: sound idea, prototype/MVP, quality management, strategic relationships, and product rollout. Max pre-revenue valuation ~$3.75M.",
    vc: "Back-calculates present value from projected 5-7 year exit using industry multiples, discounted at required investor ROI (10x-30x for seed).",
    "dcf-ltg": "DCF using Damodaran Long-Term Growth model. Terminal value = FCF x (1+g) / (WACC-g). WACC 11%, LTG 2.5%, RF Rate 4.2%.",
    "dcf-multiples": "DCF with exit value via EBITDA/Revenue multiples. SaaS ~25x, AI ~35x EBITDA (Damodaran 2026). More reliable for high-growth startups.",
    "evaldam-score": "Proprietary algorithm: internal database percentile, 2026 industry growth premium, team history bonus, IP strength, customer concentration risk, and competitive moat.",
};
const weights = (stage) => (stage === "pre-revenue" || stage === "seed")
    ? { scorecard: 16, berkus: 16, vc: 24, "dcf-ltg": 16, "dcf-multiples": 8, "evaldam-score": 20 }
    : { scorecard: 8, berkus: 8, vc: 24, "dcf-ltg": 20, "dcf-multiples": 20, "evaldam-score": 20 };
function buildReportDocument(data) {
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const stage = (data.stage || "seed").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    const reportId = data.valuationId ? `EVD-${data.valuationId.substring(0, 8).toUpperCase()}` : `EVD-${Date.now()}`;
    const W = weights(data.stage || "seed");
    const methods = (data.methods || []).filter(m => m?.methodName && (m?.midEstimate ?? 0) > 0);
    const maxMid = methods.reduce((acc, m) => Math.max(acc, m.midEstimate || 0), 1);
    const confColor = data.confidenceLevel === "high" ? "#166534" : data.confidenceLevel === "medium" ? "#854d0e" : "#991b1b";
    const safePct = (val) => {
        const n = Math.round(((val || 0) / maxMid) * 100);
        return isNaN(n) || n < 0 ? 0 : n > 100 ? 100 : n;
    };
    return (<renderer_1.Document title={`Valuation Report — ${data.companyName}`} author="Evaldam AI">

      {/* PAGE 1: COVER */}
      <renderer_1.Page size="A4" style={[s.page, s.coverPage]}>
        <renderer_1.View style={[s.row, { justifyContent: "space-between", marginBottom: 56 }]}>
          <renderer_1.Text style={{ fontSize: 15, fontFamily: "Helvetica-Bold", color: "#ffffff" }}>Evaldam AI</renderer_1.Text>
          <renderer_1.Text style={{ fontSize: 9, color: "#475569", letterSpacing: 1.5 }}>CONFIDENTIAL</renderer_1.Text>
        </renderer_1.View>

        <renderer_1.Text style={{ fontSize: 9, color: "#a5b4fc", letterSpacing: 1.5, marginBottom: 16 }}>PRE-MONEY VALUATION REPORT</renderer_1.Text>
        <renderer_1.Text style={{ fontSize: 36, fontFamily: "Helvetica-Bold", color: "#ffffff", marginBottom: 8, lineHeight: 1.2 }}>{data.companyName}</renderer_1.Text>
        <renderer_1.Text style={{ fontSize: 13, color: "#94a3b8", marginBottom: 40 }}>{stage}{data.industry ? ` · ${data.industry}` : ""}</renderer_1.Text>

        <renderer_1.View style={[s.row, { marginBottom: 30 }]}>
          {[
            ["WEIGHTED AVERAGE", fmt(data.blendedAverage), "Pre-Money Valuation"],
            ["VALUATION RANGE", `${fmtS(data.blendedLow)} – ${fmtS(data.blendedHigh)}`, "Low — High bound"],
            ["CONFIDENCE", (data.confidenceLevel || "MEDIUM").toUpperCase(), `Data: ${data.dataCompleteness || 0}% complete`],
        ].map(([label, value, sub], i) => (<renderer_1.View key={i} style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 10, padding: 18, marginRight: i < 2 ? 10 : 0 }}>
              <renderer_1.Text style={{ fontSize: 8, color: "#64748b", letterSpacing: 1, marginBottom: 4 }}>{label}</renderer_1.Text>
              <renderer_1.Text style={{ fontSize: i === 0 ? 18 : 14, fontFamily: "Helvetica-Bold", color: "#ffffff", marginBottom: 2 }}>{value}</renderer_1.Text>
              <renderer_1.Text style={{ fontSize: 9, color: "#6366f1" }}>{sub}</renderer_1.Text>
            </renderer_1.View>))}
        </renderer_1.View>

        {(data.keyReasons || []).slice(0, 3).map((r, i) => (<renderer_1.Text key={i} style={{ fontSize: 10, color: "#64748b", marginBottom: 5 }}>▸ {r}</renderer_1.Text>))}

        <renderer_1.View style={[s.row, { justifyContent: "space-between", marginTop: 40 }]}>
          <renderer_1.View>
            <renderer_1.Text style={{ fontSize: 9, color: "#475569" }}>Report ID: {reportId}</renderer_1.Text>
            <renderer_1.Text style={{ fontSize: 9, color: "#475569" }}>Generated: {today}</renderer_1.Text>
          </renderer_1.View>
          <renderer_1.View style={{ alignItems: "flex-end" }}>
            <renderer_1.Text style={{ fontSize: 9, color: "#475569" }}>Evaldam AI Professional Valuation Engine</renderer_1.Text>
            <renderer_1.Text style={{ fontSize: 9, color: "#475569" }}>6-Method Blended Analysis · 2026 Market Data</renderer_1.Text>
          </renderer_1.View>
        </renderer_1.View>
      </renderer_1.Page>

      {/* PAGE 2: EXECUTIVE SUMMARY */}
      <renderer_1.Page size="A4" style={[s.page, s.pad]}>
        <renderer_1.Text style={s.sectionTag}>SECTION 1</renderer_1.Text>
        <renderer_1.Text style={s.sectionTitle}>Executive Summary</renderer_1.Text>
        <renderer_1.Text style={s.sectionSub}>Professional pre-money valuation of {data.companyName} using {methods.length} industry-standard methodologies.</renderer_1.Text>

        <renderer_1.View style={s.highlightBox}>
          <renderer_1.Text style={{ fontSize: 8, color: "#c7d2fe", letterSpacing: 1, marginBottom: 6 }}>PRE-MONEY VALUATION — WEIGHTED AVERAGE</renderer_1.Text>
          <renderer_1.Text style={{ fontSize: 34, fontFamily: "Helvetica-Bold", color: "#ffffff", marginBottom: 12 }}>{fmt(data.blendedAverage)}</renderer_1.Text>
          <renderer_1.View style={s.row}>
            {[
            ["Low Bound", fmt(data.blendedLow)],
            ["High Bound", fmt(data.blendedHigh)],
            ["Methods", String(methods.length)],
        ].map(([label, val], i) => (<renderer_1.View key={i} style={{ marginRight: 28 }}>
                <renderer_1.Text style={{ fontSize: 9, color: "#c7d2fe", marginBottom: 2 }}>{label}</renderer_1.Text>
                <renderer_1.Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", color: "#ffffff" }}>{val}</renderer_1.Text>
              </renderer_1.View>))}
          </renderer_1.View>
        </renderer_1.View>

        <renderer_1.View style={[s.row, { marginBottom: 20 }]}>
          {[
            ["CONFIDENCE", (data.confidenceLevel || "MEDIUM").toUpperCase(), confColor],
            ["DATA QUALITY", `${data.dataCompleteness || 0}%`, "#0f172a"],
            ["STAGE", stage, "#0f172a"],
        ].map(([label, val, color], i) => (<renderer_1.View key={i} style={[s.statBox, i === 2 ? { marginRight: 0 } : {}]}>
              <renderer_1.Text style={s.statLabel}>{label}</renderer_1.Text>
              <renderer_1.Text style={[s.statValue, { color: color }]}>{val}</renderer_1.Text>
            </renderer_1.View>))}
        </renderer_1.View>

        <renderer_1.Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 12 }}>Key Valuation Drivers</renderer_1.Text>
        {(data.keyReasons || []).map((r, i) => (<renderer_1.View key={i} style={s.reasonRow}>
            <renderer_1.Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: "#6366f1", width: 16, flexShrink: 0 }}>{i + 1}.</renderer_1.Text>
            <renderer_1.Text style={{ fontSize: 10, color: "#334155", lineHeight: 1.6, flex: 1 }}>{r}</renderer_1.Text>
          </renderer_1.View>))}
      </renderer_1.Page>

      {/* PAGE 3: METHODS OVERVIEW */}
      <renderer_1.Page size="A4" style={[s.page, s.pad]}>
        <renderer_1.Text style={s.sectionTag}>SECTION 2</renderer_1.Text>
        <renderer_1.Text style={s.sectionTitle}>Valuation Methods Overview</renderer_1.Text>
        <renderer_1.Text style={s.sectionSub}>All methods run in parallel. Final valuation blended using stage-weighted averaging.</renderer_1.Text>

        <renderer_1.View style={s.tableHeader}>
          <renderer_1.Text style={[s.tableHeaderCell, { flex: 3 }]}>METHOD</renderer_1.Text>
          <renderer_1.Text style={[s.tableHeaderCell, { flex: 1.5, textAlign: "right" }]}>LOW</renderer_1.Text>
          <renderer_1.Text style={[s.tableHeaderCell, { flex: 1.5, textAlign: "right" }]}>MID</renderer_1.Text>
          <renderer_1.Text style={[s.tableHeaderCell, { flex: 1.5, textAlign: "right" }]}>HIGH</renderer_1.Text>
          <renderer_1.Text style={[s.tableHeaderCell, { flex: 1, textAlign: "center" }]}>WEIGHT</renderer_1.Text>
        </renderer_1.View>
        {methods.map((m, i) => (<renderer_1.View key={m.methodName} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
            <renderer_1.Text style={[s.tableCell, { flex: 3, fontFamily: "Helvetica-Bold" }]}>{MN[m.methodName] || m.methodName}</renderer_1.Text>
            <renderer_1.Text style={[s.tableCell, { flex: 1.5, textAlign: "right", color: "#64748b" }]}>{fmt(m.lowEstimate)}</renderer_1.Text>
            <renderer_1.Text style={[s.tableCell, { flex: 1.5, textAlign: "right", fontFamily: "Helvetica-Bold", color: "#4f46e5" }]}>{fmt(m.midEstimate)}</renderer_1.Text>
            <renderer_1.Text style={[s.tableCell, { flex: 1.5, textAlign: "right", color: "#64748b" }]}>{fmt(m.highEstimate)}</renderer_1.Text>
            <renderer_1.Text style={[s.tableCell, { flex: 1, textAlign: "center" }]}>{W[m.methodName] || 0}%</renderer_1.Text>
          </renderer_1.View>))}
        <renderer_1.View style={[s.tableRow, { backgroundColor: "#f0f4ff" }]}>
          <renderer_1.Text style={[s.tableCell, { flex: 3, fontFamily: "Helvetica-Bold", color: "#4338ca" }]}>BLENDED RESULT</renderer_1.Text>
          <renderer_1.Text style={[s.tableCell, { flex: 1.5, textAlign: "right", color: "#4338ca" }]}>{fmt(data.blendedLow)}</renderer_1.Text>
          <renderer_1.Text style={[s.tableCell, { flex: 1.5, textAlign: "right", fontFamily: "Helvetica-Bold", color: "#4338ca" }]}>{fmt(data.blendedAverage)}</renderer_1.Text>
          <renderer_1.Text style={[s.tableCell, { flex: 1.5, textAlign: "right", color: "#4338ca" }]}>{fmt(data.blendedHigh)}</renderer_1.Text>
          <renderer_1.Text style={[s.tableCell, { flex: 1, textAlign: "center", color: "#4338ca" }]}>100%</renderer_1.Text>
        </renderer_1.View>

        <renderer_1.Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: "#0f172a", marginTop: 28, marginBottom: 14 }}>Methods Visualization</renderer_1.Text>
        {methods.map(m => {
            const pct = safePct(m.midEstimate);
            return (<renderer_1.View key={m.methodName} style={{ marginBottom: 10 }}>
              <renderer_1.View style={[s.row, { justifyContent: "space-between", marginBottom: 3 }]}>
                <renderer_1.Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#334155" }}>{MN[m.methodName] || m.methodName}</renderer_1.Text>
                <renderer_1.Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#6366f1" }}>{fmt(m.midEstimate)}</renderer_1.Text>
              </renderer_1.View>
              <renderer_1.View style={s.barTrack}>
                <renderer_1.View style={[s.barFill, { width: `${pct}%` }]}/>
              </renderer_1.View>
            </renderer_1.View>);
        })}
      </renderer_1.Page>

      {/* PAGE 4: METHOD DETAIL */}
      <renderer_1.Page size="A4" style={[s.page, s.pad]}>
        <renderer_1.Text style={s.sectionTag}>SECTION 3</renderer_1.Text>
        <renderer_1.Text style={s.sectionTitle}>Detailed Method Analysis</renderer_1.Text>
        <renderer_1.Text style={s.sectionSub}>Methodology, data sources, and calculations for each valuation method.</renderer_1.Text>

        {methods.map((m) => (<renderer_1.View key={m.methodName} style={s.methodCard} wrap={false}>
            <renderer_1.View style={[s.row, { justifyContent: "space-between", alignItems: "center", marginBottom: 4 }]}>
              <renderer_1.Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: "#0f172a" }}>{MN[m.methodName] || m.methodName}</renderer_1.Text>
              <renderer_1.Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: "#6366f1" }}>{fmt(m.midEstimate)}</renderer_1.Text>
            </renderer_1.View>
            <renderer_1.Text style={{ fontSize: 9, color: "#475569", lineHeight: 1.6, marginBottom: 10 }}>{MD[m.methodName] || ""}</renderer_1.Text>
            <renderer_1.View style={[s.row, { marginBottom: 8 }]}>
              {[["LOW", fmt(m.lowEstimate), "#64748b"], ["MID", fmt(m.midEstimate), "#4f46e5"], ["HIGH", fmt(m.highEstimate), "#64748b"]].map(([label, val, color], i) => (<renderer_1.View key={i} style={[s.methodNumBox, i === 2 ? { marginRight: 0 } : {}]}>
                  <renderer_1.Text style={s.methodNumLabel}>{label} ESTIMATE</renderer_1.Text>
                  <renderer_1.Text style={[s.methodNumValue, { color: color, fontSize: i === 1 ? 13 : 11 }]}>{val}</renderer_1.Text>
                </renderer_1.View>))}
            </renderer_1.View>
            {m.reasoning && (<renderer_1.Text style={{ fontSize: 9, color: "#64748b", lineHeight: 1.6, backgroundColor: "#ffffff", padding: 8, borderRadius: 6 }}>
                {m.reasoning.substring(0, 300)}{m.reasoning.length > 300 ? "..." : ""}
              </renderer_1.Text>)}
            <renderer_1.View style={[s.row, { justifyContent: "space-between", marginTop: 8, paddingTop: 8 }]}>
              <renderer_1.Text style={{ fontSize: 8.5, color: "#94a3b8" }}>Weight: {W[m.methodName] || 0}%</renderer_1.Text>
              <renderer_1.Text style={{ fontSize: 8.5, color: "#94a3b8" }}>Confidence: {(m.confidence || "medium").toUpperCase()}</renderer_1.Text>
            </renderer_1.View>
          </renderer_1.View>))}
      </renderer_1.Page>

      {/* PAGE 5: CERTIFICATION */}
      <renderer_1.Page size="A4" style={[s.page, s.pad]}>
        <renderer_1.Text style={s.sectionTag}>APPENDIX</renderer_1.Text>
        <renderer_1.Text style={s.sectionTitle}>Data Sources & Certification</renderer_1.Text>
        <renderer_1.Text style={s.sectionSub}>Data provenance, professional certification, and legal disclaimer.</renderer_1.Text>

        {[
            ["Prof. A. Damodaran, NYU Stern", "WACC, EBITDA multiples, LTG rates (2026)"],
            ["Federal Reserve (2026)", "Risk-free rate 4.2%, Fed Funds 4.5%"],
            ["CB Insights Q1 2026", "Venture funding trends, stage benchmarks"],
            ["PitchBook 2026", "Comparable company multiples and exit data"],
            ["Crunchbase (real-time)", "Funding rounds, comparable exits"],
        ].map(([src, desc], i) => (<renderer_1.View key={i} style={[s.row, { padding: 8, backgroundColor: i % 2 === 0 ? "#f8fafc" : "#ffffff" }]}>
            <renderer_1.Text style={[s.tableCell, { flex: 2, fontFamily: "Helvetica-Bold" }]}>{src}</renderer_1.Text>
            <renderer_1.Text style={[s.tableCell, { flex: 3, color: "#64748b" }]}>{desc}</renderer_1.Text>
          </renderer_1.View>))}

        <renderer_1.View style={s.darkBox}>
          <renderer_1.View style={[s.row, { justifyContent: "space-between", marginBottom: 14 }]}>
            <renderer_1.Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: "#e2e8f0" }}>Evaldam AI — Professional Certification</renderer_1.Text>
            <renderer_1.Text style={{ fontSize: 9, color: "#6366f1" }}>{reportId}</renderer_1.Text>
          </renderer_1.View>
          <renderer_1.Text style={{ fontSize: 9, color: "#94a3b8", lineHeight: 1.7, marginBottom: 12 }}>
            This report certifies that the valuation of {data.companyName} has been conducted in accordance with professional valuation standards. All methods are industry-recognised and outputs are based on data provided by the client and publicly available market benchmarks as of {today}.
          </renderer_1.Text>
          <renderer_1.Text style={{ fontSize: 8, color: "#64748b", lineHeight: 1.7, marginBottom: 16 }}>
            DISCLAIMER: This report is for informational and fundraising purposes only. It does not constitute financial advice, an offer to sell, or a solicitation of any investment. Actual valuations may differ based on negotiation, market conditions, and due diligence. Evaldam AI is not a registered investment adviser or broker-dealer. © {new Date().getFullYear()} Evaldam AI.
          </renderer_1.Text>
          <renderer_1.View style={[s.row, { justifyContent: "space-between", paddingTop: 14 }]}>
            <renderer_1.View>
              <renderer_1.Text style={{ fontSize: 14, color: "#c7d2fe", fontFamily: "Helvetica-Oblique", marginBottom: 3 }}>Evaldam AI Engine</renderer_1.Text>
              <renderer_1.Text style={{ fontSize: 8, color: "#64748b" }}>Automated Professional Valuation System</renderer_1.Text>
            </renderer_1.View>
            <renderer_1.View style={{ alignItems: "flex-end" }}>
              <renderer_1.Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: "#e2e8f0", marginBottom: 3 }}>Date of Issue</renderer_1.Text>
              <renderer_1.Text style={{ fontSize: 9, color: "#94a3b8" }}>{today}</renderer_1.Text>
            </renderer_1.View>
          </renderer_1.View>
        </renderer_1.View>

        <renderer_1.Text style={{ fontSize: 9, color: "#94a3b8", textAlign: "center", marginTop: 20 }}>
          CONFIDENTIAL — Prepared exclusively for {data.companyName} and its authorized representatives.
        </renderer_1.Text>
      </renderer_1.Page>

    </renderer_1.Document>);
}
//# sourceMappingURL=react-pdf-report.js.map