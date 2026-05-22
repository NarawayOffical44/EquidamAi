import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { trackServerEvent } from "@/lib/analytics/server-ga4";
import {
  adminOnlyResponse,
  getAuthenticatedUser,
  getValuationWorkspaceAccess,
  isWorkspaceAdmin,
  paidWorkspaceRequiredResponse,
  unauthorizedResponse,
} from "@/lib/team/access";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ valuationId: string }> }
) {
  try {
    const { valuationId } = await params;
    const { enabled } = await request.json();
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return unauthorizedResponse();
    const adminClient = createAdminClient();
    const valuationAccess = await getValuationWorkspaceAccess(adminClient, user.id, valuationId);
    if (!valuationAccess) return paidWorkspaceRequiredResponse();
    if (!isWorkspaceAdmin(valuationAccess.access)) {
      return adminOnlyResponse("Only the workspace Admin can create or disable public report links");
    }

    const { data: valuation, error: valuationError } = await adminClient
      .from("valuations")
      .select("id, user_id, share_token, is_public")
      .eq("id", valuationId)
      .single();

    if (valuationError || !valuation) {
      return NextResponse.json({ error: "Valuation not found" }, { status: 404 });
    }

    const shareToken = valuation.share_token || randomUUID().replace(/-/g, "");
    const { data: updated, error: updateError } = await adminClient
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
