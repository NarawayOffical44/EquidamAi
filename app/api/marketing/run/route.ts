import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { publishMarketingBlogPosts, type MarketingBlogPostInput } from "@/lib/marketing/blog-posts";

export const runtime = "nodejs";

type Payload = {
  source?: unknown;
  dryRun?: unknown;
  posts?: unknown;
  blogs?: unknown;
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
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  const posts = getPosts(payload);
  if (posts.length === 0) {
    return NextResponse.json(
      { success: false, error: "Send one or two blog posts in posts or blogs." },
      { status: 400 }
    );
  }

  if (posts.length > 2) {
    return NextResponse.json({ success: false, error: "Send a maximum of two blog posts per run." }, { status: 400 });
  }

  try {
    const result = await publishMarketingBlogPosts({
      supabase: createAdminClient(),
      posts,
      dryRun: payload.dryRun === true,
      source: readString(payload.source) || "appscript",
    });

    return NextResponse.json({
      success: result.rejected === 0,
      dryRun: payload.dryRun === true,
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
