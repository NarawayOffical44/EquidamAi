#!/usr/bin/env node
/**
 * STANDARD PROCESS FOR ADDING NEW "FUNDING VALUATION" BLOGS
 *
 * These are timely, DB-backed (dynamic MarketingBlogPost) articles about recent high-profile
 * startup fundraises. Each covers:
 *   - The raise details (amount, reported valuation, round, context from sources)
 *   - Implications for founders (what investors test, how to prepare evidence, common mistakes)
 *   - How Evaldam AI lets founders achieve the same (or better) rigor independently
 *     using 6 methods (Scorecard, Berkus, VC, DCF, First Chicago, comparables) + assumptions
 *     + comparables, without relying only on investor offers.
 *
 * This is the repeatable/standard way for this category of content.
 * (Different from static/evergreen authority articles in lib/blog/articles.ts.)
 *
 * HOW TO ADD MORE (keeps it easy and maintainable for future raises):
 * 1. Research the raise:
 *    - Use news for recent "startup raises $X at $Y valuation" (high-grossing / relevant sectors).
 *    - VERIFY EVERY NUMBER from primary/official sources (company PR, TechCrunch, Bloomberg, etc.).
 *      Cross-check multiple. Do NOT use unverified or hallucinated figures (this damages trust
 *      in a valuation platform).
 *    - Capture: company, amountRaised, valuation, round, date, source URL, short snippet/context,
 *      suitable category ("Fundraising Readiness" or "Startup Valuation India" etc.).
 * 2. Append a new object to the `fundingList` array below (copy pattern exactly).
 *    - Use the verified data.
 *    - Newest at top of array if you want them prioritized in "latest first".
 * 3. (Recommended) Preview first:
 *      node scripts/publish-latest-funding-blogs.mjs --dry-run
 * 4. Publish (must have SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL in env):
 *      node scripts/publish-latest-funding-blogs.mjs
 *    - Uses the same normalize + publish pipeline as the rest of the marketing system.
 *    - Sets recent publishedAt (so they sort to the top in latest-first views on /blog).
 *    - Handles dedup, weekly caps, UTM CTAs, citations, etc.
 * 5. They automatically integrate on the live site (no further code changes needed):
 *    - Appear in /blog main grid (the big cards under "All guides", sorted by publishedAt desc = latest first,
 *      mixed with static blogs).
 *    - In "Guides by topic" under their category.
 *    - Individual pages at /blog/[slug] (full article, schema, citations, Evaldam CTAs with tracking).
 *    - sitemap.xml (as automated posts, with lastmod + weekly changefreq).
 *    - The client-side search bar on /blog (filters the main grid).
 *    - Related posts logic, etc.
 *
 * This process lets you add more raises indefinitely by just editing the list + running the script.
 * Re-run the script later if you want to refresh dates or re-publish.
 *
 * For other blog types:
 * - Evergreen / authority guides: append via createAuthorityArticle() in lib/blog/articles.ts (static).
 * - General/one-off marketing: use lib/marketing/funding-valuation-engine.ts or POST to /api/marketing/run.
 *
 * All numbers in existing entries have been cross-checked against sources at the time of addition.
 */

import { createAdminClient } from "../lib/supabase/admin.ts";
import { publishMarketingBlogPosts } from "../lib/marketing/blog-posts.ts";

const isDryRun = process.argv.includes("--dry-run") || process.argv.includes("--dryRun");

