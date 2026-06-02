import { callLLM } from "@/lib/claude/providers";
import { stripEmoji } from "@/lib/blog/utils";
import type { MarketingBlogPostInput } from "@/lib/marketing/blog-posts";

export type MarketingBlogGenerationRequest = {
  topic?: unknown;
  title?: unknown;
  category?: unknown;
  keywords?: unknown;
  researchNotes?: unknown;
  sources?: unknown;
  citations?: unknown;
  imageUrl?: unknown;
  imageAlt?: unknown;
};

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

function readSourceList(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return readString(item);
        if (typeof item !== "object" || item === null) return "";

        const record = item as Record<string, unknown>;
        const label = readString(record.label) || readString(record.title) || readString(record.name) || "Source";
        const url = readString(record.url) || readString(record.href);
        return url ? `${label}: ${url}` : label;
      })
      .filter(Boolean);
  }

  return readStringList(value);
}

function readCitationList(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item !== "object" || item === null) return null;

      const record = item as Record<string, unknown>;
      const label = stripEmoji(readString(record.label) || readString(record.title) || readString(record.name));
      const url = readString(record.url) || readString(record.href);
      if (!label || !url || !/^https?:\/\//i.test(url)) return null;

      return { label, url };
    })
    .filter((item): item is { label: string; url: string } => Boolean(item))
    .slice(0, 6);
}

function extractJson(text: string): string {
  if (!text || !text.trim()) return "{}";

  const trimmed = text.trim();

  // If it already looks like pure JSON object, use it
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  // Prefer fenced code block
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    const candidate = fenced[1].trim();
    if (candidate.startsWith("{")) return candidate;
  }

  // Find the last plausible top-level JSON object (LLMs sometimes add commentary after)
  const matches = Array.from(trimmed.matchAll(/\{[\s\S]*\}/g));
  if (matches.length > 0) {
    return matches[matches.length - 1][0].trim();
  }

  // Fallback: first { to last }
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) {
    return trimmed.slice(first, last + 1);
  }

  return trimmed;
}

function cleanJsonForParse(jsonStr: string): string {
  let s = jsonStr.trim();

  // Remove trailing commas before } or ]
  s = s.replace(/,(\s*[}\]])/g, '$1');

  // Fix common unquoted keys (simple heuristic)
  s = s.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

  // Normalize smart quotes etc if present (rare)
  s = s.replace(/[\u201c\u201d]/g, '"').replace(/[\u2018\u2019]/g, "'");

  return s;
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

function normalizeGeneratedPost(
  value: unknown,
  request: unknown,
  index: number,
  precomputedFallback?: { topic?: string; category?: string }
): MarketingBlogPostInput {
  const record = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const fallbackSource = precomputedFallback || {};
  const fallback = fallbackSource as Record<string, unknown>;
  const fallbackTitle =
    readString(fallback.topic) ||
    readString(fallback.title) ||
    "Current startup valuation signals founders should understand";
  const fallbackCategory = readString(fallback.category) || "Startup Valuation";

  const req = request as Record<string, unknown>;
  const title = stripEmoji(readString(record.title) || readString(req.title) || fallbackTitle);
  const category = stripEmoji(readString(record.category) || readString(req.category) || fallbackCategory);
  const content = stripEmoji(readString(record.content));
  const description = stripEmoji(readString(record.description));
  const summary = stripEmoji(readString(record.summary));
  const keywords = (readStringList(record.keywords).length > 0 ? readStringList(record.keywords) : readStringList(req.keywords))
    .map(stripEmoji)
    .filter(Boolean);
  const citations = readCitationList(record.citations).length > 0
    ? readCitationList(record.citations)
    : readCitationList(req.citations ?? req.sources);

  // If the model produced a very weak title or content, fall back gracefully
  const safeTitle = title.length > 8 ? title : fallbackTitle;
  const safeContent = content.length > 200 ? content : readString((record as Record<string, unknown>).content) || "";

  return {
    externalId: `server-ai-${new Date().toISOString().slice(0, 10)}-${slugify(safeTitle)}`,
    title: safeTitle,
    slug: slugify(readString(record.slug) || safeTitle),
    description,
    summary,
    category,
    keywords,
    imageUrl: readString(record.imageUrl) || readString(req.imageUrl) || undefined,
    imageAlt: stripEmoji(readString(record.imageAlt) || readString(req.imageAlt) || safeTitle),
    content: safeContent,
    citations: citations.length > 0 ? citations : undefined,
  };
}

