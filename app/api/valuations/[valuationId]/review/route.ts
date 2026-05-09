/**
 * Professional Valuation Review API
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ valuationId: string }> }
) {
  try {
    const { valuationId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: valuation } = await supabase
      .from("valuations")
      .select("*, professional_review")
      .eq("id", valuationId)
      .single();

    if (!valuation || valuation.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: valuation.professional_review || { status: "not_requested" }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ valuationId: string }> }
) {
  try {
    const { valuationId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { action, reviewer_notes, adjustments, final_valuation } = await request.json();

    const { data: valuation } = await supabase
      .from("valuations")
      .select("*")
      .eq("id", valuationId)
      .single();

    if (!valuation || valuation.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updatedReview = {
      status: action,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      reviewer_notes,
      adjustments: adjustments || [],
      final_valuation: action === "approved" ? final_valuation : null
    };

    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from("valuations")
      .update({ professional_review: updatedReview })
      .eq("id", valuationId);

    if (error) throw error;

    await adminClient.from("report_audit_log").insert({
      valuation_id: valuationId,
      action: action === "pending_review" ? "reviewed" : action,
      actor_type: "professional",
      actor_id: user.id,
      details: { reviewer_notes }
    });

    return NextResponse.json({ success: true, data: updatedReview });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
