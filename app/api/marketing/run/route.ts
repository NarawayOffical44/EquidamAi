import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateMarketingBlogPosts, type MarketingBlogGenerationRequest } from "@/lib/marketing/blog-generator";
import { publishMarketingBlogPosts, type MarketingBlogPostInput } from "@/lib/marketing/blog-posts";

export const runtime = "nodejs";

type Payload = {
  source?: unknown;
  dryRun?: unknown;
  posts?: unknown;
  blogs?: unknown;
  count?: unknown;
  requests?: unknown;
  topics?: unknown;
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

  if (posts.length > 2) {
    return NextResponse.json({ success: false, error: "Send a maximum of two blog posts per run." }, { status: 400 });
  }

  try {
    if (posts.length === 0) {
      posts = await generateMarketingBlogPosts({
        requests: getGenerationRequests(payload),
        count: Number(payload.count || 1),
      });
      generated = true;
    }

    const result = await publishMarketingBlogPosts({
      supabase: createAdminClient(),
      posts,
      dryRun: payload.dryRun === true,
      source: readString(payload.source) || (generated ? "server-ai" : "appscript"),
    });

    return NextResponse.json({
      success: result.rejected === 0,
      dryRun: payload.dryRun === true,
      generated,
      generatedCount: generated ? posts.length : 0,
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
