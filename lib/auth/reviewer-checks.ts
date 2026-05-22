/**
 * Reviewer Role & Authorization Checks
 * Ensures proper separation between users and professional reviewers
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ReviewerProfile {
  id: string;
  email: string;
  role: "professional_reviewer" | "admin";
  specialty: string | null;
  status: "active" | "inactive" | "suspended";
}

/**
 * Verify user is a professional reviewer
 */
export async function getReviewerProfile(
  userId: string
): Promise<ReviewerProfile | null> {
  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, role, reviewer_specialty, reviewer_status")
    .eq("id", userId)
    .single();

  if (error || !user) return null;

  // Must be reviewer or admin, and active
  if (!["professional_reviewer", "admin"].includes(user.role)) {
    return null;
  }

  if (user.reviewer_status !== "active") {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    specialty: user.reviewer_specialty,
    status: user.reviewer_status,
  };
}

/**
 * Check if user can review a specific valuation
 * - Cannot review own valuations
 * - Must have reviewer role
 * - Must be active
 */
export async function canUserReviewValuation(
  userId: string,
  valuationUserId: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Cannot review own valuations
  if (userId === valuationUserId) {
    return {
      allowed: false,
      reason: "Cannot review your own valuations",
    };
  }

  // Must be active reviewer
  const reviewer = await getReviewerProfile(userId);
  if (!reviewer) {
    return {
      allowed: false,
      reason: "Only active professional reviewers can approve valuations",
    };
  }

  return { allowed: true };
}

/**
 * Claim a review from the queue
 * Assigns the reviewer and marks as claimed
 */
export async function claimReview(
  valuationId: string,
  reviewerId: string
): Promise<{ success: boolean; error?: string }> {
  const adminClient = createAdminClient();

  // Verify reviewer
  const reviewer = await getReviewerProfile(reviewerId);
  if (!reviewer) {
    return { success: false, error: "Reviewer not found or inactive" };
  }

  // Claim the review
  const { error } = await adminClient
    .from("valuations")
    .update({
      assigned_reviewer_id: reviewerId,
      review_claimed_at: new Date().toISOString(),
    })
    .eq("id", valuationId)
    .is("assigned_reviewer_id", null); // Only claim if not already assigned

  if (error) {
    return { success: false, error: "Could not claim review (already claimed?)" };
  }

  // Log assignment
  await adminClient.from("review_assignments").insert({
    valuation_id: valuationId,
    assigned_to_user_id: reviewerId,
    assigned_by_user_id: reviewerId, // Self-claimed
    claimed_at: new Date().toISOString(),
    status: "claimed",
  });

  return { success: true };
}
