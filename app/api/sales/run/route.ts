import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendDay1, sendDay3, sendDay7, type SalesOutreach } from "@/lib/sales/sequence";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";

function isAuthorized(req: NextRequest) {
  const secret = process.env.SALES_JOB_SECRET;
  if (!secret) return false;
  const bearer = req.headers.get("authorization") || "";
  const header = req.headers.get("x-sales-secret") || "";
  return bearer === `Bearer ${secret}` || header === secret;
}

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("sales_outreach")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) {
    logger.error("sales/run: fetch failed", { error });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const outreachList = (rows || []) as SalesOutreach[];
  let day1 = 0, day3 = 0, day7 = 0, completed = 0;

  for (const outreach of outreachList) {
    const age = daysSince(outreach.created_at);

    try {
      if (age >= 1 && !outreach.day1_sent_at) {
        await sendDay1(outreach);
        day1++;
      } else if (age >= 3 && !outreach.day3_sent_at) {
        await sendDay3(outreach);
        day3++;
      } else if (age >= 7 && !outreach.day7_sent_at) {
        await sendDay7(outreach);
        day7++;

        // Mark completed after day 7
        await admin
          .from("sales_outreach")
          .update({ status: "completed" })
          .eq("id", outreach.id);
        completed++;
      }
    } catch (err) {
      logger.error("sales/run: sequence step failed", { id: outreach.id, err });
    }
  }

  return NextResponse.json({ ok: true, day1, day3, day7, completed });
}
