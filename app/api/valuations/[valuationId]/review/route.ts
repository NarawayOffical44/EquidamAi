/**
 * Professional Valuation Review API
 * Separates user access (view own review) from reviewer access (approve/reject)
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canUserReviewValuation, getReviewerProfile } from "@/lib/auth/reviewer-checks";
import { NextRequest, NextResponse } from "next/server";
import { trackServerEvent } from "@/lib/analytics/server-ga4";

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
      .select("id, user_id, assigned_reviewer_id, professional_review")
      .eq("id", valuationId)
      .single();

    if (!valuation) {
      return NextResponse.json({ error: "Valuation not found" }, { status: 404 });
    }

    // Users can view their own review status
    // Reviewers can view valuations assigned to them
    const isOwner = valuation.user_id === user.id;
    const isAssignedReviewer = valuation.assigned_reviewer_id === user.id;
    const isReviewer = (await getReviewerProfile(user.id)) !== null;

    if (!isOwner && !isAssignedReviewer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
      .select("user_id, professional_review")
      .eq("id", valuationId)
      .single();

    if (!valuation) {
      return NextResponse.json({ error: "Valuation not found" }, { status: 404 });
    }

    // ✅ SECURITY: Check if user can review this valuation
    if (action === "pending_review") {
      if (valuation.user_id !== user.id) {
        return NextResponse.json({ error: "Only the valuation owner can request review" }, { status: 403 });
      }

      const updatedReview = {
        status: "pending_review",
        requested_by: user.id,
        requested_at: new Date().toISOString(),
        reviewer_notes: reviewer_notes || "",
        adjustments: [],
        final_valuation: null,
      };

      const adminClient = createAdminClient();
      const { error } = await adminClient
        .from("valuations")
        .update({ professional_review: updatedReview })
        .eq("id", valuationId);

      if (error) throw error;

      await trackServerEvent("review_request", {
        valuation_id: valuationId,
        action: "pending_review",
      }, user.id);

      return NextResponse.json({ success: true, data: updatedReview });
    }

    const canReview = await canUserReviewValuation(user.id, valuation.user_id);
    if (!canReview.allowed) {
      return NextResponse.json({ error: canReview.reason }, { status: 403 });
    }

    // ✅ SECURITY: Verify reviewer is active
    const reviewer = await getReviewerProfile(user.id);
    if (!reviewer) {
      return NextResponse.json(
        { error: "Only active professional reviewers can submit reviews" },
        { status: 403 }
      );
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

    // Log review completion
    await adminClient.from("review_assignments").update({
      status: "completed",
      updated_at: new Date().toISOString(),
    }).eq("valuation_id", valuationId);

    // Log action in audit trail
    await adminClient.from("report_audit_log").insert({
      valuation_id: valuationId,
      action: action === "pending_review" ? "reviewed" : action,
      actor_type: "professional",
      actor_id: user.id,
      details: { reviewer_notes, reviewer_specialty: reviewer.specialty }
    });

    return NextResponse.json({ success: true, data: updatedReview });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
