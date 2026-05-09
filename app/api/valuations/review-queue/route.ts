/**
 * Review Queue API
 * Lists pending valuations for professional reviewers
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getReviewerProfile } from "@/lib/auth/reviewer-checks";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify reviewer status
    const reviewer = await getReviewerProfile(user.id);
    if (!reviewer) {
      return NextResponse.json(
        { error: "Only active professional reviewers can access this" },
        { status: 403 }
      );
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending_review"; // pending_review, approved, rejected
    const specialty = searchParams.get("specialty"); // Filter by specialty if admin
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query for pending reviews
    let query = supabase
      .from("valuations")
      .select(
        `
        id,
        startup_id,
        user_id,
        blended_weighted_average,
        confidence_level,
        created_at,
        assigned_reviewer_id,
        review_claimed_at,
        professional_review,
        startups(company_name),
        users(full_name, email)
      `,
        { count: "exact" }
      )
      .eq("professional_review->>'status'", status);

    // Admin can see all, reviewers see unassigned or assigned to them
    if (reviewer.role !== "admin") {
      query = query.or(
        `assigned_reviewer_id.is.null,assigned_reviewer_id.eq.${user.id}`
      );
    }

    // Filter by specialty if reviewer has one
    if (specialty && (reviewer.role === "admin" || reviewer.specialty === specialty)) {
      query = query.eq("startups.industry", specialty);
    }

    // Sort by age (oldest first) for fairness
    query = query.order("created_at", { ascending: true });

    // Paginate
    const { data: valuations, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch review queue" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: valuations || [],
      count,
      pagination: { offset, limit, total: count },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST - Claim a review from the queue
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify reviewer
    const reviewer = await getReviewerProfile(user.id);
    if (!reviewer) {
      return NextResponse.json(
        { error: "Only active professional reviewers can claim reviews" },
        { status: 403 }
      );
    }

    const { valuationId } = await request.json();

    if (!valuationId) {
      return NextResponse.json(
        { error: "valuationId is required" },
        { status: 400 }
      );
    }

    // Verify valuation exists and is pending
    const { data: valuation } = await supabase
      .from("valuations")
      .select("id, professional_review, assigned_reviewer_id")
      .eq("id", valuationId)
      .single();

    if (!valuation) {
      return NextResponse.json(
        { error: "Valuation not found" },
        { status: 404 }
      );
    }

    if (valuation.professional_review?.status !== "pending_review") {
      return NextResponse.json(
        { error: "Valuation is not pending review" },
        { status: 400 }
      );
    }

    if (valuation.assigned_reviewer_id && valuation.assigned_reviewer_id !== user.id) {
      return NextResponse.json(
        { error: "This valuation is already assigned to another reviewer" },
        { status: 409 }
      );
    }

    // Claim the review
    const adminClient = require("@/lib/supabase/admin").createAdminClient();

    const { error } = await adminClient
      .from("valuations")
      .update({
        assigned_reviewer_id: user.id,
        review_claimed_at: new Date().toISOString(),
      })
      .eq("id", valuationId);

    if (error) throw error;

    // Log the claim
    await adminClient.from("review_assignments").insert({
      valuation_id: valuationId,
      assigned_to_user_id: user.id,
      assigned_by_user_id: user.id,
      claimed_at: new Date().toISOString(),
      status: "claimed",
    });

    return NextResponse.json({
      success: true,
      message: "Review claimed successfully",
      valuationId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to claim review" },
      { status: 500 }
    );
  }
}
