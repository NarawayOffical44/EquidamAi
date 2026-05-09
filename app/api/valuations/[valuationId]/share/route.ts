import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { trackServerEvent } from "@/lib/analytics/server-ga4";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ valuationId: string }> }
) {
  try {
    const { valuationId } = await params;
    const { enabled } = await request.json();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: valuation, error: valuationError } = await supabase
      .from("valuations")
      .select("id, user_id, share_token, is_public")
      .eq("id", valuationId)
      .single();

    if (valuationError || !valuation) {
      return NextResponse.json({ error: "Valuation not found" }, { status: 404 });
    }

    if (valuation.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const shareToken = valuation.share_token || randomUUID().replace(/-/g, "");
    const { data: updated, error: updateError } = await supabase
      .from("valuations")
      .update({
        is_public: Boolean(enabled),
        share_token: shareToken,
      })
      .eq("id", valuationId)
      .select("share_token, is_public")
      .single();

    if (updateError) throw updateError;

    await trackServerEvent("share_link_updated", {
      valuation_id: valuationId,
      enabled: Boolean(enabled),
    }, user.id);

    return NextResponse.json({
      success: true,
      data: {
        shareToken: updated.share_token,
        isPublic: updated.is_public,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update share link" },
      { status: 500 }
    );
  }
}
