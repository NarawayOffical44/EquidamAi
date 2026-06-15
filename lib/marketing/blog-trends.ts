import type { MarketingBlogGenerationRequest } from "@/lib/marketing/blog-generator";

type TrendSource = {
  title: string;
  url: string;
  source?: string;
  publishedAt?: string;
  snippet?: string;
  query: string;
};

type TrendOptions = {
  count: number;
  queries?: string[];
  existingSlugs?: string[];
  existingTitles?: string[];
};

const DEFAULT_SEARCH_QUERIES = [
  "startup valuation calculator",
  "startup valuation",
  "startup funding",
  "startup ai India",
  "startup india funding",
  "startup registration India",
  "startup funding for small business",
  "funding for small business startup",
  "business startup funding",
  "startup funding news",
  "us startup funding news",
  "startup valuation founder fundraising",
  "pre money valuation seed funding startup",
  "startup funding India valuation founders",
  "AI startup funding valuation",
  "SaaS startup funding revenue valuation",
  "startup investors due diligence valuation",
  // Expanded per 2026 Content+SEO strategy (India early-stage + founder readiness focus)
  "seed funding India valuation",
  "angel round valuation India",
  "pre seed valuation founder",
  "startup valuation India 2026",
  "founder dilution seed round India",
  "revenue quality signals startup",
  "investor readiness checklist founder",
  "AI SaaS valuation benchmarks",
  "India startup valuation benchmarks",
  "local comparables vs global valuation",
];

const DOMAIN_KEYWORDS = [
  "startup",
  "founder",
  "valuation",
  "calculator",
  "funding",
  "fundraising",
  "small business",
  "seed",
  "venture",
  "investor",
  "saas",
  "fintech",
  "ai",
  "india",
  "revenue",
  "dilution",
  "cap table",
  "term sheet",
  "safe",
];

const CATEGORY_RULES: { category: string; keywords: string[]; focus: string }[] = [
  { category: "AI Startup Valuation", focus: "AI startup funding", keywords: ["ai", "artificial intelligence", "generative ai"] },
  { category: "SaaS Valuation", focus: "SaaS funding and revenue quality", keywords: ["saas", "arr", "subscription"] },
  { category: "Fintech Valuation", focus: "fintech funding", keywords: ["fintech", "payments", "lending", "banking"] },
  { category: "Startup Valuation India", focus: "India startup funding", keywords: ["india", "indian", "bengaluru", "mumbai", "delhi"] },
  { category: "Fundraising Terms", focus: "fundraising terms", keywords: ["term sheet", "safe", "convertible", "dilution", "cap table"] },
  { category: "Investor Readiness", focus: "investor due diligence", keywords: ["investor", "due diligence", "vc", "venture"] },
  { category: "Revenue Quality", focus: "startup revenue quality", keywords: ["revenue", "arr", "growth", "churn", "retention"] },
  { category: "Fundraising Readiness", focus: "startup fundraising", keywords: ["funding", "fundraising", "seed", "series a", "raised"] },
];

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 90);
}

function normalizeTitle(value: string) {
  return slugify(value).replace(/-/g, " ");
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function parseRssItems(xml: string, query: string): TrendSource[] {
  return Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/gi))
    .map((match): TrendSource | null => {
      const block = match[1];
      const title = cleanTitle(readTag(block, "title"));
      const url = readTag(block, "link");
      const source = readTag(block, "source");
      const publishedAt = readTag(block, "pubDate");
      const snippet = readTag(block, "description");

      if (!title || !url) return null;
      return {
        title,
        url,
        source: source || undefined,
        publishedAt: publishedAt || undefined,
        snippet: snippet || undefined,
        query,
      };
    })
    .filter((item): item is TrendSource => item !== null);
}

function cleanTitle(value: string) {
  return value
    .replace(/\s+-\s+[^-]{2,80}$/g, "")
    .replace(/\s+\|\s+[^|]{2,80}$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchText(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "EvaldamAI-MarketingResearch/1.0",
        Accept: "application/rss+xml, application/xml, text/xml, text/plain",
      },
    });

    if (!response.ok) return "";
    return response.text();
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchNewsSignals(query: string) {
  const searchUrl = new URL("https://news.google.com/rss/search");
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("hl", "en-IN");
  searchUrl.searchParams.set("gl", "IN");
  searchUrl.searchParams.set("ceid", "IN:en");

  const xml = await fetchText(searchUrl.toString());
  return xml ? parseRssItems(xml, query) : [];
}

async function fetchGeneralTrendSignals() {
  const feeds = [
    { url: "https://trends.google.com/trending/rss?geo=IN", query: "google trends India" },
    { url: "https://trends.google.com/trending/rss?geo=US", query: "google trends US" },
  ];

  const results = await Promise.all(
    feeds.map(async (feed) => {
      const xml = await fetchText(feed.url);
      return xml ? parseRssItems(xml, feed.query) : [];
    })
  );

  return results.flat().filter((item) => relevanceScore(item) >= 3);
}

