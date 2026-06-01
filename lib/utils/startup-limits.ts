import { SupabaseClient } from "@supabase/supabase-js";
import { UNLIMITED_LIMIT } from "@/lib/plans/plan-limits";

interface UserTierInfo {
  tier: "free" | "pro" | "plus" | "startup" | "agency" | "enterprise";
  startupCount: number;
  maxStartups: number;
  canCreateMore: boolean;
  remainingStartups: number;
}

interface StartupLimitError {
  allowed: boolean;
  tier: string;
  current: number;
  max: number;
  message: string;
  activeCount?: number;
  activeMax?: number;
}

/**
 * Get user's current tier and startup count
 */
export async function getUserTierInfo(
  userId: string,
  adminClient: SupabaseClient
): Promise<UserTierInfo | null> {
  try {
    const { data, error } = await adminClient
      .from("user_profiles")
      .select("tier, startup_count, max_startups")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Failed to fetch user tier info:", error);
      return null;
    }

    const canCreateMore = data.startup_count < data.max_startups;
    const remainingStartups = Math.max(0, data.max_startups - data.startup_count);

    return {
      tier: data.tier,
      startupCount: data.startup_count,
      maxStartups: data.max_startups,
      canCreateMore,
      remainingStartups,
    };
  } catch (error) {
    console.error("Error getting user tier info:", error);
    return null;
  }
}

/**
 * Check if user can create a new startup - Uses MONTHLY allocation
 * User gets allocation per month (resets on subscription renewal)
 * Can delete startups anytime, but creations limited to monthly quota
 */
