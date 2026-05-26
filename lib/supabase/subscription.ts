import { SupabaseClient } from "@supabase/supabase-js";
import {
  UNLIMITED_LIMIT,
  getPlanLimits as getCanonicalPlanLimits,
} from "@/lib/plans/plan-limits";

export interface UserSubscription {
  plan: "free" | "pro" | "plus" | "startup" | "agency" | "enterprise";
  plan_active: boolean;
  subscription_id: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  billing_cycle: string | null;
  enterprise_startup_limit: number | null;
}

export interface PlanLimits {
  plan: "free" | "pro" | "plus" | "startup" | "agency" | "enterprise";
  max_startups: number;
  max_team_seats: number;
  features: string[];
}

type SubscriptionPlan = UserSubscription["plan"];

/**
 * Compatibility shape for older subscription call sites.
 * Values are derived from lib/plans/plan-limits.ts so plan entitlements have one source of truth.
 */
export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  free: toSubscriptionPlanLimits("free"),
  pro: toSubscriptionPlanLimits("pro"),
  plus: toSubscriptionPlanLimits("plus"),
  startup: toSubscriptionPlanLimits("startup"),
  agency: toSubscriptionPlanLimits("agency"),
  enterprise: toSubscriptionPlanLimits("enterprise"),
};

function toSubscriptionPlanLimits(plan: SubscriptionPlan, planActive: boolean | null = true): PlanLimits {
  const canonical = getCanonicalPlanLimits(plan, planActive);

  return {
    plan,
    max_startups: canonical.startupProfiles,
    max_team_seats: canonical.teamSeats,
    features: buildFeatureList(canonical),
  };
}

function buildFeatureList(plan: ReturnType<typeof getCanonicalPlanLimits>) {
  const features = [
    plan.startupProfiles >= UNLIMITED_LIMIT
      ? "Portfolio workspace access"
      : plan.startupProfiles > 1
        ? "Multi-startup workspace access"
        : "Startup workspace access",
    "Valuation preview access",
    plan.aiQuestions.limit >= UNLIMITED_LIMIT ? "High-limit Startup AI access" : "Startup AI access",
    "PDF report downloads",
    plan.evaldamAiScore ? "Evaldam supporting score" : "No Evaldam supporting score",
  ];

  if (plan.teamSeats > 0) {
    features.push("Team workspace access");
  }

  if (plan.portfolioDashboard !== "none") {
    features.push(`${plan.portfolioDashboard === "advanced" ? "Advanced" : "Portfolio"} dashboard`);
  }

  if (plan.whiteLabelReports) {
    features.push("White-label reports");
  }

  return features;
}

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

  const limits = toSubscriptionPlanLimits(subscription.plan, subscription.plan_active);

  // For enterprise, use custom limit if set
  if (subscription.plan === "enterprise" && subscription.plan_active && subscription.enterprise_startup_limit) {
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

  const isFreePlan = !subscription.plan_active || subscription.plan === "free";

  // Check subscription has not expired. Expired paid users fall back to the free draft allowance.
  if (!isFreePlan && subscription.subscription_end_date) {
    const now = new Date();
    const endDate = new Date(subscription.subscription_end_date);
    if (now > endDate) {
      subscription.plan = "free";
      subscription.plan_active = false;
    }
  }

  // Check plan limit not exceeded
  const limits = toSubscriptionPlanLimits(subscription.plan, subscription.plan_active);
  if (subscription.plan === "enterprise" && subscription.plan_active && subscription.enterprise_startup_limit) {
    limits.max_startups = subscription.enterprise_startup_limit;
  }

  const count = await getUserStartupCount(supabase, userId);
  if (count >= limits.max_startups) {
    return {
      allowed: false,
      reason: `You've reached your plan limit of ${limits.max_startups} startup profiles. Upgrade to Agency / Investor or contact sales for Enterprise.`,
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
    plan: "pro" | "plus" | "startup" | "agency" | "enterprise";
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

    const maxStartups = toSubscriptionPlanLimits(data.plan, true).max_startups;
    const { error: profileError } = await supabase
      .from("user_profiles")
      .upsert({
        id: userId,
        tier: data.plan,
        startup_count: 0,
        max_startups: maxStartups,
        startups_created_this_month: 0,
        monthly_cycle_start_date: new Date().toISOString().slice(0, 10),
        last_subscription_renewal_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error("Error updating user profile tier:", profileError);
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

    await supabase
      .from("user_profiles")
      .update({
        tier: "free",
        max_startups: PLAN_LIMITS.free.max_startups,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    return true;
  } catch (error) {
    console.error("Exception deactivating subscription:", error);
    return false;
  }
}