function recencyScore(value?: string) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return 0;

  const ageDays = (Date.now() - timestamp) / (24 * 60 * 60 * 1000);
  if (ageDays <= 3) return 5;
  if (ageDays <= 10) return 4;
  if (ageDays <= 21) return 3;
  if (ageDays <= 45) return 1;
  return -2;
}

function relevanceScore(item: TrendSource) {
  const text = `${item.title} ${item.snippet || ""} ${item.query}`.toLowerCase();
  const keywordHits = DOMAIN_KEYWORDS.reduce((score, keyword) => score + (text.includes(keyword) ? 1 : 0), 0);
  return keywordHits + recencyScore(item.publishedAt);
}

function classifyTrend(item: TrendSource) {
  const text = `${item.title} ${item.snippet || ""} ${item.query}`.toLowerCase();
  return CATEGORY_RULES.find((rule) => rule.keywords.some((keyword) => text.includes(keyword))) || {
    category: "Fundraising Readiness",
    focus: "startup valuation and fundraising",
    keywords: ["startup valuation", "fundraising readiness", "investor readiness"],
  };
}

function dedupeSignals(items: TrendSource[]) {
  const seen = new Set<string>();
  const deduped: TrendSource[] = [];

  for (const item of items) {
    const key = slugify(item.title) || item.url;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  return deduped;
}

function buildRequest(item: TrendSource, related: TrendSource[]): MarketingBlogGenerationRequest {
  const classification = classifyTrend(item);
  const topic = `What current ${classification.focus} signals mean for startup valuation conversations`;
  const sourceLines = related.slice(0, 5).map((source) => {
    const date = source.publishedAt ? new Date(source.publishedAt).toISOString().slice(0, 10) : "recent";
    return `- ${source.title}${source.source ? ` (${source.source}` : ""}${source.source ? `, ${date})` : ` (${date})`}: ${source.url}`;
  });

  return {
    topic,
    category: classification.category,
    keywords: Array.from(new Set([...classification.keywords, "startup valuation", "founder fundraising"])).slice(0, 6),
    researchNotes: [
      `Current search/news signals found on ${new Date().toISOString().slice(0, 10)}.`,
      "Use these signals as market context for an evergreen founder guide. Do not write a news report, do not copy source wording, and do not invent numbers.",
      "Explain what the pattern means for founders preparing valuation, fundraising, investor readiness, assumptions, comparables, or revenue quality.",
      ...sourceLines,
    ].join("\n"),
    sources: related.slice(0, 5).map((source) => ({ label: source.title, url: source.url })),
  };
}

function isExistingTopic(request: MarketingBlogGenerationRequest, existingSlugs: Set<string>, existingTitles: Set<string>) {
  const topic = readString(request.topic);
  return existingSlugs.has(slugify(topic)) || existingTitles.has(normalizeTitle(topic));
}

function parseQueryList(value: unknown) {
  if (Array.isArray(value)) return value.map(readString).filter(Boolean);
  if (typeof value === "string") return value.split(/\n|,/).map(readString).filter(Boolean);
  return [];
}

export { fetchNewsSignals, fetchText, parseRssItems, fetchGeneralTrendSignals, classifyTrend, buildRequest as buildTrendRequest };

export async function discoverTrendingMarketingBlogRequests(options: TrendOptions): Promise<MarketingBlogGenerationRequest[]> {
  if (process.env.MARKETING_TREND_RESEARCH_ENABLED === "false") return [];

  const maxQueries = Math.min(Math.max(Number(process.env.MARKETING_TREND_QUERY_LIMIT || 4), 1), 8);
  const queries = (options.queries && options.queries.length > 0 ? options.queries : parseQueryList(process.env.MARKETING_TREND_QUERIES))
    .concat(DEFAULT_SEARCH_QUERIES)
    .filter(Boolean)
    .slice(0, maxQueries);

  const [newsResults, trendResults] = await Promise.all([
    Promise.all(queries.map(fetchNewsSignals)),
    fetchGeneralTrendSignals(),
  ]);

  const signals = dedupeSignals([...newsResults.flat(), ...trendResults])
    .map((item) => ({ item, score: relevanceScore(item) }))
    .filter(({ score }) => score >= 4)
    .sort((first, second) => second.score - first.score)
    .map(({ item }) => item);

  const existingSlugs = new Set((options.existingSlugs || []).map(slugify).filter(Boolean));
  const existingTitles = new Set((options.existingTitles || []).map(normalizeTitle).filter(Boolean));
  const requests: MarketingBlogGenerationRequest[] = [];
  const usedTopics = new Set<string>();

  for (const signal of signals) {
    const classification = classifyTrend(signal);
    const related = signals.filter((candidate) => classifyTrend(candidate).category === classification.category).slice(0, 5);
    const request = buildRequest(signal, related.length > 0 ? related : [signal]);
    const topicKey = slugify(readString(request.topic));

    if (!topicKey || usedTopics.has(topicKey) || isExistingTopic(request, existingSlugs, existingTitles)) continue;
    usedTopics.add(topicKey);
    requests.push(request);

    if (requests.length >= options.count) break;
  }

  return requests;
}
