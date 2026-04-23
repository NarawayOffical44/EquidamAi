import { SupabaseClient } from "@supabase/supabase-js";

export interface UserSubscription {
  plan: "pro" | "plus" | "enterprise";
  plan_active: boolean;
  subscription_id: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  billing_cycle: string | null;
  enterprise_startup_limit: number | null;
}

export interface PlanLimits {
  plan: "pro" | "plus" | "enterprise";
  max_startups: number;
  max_team_seats: number;
  features: string[];
}

/**
 * Plan Limits - Enforced in database and application
 * These are the authoritative limits for each plan
 */
export const PLAN_LIMITS: Record<string, PlanLimits> = {
  pro: {
    plan: "pro",
    max_startups: 3,
    max_team_seats: 1,
    features: [
      "3 active startup profiles",
      "Unlimited revisions per profile",
      "One-page VC summary (PDF)",
      "Full professional report (PDF)",
      "Basic analytics",
      "Evaldam Proprietary Score",
    ],
  },
  plus: {
    plan: "plus",
    max_startups: 15,
    max_team_seats: 3,
    features: [
      "15 active startup profiles",
      "Unlimited revisions per profile",
      "One-page VC summary (PDF)",
      "Full professional report (PDF)",
      "Advanced analytics",
      "Evaldam Proprietary Score",
      "Startup grid management",
      "Team collaboration (3 seats)",
      "Valuation history tracking",
      "Custom report exports",
    ],
  },
  enterprise: {
    plan: "enterprise",
    max_startups: 999999, // Effectively unlimited
    max_team_seats: 999999,
    features: [
      "Unlimited startup profiles",
      "White-label platform",
      "API access",
      "Bulk processing",
      "Dedicated account manager",
      "All Plus features",
    ],
  },
};

/**
 * Get user's subscription details
 */
export async function getUserSubscription(
  supabase: SupabaseClient,
  userId: string
): Promise<UserSubscription | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select(
        "plan, plan_active, subscription_id, subscription_start_date, subscription_end_date, billing_cycle, enterprise_startup_limit"
      )
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching subscription:", error);
      return null;
    }

    return data as UserSubscription;
  } catch (error) {
    console.error("Exception getting subscription:", error);
    return null;
  }
}

/**
 * Get current plan limits for user
 */
export async function getUserPlanLimits(
  supabase: SupabaseClient,
  userId: string
): Promise<PlanLimits | null> {
  const subscription = await getUserSubscription(supabase, userId);
  if (!subscription) return null;

  const plan = subscription.plan as "pro" | "plus" | "enterprise";
  const limits = PLAN_LIMITS[plan];

  // For enterprise, use custom limit if set
  if (plan === "enterprise" && subscription.enterprise_startup_limit) {
    return {
      ...limits,
      max_startups: subscription.enterprise_startup_limit,
    };
  }

  return limits;
}

/**
 * Get user's current startup count
 */
export async function getUserStartupCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("startups")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) {
      console.error("Error counting startups:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("Exception counting startups:", error);
    return 0;
  }
}

/**
 * Check if user can create new startup
 * Returns: { allowed: boolean, reason?: string }
 */
export async function canCreateStartup(
  supabase: SupabaseClient,
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Check subscription is active
  const subscription = await getUserSubscription(supabase, userId);
  if (!subscription) {
    return { allowed: false, reason: "Subscription not found" };
  }

  if (!subscription.plan_active) {
    return { allowed: false, reason: "Subscription is inactive" };
  }

  // Check subscription has not expired
  if (subscription.subscription_end_date) {
    const now = new Date();
    const endDate = new Date(subscription.subscription_end_date);
    if (now > endDate) {
      return { allowed: false, reason: "Subscription has expired" };
    }
  }

  // Check plan limit not exceeded
  const limits = await getUserPlanLimits(supabase, userId);
  if (!limits) {
    return { allowed: false, reason: "Plan limits not found" };
  }

  const count = await getUserStartupCount(supabase, userId);
  if (count >= limits.max_startups) {
    return {
      allowed: false,
      reason: `You've reached your plan limit of ${limits.max_startups} startup profiles. Upgrade to Plus or contact sales for Enterprise.`,
    };
  }

  return { allowed: true };
}

/**
 * Create or update user subscription from Stripe data
 * Called by webhook handler
 */
export async function updateUserSubscription(
  supabase: SupabaseClient,
  userId: string,
  data: {
    plan: "pro" | "plus" | "enterprise";
    subscription_id: string;
    subscription_start_date?: string;
    subscription_end_date?: string;
    billing_cycle?: "monthly" | "annual";
    plan_active?: boolean;
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("users")
      .update({
        plan: data.plan,
        subscription_id: data.subscription_id,
        subscription_start_date:
          data.subscription_start_date || new Date().toISOString(),
        subscription_end_date: data.subscription_end_date,
        billing_cycle: data.billing_cycle || "monthly",
        plan_active: data.plan_active !== false ? true : false,
      })
      .eq("id", userId);

    if (error) {
      console.error("Error updating subscription:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exception updating subscription:", error);
    return false;
  }
}

/**
 * Deactivate user subscription (e.g., on payment failure or cancellation)
 */
export async function deactivateSubscription(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("users")
      .update({
        plan_active: false,
        subscription_end_date: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("Error deactivating subscription:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exception deactivating subscription:", error);
    return false;
  }
}
