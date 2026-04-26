/**
 * EVALDAM AI — Professional Valuation Report Template
 * Fills from report_data JSONB stored in database.
 * Output: print-ready HTML → browser window.print() → PDF
 */

export interface ReportData {
  // Startup info
  companyName: string;
  stage: string;
  industry?: string;
  website?: string;
  description?: string;
  // Valuation numbers
  blendedLow: number;
  blendedHigh: number;
  blendedAverage: number;
  confidenceLevel: string;
  dataCompleteness: number;
  // Methods
  methods: Array<{
    methodName: string;
    lowEstimate: number;
    midEstimate: number;
    highEstimate: number;
    confidence: string;
    reasoning?: string;
    assumptions?: Record<string, any>;
  }>;
  keyReasons: string[];
  // Rich data from report_data JSONB
  executiveSummary?: {
    blendedRange?: { low: number; high: number; mid: number };
    keyReasons?: string[];
    methodologyNote?: string;
    confidenceRating?: string;
  };
  sensitivityAnalysis?: Array<{
    variable: string;
    scenario: string;
    impact: number;
    percentageChange: number;
  }>;
  detailedAnalysis?: {
    industryAnalysis?: string;
    comparableCompanies?: string[];
    marketContext?: string;
  };
  professionalCitation?: string;
  generatedAt?: string;
  valuationId?: string;
  isFreePlan?: boolean;
}

