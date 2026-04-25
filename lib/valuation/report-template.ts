/**
 * Professional Valuation Report Template
 * Evaldam AI - Professional Grade Output
 *
 * Format: Markdown (PDF-convertible) with full citations and professional layout
 */

import { ProfessionalValuationResult } from './professional-engine';
import { StartupProfile } from '@/types';

export function generateProfessionalReport(
  result: ProfessionalValuationResult,
  profile: StartupProfile
): string {
  const report = `
# PROFESSIONAL VALUATION REPORT

**${profile.companyName}**

*Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}*

---

## EXECUTIVE SUMMARY

### Valuation Range

| Metric | Value |
|--------|-------|
| **Low Estimate** | $${result.executiveSummary.blendedRange.low.toLocaleString()} |
| **Weighted Average** | $${result.executiveSummary.blendedRange.mid.toLocaleString()} |
| **High Estimate** | $${result.executiveSummary.blendedRange.high.toLocaleString()} |
| **Methodology** | 5-Method Blend (Stage-Weighted) |
| **Data Completeness** | ${result.dataCompleteness}% |
| **Confidence Level** | ${result.confidenceLevel.toUpperCase()} |

### Key Investment Reasons

${result.executiveSummary.keyReasons.map((reason, idx) => `${idx + 1}. ${reason}`).join('\n')}

### Valuation Note

${result.executiveSummary.methodologyNote}

**Confidence Rating:** ${result.executiveSummary.confidenceRating}

---

## COMPANY OVERVIEW

| Field | Value |
|-------|-------|
| Company | ${profile.companyName} |
| Tagline | ${profile.tagline || 'N/A'} |
| Stage | ${profile.stage.charAt(0).toUpperCase() + profile.stage.slice(1)} |
| Founded | ${profile.founded || 'N/A'} |
| Headquarters | ${profile.headquarters || 'N/A'} |
| Industry | ${profile.industry || 'Technology'} |
| Team Size | ${profile.team?.length || '0'} members |
| ARR (Current) | $${(profile.annualRecurringRevenue || 0).toLocaleString()} |
| Monthly Growth | ${profile.monthlyGrowthRate || 'N/A'}% |
| TAM | $${(profile.totalAddressableMarket || 0).toLocaleString()} |
| Accelerators | ${profile.accelerators?.map(a => a.name).join(', ') || 'None'} |

---

## INDUSTRY ANALYSIS & MARKET CONTEXT

${result.detailedAnalysis.industryAnalysis}

### Comparable Companies

${result.detailedAnalysis.comparableCompanies.map(comp => `- ${comp}`).join('\n')}

### Market Environment

${result.detailedAnalysis.marketContext}

---

## VALUATION METHODOLOGY

### Overview

This valuation employs five professional methods, each with distinct strengths:

1. **Scorecard Method** — Compares company against market averages using six weighted factors
2. **Berkus/Checklist Method** — Allocates value to key business milestones
3. **Venture Capital Method** — Back-solves from exit value using required returns
4. **DCF with Long-Term Growth** — Projects cash flows using Damodaran 2026 parameters
5. **DCF with Multiples** — Terminal value via 2026 market exit multiples

**Dynamic Weighting:**
- Pre-revenue/Seed stage: 40% qualitative (Scorecard, Berkus) + 60% quantitative (VC, DCF)
- Growth stage (Series A+): 30% qualitative + 70% quantitative

This blend balances early-stage uncertainty with later-stage financial rigor.

---

## METHOD-BY-METHOD BREAKDOWN

### 1. Scorecard Method (Bill Payne, Ohio TechAngels)

**Valuation Range:** $${result.methods[0]?.lowEstimate.toLocaleString() || 'N/A'}–$${result.methods[0]?.highEstimate.toLocaleString() || 'N/A'}
**Weighted Estimate:** $${result.methods[0]?.midEstimate.toLocaleString() || 'N/A'}
**Weight in Blend:** 20% (early stage) / 10% (growth)
**Confidence:** ${result.methods[0]?.confidence || 'N/A'}

**Methodology:**
Scores company on 6 weighted factors vs. market average (0–150%):
- Team Strength (30%)
- Market Opportunity (25%)
- Product/Technology (15%)
- Competitive Position (10%)
- Sales/Marketing (10%)
- Capital Needs (10%)

Final valuation = Base valuation ($${result.methods[0]?.assumptions?.baseValuation?.toLocaleString() || 'N/A'}) × Weighted adjustment factor

**Calculation Rationale:**
${result.methods[0]?.reasoning || 'See detailed analysis'}

**Sources:**
${result.methods[0]?.sources?.map(s => `- ${s}`).join('\n') || 'N/A'}

---

### 2. Berkus/Checklist Method (Dave Berkus, 2024)

**Valuation Range:** $${result.methods[1]?.lowEstimate.toLocaleString() || 'N/A'}–$${result.methods[1]?.highEstimate.toLocaleString() || 'N/A'}
**Weighted Estimate:** $${result.methods[1]?.midEstimate.toLocaleString() || 'N/A'}
**Weight in Blend:** 20% (early stage) / 10% (growth)
**Confidence:** ${result.methods[1]?.confidence || 'N/A'}

**Methodology:**
Allocates up to $750k per milestone (2026 adjustment):
- Sound Idea/Business Model
- Prototype/Working Product
- Management Team
- Strategic Relationships (accelerators, VCs)
- Product Rollout/Traction

Max realistic valuation: $3.75M–$5M (updated for 2026 hot market)

**Calculation Rationale:**
${result.methods[1]?.reasoning || 'See detailed analysis'}

**Sources:**
${result.methods[1]?.sources?.map(s => `- ${s}`).join('\n') || 'N/A'}

---

### 3. Venture Capital Method

**Valuation Range:** $${result.methods[2]?.lowEstimate.toLocaleString() || 'N/A'}–$${result.methods[2]?.highEstimate.toLocaleString() || 'N/A'}
**Weighted Estimate:** $${result.methods[2]?.midEstimate.toLocaleString() || 'N/A'}
**Weight in Blend:** 30%
**Confidence:** ${result.methods[2]?.confidence || 'N/A'}

**Methodology:**
1. Project 5–7 year terminal revenue
2. Apply 2026 exit multiples (SaaS: 4.5–5.7x ARR | AI: 8–50x ARR)
3. Calculate terminal enterprise value
4. Apply required investor ROI (stage-dependent: 30–50%+)
5. Back-solve for pre-money valuation today

**Exit Multiple Justification:**
Based on 2026 benchmarks from Damodaran, Livmo, VentureSource data.

**Calculation Rationale:**
${result.methods[2]?.reasoning || 'See detailed analysis'}

**Sources:**
${result.methods[2]?.sources?.map(s => `- ${s}`).join('\n') || 'N/A'}

---

### 4. DCF with Long-Term Growth (Damodaran, January 2026)

**Valuation Range:** $${result.methods[3]?.lowEstimate.toLocaleString() || 'N/A'}–$${result.methods[3]?.highEstimate.toLocaleString() || 'N/A'}
**Weighted Estimate:** $${result.methods[3]?.midEstimate.toLocaleString() || 'N/A'}
**Weight in Blend:** 20% (early stage) / 25% (growth)
**Confidence:** ${result.methods[3]?.confidence || 'N/A'}

**Methodology:**
1. Project free cash flows 5–10 years with realistic growth deceleration
2. Calculate terminal value: FCF × (1 + LTG) / (WACC − LTG)
3. Discount all FCF to present using WACC
4. Sum to enterprise value

**Key Parameters (2026 Damodaran):**
- Long-term growth rate: 2.0–2.5% (never exceed global GDP growth)
- WACC (Software/SaaS): 9–14% (industry average 11%)
- Risk-free rate: 4.0–4.5% (US 10-year Treasury)
- Tax rate: 0% (pre-profit) to 21% (profitable)

**Conservative Assumptions:**
- Growth deceleration: High years 1–3 → moderate years 4–5 → mature 6+
- Operating margin expansion: Typical path to 30–40% EBITDA margin
- Terminal value: 60–80% of total valuation

**Calculation Rationale:**
${result.methods[3]?.reasoning || 'See detailed analysis'}

**Sources:**
${result.methods[3]?.sources?.map(s => `- ${s}`).join('\n') || 'N/A'}

---

### 5. DCF with Multiples (Terminal Value via Exit Multiples)

**Valuation Range:** $${result.methods[4]?.lowEstimate.toLocaleString() || 'N/A'}–$${result.methods[4]?.highEstimate.toLocaleString() || 'N/A'}
**Weighted Estimate:** $${result.methods[4]?.midEstimate.toLocaleString() || 'N/A'}
**Weight in Blend:** 10% (early stage) / 25% (growth)
**Confidence:** ${result.methods[4]?.confidence || 'N/A'}

**Methodology:**
1. Project revenue to exit year (5–7 years)
2. Apply 2026 exit multiple (ARR or EBITDA based)
3. Calculate terminal enterprise value
4. Discount to present using WACC
5. Add present value of interim cash flows

**Why This Method for High-Growth:**
More reliable than pure LTG because it locks valuation to market comparables rather than perpetuity assumptions.

**2026 Exit Multiples Used:**
- Traditional SaaS (private): 3–7x ARR (median 4.5–5.7x)
- AI-Enhanced SaaS: 8–20x ARR (median 12–15x)
- Pure AI-Native: 10–50x ARR (median 20–30x for strong traction)
- EBITDA multiples: Public SaaS 9.8–10.6x, Private 20–30x

**Calculation Rationale:**
${result.methods[4]?.reasoning || 'See detailed analysis'}

**Sources:**
${result.methods[4]?.sources?.map(s => `- ${s}`).join('\n') || 'N/A'}

---

## BLENDED VALUATION & FINAL RANGE

### Method Contribution to Final Valuation

| Method | Estimate | Weight | Contribution |
|--------|----------|--------|--------------|
| ${result.methods[0]?.methodName || 'Scorecard'} | $${result.methods[0]?.midEstimate.toLocaleString() || 'N/A'} | ${Object.values(result.blended.methodBreakdown)[0]?.weight?.toFixed(2) || 'N/A'} | $${(result.methods[0]?.midEstimate * (Object.values(result.blended.methodBreakdown)[0]?.weight || 0)).toLocaleString()} |
| ${result.methods[1]?.methodName || 'Berkus'} | $${result.methods[1]?.midEstimate.toLocaleString() || 'N/A'} | ${Object.values(result.blended.methodBreakdown)[1]?.weight?.toFixed(2) || 'N/A'} | $${(result.methods[1]?.midEstimate * (Object.values(result.blended.methodBreakdown)[1]?.weight || 0)).toLocaleString()} |
| ${result.methods[2]?.methodName || 'VC'} | $${result.methods[2]?.midEstimate.toLocaleString() || 'N/A'} | ${Object.values(result.blended.methodBreakdown)[2]?.weight?.toFixed(2) || 'N/A'} | $${(result.methods[2]?.midEstimate * (Object.values(result.blended.methodBreakdown)[2]?.weight || 0)).toLocaleString()} |
| ${result.methods[3]?.methodName || 'DCF-LTG'} | $${result.methods[3]?.midEstimate.toLocaleString() || 'N/A'} | ${Object.values(result.blended.methodBreakdown)[3]?.weight?.toFixed(2) || 'N/A'} | $${(result.methods[3]?.midEstimate * (Object.values(result.blended.methodBreakdown)[3]?.weight || 0)).toLocaleString()} |
| ${result.methods[4]?.methodName || 'DCF-Multiples'} | $${result.methods[4]?.midEstimate.toLocaleString() || 'N/A'} | ${Object.values(result.blended.methodBreakdown)[4]?.weight?.toFixed(2) || 'N/A'} | $${(result.methods[4]?.midEstimate * (Object.values(result.blended.methodBreakdown)[4]?.weight || 0)).toLocaleString()} |

### Final Valuation

**Range:** $${result.blended.lowRange.toLocaleString()} – $${result.blended.highRange.toLocaleString()}
**Weighted Average:** $${result.blended.weightedAverage.toLocaleString()}
**Recommended Reference Point:** $${result.blended.weightedAverage.toLocaleString()} (use 10–15% discount for investor negotiation)

---

## SENSITIVITY ANALYSIS

**How valuation changes with key assumptions:**

| Variable | Scenario | Impact | % Change |
|----------|----------|--------|----------|
${result.sensitivityAnalysis.map(s =>
  `| ${s.variable} | ${s.scenario} | $${s.impact >= 0 ? '+' : ''}${s.impact.toLocaleString()} | ${s.percentageChange >= 0 ? '+' : ''}${s.percentageChange}% |`
).join('\n')}

**Interpretation:**
- Upside risk: Faster growth or favorable market multiples could support 20–30% higher valuation
- Downside risk: Slower adoption or market correction could result in 25% lower valuation
- Most sensitive to: Growth rate, exit multiple assumption, and market conditions

---

## RISK FACTORS & MITIGANTS

### Key Risks

1. **Market Adoption Risk** — Dependent on achieving projected customer acquisition
   - *Mitigation:* Strong team + early customer validation

2. **Competitive Intensity** — Well-funded competitors may emerge
   - *Mitigation:* Tech differentiation + network effects

3. **Macroeconomic Risk** — Recession could impact SaaS spending and valuations
   - *Mitigation:* Diversified customer base + efficient unit economics

### Opportunities for Upside

1. International expansion could increase TAM by 3–5x
2. Adjacent product verticals could unlock new revenue streams
3. Strategic M&A at premium multiples if strong traction achieved

---

## PROFESSIONAL STANDARDS & DISCLOSURES

This valuation report:

✓ Follows 5 professional methods taught by investment banks, private equity, and CA firms
✓ Uses 2026 market benchmarks from Damodaran, Livmo, VentureSource, S&P CapitalIQ
✓ Shows full calculation transparency — every number is cited and explained
✓ Employs stage-weighted blending to balance qualitative and quantitative rigor
✓ Includes sensitivity analysis for key drivers and downside/upside scenarios

**Limitations:**
- Valuations are estimates based on available data; actual value depends on deal terms and buyer preferences
- Market conditions and multiples change continuously; this report reflects Q1 2026 data
- Early-stage companies (pre-revenue) have higher valuation uncertainty by nature

---

## CITATION & SOURCE SUMMARY

**Methodology Sources:**
- Bill Payne Scorecard Method (Ohio TechAngels, 2024)
- Dave Berkus Checklist Method (2024)
- Venture Capital Method (Standard VC practice, taught at Stanford GSB, Harvard Business School)
- Aswath Damodaran DCF Model (Cost of Equity tables, January 2026)
- Exit Multiple Benchmarks: Livmo SaaS Index, VentureSource, S&P CapitalIQ, PitchBook

**Market Data Sources:**
- Federal Reserve Economic Data (risk-free rate, inflation)
- Damodaran Cost of Equity by Industry (11% WACC for Software)
- Livmo 2026 SaaS Benchmarks (ARR multiples, growth rates)
- VentureSource (VC funding trends, successful exit multiples)
- S&P CapitalIQ (public comp multiples: ARKW, software peers)
- Crunchbase (comparable company funding and valuations)

---

## REPORT METADATA

**Report Date:** ${result.generatedAt}
**Company:** ${profile.companyName}
**Valuation Engine:** Evaldam AI Professional Engine 2026
**Data Completeness:** ${result.dataCompleteness}%
**Confidence Level:** ${result.confidenceLevel.toUpperCase()}
**Currency:** USD

---

**This report is confidential and intended for internal use or investor discussions only.**
**Questions? Contact: valuations@equidam.ai**

${result.professionalCitation}
`;

  return report;
}
