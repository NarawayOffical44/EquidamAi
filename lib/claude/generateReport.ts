import Anthropic from "@anthropic-ai/sdk";
import { StartupProfile, ValuationResult, ValuationReport } from "@/types";

const client = new Anthropic();

export async function generateFullReport(
  profile: StartupProfile,
  valuation: ValuationResult
): Promise<Omit<ValuationReport, "id" | "valuationId" | "startupId" | "userId">> {
  const systemPrompt = `You are a professional investment analyst and valuation expert.
Your task is to generate a comprehensive, credible startup valuation report suitable for forwarding to investors.
The report must be professional, cite all sources, include full methodology breakdown, and present both conservative and optimistic scenarios.
Use markdown format for all sections.`;

  const userPrompt = `Generate a professional valuation report for:

Company: ${profile.companyName}
Stage: ${profile.stage}
Industry: ${profile.industry || "technology"}
HQ: ${profile.headquarters || "N/A"}
ARR: $${profile.annualRecurringRevenue?.toLocaleString() || "Unknown"}
Team: ${profile.team?.length || 0} members
Accelerator: ${profile.accelerators?.map((a) => a.name).join(", ") || "None"}

Blended Valuation:
- Low: $${valuation.blended.lowRange.toLocaleString()}
- Mid (Weighted): $${valuation.blended.weightedAverage.toLocaleString()}
- High: $${valuation.blended.highRange.toLocaleString()}

Valuation Methods Used:
${valuation.methods
  .map(
    (m) => `
- ${m.methodName.toUpperCase()}: $${m.midEstimate.toLocaleString()} (Low: $${m.lowEstimate.toLocaleString()}, High: $${m.highEstimate.toLocaleString()})
  Sources: ${m.sources.join("; ")}
  Confidence: ${m.confidence}
`
  )
  .join("")}

KEY REQUIREMENTS:
1. Executive Summary (1-2 pages): Company overview, valuation range, key drivers
2. Company Overview (2-3 pages): Business model, market, traction, team
3. Valuation Methodology (3-4 pages): Explain each method used, why, and assumptions
4. Method-by-Method Breakdown (8-12 pages):
   - Scorecard Method details and calculation
   - Berkus Method details and calculation
   - VC Method details and calculation
   - DCF with LTG details and calculation
   - DCF with Multiples details and calculation
5. Sensitivity Analysis (2-3 pages): Impact of ±10% growth, ±1x multiple
6. Comparable Companies (1-2 pages): Benchmark against similar-stage SaaS/AI startups
7. Key Risks & Mitigants (1-2 pages)
8. Investment Highlights (1 page): 3-5 key reasons to invest
9. Appendix (2-3 pages):
   - Full assumptions used
   - All source citations
   - Data sources (Damodaran, Crunchbase, etc.)
   - Methodology references

TONE: Professional, credible, suitable for VC/investor sharing
LENGTH: 25-35 pages (detailed breakdown)
FORMAT: Markdown with proper section headers, tables, and formatting

Generate each section separately but ensure continuity and professional flow.`;

  const reportResponse = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 8000,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
    system: systemPrompt,
  });

  const reportText =
    reportResponse.content[0].type === "text" ? reportResponse.content[0].text : "";

  // Parse report into sections
  const executiveSummaryMatch = reportText.match(
    /## Executive Summary([\s\S]*?)(?=## |$)/i
  );
  const methodologyMatch = reportText.match(
    /## Valuation Methodology([\s\S]*?)(?=## |$)/i
  );

  const report: Omit<ValuationReport, "id" | "valuationId" | "startupId" | "userId"> = {
    executiveSummary: executiveSummaryMatch ? executiveSummaryMatch[1].trim() : reportText.slice(0, 1000),
    methodology: [
      {
        title: "Valuation Methodology Overview",
        content:
          methodologyMatch ?
          methodologyMatch[1].trim() :
          "Professional valuation using multiple methods",
      },
    ],
    methodBreakdown: valuation.methods.map((method) => ({
      title: `${method.methodName.toUpperCase()} Method`,
      content: method.reasoning,
    })),
    assumptions: {
      title: "Key Assumptions and Drivers",
      content: formatAssumptions(valuation),
    },
    appendix: {
      title: "Appendix: Sources and Citations",
      content: formatAppendix(valuation),
    },
    generatedAt: new Date().toISOString(),
    reportVersion: "1.0",
  };

  return report;
}

function formatAssumptions(valuation: ValuationResult): string {
  let markdown = "### Assumptions by Method\n\n";

  valuation.methods.forEach((method) => {
    markdown += `#### ${method.methodName}\n`;
    markdown += `- Confidence: ${method.confidence}\n`;
    Object.entries(method.assumptions).forEach(([key, value]) => {
      markdown += `- ${key}: ${typeof value === "number" ? `$${value.toLocaleString()}` : value}\n`;
    });
    markdown += "\n";
  });

  return markdown;
}

function formatAppendix(valuation: ValuationResult): string {
  let markdown = "### Data Sources\n\n";

  const allSources = new Set<string>();
  valuation.methods.forEach((method) => {
    method.sources.forEach((source) => allSources.add(source));
  });

  markdown += "#### Primary Sources\n";
  Array.from(allSources).forEach((source) => {
    markdown += `- ${source}\n`;
  });

  markdown += "\n#### Methodology References\n";
  markdown += "- Bill Payne Scorecard Method (Ohio TechAngels, 2024)\n";
  markdown += "- Dave Berkus Checklist Method (2024)\n";
  markdown += "- Venture Capital Method (Standard VC Practice)\n";
  markdown += "- Damodaran DCF Model (January 2026)\n";
  markdown += "- 2026 Private SaaS Benchmarks (Livmo, Finerva, VentureSource)\n";

  return markdown;
}

export async function generateOnePagerSummary(
  profile: StartupProfile,
  valuation: ValuationResult
): Promise<string> {
  const systemPrompt = `You are a professional design consultant creating a one-page executive summary for a startup valuation.
The document must be concise, visually organized, and suitable for attaching to a pitch deck.
Use markdown that can be converted to PDF.`;

  const userPrompt = `Create a one-page VC summary for:

Company: ${profile.companyName}
Tagline: ${profile.tagline || "AI-powered startup valuation"}

Valuation: $${valuation.blended.lowRange.toLocaleString()} - $${valuation.blended.highRange.toLocaleString()}
(Weighted Estimate: $${valuation.blended.weightedAverage.toLocaleString()})

Key Reasons:
${valuation.blended.keyReasons.map((r) => `- ${r}`).join("\n")}

REQUIREMENTS:
1. Company name and tagline (header)
2. Valuation range prominently displayed
3. 3-4 key reasons bullet points
4. "Market-Verified" badge (cite methods and sources)
5. Methodology statement: "Based on Scorecard, Berkus, VC Method, and DCF analysis"
6. Footer: Data sources and confidence level
7. Professional design suitable for investor review

Keep it to ONE PAGE. Clean, minimal design.
Return as markdown suitable for PDF conversion.`;

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
    system: systemPrompt,
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}
