/**
 * Professional PDF Report Generator
 * Converts valuation data to investor-grade PDF
 *
 * Structure:
 * 1. Title Page
 * 2. Executive Summary
 * 3. Valuation Summary Table
 * 4. Method-by-Method Breakdown (5 methods × full math + sources)
 * 5. Blended Valuation & Weighting
 * 6. Sensitivity & Scenario Analysis
 * 7. Assumptions & Sources Appendix
 */

import { ProfessionalValuationResult } from '@/lib/valuation/professional-engine';
import { StartupProfile } from '@/types';
import {
  generateValuationRangeChart,
  generateMethodContributionChart,
  generateSensitivityChart,
  generateMarketBenchmarksChart,
  generateValuationTrendsChart,
} from './chart-generator';

export interface PDFReportContent {
  titlePage: string;
  executiveSummary: string;
  valuationTable: string;
  methodBreakdown: string;
  blendedValuation: string;
  sensitivityAnalysis: string;
  appendix: string;
}

export function generatePDFReportHTML(
  result: ProfessionalValuationResult,
  profile: StartupProfile
): string {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Valuation Report - ${profile.companyName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: white;
      padding: 40px;
    }

    .page { page-break-after: always; padding: 40px; }
    .page-break { page-break-after: always; }

    /* Title Page */
    .title-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      text-align: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .title-page h1 {
      font-size: 48px;
      margin-bottom: 20px;
      font-weight: bold;
    }

    .title-page .subtitle {
      font-size: 24px;
      margin-bottom: 40px;
      opacity: 0.9;
    }

    .title-page .details {
      margin-top: 60px;
      text-align: left;
      max-width: 400px;
    }

    .title-page .detail-row {
      margin: 12px 0;
      font-size: 14px;
    }

    .title-page .report-date {
      margin-top: 100px;
      font-size: 12px;
      opacity: 0.8;
    }

    /* Headers */
    h1 { font-size: 36px; color: #667eea; margin: 40px 0 20px 0; }
    h2 { font-size: 24px; color: #667eea; margin: 30px 0 15px 0; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
    h3 { font-size: 18px; color: #555; margin: 20px 0 10px 0; }

    /* Summary Box */
    .summary-box {
      background: #f0f4ff;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }

    .summary-box .metric {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
      font-size: 16px;
    }

    .summary-box .metric .label {
      font-weight: 600;
    }

    .summary-box .metric .value {
      color: #667eea;
      font-weight: bold;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 14px;
    }

    th {
      background: #667eea;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }

    td {
      padding: 10px 12px;
      border-bottom: 1px solid #ddd;
    }

    tr:nth-child(even) {
      background: #f9f9f9;
    }

    /* Method Sections */
    .method-section {
      margin: 30px 0;
      padding: 20px;
      background: #fafafa;
      border-radius: 4px;
    }

    .method-section h3 {
      color: #667eea;
      margin-bottom: 15px;
    }

    .method-detail {
      margin: 10px 0;
      font-size: 14px;
    }

    .method-detail .label {
      font-weight: 600;
      color: #333;
      display: inline-block;
      width: 150px;
    }

    .method-detail .value {
      color: #667eea;
      font-weight: 500;
    }

    /* Key Reasons */
    .key-reasons {
      margin: 20px 0;
    }

    .key-reasons ul {
      list-style: none;
      padding: 0;
    }

    .key-reasons li {
      margin: 12px 0;
      padding-left: 25px;
      position: relative;
      font-size: 15px;
    }

    .key-reasons li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #667eea;
      font-weight: bold;
    }

    /* Sensitivity */
    .sensitivity-row {
      display: flex;
      justify-content: space-between;
      padding: 10px;
      margin: 8px 0;
      background: white;
      border-left: 3px solid #667eea;
    }

    .sensitivity-scenario {
      flex: 1;
      font-weight: 500;
    }

    .sensitivity-impact {
      color: #667eea;
      font-weight: bold;
      min-width: 120px;
      text-align: right;
    }

    /* Sources */
    .sources {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 4px;
      font-size: 13px;
      margin: 10px 0;
    }

    .sources ul {
      list-style: none;
      padding: 0;
      margin: 10px 0;
    }

    .sources li {
      padding: 5px 0;
      margin-left: 0;
    }

    .sources li:before {
      content: "•";
      margin-right: 8px;
      color: #667eea;
    }

    /* Footer */
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #999;
      text-align: center;
    }

    /* Confidence Badge */
    .confidence-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      margin: 10px 0;
    }

    .confidence-high { background: #d4edda; color: #155724; }
    .confidence-medium { background: #fff3cd; color: #856404; }
    .confidence-low { background: #f8d7da; color: #721c24; }

    /* Print Optimization */
    @media print {
      body { padding: 0; }
      .page { padding: 40px; }
      .page-break { page-break-after: always; }
    }
  </style>
</head>
<body>

<!-- PAGE 1: TITLE PAGE -->
<div class="title-page page-break">
  <h1>VALUATION REPORT</h1>
  <p class="subtitle">${profile.companyName}</p>

  <div class="details">
    <div class="detail-row"><strong>Stage:</strong> ${profile.stage}</div>
    <div class="detail-row"><strong>Industry:</strong> ${profile.industry || 'Technology'}</div>
    <div class="detail-row"><strong>Headquarters:</strong> ${profile.headquarters || 'N/A'}</div>
    <div class="detail-row"><strong>Current ARR:</strong> $${(profile.annualRecurringRevenue || 0).toLocaleString()}</div>
  </div>

  <div class="report-date">
    <p>Report Date: ${today}</p>
    <p>Methodology: 5-Method Professional Blend</p>
    <p>Data Completeness: ${result.dataCompleteness}%</p>
  </div>
</div>

<!-- PAGE 2: EXECUTIVE SUMMARY -->
<div class="page page-break">
  <h1>Executive Summary</h1>

  <div class="summary-box">
    <div class="metric">
      <span class="label">Low Estimate:</span>
      <span class="value">$${result.executiveSummary.blendedRange.low.toLocaleString()}</span>
    </div>
    <div class="metric">
      <span class="label">Weighted Average:</span>
      <span class="value">$${result.executiveSummary.blendedRange.mid.toLocaleString()}</span>
    </div>
    <div class="metric">
      <span class="label">High Estimate:</span>
      <span class="value">$${result.executiveSummary.blendedRange.high.toLocaleString()}</span>
    </div>
  </div>

  <h2>Valuation Range Visualization</h2>
  ${generateValuationRangeChart(
    result.executiveSummary.blendedRange.low,
    result.executiveSummary.blendedRange.mid,
    result.executiveSummary.blendedRange.high,
    profile.companyName
  )}

  <h2>Key Investment Reasons</h2>
  <div class="key-reasons">
    <ul>
      ${result.executiveSummary.keyReasons.map(reason => `<li>${reason}</li>`).join('')}
    </ul>
  </div>

  <h2>Confidence Rating</h2>
  <p>${result.executiveSummary.confidenceRating}</p>
  <div class="confidence-badge confidence-${result.confidenceLevel}">
    ${result.confidenceLevel.toUpperCase()}
  </div>

  <h2>Methodology Overview</h2>
  <p>${result.executiveSummary.methodologyNote}</p>
</div>

<!-- PAGE 3: VALUATION SUMMARY TABLE -->
<div class="page page-break">
  <h1>Valuation Summary by Method</h1>

  <table>
    <thead>
      <tr>
        <th>Method</th>
        <th>Low Estimate</th>
        <th>Midpoint</th>
        <th>High Estimate</th>
        <th>Weight</th>
        <th>Confidence</th>
      </tr>
    </thead>
    <tbody>
      ${result.methods.map((method, idx) => {
        const weight = result.blended.methodBreakdown[method.methodName]?.weight || 0;
        return `
        <tr>
          <td><strong>${method.methodName.replace('-', ' ').toUpperCase()}</strong></td>
          <td>$${method.lowEstimate.toLocaleString()}</td>
          <td>$${method.midEstimate.toLocaleString()}</td>
          <td>$${method.highEstimate.toLocaleString()}</td>
          <td>${(weight * 100).toFixed(0)}%</td>
          <td>${method.confidence}</td>
        </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <h2>Method Contribution to Final Valuation</h2>
  ${generateMethodContributionChart(
    result.methods.map((m) => ({
      name: m.methodName,
      weight: result.blended.methodBreakdown[m.methodName]?.weight || 0,
      estimate: m.midEstimate,
    }))
  )}
  <p style="margin-top: 20px;">The 5 methods are blended using stage-weighted averaging:</p>
  <ul style="margin: 15px 0 15px 20px;">
    ${result.methods.map((method) => {
      const weight = result.blended.methodBreakdown[method.methodName]?.weight || 0;
      const contribution = result.blended.methodBreakdown[method.methodName]?.estimate * weight || 0;
      return `<li>${method.methodName.toUpperCase()}: ${(weight * 100).toFixed(1)}% weight = $${Math.round(contribution).toLocaleString()} contribution</li>`;
    }).join('')}
  </ul>
</div>

<!-- PAGES 4-8: METHOD-BY-METHOD BREAKDOWN -->
${result.methods.map((method, idx) => `
<div class="page ${idx < result.methods.length - 1 ? 'page-break' : ''}">
  <h1>Method ${idx + 1}: ${method.methodName.replace('-', ' ').toUpperCase()}</h1>

  <div class="method-section">
    <h3>Valuation Estimate</h3>
    <div class="method-detail">
      <span class="label">Range:</span>
      <span class="value">$${method.lowEstimate.toLocaleString()} – $${method.highEstimate.toLocaleString()}</span>
    </div>
    <div class="method-detail">
      <span class="label">Midpoint:</span>
      <span class="value">$${method.midEstimate.toLocaleString()}</span>
    </div>
    <div class="method-detail">
      <span class="label">Weight in Blend:</span>
      <span class="value">${(result.blended.methodBreakdown[method.methodName]?.weight * 100 || 0).toFixed(1)}%</span>
    </div>
    <div class="method-detail">
      <span class="label">Confidence:</span>
      <span class="value">${method.confidence}</span>
    </div>
  </div>

  <h3>Methodology & Calculation</h3>
  <p>${method.reasoning}</p>

  <h3>Key Assumptions</h3>
  <div class="sources">
    <ul>
      ${Object.entries(method.assumptions).map(([key, value]) => {
        const displayVal = typeof value === 'number' ?
          (value > 1000 ? '$' + value.toLocaleString() : value.toFixed(2)) :
          value;
        return `<li><strong>${key}:</strong> ${displayVal}</li>`;
      }).join('')}
    </ul>
  </div>

  <h3>Sources & Citations</h3>
  <div class="sources">
    <ul>
      ${method.sources.map(source => `<li>${source}</li>`).join('')}
    </ul>
  </div>
</div>
`).join('')}

<!-- PAGE 9: BLENDED VALUATION & WEIGHTING RATIONALE -->
<div class="page page-break">
  <h1>Blended Valuation & Weighting Rationale</h1>

  <h2>Final Valuation Range</h2>
  <div class="summary-box">
    <div class="metric">
      <span class="label">Conservative (Low):</span>
      <span class="value">$${result.blended.lowRange.toLocaleString()}</span>
    </div>
    <div class="metric">
      <span class="label">Base Case (Weighted Average):</span>
      <span class="value">$${result.blended.weightedAverage.toLocaleString()}</span>
    </div>
    <div class="metric">
      <span class="label">Optimistic (High):</span>
      <span class="value">$${result.blended.highRange.toLocaleString()}</span>
    </div>
  </div>

  <h2>Weighting Methodology</h2>
  <p>Stage: <strong>${profile.stage}</strong></p>
  <p>
    ${profile.stage === 'pre-revenue' || profile.stage === 'seed' ?
      'Early-stage: 40% qualitative (Scorecard, Berkus) + 60% quantitative (VC, DCF methods)' :
      'Growth-stage: 30% qualitative (Scorecard, Berkus) + 70% quantitative (VC, DCF methods)'}
  </p>

  <h2>Method Contribution Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Method</th>
        <th>Estimate</th>
        <th>Weight</th>
        <th>Contribution to Blended</th>
      </tr>
    </thead>
    <tbody>
      ${result.methods.map((method) => {
        const weight = result.blended.methodBreakdown[method.methodName]?.weight || 0;
        const contribution = Math.round(method.midEstimate * weight);
        return `
        <tr>
          <td>${method.methodName.toUpperCase()}</td>
          <td>$${method.midEstimate.toLocaleString()}</td>
          <td>${(weight * 100).toFixed(1)}%</td>
          <td>$${contribution.toLocaleString()}</td>
        </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <h2>Recommended Reference Point</h2>
  <p>
    <strong>$${result.blended.weightedAverage.toLocaleString()}</strong> (weighted average)
  </p>
  <p style="margin-top: 10px; font-size: 14px;">
    For investor negotiation, founders typically target 10–15% discount to this value.
  </p>
</div>

<!-- PAGE 10: SENSITIVITY & SCENARIO ANALYSIS -->
<div class="page page-break">
  <h1>Sensitivity & Scenario Analysis</h1>

  <h2>How Valuation Changes with Key Assumptions</h2>
  <p style="margin-bottom: 20px;">
    This analysis shows how the blended valuation shifts under different scenarios.
  </p>

  ${generateSensitivityChart(
    result.blended.weightedAverage,
    result.sensitivityAnalysis.map((s) => ({
      scenario: s.scenario,
      percentageChange: s.percentageChange,
    }))
  )}

  <div style="margin: 20px 0;">
    ${result.sensitivityAnalysis.map((sensitivity) => `
    <div class="sensitivity-row">
      <div class="sensitivity-scenario">
        <strong>${sensitivity.variable}:</strong> ${sensitivity.scenario}
      </div>
      <div class="sensitivity-impact">
        ${sensitivity.percentageChange >= 0 ? '+' : ''}${sensitivity.percentageChange}%
      </div>
    </div>
    `).join('')}
  </div>

  <h2>Scenario Modeling</h2>

  <h3>Bull Case (Upside Scenario)</h3>
  <p>
    Faster growth adoption + favorable exit multiples could support <strong>20–30% higher</strong> valuation.
    This assumes: strong product-market fit, rapid team scaling, favorable market conditions at exit.
  </p>

  <h3>Base Case (Most Likely)</h3>
  <p>
    <strong>$${result.blended.weightedAverage.toLocaleString()}</strong> assumes: realistic growth trajectory,
    typical exit multiples, normal market conditions, professional execution.
  </p>

  <h3>Bear Case (Downside Scenario)</h3>
  <p>
    Slower adoption or market contraction could result in <strong>20–25% lower</strong> valuation.
    This assumes: product adoption challenges, competitive pressures, macroeconomic headwinds.
  </p>

  <h2>Risk Factors</h2>
  <ul style="margin: 15px 0 15px 20px;">
    <li>Market adoption risk — Customer acquisition may differ from projections</li>
    <li>Competitive risk — Well-funded competitors could emerge</li>
    <li>Execution risk — Team ability to achieve milestones</li>
    <li>Macroeconomic risk — Recession or SaaS spending pullback</li>
  </ul>

  <h2>Upside Opportunities</h2>
  <ul style="margin: 15px 0 15px 20px;">
    <li>International expansion — 3–5x TAM increase</li>
    <li>Adjacent verticals — New revenue streams</li>
    <li>Strategic acquisition — Premium M&A multiples at strong traction</li>
  </ul>
</div>

<!-- PAGE 11: ASSUMPTIONS & SOURCES APPENDIX -->
<div class="page">
  <h1>Appendix: Assumptions & Sources</h1>

  <h2>Company Data</h2>
  <table>
    <tr><td><strong>Company Name</strong></td><td>${profile.companyName}</td></tr>
    <tr><td><strong>Stage</strong></td><td>${profile.stage}</td></tr>
    <tr><td><strong>Industry</strong></td><td>${profile.industry || 'N/A'}</td></tr>
    <tr><td><strong>Headquarters</strong></td><td>${profile.headquarters || 'N/A'}</td></tr>
    <tr><td><strong>Current ARR</strong></td><td>$${(profile.annualRecurringRevenue || 0).toLocaleString()}</td></tr>
    <tr><td><strong>Monthly Growth Rate</strong></td><td>${profile.monthlyGrowthRate || 'N/A'}%</td></tr>
    <tr><td><strong>TAM</strong></td><td>$${(profile.totalAddressableMarket || 0).toLocaleString()}</td></tr>
    <tr><td><strong>Team Size</strong></td><td>${profile.team?.length || 0} members</td></tr>
  </table>

  <h2>2026 Market Benchmarks (Damodaran, Livmo, VentureSource)</h2>
  <h3>ARR Multiples</h3>
  <ul style="margin: 10px 0 10px 20px;">
    <li>Traditional SaaS (private): 3–7x (median 4.5–5.7x)</li>
    <li>AI-Enhanced SaaS: 8–20x</li>
    <li>AI-Native: 10–50x (median 20–30x)</li>
  </ul>

  <h3>EBITDA Multiples</h3>
  <ul style="margin: 10px 0 10px 20px;">
    <li>Public SaaS: 9.8–10.6x</li>
    <li>Private high-growth: 20–30x</li>
    <li>AI premium: +20–50%</li>
  </ul>

  <h3>Damodaran Parameters (2026)</h3>
  <ul style="margin: 10px 0 10px 20px;">
    <li>Long-term growth (LTG): 2.0–2.5% (never exceed global GDP)</li>
    <li>WACC (Software/SaaS): 9–14% (default 11%)</li>
    <li>Risk-free rate: 4.0–4.5% (US 10-year Treasury)</li>
  </ul>

  <h2>Market Valuation Trends</h2>
  ${generateValuationTrendsChart()}

  <h2>Industry Benchmark Comparison</h2>
  ${generateMarketBenchmarksChart(profile.industry || 'saas')}

  <h2>Primary Sources</h2>
  <div class="sources">
    <ul>
      <li>Aswath Damodaran, Cost of Equity by Industry (January 2026)</li>
      <li>Livmo SaaS Benchmarks Index (2026)</li>
      <li>VentureSource Database (VC funding, exit multiples)</li>
      <li>S&P CapitalIQ (public comp multiples)</li>
      <li>Federal Reserve Economic Data (risk-free rate, inflation)</li>
      <li>Crunchbase (comparable company valuations)</li>
      <li>PitchBook (exit multiples and M&A trends)</li>
    </ul>
  </div>

  <h2>Report Information</h2>
  <div class="sources">
    <p><strong>Generated:</strong> ${result.generatedAt}</p>
    <p><strong>Engine:</strong> Equidam AI Professional Valuation Engine 2026</p>
    <p><strong>Data Completeness:</strong> ${result.dataCompleteness}%</p>
    <p><strong>Confidence Level:</strong> ${result.confidenceLevel.toUpperCase()}</p>
  </div>

  <div class="footer">
    <p>This report is confidential and intended for internal use or investor discussions only.</p>
    <p>${result.professionalCitation}</p>
  </div>
</div>

</body>
</html>
  `;

  return html;
}

/**
 * Generate PDF from HTML using Puppeteer
 * (Call this from API route or backend job)
 */
export async function generatePDFFromHTML(html: string): Promise<Buffer> {
  // Note: In production, use Puppeteer or similar
  // For now, return HTML as is - frontend can use html2pdf or server can use headless browser
  return Buffer.from(html, 'utf-8');
}