export async function checkStartupCreationLimit(
  userId: string,
  adminClient: SupabaseClient
): Promise<StartupLimitError> {
  try {
    const { data: subscription, error: subscriptionError } = await adminClient
      .from("users")
      .select("plan, plan_active, subscription_end_date, enterprise_startup_limit")
      .eq("id", userId)
      .single();

    if (subscriptionError || !subscription) {
      return {
        allowed: false,
        tier: "unknown",
        current: 0,
        max: 0,
        message: "Account profile not found. Please sign in again before creating a startup.",
      };
    }

    const paidPlanExpired = Boolean(
      subscription.plan_active &&
      subscription.subscription_end_date &&
      new Date(subscription.subscription_end_date) < new Date()
    );
    const rawPlan = String(subscription.plan || "free").trim().toLowerCase();
    const plan = (
      paidPlanExpired || !subscription.plan_active
        ? "free"
        : rawPlan in TIER_LIMITS
          ? rawPlan
          : "free"
    ) as keyof typeof TIER_LIMITS;
    const planLimit = TIER_LIMITS[plan]?.maxStartups || TIER_LIMITS.pro.maxStartups;
    const monthlyLimit = plan === "enterprise" && subscription.enterprise_startup_limit
      ? Number(subscription.enterprise_startup_limit)
      : planLimit;
    const activeLimit = monthlyLimit;

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { count: activeCountResult } = await adminClient
      .from("startups")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    const activeCount = activeCountResult || 0;

    const { data, error } = await adminClient
      .from("user_profiles")
      .select("tier, startups_created_this_month, monthly_cycle_start_date, last_subscription_renewal_date")
      .eq("id", userId)
      .single();

    if (error || !data) {
      await adminClient.from("user_profiles").upsert({
        id: userId,
        tier: plan,
        startup_count: activeCount,
        max_startups: activeLimit,
        startups_created_this_month: 0,
        monthly_cycle_start_date: new Date().toISOString().slice(0, 10),
        last_subscription_renewal_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    const cycleStart = data?.monthly_cycle_start_date ? new Date(data.monthly_cycle_start_date) : monthStart;
    const shouldResetCycle = plan !== "free" && cycleStart < monthStart;
    const createdThisMonth = shouldResetCycle ? 0 : Number(data?.startups_created_this_month || 0);

    if (shouldResetCycle) {
      await adminClient
        .from("user_profiles")
        .update({
          startups_created_this_month: 0,
          monthly_cycle_start_date: new Date().toISOString().slice(0, 10),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    }

    await adminClient
      .from("user_profiles")
      .update({
        tier: plan,
        startup_count: activeCount,
        max_startups: activeLimit,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    const monthlyRemaining = Math.max(0, monthlyLimit - createdThisMonth);
    const activeRemaining = Math.max(0, activeLimit - activeCount);
    const canCreateMore = monthlyRemaining > 0 && activeRemaining > 0;
    const remaining = Math.min(monthlyRemaining, activeRemaining);

    if (!canCreateMore) {
      const limitMessage = activeRemaining <= 0
        ? paidPlanExpired
          ? `Your paid access ended on ${new Date(subscription.subscription_end_date as string).toLocaleDateString()}. Free plan limits now apply. Upgrade again to add more startup profiles.`
          : plan === "free"
            ? "Free accounts can keep 1 lifetime startup. Upgrade to Startup to add another startup profile."
            : `Your plan allows ${activeLimit} active startup profile(s). Delete an existing profile or upgrade before creating more.`
        : `You've used ${createdThisMonth} of ${monthlyLimit} startup creation(s) for this month. New creation allowance opens next month.`;

      return {
        allowed: false,
        tier: plan,
        current: createdThisMonth,
        max: monthlyLimit,
        message: limitMessage,
        activeCount,
        activeMax: activeLimit,
      };
    }

    return {
      allowed: true,
      tier: plan,
      current: createdThisMonth,
      max: monthlyLimit,
      message: `You can create ${remaining} more startup(s) this month.`,
      activeCount,
      activeMax: activeLimit,
    };
  } catch (error) {
    console.error("Error checking startup limit:", error);
    return {
      allowed: false,
      tier: "error",
      current: 0,
      max: 0,
      message: "Error verifying startup limit. Please try again.",
    };
  }
}

export async function incrementStartupCreationUsageIfNeeded(
  userId: string,
  adminClient: SupabaseClient,
  previousCreatedThisMonth: number
): Promise<boolean> {
  try {
    const { data } = await adminClient
      .from("user_profiles")
      .select("startups_created_this_month")
      .eq("id", userId)
      .single();

    const current = Number(data?.startups_created_this_month || 0);
    if (current > previousCreatedThisMonth) return true;

    const { error } = await adminClient
      .from("user_profiles")
      .update({
        startups_created_this_month: previousCreatedThisMonth + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("Failed to increment startup creation usage:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error incrementing startup creation usage:", error);
    return false;
  }
}

/**
 * Increment user's monthly startup count after creating a startup
 * Note: This is now handled automatically by DB trigger on startup creation
 * Kept for backwards compatibility
 */
export async function incrementStartupCount(
  userId: string,
  adminClient: SupabaseClient
): Promise<boolean> {
  try {
    const { error } = await adminClient.rpc(
      "increment_monthly_startup_count",
      { p_user_id: userId }
    );

    if (error) {
      console.error("Failed to increment monthly startup count:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error incrementing monthly startup count:", error);
    return false;
  }
}

/**
 * IMPORTANT: Deletions are ALLOWED anytime
 * Users can delete startups without affecting monthly quota
 * The monthly counter only tracks creations, not current count
 * This allows users to manage their portfolio while preserving their monthly allocation
 */

/**
 * Get tier-specific limits
 * Based on pricing page: app/(app)/pricing/page.tsx
 */
export const TIER_LIMITS = {
  free: {
    maxStartups: 1,
    maxReportsPerMonth: 3,
    watermarkReports: true,
    features: [
      "1 lifetime startup",
      "5 valuation previews/month",
      "3 watermarked report downloads/month",
      "No Evaldam AI Score",
    ],
  },
  pro: {
    maxStartups: 3, // Existing legacy Pro limit retained for current users
    maxReportsPerMonth: Infinity, // "Unlimited revisions per profile"
    watermarkReports: false,
    features: [
      "3 active startup profiles",
      "Unlimited revisions per profile",
      "AI auto-fill from pitch deck",
      "One-page VC summary (PDF)",
      "Full professional report (PDF)",
      "Basic analytics",
    ],
  },
  startup: {
    maxStartups: 1,
    maxReportsPerMonth: Infinity,
    watermarkReports: false,
    features: [
      "1 active startup profile",
      "Unlimited revisions per profile",
      "AI auto-fill from pitch deck",
      "One-page VC summary (PDF)",
      "Full professional report (PDF)",
      "Basic analytics",
    ],
  },
  plus: {
    maxStartups: 15, // Existing legacy Plus limit retained for current users
    maxReportsPerMonth: Infinity, // "Unlimited revisions per profile"
    watermarkReports: false,
    features: [
      "15 active startup profiles",
      "Unlimited revisions per profile",
      "AI auto-fill from pitch deck",
      "One-page VC summary (PDF)",
      "Full professional report (PDF)",
      "Advanced analytics",
      "Advisor workspace view",
      "Review workflow support",
    ],
  },
  agency: {
    maxStartups: 10,
    maxReportsPerMonth: Infinity,
    watermarkReports: false,
    features: [
      "10 active startup profiles",
      "Unlimited revisions per profile",
      "AI auto-fill from pitch deck",
      "One-page VC summary (PDF)",
      "Full professional report (PDF)",
      "Advanced analytics",
      "5 team members",
      "Portfolio dashboard",
      "Agency / investor workspace view",
      "Review workflow support",
    ],
  },
  enterprise: {
    maxStartups: UNLIMITED_LIMIT, // From pricing page: "Unlimited startup profiles"
    maxReportsPerMonth: Infinity,
    watermarkReports: false,
    // Custom pricing - contact sales
    // Price: Custom (as per discussion)
    features: [
      "Unlimited startup profiles",
      "Bulk valuation workflows",
      "Enterprise team seats",
      "Custom benchmark support",
      "Bulk processing",
      "Implementation support",
      "Custom SLA & support",
      "Custom pricing & features",
    ],
  },
} as const;

/**
 * Check if tier should have watermarked reports
 */
export function shouldWatermarkReports(tier: string): boolean {
  const tierConfig = TIER_LIMITS[tier as keyof typeof TIER_LIMITS];
  return tierConfig?.watermarkReports ?? true; // Default to true for safety
}
