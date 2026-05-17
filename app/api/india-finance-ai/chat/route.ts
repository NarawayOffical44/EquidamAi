import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { indiaFinanceAiQueue } from "@/lib/india-finance-ai/server-queue";
import { askIndiaFinanceAi } from "@/lib/india-finance-ai/runpod-client";
import { getIndiaFinanceAiAccess, recordIndiaFinanceAiUse } from "@/lib/india-finance-ai/usage-limits";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ChatSchema = z.object({
  message: z.string().trim().min(3).max(4000),
  sessionToken: z.string().trim().max(200).optional().default(""),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().trim().min(1).max(4000),
      })
    )
    .max(8)
    .optional(),
});

const limiterEnabled = process.env.INDIA_FINANCE_AI_LIMITER_ENABLED === "true";

export async function POST(request: NextRequest) {
  const startedAt = Date.now();

  try {
    const payload = ChatSchema.parse(await request.json());
    const supabase = await createClient();
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const access = await getIndiaFinanceAiAccess({
      supabase,
      sessionToken: payload.sessionToken,
      ip,
    });

    if (limiterEnabled && access.usage.upgradeRequired) {
      return NextResponse.json(
        {
          success: false,
          error: "Evaldam Startup AI limit reached",
          usage: access.usage,
          upgradeUrl: "/pricing",
        },
        { status: 429 }
      );
    }

    const queuedRun = indiaFinanceAiQueue.enqueue(() =>
      askIndiaFinanceAi({
        message: payload.message,
        history: payload.history,
      })
    );
    const { result, meta } = await queuedRun;
    const usage = limiterEnabled
      ? recordIndiaFinanceAiUse(access.key, access.usage)
      : {
          ...access.usage,
          upgradeRequired: false,
        };

    return NextResponse.json({
      success: true,
      data: {
        answer: result.answer,
        status: "completed",
        queuedBehind: meta.queuedBehind,
        waitMs: meta.waitMs,
        rawStatus: result.rawStatus,
        usage,
        limiterEnabled,
      },
      meta: {
        processingTime: Date.now() - startedAt,
      },
    });
  } catch (error) {
    logger.error("Evaldam Startup AI chat failed", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid chat request", details: error.issues },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Evaldam Startup AI is unavailable";
    const status = message.includes("busy") ? 503 : 500;

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const sessionToken = searchParams.get("sessionToken") || "";
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const access = await getIndiaFinanceAiAccess({ supabase, sessionToken, ip });

    return NextResponse.json({
      success: true,
      data: {
        usage: {
          ...access.usage,
          upgradeRequired: limiterEnabled ? access.usage.upgradeRequired : false,
        },
        limiterEnabled,
        queueDepth: indiaFinanceAiQueue.pendingCount,
      },
    });
  } catch (error) {
    logger.error("Evaldam Startup AI usage lookup failed", error);
    return NextResponse.json(
      { success: false, error: "Could not load Evaldam Startup AI usage" },
      { status: 500 }
    );
  }
}
