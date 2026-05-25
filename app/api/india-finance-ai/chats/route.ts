import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  isPaidStartupAiPlan,
  listStartupAiChats,
} from "@/lib/india-finance-ai/chat-history";
import { getIndiaFinanceAiAccess } from "@/lib/india-finance-ai/usage-limits";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  sessionToken: z.string().trim().max(200).optional().default(""),
});

export async function GET(request: NextRequest) {
  try {
    const query = QuerySchema.parse({
      sessionToken: request.nextUrl.searchParams.get("sessionToken") || "",
    });
    const supabase = await createClient();
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const access = await getIndiaFinanceAiAccess({
      supabase,
      sessionToken: query.sessionToken,
      ip,
    });

    if (!access.user || !isPaidStartupAiPlan(access.usage.plan)) {
      return NextResponse.json({
        success: true,
        data: {
          chats: [],
          dbBacked: false,
        },
      });
    }

    const chats = await listStartupAiChats(supabase, access.user.id);

    return NextResponse.json({
      success: true,
      data: {
        chats,
        dbBacked: true,
      },
    });
  } catch (error) {
    logger.error("Startup AI chat history lookup failed", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid chat history request", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Could not load saved Startup AI chats" },
      { status: 500 }
    );
  }
}