export async function generateMarketingBlogPosts(params: {
  requests?: MarketingBlogGenerationRequest[];
  count?: number;
  existingSlugs?: string[];
  existingTitles?: string[];
}): Promise<MarketingBlogPostInput[]> {
  if (process.env.MARKETING_BLOG_AI_ENABLED !== "true") {
    throw new Error("Marketing blog AI generation is disabled.");
  }

  const count = Math.min(Math.max(Number(params.count || params.requests?.length || 1), 1), 2);
  const requests = params.requests && params.requests.length > 0
    ? params.requests.slice(0, count)
    : [];

  if (requests.length === 0) {
    throw new Error("No current trend research was available for blog generation.");
  }

  const generatedPosts: MarketingBlogPostInput[] = [];

  // Collect a short list of titles to help the model avoid near-duplicates in substance
  const avoidTitles = (params.existingTitles || []).slice(0, 6);

  for (const [index, rawRequest] of requests.entries()) {
    const fallbackTopic = {};

    // Robustly read fields from either user-supplied request shape or internal topic objects
    const req = rawRequest as Record<string, unknown>;
    const topic =
      readString(req.topic) ||
      readString(req.title) ||
      "Current startup valuation signals founders should understand";
    const category = readString(req.category) || "Startup Valuation";
    const keywords = readStringList(req.keywords);
    const researchNotes = readString(req.researchNotes);
    const sources = readSourceList(req.sources ?? req.citations);

    const system = [
      "You are Evaldam AI's startup valuation content editor.",
      "Your audience is serious founders preparing for investor conversations. They want precise, actionable, non-hype guidance on valuation mechanics, evidence, negotiation, and investor psychology.",
      "Tone: editorial, calm authority, practical. Short clear sentences. Concrete examples using founder situations (pre-revenue, seed with pilot revenue, SaaS with ARR, etc.). No filler, no motivational language, no 'leverage the power of', no generic SaaS platitudes.",
      "Structure for fast value: strong prose hook (2-3 paragraphs), then ## headings that deliver 'what investors actually test', 'how to prepare evidence', 'common founder mistakes', and 'a clear next step founders can take this week'.",
      "Headings must be specific and scannable (e.g. 'How investors pressure-test your revenue quality' not 'Revenue considerations'). Use 4-7 ## sections total.",
      "The first content under the opening must be prose paragraphs; never start the body with a heading.",
      "Keep every article useful after the news cycle. You may reference current signals from supplied research notes as context, but the final article must be an evergreen founder guide, not a news recap.",
      "Never invent statistics, named investors, quotes, or external case studies. Use only the supplied research notes + general domain reasoning.",
      "Use only the supplied source list for current context. Do not invent citations.",
      "Naturally work the SEO keywords into title, summary, description, and 3-5 times across the body without sounding forced.",
      "Output MUST be exactly one valid JSON object and nothing else. No markdown code fences, no explanatory text before or after the JSON.",
      "Do not use emoji, decorative symbols, ALL CAPS emphasis, or social media punctuation.",
    ].join(" ");

    const promptLines = [
      "You must return ONLY a single JSON object. No other text.",
      "",
      `Topic: ${topic}`,
      `Category: ${category}`,
    ];

    if (keywords.length > 0) {
      promptLines.push(`SEO keywords to weave in naturally: ${keywords.join(", ")}`);
    }
    if (researchNotes) {
      promptLines.push(`Research notes (treat as authoritative guidance for this piece):\n${researchNotes}`);
    }
    if (sources.length > 0) {
      promptLines.push(`Additional context you may reference:\n${sources.join("\n")}`);
    }
    if (avoidTitles.length > 0) {
      promptLines.push(`Titles/angles already covered recently (create a meaningfully different angle):\n${avoidTitles.map(t => `- ${t}`).join("\n")}`);
    }

    promptLines.push(
      "",
      "Return exactly this JSON shape (all fields required except imageAlt which is optional):",
      "{",
      '  "title": "Clear, specific, benefit-oriented title under 70 characters",',
      '  "slug": "kebab-case-url-slug",',
      '  "description": "140-200 character meta description that creates curiosity and promises practical value",',
      '  "summary": "40-450 character answer-first paragraph that gives the main takeaway in plain language",',
      '  "category": "string (use the provided category or a close match)",',
      '  "keywords": ["2-5 relevant keywords"],',
      '  "content": "950-1250 words. Start with 2-3 paragraphs of prose hook. Then use ## markdown headings (4-7 of them) for the body. Short paragraphs. End with a practical founder action. No concluding zinger paragraph.",',
      '  "citations": [{"label": "source title", "url": "https://source-url"}],',
      '  "imageAlt": "concise descriptive alt text for a hero image"',
      "}",
      "",
      "CTA guidance: Use label like 'Get your company-specific valuation range' or 'Check your valuation before fundraising'. The href should be '/free-valuation' (the publish step will append UTM tracking parameters for blog-driven traffic).",
      "",
      "The content field must contain real substance: specific investor questions, evidence types founders should gather, how assumptions affect ranges, and exact language or frameworks founders can use in conversations.",
    );

    const prompt = promptLines.join("\n");

    const response = await callLLM(
      [{ role: "user", content: prompt }],
      {
        system,
        useCase: "report",
        maxTokens: 3400,
        temperature: 0.42,
        jsonMode: true,
      }
    );

    let parsed: unknown;
    try {
      const jsonStr = cleanJsonForParse(extractJson(response));
      parsed = JSON.parse(jsonStr);
    } catch {
      // Graceful fallback; the publish step will likely reject it if quality is too low.
      parsed = {
        title: topic,
        category,
        keywords,
        content: response,
      };
    }

    generatedPosts.push(normalizeGeneratedPost(parsed, rawRequest, index, fallbackTopic));
  }

  return generatedPosts;
}
