import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { indiaFinanceAiQueue } from "@/lib/india-finance-ai/server-queue";
import { askIndiaFinanceAi } from "@/lib/india-finance-ai/runpod-client";
import {
  isPaidStartupAiPlan,
  saveStartupAiExchange,
} from "@/lib/india-finance-ai/chat-history";
import {
  getAiLimitMessage,
  getAiPromptLengthMessage,
  getIndiaFinanceAiAccess,
  isPromptTooLong,
  recordAiUsageUseIfAvailable,
} from "@/lib/india-finance-ai/usage-limits";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ChatSchema = z.object({
  message: z.string().trim().min(3).max(4000),
  sessionToken: z.string().trim().max(200).optional().default(""),
  threadId: z.string().trim().uuid().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().trim().min(1).max(4000),
      })
    )
    .max(10)
    .optional(),
});

const limiterEnabled = process.env.INDIA_FINANCE_AI_LIMITER_ENABLED !== "false";
const FREE_RESPONSE_MAX_TOKENS = Number(process.env.INDIA_FINANCE_AI_FREE_MAX_TOKENS || 450);

function isFreeAccessPlan(plan: string) {
  return plan === "anonymous" || plan === "free";
}

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

    if (access.user) {
      const { data: startupContributorAccess } = await supabase
        .from("startup_card_access")
        .select("id")
        .eq("user_id", access.user.id)
        .eq("status", "accepted")
        .maybeSingle();

      if (startupContributorAccess) {
        return NextResponse.json(
          {
            success: false,
            error: "Startup contributor accounts can only update the shared startup card.",
          },
          { status: 403 }
        );
      }
    }

    if (isPromptTooLong(payload.message, access.usage)) {
      return NextResponse.json(
        {
          success: false,
          error: getAiPromptLengthMessage(access.usage.promptCharacterLimit || 0),
          usage: access.usage,
          upgradeUrl: "/pricing",
        },
        { status: 413 }
      );
    }

    let usage = access.usage;
    const freeAccess = isFreeAccessPlan(access.usage.plan);
    if (limiterEnabled) {
      const reservation = await recordAiUsageUseIfAvailable(access.key, access.usage);
      usage = reservation.usage;

      if (!reservation.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: getAiLimitMessage(reservation.usage),
            usage: reservation.usage,
            upgradeUrl: "/pricing",
          },
          { status: 429 }
        );
      }
    }

    const queuedRun = indiaFinanceAiQueue.enqueue(() =>
      askIndiaFinanceAi({
        message: payload.message,
        history: freeAccess ? payload.history?.slice(-4) : payload.history,
        maxTokens: freeAccess ? FREE_RESPONSE_MAX_TOKENS : undefined,
      })
    );
    const { result, meta } = await queuedRun;
    if (!limiterEnabled) usage = { ...access.usage, upgradeRequired: false };
    let savedThread: Awaited<ReturnType<typeof saveStartupAiExchange>> | null = null;

    if (access.user && isPaidStartupAiPlan(access.usage.plan)) {
      try {
        savedThread = await saveStartupAiExchange({
          supabase,
          userId: access.user.id,
          threadId: payload.threadId,
          userMessage: payload.message,
          assistantMessage: result.answer,
        });
      } catch (saveError) {
        logger.error("Startup AI chat history save failed", saveError);
      }
    }

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
        thread: savedThread
          ? {
              id: savedThread.id,
              title: savedThread.title,
              updatedAt: savedThread.updatedAt,
            }
          : null,
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