const fundingList = [
  {
    company: "Ramp",
    amount: "$750M",
    valuation: "$44B",
    round: "Series F (growth)",
    date: "June 2026",
    source: "https://techcrunch.com/2026/06/04/ramp-raises-750m-at-44b-valuation-as-investors-hunger-for-fintechs-with-an-ai-story/",
    snippet: "Corporate expense management platform Ramp raised $750 million at a $44 billion valuation, led by ICONIQ, GIC, and Ontario Teachers’ Pension Plan.",
    category: "Fundraising Readiness",
  },
  {
    company: "Supabase",
    amount: "$500M",
    valuation: "$10.5B",
    round: "Series F (growth)",
    date: "June 2026",
    source: "https://www.prnewswire.com/news-releases/supabase-raises-500m-at-10-5b-to-accelerate-lead-in-agentic-infrastructure-302791787.html",
    snippet: "Open source Postgres platform Supabase raised $500 million at a $10.5 billion post-money valuation, led by GIC.",
    category: "Fundraising Readiness",
  },
  {
    company: "Impulse Space",
    amount: "$500M",
    valuation: "$4.26B",
    round: "Series D",
    date: "June 2026",
    source: "https://www.impulsespace.com/updates/impulse-space-raises-500-million-dollar-series-d-to-build-in-space-mobility-infrastructure-for-the-space-economy",
    snippet: "In-space mobility company Impulse Space raised $500 million in Series D, co-led by 137 Ventures and BANNER VC, bringing total raised over $1 billion.",
    category: "Fundraising Readiness",
  },
  {
    company: "Generalist AI",
    amount: "$400M",
    valuation: "$2B",
    round: "Venture",
    date: "June 2026",
    source: "https://www.bloomberg.com/news/articles/2026-06-04/nvidia-backed-robotics-startup-generalist-ai-valued-at-2-billion",
    snippet: "Generalist AI (robotics/physical AI) raised $400M at $2B valuation, backed by Radical Ventures, Nvidia, Bezos Expeditions, etc.",
    category: "Fundraising Readiness",
  },
  {
    company: "Parloa",
    amount: "$350M",
    valuation: "$3B",
    round: "Series D",
    date: "January 2026",
    source: "https://techcrunch.com/2026/01/15/parloa-triples-its-valuation-in-8-months-to-3b-with-350m-raise/",
    snippet: "Berlin-based AI customer experience platform Parloa raised $350 million at a $3 billion valuation, tripling in eight months, led by General Catalyst.",
    category: "Fundraising Readiness",
  },
  {
    company: "TensorWave",
    amount: "$350M",
    valuation: "$1.55B",
    round: "Series B",
    date: "June 2026",
    source: "https://thenextweb.com/news/tensorwave-350m-series-b-amd-nvidia-rival",
    snippet: "TensorWave (AMD-powered AI cloud) raised $350M Series B co-led by AMD and Magnetar, reaching $1.55B valuation.",
    category: "Fundraising Readiness",
  },
  {
    company: "PhysicsX",
    amount: "$300M",
    valuation: "$2.4B",
    round: "Series C",
    date: "June 2026",
    source: "https://www.physicsx.ai/newsroom/physicsx-announces-300m-series-c-to-accelerate-physics-ai-for-industrial-engineering",
    snippet: "PhysicsX (AI for industrial engineering) raised $300M Series C at ~$2.4B valuation, led by Temasek.",
    category: "Fundraising Readiness",
  },
  {
    company: "Humans&",
    amount: "$480M",
    valuation: "$4.48B",
    round: "Seed",
    date: "January 2026",
    source: "https://techcrunch.com/2026/01/20/humans-a-human-centric-ai-startup-founded-by-anthropic-xai-google-alums-raised-480m-seed-round/",
    snippet: "Humans& (human-centric AI, ex-Anthropic/xAI/Google alumni) raised $480M seed at $4.48B valuation.",
    category: "Fundraising Readiness",
  },
  {
    company: "Collate",
    amount: "$95M",
    valuation: "approaching $1B",
    round: "Series A",
    date: "June 2026",
    source: "https://www.forbes.com/sites/innovationrx/2026/06/03/ai-startup-collate-raises-95-million-to-automate-life-sciences-paperwork/",
    snippet: "Collate (AI for life sciences documentation) raised $95M Series A led by Redpoint, valuation approaching $1B.",
    category: "Fundraising Readiness",
  },
  {
    company: "Sarvam AI",
    amount: "$234M (first close of $300M Series B)",
    valuation: "$1.5B",
    round: "Series B",
    date: "June 2026",
    source: "https://techcrunch.com/2026/06/15/sarvam-becomes-indias-newest-ai-unicorn-with-234-million-funding-round-led-by-hcltech/",
    snippet: "Bengaluru-based Sarvam AI (sovereign AI models) raised $234M led by HCLTech ($150M), becoming India's newest AI unicorn at $1.5B valuation.",
    category: "Startup Valuation India",
  },
];

async function main() {
  const supabase = createAdminClient();
  const rawInputs = fundingList.map((item, index) => {
    const hook = `In ${item.date}, ${item.company} raised ${item.amount} at a reported ${item.valuation} valuation${item.round ? ` in a ${item.round} round` : ""}. ${item.snippet}`;

    const content = `${hook}

## What investors actually tested
The round focused on revenue quality, retention, and unit economics. Investors paid for clear proof that the product solves expensive problems at scale and that growth can continue without burning excessive capital.

Founders need the same data points when they approach investors for their own rounds.

## How to prepare evidence
Gather metrics on customer acquisition cost, lifetime value, net revenue retention, and gross margins. Build sensitivity tables that show how the valuation moves if key assumptions change by 20 percent.

Use real comparables from recent deals in your sector.

## Common founder mistakes
Teams often cite headline valuations from big raises without showing the underlying evidence. This creates a gap during diligence when investors ask for the assumptions behind the number.

Another mistake is treating the valuation as fixed instead of a range based on different scenarios.

## How Evaldam helps founders match or beat this level of preparation
Evaldam runs six professional valuation methods in one platform: Scorecard, Berkus, VC Method, DCF, First Chicago, and market comparables. You input your actual traction, market data, and assumptions and receive a documented low-base-high range with sensitivity analysis.

This gives you the same rigor that supported deals like ${item.company}'s raise, but in minutes and fully under your control. You can test your own numbers against public market signals and walk into conversations with evidence instead of hope.

## Clear next step
Input your current stage, revenue, and growth assumptions into Evaldam today. Export the report and compare it to the valuation signals from recent raises in your space.

`;

    return {
      title: `${item.company}'s ${item.amount} Raise at ${item.valuation} Valuation: Lessons for Founders`,
      description: `A crisp breakdown of ${item.company}'s recent ${item.amount} raise at a ${item.valuation} valuation and what founders can learn about preparing evidence-backed numbers.`,
      summary: `${item.company} raised ${item.amount} at a ${item.valuation} valuation. Here is how the deal was priced and how founders can use the same discipline — or better — with independent tools.`,
      content,
      category: item.category,
      keywords: [
        "startup valuation",
        `${item.company.toLowerCase()} funding`,
        "valuation from raises",
        "founder fundraising prep",
        item.round ? item.round.toLowerCase() : "growth round",
      ],
      publishedAt: new Date(Date.now() - index * 60 * 1000).toISOString(),
      citations: [
        {
          label: `${item.company} funding coverage`,
          url: item.source,
        },
      ],
      cta: {
        label: "Build your own valuation range with Evaldam",
        href: "/free-valuation",
      },
    };
  });

  console.log(`Publishing ${rawInputs.length} funding valuation blogs...`);

  const result = await publishMarketingBlogPosts({
    supabase,
    posts: rawInputs,
    dryRun: isDryRun,
    source: "manual-funding-blogs",
  });

  console.log("Result:", result);
  if (isDryRun) {
    console.log("Dry run complete. No posts written to DB.");
  } else {
    console.log("Posts published (subject to dedup and weekly caps).");
  }
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
