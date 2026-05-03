import { SupabaseClient } from "@supabase/supabase-js";

interface UserTierInfo {
  tier: "free" | "pro" | "plus" | "enterprise";
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
    // Get user's monthly allocation status
    const { data, error } = await adminClient
      .from("user_profiles")
      .select("tier, startups_created_this_month, last_subscription_renewal_date")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return {
        allowed: false,
        tier: "unknown",
        current: 0,
        max: 0,
        message: "Could not verify your account tier.",
      };
    }

    const tier = data.tier || "free";
    const createdThisMonth = data.startups_created_this_month || 0;
    const monthlyLimit = TIER_LIMITS[tier as keyof typeof TIER_LIMITS]?.maxStartups || 1;
    const canCreateMore = createdThisMonth < monthlyLimit;
    const remaining = monthlyLimit - createdThisMonth;

    if (!canCreateMore) {
      const limitMessage =
        tier === "free"
          ? `Free plan limited to ${monthlyLimit} startup per month. Please upgrade to create more.`
          : `You've created ${createdThisMonth} startups this month (limit: ${monthlyLimit}). New startups available next month with subscription renewal.`;

      return {
        allowed: false,
        tier: tier,
        current: createdThisMonth,
        max: monthlyLimit,
        message: limitMessage,
      };
    }

    return {
      allowed: true,
      tier: tier,
      current: createdThisMonth,
      max: monthlyLimit,
      message: `You can create ${remaining} more startup(s) this month.`,
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
      "1 active startup profile",
      "3 evaluation reports",
      "AI auto-fill from pitch deck",
      "Basic valuation reports",
      "Export as PDF",
    ],
  },
  pro: {
    maxStartups: 3, // From pricing page: "3 active startup profiles"
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
  plus: {
    maxStartups: 15, // From pricing page: "15 active startup profiles"
    maxReportsPerMonth: Infinity, // "Unlimited revisions per profile"
    watermarkReports: false,
    features: [
      "15 active startup profiles",
      "Unlimited revisions per profile",
      "AI auto-fill from pitch deck",
      "One-page VC summary (PDF)",
      "Full professional report (PDF)",
      "Advanced analytics",
      "Startup portfolio management",
      "Team seats (up to 3)",
    ],
  },
  enterprise: {
    maxStartups: Infinity, // From pricing page: "Unlimited startup profiles"
    maxReportsPerMonth: Infinity,
    watermarkReports: false,
    // Custom pricing - contact sales
    // Price: Custom (as per discussion)
    features: [
      "Unlimited startup profiles",
      "White-label platform",
      "API access",
      "Bulk processing",
      "Dedicated account manager",
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
