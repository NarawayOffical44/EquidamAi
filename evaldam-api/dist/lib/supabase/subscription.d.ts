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
export declare const PLAN_LIMITS: Record<string, PlanLimits>;
/**
 * Get user's subscription details
 */
export declare function getUserSubscription(supabase: SupabaseClient, userId: string): Promise<UserSubscription | null>;
/**
 * Get current plan limits for user
 */
export declare function getUserPlanLimits(supabase: SupabaseClient, userId: string): Promise<PlanLimits | null>;
/**
 * Get user's current startup count
 */
export declare function getUserStartupCount(supabase: SupabaseClient, userId: string): Promise<number>;
/**
 * Check if user can create new startup
 * Returns: { allowed: boolean, reason?: string }
 */
export declare function canCreateStartup(supabase: SupabaseClient, userId: string): Promise<{
    allowed: boolean;
    reason?: string;
}>;
/**
 * Create or update user subscription from Stripe data
 * Called by webhook handler
 */
export declare function updateUserSubscription(supabase: SupabaseClient, userId: string, data: {
    plan: "pro" | "plus" | "enterprise";
    subscription_id: string;
    subscription_start_date?: string;
    subscription_end_date?: string;
    billing_cycle?: "monthly" | "annual";
    plan_active?: boolean;
}): Promise<boolean>;
/**
 * Deactivate user subscription (e.g., on payment failure or cancellation)
 */
export declare function deactivateSubscription(supabase: SupabaseClient, userId: string): Promise<boolean>;
//# sourceMappingURL=subscription.d.ts.map