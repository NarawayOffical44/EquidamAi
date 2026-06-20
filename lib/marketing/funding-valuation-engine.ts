import type { MarketingBlogGenerationRequest } from "@/lib/marketing/blog-generator";
import { generateMarketingBlogPosts } from "@/lib/marketing/blog-generator";
import { publishMarketingBlogPosts, type MarketingBlogPostInput } from "@/lib/marketing/blog-posts";
import { fetchNewsSignals } from "@/lib/marketing/blog-trends"; // reuses the news RSS logic

export type FundingRaise = {
  company: string;
  amountRaised?: string;
  valuation?: string;
  round?: string;
  date?: string;
  sourceUrl?: string;
  snippet?: string;
};

type FundingEngineOptions = {
  count?: number;
  specificRaises?: FundingRaise[];
  dryRun?: boolean;
  source?: string;
};

/**
 * Dedicated engine for auto-generating marketing blog posts about recent high-profile startup fundraises.
 * 
 * - Auto-discovers latest "high grossing" (high valuation) raises via targeted news search.
 * - Supports manually provided examples ("given some startup raised funds").
 * - Each post discusses the reported valuation from the raise.
 * - Positions Evaldam as the platform that lets founders achieve the same (or better) valuation clarity and preparedness independently.
 * 
 * Reuses the existing generate + publish pipeline (dedup, weekly caps, normalization, UTM CTAs, etc.).
 */
export async function runFundingValuationBlogEngine(options: FundingEngineOptions = {}) {
  const count = Math.min(Math.max(options.count || 1, 1), 2);
  const dryRun = !!options.dryRun;

  let raises: FundingRaise[] = [];

  if (options.specificRaises && options.specificRaises.length > 0) {
    raises = options.specificRaises.slice(0, count);
  } else {
    raises = await discoverRecentHighValuationRaises(count * 2); // discover more, take top
    raises = raises.slice(0, count);
  }

  if (raises.length === 0) {
    return { success: false, error: "No recent high-valuation funding signals found." };
  }

  const requests: MarketingBlogGenerationRequest[] = raises.map((raise) =>
    buildFundingValuationRequest(raise)
  );

  const posts = await generateMarketingBlogPosts({
    requests,
    count,
  });

  const publishResult = await publishMarketingBlogPosts({
    supabase: (await import("@/lib/supabase/admin")).createAdminClient(),
    posts: posts as MarketingBlogPostInput[],
    dryRun,
    source: options.source || "funding-valuation-engine",
  });

  return {
    success: publishResult.rejected === 0,
    generated: posts.length,
    raisesAnalyzed: raises,
    publish: publishResult,
  };
}

/**
 * Targeted discovery for recent startup raises with high valuations ("high grossing" topic).
 * Uses the shared news RSS fetcher with funding/valuation-focused queries.
 */
async function discoverRecentHighValuationRaises(max: number): Promise<FundingRaise[]> {
  const queries = [
    "startup raises valuation",
    "funding round $ valuation",
    "startup $ million valuation raise",
    "Series A $ valuation",
    "Series B valuation raise",
    "AI startup funding valuation",
    "SaaS startup raises $ billion",
    "startup raised at $ valuation 2026",
    "unicorn funding round valuation",
  ];

  const allSignals = await Promise.all(queries.map((q) => fetchNewsSignals(q)));
  const flat = allSignals.flat();

  const raises: FundingRaise[] = [];

  for (const signal of flat) {
    if (raises.length >= max) break;

    const text = `${signal.title} ${signal.snippet || ""}`.toLowerCase();
    if (!text.includes("valuation") && !text.includes("raised") && !text.includes("$")) continue;

    const raise = extractRaiseFromSignal(signal);
    if (raise && raise.valuation) {
      // basic dedup by company
      if (!raises.some((r) => r.company.toLowerCase() === raise.company.toLowerCase())) {
        raises.push(raise);
      }
    }
  }

  return raises;
}

