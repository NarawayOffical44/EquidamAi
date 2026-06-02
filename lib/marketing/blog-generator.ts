import { callLLM } from "@/lib/claude/providers";
import type { MarketingBlogPostInput } from "@/lib/marketing/blog-posts";

export type MarketingBlogGenerationRequest = {
  topic?: unknown;
  title?: unknown;
  category?: unknown;
  keywords?: unknown;
  researchNotes?: unknown;
  sources?: unknown;
  imageUrl?: unknown;
  imageAlt?: unknown;
};

const DEFAULT_TOPICS: MarketingBlogGenerationRequest[] = [
  {
    topic: "How early-stage founders should explain valuation before the first investor call",
    category: "Fundraising Readiness",
  },
  {
    topic: "What Indian seed founders should prepare before discussing pre-money valuation",
    category: "Startup Valuation India",
  },
  {
    topic: "How comparables can support a startup valuation without overclaiming market proof",
    category: "Comparable Companies",
  },
  {
    topic: "What investors usually question in a founder valuation report",
    category: "Investor Readiness",
  },
];

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readStringList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(readString).filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(/,|\n/).map(readString).filter(Boolean);
  }

  return [];
}

function pickDefaultTopic(index: number) {
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return DEFAULT_TOPICS[(weekNumber + index) % DEFAULT_TOPICS.length];
}

function extractJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return trimmed;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);

  return trimmed;
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

function normalizeGeneratedPost(value: unknown, request: MarketingBlogGenerationRequest, index: number): MarketingBlogPostInput {
  const record = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const fallbackTopic = pickDefaultTopic(index);
  const fallbackTitle = readString(fallbackTopic.topic) || "Startup valuation readiness for founders";
  const fallbackCategory = readString(fallbackTopic.category) || "Startup Valuation";
  const title = readString(record.title) || readString(request.title) || fallbackTitle;
  const category = readString(record.category) || readString(request.category) || fallbackCategory;
  const content = readString(record.content);
  const description = readString(record.description);
  const summary = readString(record.summary);
  const keywords = readStringList(record.keywords).length > 0 ? readStringList(record.keywords) : readStringList(request.keywords);

  return {
    externalId: `server-ai-${new Date().toISOString().slice(0, 10)}-${slugify(title)}`,
    title,
    slug: slugify(readString(record.slug) || title),
    description,
    summary,
    category,
    keywords,
    imageUrl: readString(record.imageUrl) || readString(request.imageUrl) || undefined,
    imageAlt: readString(record.imageAlt) || readString(request.imageAlt) || title,
    content,
  };
}

export async function generateMarketingBlogPosts(params: {
  requests?: MarketingBlogGenerationRequest[];
  count?: number;
}): Promise<MarketingBlogPostInput[]> {
  if (process.env.MARKETING_BLOG_AI_ENABLED !== "true") {
    throw new Error("Marketing blog AI generation is disabled.");
  }

  const count = Math.min(Math.max(Number(params.count || params.requests?.length || 1), 1), 2);
  const requests = params.requests && params.requests.length > 0
    ? params.requests.slice(0, count)
    : Array.from({ length: count }, (_, index) => pickDefaultTopic(index));

  const generatedPosts: MarketingBlogPostInput[] = [];

  for (const [index, request] of requests.entries()) {
    const fallbackTopic = pickDefaultTopic(index);
    const topic = readString(request.topic) || readString(request.title) || readString(fallbackTopic.topic);
    const category = readString(request.category) || readString(fallbackTopic.category) || "Startup Valuation";
    const keywords = readStringList(request.keywords);
    const researchNotes = readString(request.researchNotes);
    const sources = readStringList(request.sources);

    const system = [
      "You are Evaldam AI's startup valuation content editor.",
      "Write practical, founder-facing blog content for serious startup valuation and fundraising readers.",
      "Return only valid JSON. Do not include markdown fences.",
      "Do not invent named statistics, investor quotes, or external citations.",
      "Use clear headings in the content with ## markdown headings.",
    ].join(" ");

    const prompt = [
      `Topic: ${topic}`,
      `Category: ${category}`,
      keywords.length > 0 ? `SEO keywords: ${keywords.join(", ")}` : "",
      researchNotes ? `Research notes:\n${researchNotes}` : "",
      sources.length > 0 ? `Allowed sources/context:\n${sources.join("\n")}` : "",
      "",
      "Create one blog post as JSON with this exact shape:",
      "{",
      '  "title": "string",',
      '  "slug": "url-safe-string",',
      '  "description": "40-220 character meta description",',
      '  "summary": "40-500 character short answer",',
      '  "category": "string",',
      '  "keywords": ["keyword 1", "keyword 2", "keyword 3"],',
      '  "content": "900-1300 words with ## section headings, short paragraphs, no hype",',
      '  "imageAlt": "descriptive image alt text"',
      "}",
    ].filter(Boolean).join("\n");

    const response = await callLLM(
      [{ role: "user", content: prompt }],
      {
        system,
        useCase: "report",
        maxTokens: 3200,
        temperature: 0.45,
      }
    );

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJson(response));
    } catch {
      parsed = {
        title: topic,
        category,
        keywords,
        content: response,
      };
    }

    generatedPosts.push(normalizeGeneratedPost(parsed, request, index));
  }

  return generatedPosts;
}
