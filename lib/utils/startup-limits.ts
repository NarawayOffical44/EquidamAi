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
 * Check if user can create a new startup
 */
export async function checkStartupCreationLimit(
  userId: string,
  adminClient: SupabaseClient
): Promise<StartupLimitError> {
  try {
    const tierInfo = await getUserTierInfo(userId, adminClient);

    if (!tierInfo) {
      return {
        allowed: false,
        tier: "unknown",
        current: 0,
        max: 0,
        message: "Could not verify your account tier.",
      };
    }

    if (!tierInfo.canCreateMore) {
      const limitMessage =
        tierInfo.tier === "free"
          ? `Free plan limited to ${tierInfo.maxStartups} startup. Upgrade to create more.`
          : `You've reached your limit of ${tierInfo.maxStartups} startups on the ${tierInfo.tier} plan.`;

      return {
        allowed: false,
        tier: tierInfo.tier,
        current: tierInfo.startupCount,
        max: tierInfo.maxStartups,
        message: limitMessage,
      };
    }

    return {
      allowed: true,
      tier: tierInfo.tier,
      current: tierInfo.startupCount,
      max: tierInfo.maxStartups,
      message: `You can create ${tierInfo.remainingStartups} more startup(s).`,
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
 * Increment user's startup count after creating a startup
 */
export async function incrementStartupCount(
  userId: string,
  adminClient: SupabaseClient
): Promise<boolean> {
  try {
    const { error } = await adminClient.rpc(
      "increment_startup_count",
      { user_id: userId }
    );

    if (error) {
      console.error("Failed to increment startup count:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error incrementing startup count:", error);
    return false;
  }
}

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
