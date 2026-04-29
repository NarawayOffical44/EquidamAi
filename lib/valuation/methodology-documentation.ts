/**
 * Methodology Documentation & Verification
 *
 * This module ensures all valuations are transparent, verifiable, and based on
 * industry-standard methodologies. Any result can be independently verified.
 */

export const methodologyDetails = {
  scorecard: {
    name: "Bill Payne Scorecard Method",
    author: "Bill Payne (Ohio TechAngels)",
    type: "Qualitative Adjustment",
    description:
      "Adjusts base valuation (from comparable companies) using 6 weighted factors.",
    formula:
      "Final Valuation = Base Valuation × (Sum of weighted factor scores)",
    factors: {
      teamStrength: {
        weight: 0.3,
        description: "Founder experience, startup track record, domain expertise",
        range: "0-150% (100% = market average)",
      },
      marketSize: {
        weight: 0.25,
        description: "TAM, market growth, addressable opportunity",
        range: "0-150%",
      },
      product: {
        weight: 0.15,
        description: "Technology differentiation, IP/patents, PMF",
        range: "0-150%",
      },
      competition: {
        weight: 0.1,
        description: "Competitive landscape, barriers to entry",
        range: "0-150%",
      },
      salesMarketing: {
        weight: 0.1,
        description: "Go-to-market strategy, channel effectiveness",
        range: "0-150%",
      },
      capital: {
        weight: 0.1,
        description: "Runway, capital efficiency, path to profitability",
        range: "0-150%",
      },
    },
    sources: [
      "https://www.patreon.com/billpayne",
      "Ohio TechAngels Valuation Methodology",
    ],
    credibility: "High - Widely used by angel investors",
    typicalRange: "±20% from base valuation",
  },

  berkus: {
    name: "Berkus Method",
    author: "Dave Berkus",
    type: "Checklist-Based",
    description:
      "Evaluates startups based on achievement of key success milestones.",
    formula: "Final Valuation = Base Amount × Number of factors achieved (max 5)",
    factors: {
      soundBusinessIdea: {
        value: "$500K - $2M",
        description: "Credible business plan with clear market need",
      },
      prototypeDone: {
        value: "$500K - $2M",
        description: "Working prototype or MVP demonstration",
      },
      qualityManagement: {
        value: "$500K - $1M",
        description: "Experienced team with relevant expertise",
      },
      strategicRelationships: {
        value: "$250K - $1M",
        description: "Key partnerships or customer commitments",
      },
      productRevenues: {
        value: "$1M - $5M",
        description: "Active paying customers or revenue traction",
      },
    },
    sources: ["Dave Berkus Investment Method", "Angel investing guides"],
    credibility: "High - Industry standard for seed-stage",
    typicalRange: "±30% depending on factors achieved",
  },

  vcMethod: {
    name: "Venture Capital Method",
    author: "Sand Hill Econometrics",
    type: "Quantitative Exit-based",
    description:
      "Works backward from expected exit value to determine today's valuation.",
    formula:
      "Post-Money Today = Terminal Value / ((1 + Required ROI)^holding period)",
    parameters: {
      terminalValue: {
        description: "Projected revenue at exit × Exit multiple",
        formula: "5-7 year revenue projection × SaaS multiple (3x-20x)",
      },
      requiredROI: {
        description: "Return investors expect for risk level",
        values: {
          preRevenue: "50%",
          seed: "40-50%",
          seriesA: "30-40%",
        },
      },
      exitMultiples2026: {
        tradtionalSaaS: "3x-7x revenue (median: 4.5-5.7x)",
        aiEnhancedSaaS: "8x-20x revenue",
        pureAI: "10x-50x revenue (median: 20-30x)",
      },
    },
    sources: ["Sand Hill Econometrics", "VC benchmarks 2026"],
    credibility: "Very High - Standard VC practice",
    typicalRange: "±25% based on multiple assumptions",
  },

  dcfLTG: {
    name: "DCF with Long-Term Growth",
    author: "Aswath Damodaran (NYU Stern)",
    type: "Quantitative Cash Flow",
    description:
      "Projects future cash flows, discounts to present using WACC and terminal value.",
    formula:
      "Enterprise Value = Sum(PV of FCF Year 1-5) + PV(Terminal Value)",
    terminalValue:
      "Final Year FCF × (1 + Long-term growth) / (WACC - Long-term growth)",
    parameters2026: {
      longTermGrowth: "2.0-2.5% (capped at global GDP growth)",
      wacc: {
        saas: "9-14% (typical: 11%)",
        riskFreeRate: "4.0-4.5%",
      },
      taxRate: "0% (pre-profit) to 21% (profitable)",
      projectionPeriod: "5-10 years with realistic growth deceleration",
    },
    sources: [
      "Damodaran DCF Model January 2026",
      "NYU Stern Valuation Course",
    ],
    credibility: "Very High - Academic & professional standard",
    typicalRange: "±30% based on FCF assumptions",
  },

  dcfMultiples: {
    name: "DCF with Exit Multiples",
    author: "Standard Finance Practice",
    type: "Quantitative Exit-based",
    description:
      "DCF approach using industry exit multiples for terminal value instead of perpetuity.",
    formula: "Enterprise Value = Sum(PV of FCF) + PV(Terminal Value by multiple)",
    terminalValue: "Exit Multiple × Projected Exit Year Revenue",
    exitMultiples: {
      saas: "3x-7x revenue",
      aiSoftware: "5x-25x revenue",
      deeptech: "2x-8x revenue",
    },
    sources: ["Goldman Sachs SaaS benchmarks", "PitchBook data"],
    credibility: "High - Real market multiples",
    typicalRange: "±30% based on multiple and growth assumptions",
  },
};