function extractRaiseFromSignal(signal: { title: string; url: string; snippet?: string; publishedAt?: string }): FundingRaise | null {
  const title = signal.title;
  // Very simple extraction heuristics (good enough for research notes; LLM cleans up)
  const companyMatch = title.match(/^([A-Z][A-Za-z0-9&.\s]+?)(?:\s+(?:raises?|raised|secures?|closes?))/i);
  const company = companyMatch ? companyMatch[1].trim() : title.split(" ")[0];

  const amountMatch = title.match(/\$?\s*([\d.]+)\s*(million|m|billion|b)/i);
  const amountRaised = amountMatch ? `$${amountMatch[1]}${amountMatch[2][0].toUpperCase()}` : undefined;

  const valuationMatch = title.match(/at\s+\$?\s*([\d.]+)\s*(million|m|billion|b|valuation)/i) ||
                         title.match(/valuation\s+of\s+\$?\s*([\d.]+)\s*(m|b)/i);
  const valuation = valuationMatch ? `$${valuationMatch[1]}${valuationMatch[2] ? valuationMatch[2][0].toUpperCase() : ""}` : undefined;

  const roundMatch = title.match(/(Seed|Series [A-G]|Pre-Seed|Extension|Bridge)/i);
  const round = roundMatch ? roundMatch[1] : undefined;

  if (!valuation && !amountRaised) return null;

  return {
    company: company.replace(/[,.:]$/, ""),
    amountRaised,
    valuation,
    round,
    date: signal.publishedAt,
    sourceUrl: signal.url,
    snippet: signal.snippet,
  };
}

function buildFundingValuationRequest(raise: FundingRaise): MarketingBlogGenerationRequest {
  const company = raise.company;
  const val = raise.valuation || "significant";
  const amount = raise.amountRaised ? ` ${raise.amountRaised}` : "";
  const round = raise.round ? ` (${raise.round})` : "";

  const topic = `What ${company}'s recent${amount} raise at a ${val} valuation means for founders building their own numbers`;

  const researchNotes = [
    `Recent funding signal (treat as market context only, do not copy wording):`,
    `${company} raised${amount}${round} at a reported ${val} valuation.`,
    raise.snippet ? `Context from reports: ${raise.snippet}` : "",
    raise.sourceUrl ? `Source: ${raise.sourceUrl}` : "",
    "",
    "In the article:",
    "- Clearly explain the reported valuation from this raise (what the headline number likely means for pre/post, dilution, and investor ownership).",
    "- Discuss what signals (traction, revenue quality, market size, team, comparables) probably supported this pricing.",
    "- Then show how founders facing similar fundraising moments can achieve the same level of clarity - or better - by using an independent, multi-method platform.",
    "Emphasize that tools like Evaldam let founders run Scorecard, Berkus, VC Method, DCF, First Chicago and market comparables themselves, with transparent assumptions and country-aware data, producing a defensible range they can take into investor conversations.",
    "Keep the final article evergreen and founder-actionable. End with one concrete next step a founder can take this week (e.g. input their current stage/traction into a valuation tool).",
    "Never invent extra numbers or claim the exact same outcome as the news example.",
  ].filter(Boolean).join("\n");

  return {
    topic,
    category: "Fundraising Readiness",
    keywords: [
      "startup valuation",
      "funding round valuation",
      company.toLowerCase().replace(/\s+/g, "-"),
      "startup raise",
      "pre money valuation",
      "founder fundraising",
    ],
    researchNotes,
    sources: raise.sourceUrl ? [{ label: `${company} funding news`, url: raise.sourceUrl }] : undefined,
  };
}

// Convenience for direct script usage
export async function runWithSpecificRaises(raises: FundingRaise[], options: Omit<FundingEngineOptions, "specificRaises"> = {}) {
  return runFundingValuationBlogEngine({ ...options, specificRaises: raises });
}
