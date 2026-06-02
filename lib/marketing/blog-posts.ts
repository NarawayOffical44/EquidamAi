import type { SupabaseClient } from "@supabase/supabase-js";
import type { BlogArticle } from "@/lib/blog/articles";
import { createAdminClient } from "@/lib/supabase/admin";

type BlogSection = BlogArticle["sections"][number];
type BlogCta = BlogArticle["cta"];

export type MarketingBlogPost = BlogArticle & {
  imageUrl?: string;
  imageAlt?: string;
  source?: string;
  externalId?: string;
  citations?: { label: string; url: string }[];
  status?: "draft" | "published" | "archived";
  wordCount?: number;
};

export type MarketingBlogPostInput = Record<string, unknown>;

const SITE_URL = "https://equidamai.com";
const MAX_POSTS_PER_WEEK = 2;
const MIN_PUBLISHED_WORDS = 600;

function hasSupabaseAdminEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readStringList(value: unknown) {
  const rawValues = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\n{2,}|\n-|,/)
      : [];

  return Array.from(
    new Set(
      rawValues
        .map((item) => readString(item).replace(/^[-*]\s+/, "").trim())
        .filter(Boolean)
    )
  );
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

function parseDate(value: unknown) {
  const raw = readString(value);
  if (!raw) return new Date();

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function estimateReadTime(wordCount: number) {
  return `${Math.max(3, Math.ceil(wordCount / 190))} min read`;
}

function wordCountFor(parts: unknown[]) {
  return parts
    .flatMap((part) => {
      if (Array.isArray(part)) return part;
      if (typeof part === "object" && part !== null) return Object.values(part);
      return [part];
    })
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function normalizeSections(value: unknown): BlogSection[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((section) => {
      if (typeof section !== "object" || section === null) return null;
      const record = section as Record<string, unknown>;
      const heading = readString(record.heading) || readString(record.title);
      const paragraphs = readStringList(record.paragraphs ?? record.content ?? record.body);
      const bullets = readStringList(record.bullets ?? record.points);

      if (!heading || paragraphs.length === 0) return null;

      return {
        heading,
        paragraphs,
        ...(bullets.length > 0 ? { bullets } : {}),
      };
    })
    .filter((section): section is BlogSection => Boolean(section));
}

function sectionsFromText(value: string): BlogSection[] {
  const content = value.trim();
  if (!content) return [];

  const lines = content.split(/\r?\n/).map((line) => line.trim());
  const sections: BlogSection[] = [];
  let current: BlogSection = { heading: "What founders should know", paragraphs: [] };

  for (const line of lines) {
    if (!line) continue;

    const heading = line.match(/^#{1,3}\s+(.+)$/);
    if (heading) {
      if (current.paragraphs.length > 0) sections.push(current);
      current = { heading: heading[1].trim(), paragraphs: [] };
      continue;
    }

    current.paragraphs.push(line);
  }

  if (current.paragraphs.length > 0) sections.push(current);
  if (sections.length >= 2) return sections;

  const paragraphs = content.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const midpoint = Math.max(1, Math.ceil(paragraphs.length / 2));

  return [
    {
      heading: "What founders should know",
      paragraphs: paragraphs.slice(0, midpoint),
    },
    {
      heading: "What investors will check",
      paragraphs: paragraphs.slice(midpoint).length > 0 ? paragraphs.slice(midpoint) : paragraphs.slice(0, midpoint),
    },
  ];
}

function excerptFromText(value: string, maxLength: number) {
  const cleaned = value.replace(/^#{1,3}\s+/gm, "").replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 1).trim()}…`;
}

function keywordsFromTitle(title: string, category: string) {
  const words = `${title} ${category}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 4 && !["founders", "startup"].includes(word));

  return Array.from(new Set(["startup valuation", ...words.slice(0, 4)])).slice(0, 5);
}

function normalizeCta(value: unknown): BlogCta {
  const record = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const label = readString(record.label) || "Try free valuation";
  const href = readString(record.href) || "/free-valuation";

  if (href.startsWith("/") || href.startsWith("https://") || href.startsWith("http://")) {
    return { label, href };
  }

  return { label, href: "/free-valuation" };
}

function normalizeCitations(value: unknown): { label: string; url: string }[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((citation) => {
      if (typeof citation !== "object" || citation === null) return null;
      const record = citation as Record<string, unknown>;
      const url = readString(record.url);
      if (!url) return null;

      try {
        const parsed = new URL(url);
        return {
          label: readString(record.label) || readString(record.title) || parsed.hostname,
          url: parsed.toString(),
        };
      } catch {
        return null;
      }
    })
    .filter((citation): citation is { label: string; url: string } => Boolean(citation));
}

function normalizeImageUrl(value: unknown) {
  const url = readString(value);
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}

function normalizeStatus(value: unknown): MarketingBlogPost["status"] {
  const status = readString(value).toLowerCase();
  if (status === "draft" || status === "archived") return status;
  return "published";
}

function normalizeMarketingBlogPostInput(input: MarketingBlogPostInput, fallbackSource = "appscript") {
  const title = readString(input.title);
  const content = readString(input.content ?? input.text ?? input.body);
  const summary =
    readString(input.summary) ||
    readString(input.shortAnswer) ||
    readString(input.introduction) ||
    excerptFromText(content, 300);
  const description =
    readString(input.description) ||
    readString(input.metaDescription) ||
    readString(input.excerpt) ||
    excerptFromText(content, 180) ||
    summary;
  const sections = normalizeSections(input.sections ?? input.articleSections);
  const normalizedSections = sections.length > 0 ? sections : sectionsFromText(content);
  const publishedAt = parseDate(input.publishedAt ?? input.published_at).toISOString();
  const wordCount = wordCountFor([
    title,
    description,
    summary,
    normalizedSections.flatMap((section) => [section.heading, section.paragraphs, section.bullets || []]),
  ]);
  const category = readString(input.category) || "Startup Valuation";
  const keywords = readStringList(input.keywords ?? input.tags);

  const post: MarketingBlogPost = {
    slug: slugify(readString(input.slug) || title),
    title,
    description,
    summary,
    category,
    publishedAt,
    updatedAt: parseDate(input.updatedAt ?? input.updated_at ?? publishedAt).toISOString(),
    readTime: readString(input.readTime ?? input.read_time) || estimateReadTime(wordCount),
    keywords: keywords.length >= 2 ? keywords : keywordsFromTitle(title, category),
    sections: normalizedSections,
    cta: normalizeCta(input.cta),
    imageUrl: normalizeImageUrl(input.imageUrl ?? input.image_url ?? input.image),
    imageAlt: readString(input.imageAlt ?? input.image_alt) || title,
    source: readString(input.source) || fallbackSource,
    externalId: readString(input.externalId ?? input.external_id) || undefined,
    citations: normalizeCitations(input.citations ?? input.sources),
    status: normalizeStatus(input.status),
    wordCount,
  };

  const errors: string[] = [];
  if (post.title.length < 12 || post.title.length > 140) errors.push("Title must be 12-140 characters.");
  if (post.description.length < 40 || post.description.length > 220) errors.push("Description must be 40-220 characters.");
  if (post.summary.length < 40 || post.summary.length > 500) errors.push("Summary must be 40-500 characters.");
  if (!post.slug || post.slug.length < 8) errors.push("Slug must be descriptive and URL-safe.");
  if (post.sections.length < 2) errors.push("At least two structured sections are required.");
  if (post.keywords.length < 2) errors.push("At least two SEO keywords or tags are required.");
  if (post.status === "published" && wordCount < MIN_PUBLISHED_WORDS) {
    errors.push(`Published blog posts must be at least ${MIN_PUBLISHED_WORDS} words.`);
  }

  return { post, errors };
}

function rowToPost(row: Record<string, unknown>): MarketingBlogPost {
  return {
    slug: readString(row.slug),
    title: readString(row.title),
    description: readString(row.description),
    summary: readString(row.summary),
    category: readString(row.category) || "Startup Valuation",
    publishedAt: readString(row.published_at),
    updatedAt: readString(row.updated_at) || readString(row.published_at),
    readTime: readString(row.read_time) || "5 min read",
    keywords: Array.isArray(row.keywords) ? row.keywords.map(readString).filter(Boolean) : [],
    sections: normalizeSections(row.sections),
    cta: normalizeCta(row.cta),
    imageUrl: normalizeImageUrl(row.image_url),
    imageAlt: readString(row.image_alt) || readString(row.title),
    source: readString(row.source) || "appscript",
    externalId: readString(row.external_id) || undefined,
    citations: normalizeCitations(row.citations),
    status: normalizeStatus(row.status),
    wordCount: typeof row.word_count === "number" ? row.word_count : undefined,
  };
}

function postToRow(post: MarketingBlogPost) {
  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    summary: post.summary,
    category: post.category,
    status: post.status || "published",
    keywords: post.keywords,
    sections: post.sections,
    citations: post.citations || [],
    cta: post.cta,
    image_url: post.imageUrl || null,
    image_alt: post.imageAlt || null,
    source: post.source || "appscript",
    external_id: post.externalId || null,
    word_count: post.wordCount || 0,
    read_time: post.readTime,
    published_at: post.publishedAt,
    updated_at: post.updatedAt,
  };
}

function startOfCurrentUtcWeek() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayOffset = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - dayOffset);
  return start;
}

async function getPublishedCountThisWeek(supabase: SupabaseClient) {
  const { count, error } = await supabase
    .from("marketing_blog_posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .gte("published_at", startOfCurrentUtcWeek().toISOString());

  if (error) throw error;
  return count || 0;
}

async function hasExistingPost(supabase: SupabaseClient, post: MarketingBlogPost) {
  const { data: slugMatch, error: slugError } = await supabase
    .from("marketing_blog_posts")
    .select("id")
    .eq("slug", post.slug)
    .maybeSingle();

  if (slugError) throw slugError;
  if (slugMatch) return true;

  if (!post.externalId) return false;

  const { data: externalMatch, error: externalError } = await supabase
    .from("marketing_blog_posts")
    .select("id")
    .eq("source", post.source || "appscript")
    .eq("external_id", post.externalId)
    .maybeSingle();

  if (externalError) throw externalError;
  return Boolean(externalMatch);
}

export async function getPublishedMarketingBlogPosts(limit = 24): Promise<MarketingBlogPost[]> {
  if (!hasSupabaseAdminEnv()) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("marketing_blog_posts")
    .select("*")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[marketing-blog-posts] Could not load posts", error.message);
    return [];
  }

  return (data || []).map((row) => rowToPost(row as Record<string, unknown>));
}

export async function getPublishedMarketingBlogPostBySlug(slug: string): Promise<MarketingBlogPost | null> {
  if (!hasSupabaseAdminEnv()) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("marketing_blog_posts")
    .select("*")
    .eq("slug", slugify(slug))
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    console.warn("[marketing-blog-posts] Could not load post", error.message);
    return null;
  }

  return data ? rowToPost(data as Record<string, unknown>) : null;
}

export async function publishMarketingBlogPosts(params: {
  supabase: SupabaseClient;
  posts: MarketingBlogPostInput[];
  dryRun?: boolean;
  source?: string;
}) {
  const items: {
    index: number;
    title?: string;
    slug?: string;
    status: "accepted" | "rejected" | "skipped";
    url?: string;
    errors?: string[];
    reason?: string;
  }[] = [];
  let publishedThisWeek = await getPublishedCountThisWeek(params.supabase);

  for (const [index, input] of params.posts.entries()) {
    const { post, errors } = normalizeMarketingBlogPostInput(input, params.source || "appscript");

    if (errors.length > 0) {
      items.push({ index, title: post.title, slug: post.slug, status: "rejected", errors });
      continue;
    }

    if (post.status === "published" && publishedThisWeek >= MAX_POSTS_PER_WEEK) {
      items.push({ index, title: post.title, slug: post.slug, status: "skipped", reason: "Weekly blog cap reached." });
      continue;
    }

    if (await hasExistingPost(params.supabase, post)) {
      items.push({ index, title: post.title, slug: post.slug, status: "skipped", reason: "Blog post already exists." });
      continue;
    }

    if (!params.dryRun) {
      const { error } = await params.supabase.from("marketing_blog_posts").insert(postToRow(post));
      if (error) {
        items.push({
          index,
          title: post.title,
          slug: post.slug,
          status: error.code === "23505" ? "skipped" : "rejected",
          reason: error.code === "23505" ? "Blog post already exists." : error.message,
        });
        continue;
      }
    }

    if (post.status === "published") publishedThisWeek += 1;
    items.push({ index, title: post.title, slug: post.slug, status: "accepted", url: `${SITE_URL}/blog/${post.slug}` });
  }

  return {
    accepted: items.filter((item) => item.status === "accepted").length,
    rejected: items.filter((item) => item.status === "rejected").length,
    skipped: items.filter((item) => item.status === "skipped").length,
    items,
  };
}