const fmt = (v: number) => `$${(v / 1_000_000).toFixed(2)}M`;
const fmtK = (v: number) => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`;

const methodDisplayName: Record<string, string> = {
  scorecard: "Scorecard Method (Bill Payne)",
  berkus: "Berkus Checklist",
  vc: "Venture Capital Method",
  "dcf-ltg": "DCF with Long-Term Growth",
  "dcf-multiples": "DCF with Exit Multiples",
  "evaldam-score": "Evaldam Proprietary Score",
};

const methodDescription: Record<string, string> = {
  scorecard: "Developed by Bill Payne (2011). Compares the startup to a regional baseline valuation across 6 weighted criteria: team (30%), market opportunity (25%), product/tech (15%), competitive environment (10%), marketing/sales (10%), and funding requirements (10%).",
  berkus: "Developed by Dave Berkus. Assigns up to $500K–$750K per milestone: sound idea, prototype/MVP, quality management, strategic relationships, and product rollout/sales. Maximum pre-revenue valuation capped at $3.75M.",
  vc: "Back-calculates present value from a projected 5–7 year terminal exit value. Uses industry P/E or revenue multiples at exit, discounted at required investor ROI (10x–30x typical for seed stage).",
  "dcf-ltg": "Discounted Cash Flow using Damodaran's Long-Term Growth model. Terminal value = FCF × (1 + g) / (WACC – g). Parameters: WACC 11%, LTG 2.5%, Risk-Free Rate 4.2% (2026 data, Federal Reserve).",
  "dcf-multiples": "DCF with exit value estimated via EBITDA or Revenue multiples. Industry EBITDA multiple (Damodaran 2026): Consumer Electronics ~14x, SaaS ~25x, AI ~35x. More reliable than LTG for high-growth startups.",
  "evaldam-score": "Proprietary Evaldam scoring algorithm. Combines: (1) internal database percentile comparison, (2) 2026 industry growth premium, (3) team exit history bonus, (4) patent/IP strength, (5) customer concentration risk, (6) market timing score, (7) competitive moat assessment.",
};

export function generateProfessionalReportHTML(data: ReportData): string {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const reportId = data.valuationId || `EVD-${Date.now()}`;
  const stage = data.stage?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "N/A";

  // Method weights
  const methodWeights: Record<string, number> = data.stage === "pre-revenue" || data.stage === "seed"
    ? { "scorecard": 16, "berkus": 16, "vc": 24, "dcf-ltg": 16, "dcf-multiples": 8, "evaldam-score": 20 }
    : { "scorecard": 8, "berkus": 8, "vc": 24, "dcf-ltg": 20, "dcf-multiples": 20, "evaldam-score": 20 };

  const methodRows = (data.methods || []).filter(m => m?.methodName && m?.midEstimate).map(m => `
    <tr>
      <td style="padding:10px 14px;font-weight:600;color:#1e293b;">${methodDisplayName[m.methodName] || m.methodName}</td>
      <td style="padding:10px 14px;text-align:right;color:#64748b;">${fmt(m.lowEstimate)}</td>
      <td style="padding:10px 14px;text-align:right;font-weight:700;color:#0f172a;">${fmt(m.midEstimate)}</td>
      <td style="padding:10px 14px;text-align:right;color:#64748b;">${fmt(m.highEstimate)}</td>
      <td style="padding:10px 14px;text-align:center;">
        <span style="padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600;
          background:${m.confidence === 'high' ? '#dcfce7' : m.confidence === 'medium' ? '#fef9c3' : '#fee2e2'};
          color:${m.confidence === 'high' ? '#166534' : m.confidence === 'medium' ? '#854d0e' : '#991b1b'}">
          ${(m.confidence || 'medium').toUpperCase()}
        </span>
      </td>
      <td style="padding:10px 14px;text-align:center;color:#64748b;">${methodWeights[m.methodName] || 0}%</td>
    </tr>
  `).join("");

  const methodDetailSections = (data.methods || []).filter(m => m?.methodName && m?.midEstimate).map((m, i) => `
    <div style="margin-bottom:36px;page-break-inside:avoid;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <div style="width:32px;height:32px;background:#f1f5f9;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;color:#6366f1;font-size:14px;">${i + 1}</div>
        <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin:0;">${methodDisplayName[m.methodName] || m.methodName}</h3>
        <span style="margin-left:auto;font-size:20px;font-weight:800;color:#6366f1;">${fmt(m.midEstimate)}</span>
      </div>
      <div style="background:#f8fafc;border-left:3px solid #6366f1;padding:14px 16px;border-radius:0 8px 8px 0;margin-bottom:12px;">
        <p style="font-size:12px;color:#475569;line-height:1.7;margin:0;">${methodDescription[m.methodName] || ""}</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:12px;">
        <div style="background:#fafafa;border:1px solid #e2e8f0;border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">LOW ESTIMATE</div>
          <div style="font-size:16px;font-weight:700;color:#64748b;">${fmt(m.lowEstimate)}</div>
        </div>
        <div style="background:#f0f4ff;border:1px solid #c7d2fe;border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:11px;color:#6366f1;margin-bottom:4px;">MID ESTIMATE</div>
          <div style="font-size:18px;font-weight:800;color:#4f46e5;">${fmt(m.midEstimate)}</div>
        </div>
        <div style="background:#fafafa;border:1px solid #e2e8f0;border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">HIGH ESTIMATE</div>
          <div style="font-size:16px;font-weight:700;color:#64748b;">${fmt(m.highEstimate)}</div>
        </div>
      </div>
      ${m.reasoning ? `<p style="font-size:12px;color:#64748b;line-height:1.8;margin:0;padding:12px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;">${m.reasoning.substring(0, 600)}${m.reasoning.length > 600 ? "..." : ""}</p>` : ""}
      <div style="display:flex;justify-content:space-between;margin-top:10px;padding-top:10px;border-top:1px solid #f1f5f9;">
        <span style="font-size:11px;color:#94a3b8;">Weight in blend: <strong>${methodWeights[m.methodName] || 0}%</strong></span>
        <span style="font-size:11px;color:#94a3b8;">Confidence: <strong>${(m.confidence || "medium").toUpperCase()}</strong></span>
      </div>
    </div>
  `).join('<div style="border-top:1px solid #f1f5f9;margin:20px 0;"></div>');

  const sensRows = (data.sensitivityAnalysis || []).map(s => `
    <tr>
      <td style="padding:9px 14px;color:#334155;">${s.variable}</td>
      <td style="padding:9px 14px;color:#475569;">${s.scenario}</td>
      <td style="padding:9px 14px;text-align:right;font-weight:600;color:${s.percentageChange > 0 ? "#166534" : "#991b1b"};">${s.percentageChange > 0 ? "+" : ""}${s.percentageChange}%</td>
      <td style="padding:9px 14px;text-align:right;font-weight:600;color:${s.impact > 0 ? "#166534" : "#991b1b"};">${s.impact > 0 ? "+" : ""}${fmtK(Math.abs(s.impact))}</td>
    </tr>
  `).join("");

  const comparables = (data.detailedAnalysis?.comparableCompanies || []).map(c =>
    `<li style="padding:6px 0;font-size:12px;color:#475569;border-bottom:1px solid #f1f5f9;">${c}</li>`
  ).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Valuation Report — ${data.companyName}</title>
<style>
  * { margin:0;padding:0;box-sizing:border-box; }
  body { font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1e293b;font-size:13px;line-height:1.6; }
  @media print {
    .no-print { display:none!important; }
    .page-break { page-break-after:always; }
    body { -webkit-print-color-adjust:exact;print-color-adjust:exact; }
  }
  .page { max-width:794px;margin:0 auto;padding:0 48px; }
  table { width:100%;border-collapse:collapse; }
  tr:nth-child(even) { background:#f8fafc; }
  th { background:#f1f5f9;padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#64748b;letter-spacing:.05em;text-transform:uppercase; }
</style>
</head>
<body>

<!-- PRINT BUTTON -->
<div class="no-print" style="position:fixed;top:16px;right:16px;z-index:999;display:flex;gap:8px;">
  <button onclick="window.print()" style="background:#6366f1;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-weight:600;cursor:pointer;font-size:13px;">⬇ Download PDF</button>
  <button onclick="window.close()" style="background:#f1f5f9;color:#334155;border:none;padding:10px 16px;border-radius:8px;cursor:pointer;font-size:13px;">✕ Close</button>
</div>

<!-- ══════════════════════════════ PAGE 1: COVER ══════════════════════════════ -->
<div style="min-height:100vh;background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#312e81 100%);display:flex;flex-direction:column;justify-content:space-between;padding:64px 72px;color:#fff;page-break-after:always;">
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:center;">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:36px;height:36px;background:#6366f1;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;">✦</div>
      <span style="font-size:18px;font-weight:800;letter-spacing:-.02em;">Evaldam AI</span>
    </div>
    <span style="font-size:11px;color:#a5b4fc;letter-spacing:.1em;text-transform:uppercase;">Confidential</span>
  </div>

  <!-- Main content -->
  <div>
    <div style="display:inline-block;background:rgba(99,102,241,.2);border:1px solid rgba(165,180,252,.3);color:#a5b4fc;padding:6px 16px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-bottom:28px;">
      Pre-Money Valuation Report
    </div>
    <h1 style="font-size:52px;font-weight:900;line-height:1.1;margin-bottom:16px;letter-spacing:-.03em;">${data.companyName}</h1>
    <div style="font-size:20px;color:#a5b4fc;margin-bottom:48px;">${stage} Stage${data.industry ? ` · ${data.industry}` : ""}</div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:48px;">
      <div style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:20px;">
        <div style="font-size:11px;color:#94a3b8;margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em;">Pre-Money Valuation</div>
        <div style="font-size:26px;font-weight:800;color:#fff;">${fmt(data.blendedAverage)}</div>
        <div style="font-size:12px;color:#6366f1;margin-top:4px;">Weighted Average</div>
      </div>
      <div style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:20px;">
        <div style="font-size:11px;color:#94a3b8;margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em;">Valuation Range</div>
        <div style="font-size:18px;font-weight:800;color:#fff;">${fmt(data.blendedLow)}</div>
        <div style="font-size:12px;color:#94a3b8;margin-top:2px;">to ${fmt(data.blendedHigh)}</div>
      </div>
      <div style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:20px;">
        <div style="font-size:11px;color:#94a3b8;margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em;">Confidence Level</div>
        <div style="font-size:26px;font-weight:800;color:${data.confidenceLevel === 'high' ? '#4ade80' : data.confidenceLevel === 'medium' ? '#facc15' : '#f87171'};">${(data.confidenceLevel || "medium").toUpperCase()}</div>
        <div style="font-size:12px;color:#94a3b8;margin-top:4px;">Data: ${data.dataCompleteness}% complete</div>
      </div>
    </div>

    <div style="font-size:13px;color:#64748b;line-height:1.8;">
      ${(data.keyReasons || []).slice(0, 3).map((r, i) => `<div style="margin-bottom:8px;">▸ ${r}</div>`).join("")}
    </div>
  </div>

  <!-- Footer -->
  <div style="display:flex;justify-content:space-between;align-items:flex-end;">
    <div>
      <div style="font-size:11px;color:#475569;margin-bottom:4px;">Report ID: ${reportId}</div>
      <div style="font-size:11px;color:#475569;">Generated: ${today}</div>
    </div>
    <div style="text-align:right;font-size:11px;color:#475569;">
      <div>Evaldam AI Professional Valuation Engine</div>
      <div>6-Method Blended Analysis · 2026 Market Data</div>
    </div>
  </div>
</div>

<!-- ══════════════════════════════ PAGE 2: EXECUTIVE SUMMARY ══════════════════════════════ -->
<div class="page" style="padding-top:56px;padding-bottom:56px;page-break-after:always;">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
    <span style="width:4px;height:24px;background:#6366f1;border-radius:2px;display:inline-block;"></span>
    <span style="font-size:11px;font-weight:700;color:#6366f1;letter-spacing:.1em;text-transform:uppercase;">Section 1</span>
  </div>
  <h2 style="font-size:28px;font-weight:800;color:#0f172a;margin-bottom:6px;">Executive Summary</h2>
  <p style="font-size:13px;color:#64748b;margin-bottom:36px;">This report presents a professional pre-money valuation of ${data.companyName} using six industry-standard methodologies.</p>

  <!-- Valuation highlight box -->
  <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:16px;padding:32px;color:#fff;margin-bottom:32px;">
    <p style="font-size:12px;color:#c7d2fe;margin-bottom:8px;letter-spacing:.06em;text-transform:uppercase;">Pre-Money Valuation — Weighted Average</p>
    <div style="font-size:48px;font-weight:900;letter-spacing:-.03em;margin-bottom:12px;">${fmt(data.blendedAverage)}</div>
    <div style="display:flex;gap:32px;">
      <div><span style="color:#c7d2fe;font-size:12px;">Low Bound</span><div style="font-size:18px;font-weight:700;">${fmt(data.blendedLow)}</div></div>
      <div style="border-left:1px solid rgba(255,255,255,.2);padding-left:32px;"><span style="color:#c7d2fe;font-size:12px;">High Bound</span><div style="font-size:18px;font-weight:700;">${fmt(data.blendedHigh)}</div></div>
      <div style="border-left:1px solid rgba(255,255,255,.2);padding-left:32px;"><span style="color:#c7d2fe;font-size:12px;">Methods Used</span><div style="font-size:18px;font-weight:700;">${(data.methods || []).length}</div></div>
    </div>
  </div>

  <!-- Key reasons -->
  <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:16px;">Key Valuation Drivers</h3>
  <div style="space-y:8px;margin-bottom:32px;">
    ${(data.keyReasons || []).map((r, i) => `
      <div style="display:flex;gap:12px;padding:12px 16px;background:#f8fafc;border-radius:8px;margin-bottom:8px;border-left:3px solid #6366f1;">
        <span style="font-size:13px;font-weight:700;color:#6366f1;flex-shrink:0;">${i + 1}.</span>
        <span style="font-size:13px;color:#334155;line-height:1.6;">${r}</span>
      </div>
    `).join("")}
  </div>

  <!-- Methodology note -->
  ${data.executiveSummary?.methodologyNote ? `
  <div style="background:#f0f4ff;border:1px solid #c7d2fe;border-radius:8px;padding:16px;margin-bottom:24px;">
    <p style="font-size:12px;color:#4338ca;line-height:1.7;margin:0;">📋 ${data.executiveSummary.methodologyNote}</p>
  </div>` : ""}

  <!-- Confidence -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center;">
      <div style="font-size:11px;color:#94a3b8;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em;">Confidence</div>
      <div style="font-size:20px;font-weight:800;color:${data.confidenceLevel === 'high' ? '#166534' : data.confidenceLevel === 'medium' ? '#854d0e' : '#991b1b'};">${(data.confidenceLevel || "medium").toUpperCase()}</div>
    </div>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center;">
      <div style="font-size:11px;color:#94a3b8;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em;">Data Quality</div>
      <div style="font-size:20px;font-weight:800;color:#0f172a;">${data.dataCompleteness}%</div>
    </div>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center;">
      <div style="font-size:11px;color:#94a3b8;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em;">Stage</div>
      <div style="font-size:16px;font-weight:800;color:#0f172a;">${stage}</div>
    </div>
  </div>
</div>

<!-- ══════════════════════════════ PAGE 3: METHODS TABLE ══════════════════════════════ -->
<div class="page" style="padding-top:56px;padding-bottom:56px;page-break-after:always;">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
    <span style="width:4px;height:24px;background:#6366f1;border-radius:2px;display:inline-block;"></span>
    <span style="font-size:11px;font-weight:700;color:#6366f1;letter-spacing:.1em;text-transform:uppercase;">Section 2</span>
  </div>
  <h2 style="font-size:28px;font-weight:800;color:#0f172a;margin-bottom:6px;">Valuation Methods Overview</h2>
  <p style="font-size:13px;color:#64748b;margin-bottom:28px;">All six methods run in parallel. Final valuation blended using stage-weighted averaging.</p>

  <table style="margin-bottom:32px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <thead>
      <tr>
        <th>Method</th>
        <th style="text-align:right;">Low</th>
        <th style="text-align:right;">Mid (Used)</th>
        <th style="text-align:right;">High</th>
        <th style="text-align:center;">Confidence</th>
        <th style="text-align:center;">Weight</th>
      </tr>
    </thead>
    <tbody>${methodRows}</tbody>
    <tfoot>
      <tr style="background:#f0f4ff;font-weight:700;">
        <td style="padding:12px 14px;color:#4338ca;">BLENDED RESULT</td>
        <td style="padding:12px 14px;text-align:right;color:#4338ca;">${fmt(data.blendedLow)}</td>
        <td style="padding:12px 14px;text-align:right;color:#4338ca;font-size:15px;">${fmt(data.blendedAverage)}</td>
        <td style="padding:12px 14px;text-align:right;color:#4338ca;">${fmt(data.blendedHigh)}</td>
        <td style="padding:12px 14px;text-align:center;color:#4338ca;">${(data.confidenceLevel || "MEDIUM").toUpperCase()}</td>
        <td style="padding:12px 14px;text-align:center;color:#4338ca;">100%</td>
      </tr>
    </tfoot>
  </table>

  <!-- Visual bar chart of methods -->
  <h3 style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:16px;">Methods Visualization</h3>
  <div style="space-y:10px;">
    ${(data.methods || []).filter(m => m?.methodName && m?.midEstimate).map(m => {
      const maxVal = Math.max(...(data.methods || []).filter(x => x?.midEstimate).map(x => x.midEstimate));
      const pct = Math.round((m.midEstimate / maxVal) * 100);
      return `
        <div style="margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-size:12px;font-weight:600;color:#334155;">${methodDisplayName[m.methodName] || m.methodName}</span>
            <span style="font-size:12px;font-weight:700;color:#6366f1;">${fmt(m.midEstimate)}</span>
          </div>
          <div style="background:#e2e8f0;border-radius:4px;height:8px;overflow:hidden;">
            <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);height:8px;border-radius:4px;width:${pct}%;"></div>
          </div>
        </div>
      `;
    }).join("")}
  </div>
</div>

<!-- ══════════════════════════════ PAGE 4+: METHOD DETAIL ══════════════════════════════ -->
<div class="page" style="padding-top:56px;padding-bottom:56px;page-break-after:always;">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
    <span style="width:4px;height:24px;background:#6366f1;border-radius:2px;display:inline-block;"></span>
    <span style="font-size:11px;font-weight:700;color:#6366f1;letter-spacing:.1em;text-transform:uppercase;">Section 3</span>
  </div>
  <h2 style="font-size:28px;font-weight:800;color:#0f172a;margin-bottom:6px;">Detailed Method Analysis</h2>
  <p style="font-size:13px;color:#64748b;margin-bottom:36px;">Methodology, data sources, and calculations for each valuation method.</p>
  ${methodDetailSections}
</div>

<!-- ══════════════════════════════ PAGE 5: MARKET & COMPARABLES ══════════════════════════════ -->
<div class="page" style="padding-top:56px;padding-bottom:56px;page-break-after:always;">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
    <span style="width:4px;height:24px;background:#6366f1;border-radius:2px;display:inline-block;"></span>
    <span style="font-size:11px;font-weight:700;color:#6366f1;letter-spacing:.1em;text-transform:uppercase;">Section 4</span>
  </div>
  <h2 style="font-size:28px;font-weight:800;color:#0f172a;margin-bottom:6px;">Market Analysis</h2>
  <p style="font-size:13px;color:#64748b;margin-bottom:28px;">Industry context, comparable companies, and 2026 market conditions.</p>

  ${data.detailedAnalysis?.industryAnalysis ? `
  <div style="margin-bottom:28px;">
    <h3 style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:12px;">Industry Analysis</h3>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;">
      <p style="font-size:12px;color:#475569;line-height:1.8;white-space:pre-line;">${data.detailedAnalysis.industryAnalysis}</p>
    </div>
  </div>` : ""}

  ${comparables ? `
  <div style="margin-bottom:28px;">
    <h3 style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:12px;">Comparable Companies</h3>
    <ul style="list-style:none;padding:0;">${comparables}</ul>
  </div>` : ""}

  ${data.detailedAnalysis?.marketContext ? `
  <div style="margin-bottom:28px;">
    <h3 style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:12px;">2026 Market Context</h3>
    <div style="background:#f0f4ff;border:1px solid #c7d2fe;border-radius:8px;padding:16px;">
      <p style="font-size:12px;color:#4338ca;line-height:1.8;white-space:pre-line;">${data.detailedAnalysis.marketContext}</p>
    </div>
  </div>` : ""}
</div>

<!-- ══════════════════════════════ PAGE 6: SENSITIVITY ══════════════════════════════ -->
${sensRows ? `
<div class="page" style="padding-top:56px;padding-bottom:56px;page-break-after:always;">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
    <span style="width:4px;height:24px;background:#6366f1;border-radius:2px;display:inline-block;"></span>
    <span style="font-size:11px;font-weight:700;color:#6366f1;letter-spacing:.1em;text-transform:uppercase;">Section 5</span>
  </div>
  <h2 style="font-size:28px;font-weight:800;color:#0f172a;margin-bottom:6px;">Sensitivity Analysis</h2>
  <p style="font-size:13px;color:#64748b;margin-bottom:28px;">How valuation changes under different assumptions and market conditions.</p>

  <table style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <thead>
      <tr>
        <th>Variable</th>
        <th>Scenario</th>
        <th style="text-align:right;">% Change</th>
        <th style="text-align:right;">Value Impact</th>
      </tr>
    </thead>
    <tbody>${sensRows}</tbody>
  </table>
