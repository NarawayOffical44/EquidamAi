import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type EmailEventType = "opened" | "clicked" | "bounced" | "unsubscribed" | "failed";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventType: string }> }
) {
  try {
    const secret = process.env.EMAIL_WEBHOOK_SECRET;
    if (secret) {
      const auth = request.headers.get("authorization");
      const headerSecret = request.headers.get("x-webhook-secret");
      if (auth !== `Bearer ${secret}` && headerSecret !== secret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const { eventType } = await params;
    const mappedEvent = mapEventType(eventType);
    if (!mappedEvent) {
      return NextResponse.json({ error: "Unsupported event type" }, { status: 400 });
    }

    const payload = await request.json();
    const events = Array.isArray(payload) ? payload : [payload];
    const adminClient = createAdminClient();
    let processed = 0;

    for (const event of events) {
      const email = extractEmail(event);
      if (!email) continue;

      const { data: lead } = await adminClient
        .from("email_sequence_leads")
        .select("id")
        .eq("email", email)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!lead?.id) continue;

      const emailType = normalizeEmailType(event.email_type || event.tag || event.campaign || event.template);

      await adminClient.from("email_sequence_events").insert({
        email_sequence_lead_id: lead.id,
        email_type: emailType,
        event_type: mappedEvent,
        metadata: event,
      });

      await updateLeadEngagement(adminClient, lead.id, mappedEvent, event);
      processed += 1;
    }

    return NextResponse.json({ success: true, processed });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process email webhook", details: String(error) },
      { status: 500 }
    );
  }
}

function mapEventType(raw: string): EmailEventType | null {
  const normalized = raw.toLowerCase();
  if (["open", "opened"].includes(normalized)) return "opened";
  if (["click", "clicked"].includes(normalized)) return "clicked";
  if (["bounce", "bounced", "hard_bounce", "soft_bounce"].includes(normalized)) return "bounced";
  if (["unsubscribe", "unsubscribed"].includes(normalized)) return "unsubscribed";
  if (["failed", "failure"].includes(normalized)) return "failed";
  return null;
}

function extractEmail(event: any): string | null {
  return (
    event.email ||
    event.recipient ||
    event.to ||
    event["recipient-email"] ||
    event.message?.to ||
    null
  );
}

function normalizeEmailType(value: any): "day_1" | "day_3" | "day_7" {
  const text = String(value || "").toLowerCase();
  if (text.includes("day_7") || text.includes("day-7") || text.includes("day 7")) return "day_7";
  if (text.includes("day_3") || text.includes("day-3") || text.includes("day 3")) return "day_3";
  return "day_1";
}

async function updateLeadEngagement(
  adminClient: ReturnType<typeof createAdminClient>,
  leadId: string,
  eventType: EmailEventType,
  event: any
) {
  const now = new Date().toISOString();
  const update: Record<string, any> = {};

  if (eventType === "opened") update.last_opened_at = now;
  if (eventType === "clicked") update.last_clicked_at = now;
  if (eventType === "bounced" || eventType === "failed") {
    update.failed_at = now;
    update.last_error = String(event.reason || event.error || event.event || eventType).slice(0, 500);
  }
  if (eventType === "unsubscribed") {
    update.failed_at = now;
    update.last_error = "unsubscribed";
  }

  if (Object.keys(update).length > 0) {
    await adminClient.from("email_sequence_leads").update(update).eq("id", leadId);
  }
}
