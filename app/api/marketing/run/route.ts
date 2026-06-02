import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import { blogArticles } from "@/lib/blog/articles";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateMarketingBlogPosts, type MarketingBlogGenerationRequest } from "@/lib/marketing/blog-generator";
import { attachGeneratedBlogImages } from "@/lib/marketing/blog-images";
import { discoverTrendingMarketingBlogRequests } from "@/lib/marketing/blog-trends";
import { getPublishedMarketingBlogPosts, publishMarketingBlogPosts, type MarketingBlogPostInput } from "@/lib/marketing/blog-posts";

export const runtime = "nodejs";

type Payload = {
  source?: unknown;
  dryRun?: unknown;
  posts?: unknown;
  blogs?: unknown;
  count?: unknown;
  requests?: unknown;
  topics?: unknown;
  trendQueries?: unknown;
};

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isAuthorized(request: NextRequest) {
  const configuredSecret = process.env.MARKETING_JOB_SECRET;
  if (!configuredSecret) return false;

  const bearer = request.headers.get("authorization") || "";
  const headerSecret = request.headers.get("x-marketing-secret") || "";

  return bearer === `Bearer ${configuredSecret}` || headerSecret === configuredSecret;
}

function getPosts(payload: Payload): MarketingBlogPostInput[] {
  const value = payload.posts ?? payload.blogs;
  return Array.isArray(value) ? (value as MarketingBlogPostInput[]) : [];
}

function getGenerationRequests(payload: Payload): MarketingBlogGenerationRequest[] {
  const value = payload.requests ?? payload.topics;
  return Array.isArray(value) ? (value.slice(0, 2) as MarketingBlogGenerationRequest[]) : [];
}

function getTrendQueries(payload: Payload) {
  const value = payload.trendQueries;
  if (Array.isArray(value)) return value.map(readString).filter(Boolean);
  if (typeof value === "string") return value.split(/\n|,/).map(readString).filter(Boolean);
  return [];
}

async function getExistingBlogContext() {
  const automatedPosts = await getPublishedMarketingBlogPosts(500);
  const allPosts = [...blogArticles, ...automatedPosts];

  return {
    slugs: allPosts.map((post) => post.slug).filter(Boolean),
    titles: allPosts.map((post) => post.title).filter(Boolean),
  };
}

async function parsePayload(request: NextRequest): Promise<Payload> {
  const text = await request.text();
  if (!text.trim()) return {};
  return JSON.parse(text) as Payload;
}

export async function POST(request: NextRequest) {
  if (process.env.MARKETING_AUTOMATION_ENABLED === "false") {
    return NextResponse.json({ success: true, status: "disabled" });
  }

  if (!process.env.MARKETING_JOB_SECRET) {
    return NextResponse.json(
      { success: false, error: "Marketing job secret is not configured." },
      { status: 503 }
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { success: false, error: "Database credentials are not configured." },
      { status: 503 }
    );
  }

  let payload: Payload;
  try {
    payload = await parsePayload(request);
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  let posts = getPosts(payload);
  let generated = false;
  let trendResearched = false;
  let imageResult = {
    uploaded: 0,
    skipped: 0,
    warnings: [] as string[],
  };

  if (posts.length > 2) {
    return NextResponse.json({ success: false, error: "Send a maximum of two blog posts per run." }, { status: 400 });
  }

  try {
    if (posts.length === 0) {
      let generationRequests = getGenerationRequests(payload);
      const existingContext = await getExistingBlogContext();

      if (generationRequests.length === 0) {
        generationRequests = await discoverTrendingMarketingBlogRequests({
          count: Math.min(Math.max(Number(payload.count || 1), 1), 2),
          queries: getTrendQueries(payload),
          existingSlugs: existingContext.slugs,
          existingTitles: existingContext.titles,
        });
        trendResearched = true;
      }

      if (generationRequests.length === 0) {
        return NextResponse.json(
          { success: false, error: "No relevant current trend signals were found for blog generation. Retry later or send a topic." },
          { status: 503 }
        );
      }

      logger.info("[marketing-blog] Generating via AI", {
        requestedCount: Number(payload.count || 1),
        suppliedRequests: generationRequests.length,
        existingContextSize: existingContext.slugs.length,
        trendResearched,
      });
      posts = await generateMarketingBlogPosts({
        requests: generationRequests,
        count: Number(payload.count || 1),
        existingSlugs: existingContext.slugs,
        existingTitles: existingContext.titles,
      });
      generated = true;
      logger.info("[marketing-blog] Generation complete", {
        generatedCount: posts.length,
        titles: posts.map(p => (p as any).title || (p as any).topic).slice(0, 2),
      });
    }

    const imageAttachment = await attachGeneratedBlogImages(posts);
    posts = imageAttachment.posts;
    imageResult = imageAttachment.result;

    const result = await publishMarketingBlogPosts({
      supabase: createAdminClient(),
      posts,
      dryRun: payload.dryRun === true,
      source: readString(payload.source) || (generated ? "server-trends-ai" : "appscript"),
    });

    return NextResponse.json({
      success: result.rejected === 0,
      dryRun: payload.dryRun === true,
      generated,
      trendResearched,
      generatedCount: generated ? posts.length : 0,
      images: imageResult,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Marketing blog publish failed.",
      },
      { status: 500 }
    );
  }
}