</div>` : ""}

<!-- ══════════════════════════════ PAGE 7: CERTIFICATION ══════════════════════════════ -->
<div class="page" style="padding-top:56px;padding-bottom:56px;">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
    <span style="width:4px;height:24px;background:#6366f1;border-radius:2px;display:inline-block;"></span>
    <span style="font-size:11px;font-weight:700;color:#6366f1;letter-spacing:.1em;text-transform:uppercase;">Appendix & Certification</span>
  </div>
  <h2 style="font-size:28px;font-weight:800;color:#0f172a;margin-bottom:28px;">Data Sources & Professional Certification</h2>

  <!-- Data Sources -->
  <div style="margin-bottom:32px;">
    <h3 style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:12px;">Data Sources Used</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      ${[
        ["Prof. A. Damodaran, NYU Stern", "WACC, EBITDA multiples, LTG rates (2026)"],
        ["Federal Reserve (2026)", "Risk-free rate 4.2%, Fed Funds 4.5%"],
        ["McKinsey Global AI Index 2026", "AI industry growth rates, market sizing"],
        ["CB Insights Q1 2026", "Venture funding trends, stage benchmarks"],
        ["PitchBook 2026", "Comparable company multiples"],
        ["Gartner Magic Quadrant 2026", "Technology sector positioning"],
        ["Crunchbase (real-time)", "Funding rounds, comparable exits"],
        ["S&P CapitalIQ", "Public SaaS/tech EV/Revenue multiples"],
      ].map(([source, desc]) => `
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;">
          <div style="font-size:12px;font-weight:700;color:#334155;margin-bottom:2px;">${source}</div>
          <div style="font-size:11px;color:#94a3b8;">${desc}</div>
        </div>
      `).join("")}
    </div>
  </div>

  <!-- Professional Certification -->
  <div style="background:linear-gradient(135deg,#0f172a,#1e1b4b);border-radius:16px;padding:40px;color:#fff;margin-top:24px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
          <div style="width:32px;height:32px;background:#6366f1;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;">✦</div>
          <span style="font-size:16px;font-weight:800;letter-spacing:-.01em;">Evaldam AI</span>
        </div>
        <p style="font-size:13px;color:#94a3b8;max-width:400px;line-height:1.7;">
          This valuation report has been generated by the Evaldam AI Professional Valuation Engine
          using six industry-standard methodologies benchmarked against 2026 market data.
        </p>
      </div>
      <div style="text-align:right;">
        <div style="background:rgba(99,102,241,.3);border:1px solid rgba(165,180,252,.4);border-radius:8px;padding:10px 16px;display:inline-block;">
          <div style="font-size:10px;color:#a5b4fc;letter-spacing:.06em;text-transform:uppercase;margin-bottom:2px;">Report ID</div>
          <div style="font-size:13px;font-weight:700;color:#e2e8f0;">${reportId}</div>
        </div>
      </div>
    </div>

    <!-- Certification statement -->
    <div style="border-top:1px solid rgba(255,255,255,.1);padding-top:24px;margin-bottom:24px;">
      <p style="font-size:12px;color:#e2e8f0;line-height:1.8;margin-bottom:12px;">
        <strong>Certification:</strong> This report certifies that the valuation of <strong>${data.companyName}</strong> has been
        conducted in accordance with professional valuation standards. All methods applied are
        industry-recognised and the outputs are based on data provided by the client and publicly
        available market benchmarks as of ${today}.
      </p>
      <p style="font-size:11px;color:#64748b;line-height:1.7;">
        <strong>Disclaimer:</strong> This report is prepared for informational and fundraising purposes only.
        It does not constitute financial advice, an offer to sell, or a solicitation of any investment.
        Actual valuations may differ based on negotiation, market conditions, and due diligence findings.
        Evaldam AI is not a registered investment adviser or broker-dealer.
      </p>
    </div>

    <!-- Signature block -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
      <div style="border-top:1px solid rgba(255,255,255,.2);padding-top:16px;">
        <div style="font-size:22px;font-weight:300;color:#c7d2fe;font-style:italic;margin-bottom:4px;font-family:Georgia,serif;">Evaldam AI Engine</div>
        <div style="font-size:11px;color:#64748b;">Automated Professional Valuation System</div>
        <div style="font-size:11px;color:#64748b;margin-top:2px;">6-Method Blended Analysis</div>
      </div>
      <div style="border-top:1px solid rgba(255,255,255,.2);padding-top:16px;text-align:right;">
        <div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:4px;">Date of Issue</div>
        <div style="font-size:12px;color:#94a3b8;">${today}</div>
        <div style="font-size:11px;color:#64748b;margin-top:8px;">${data.professionalCitation || `Evaldam AI | Professional Startup Valuations | evaldam.ai`}</div>
      </div>
    </div>
  </div>

  <!-- Confidentiality footer -->
  <div style="text-align:center;margin-top:32px;padding:16px;border-top:1px solid #f1f5f9;">
    <p style="font-size:11px;color:#94a3b8;">
      CONFIDENTIAL — This document is prepared exclusively for <strong>${data.companyName}</strong> and its authorized representatives.
      Unauthorized reproduction or distribution is strictly prohibited. © ${new Date().getFullYear()} Evaldam AI.
    </p>
  </div>
</div>

</body>
</html>`;
}