/**
 * Verification checklist for each valuation
 */
export const verificationChecklist = {
  dataAccuracy: [
    "Company name and website verified",
    "Stage classification confirmed",
    "Industry category validated",
    "ARR/Revenue figures checked or estimated from available data",
    "Team size verified from LinkedIn/website",
    "Growth rate estimated from traction signals",
  ],
  methodologyAccuracy: [
    "Each method uses published formula",
    "Parameters aligned with 2026 market data",
    "Assumptions documented and transparent",
    "Calculation logic verifiable",
  ],
  reasonableness: [
    "Result matches peer stage/industry multiples",
    "Growth assumptions are conservative",
    "Exit multiples based on real market data",
    "Range ±20-30% reflects uncertainty",
  ],
  independentVerification: [
    "Compare with real comparable companies",
    "Check against industry benchmarks",
    "Validate with professional valuators",
    "Cross-check with acquisition/exit prices",
  ],
};

/**
 * Sources for independent verification
 */
export const trustedDataSources = {
  comparables: [
    "PitchBook (real deal data)",
    "Crunchbase (company metrics)",
    "SaaS Capital (SaaS benchmarks)",
    "Carta (cap table data)",
  ],
  benchmarks: [
    "Sand Hill Econometrics (VC metrics)",
    "SaaS Magic Number benchmarks",
    "Bessemer Venture Partners SaaS benchmarks",
    "Goldman Sachs SaaS research",
  ],
  methodologyReferences: [
    "Bill Payne - Scorecard Method",
    "Dave Berkus - Berkus Method",
    "Aswath Damodaran - DCF methodology",
    "Sand Hill Econometrics - VC Method",
  ],
};

/**
 * How to verify a specific valuation
 */
export function generateVerificationGuide(methodNames: string[]): string {
  const methods = methodNames
    .map((name) => {
      const method = Object.entries(methodologyDetails).find(
        ([_, details]) => details.name === name
      );
      return method
        ? `
**${method[1].name}**
- Author: ${method[1].author}
- Credibility: ${method[1].credibility}
- Typical Range: ${method[1].typicalRange}
- Sources: ${method[1].sources.join(", ")}
`
        : null;
    })
    .filter(Boolean)
    .join("\n");

  return `
## Valuation Verification Guide

### Methods Used
${methods}

### How to Verify
1. **Check Company Data**: Verify ARR, growth rate, team size against company sources
2. **Compare Multiples**: Use PitchBook/Crunchbase to find similar stage/industry companies
3. **Validate Assumptions**: Review the assumptions document for each method
4. **Cross-Reference**: Compare result with professional valuators or recent funding rounds
5. **Test Reasonableness**: Ensure valuation aligns with realistic growth scenarios

### Independent Verification Resources
- PitchBook: https://pitchbook.com (comparable deals)
- Crunchbase: https://crunchbase.com (company data)
- SaaS Capital: Benchmarks for SaaS companies
- Carta: Cap table and valuation data

### Questions to Ask
- Does the valuation align with recent funding rounds in the space?
- Are growth assumptions conservative and realistic?
- Do comparable companies validate the valuation range?
- Would a professional valuator agree with the assumptions?
`;
}
