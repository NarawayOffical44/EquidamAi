import { SupabaseClient } from "@supabase/supabase-js";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetsAt: string;
}

interface RateLimitMetadata {
  ip?: string;
  country?: string;
  city?: string;
  isp?: string;
}

/**
 * Check and increment rate limit for browser session token
 * Uses daily reset (based on calendar date, not 24-hour window)
 *
 * @param sessionToken - Unique browser session token
 * @param limit - Maximum checks allowed per day (default: 5)
 * @param adminClient - Supabase admin client with service role key
 * @param metadata - Optional metadata (IP, location)
 * @returns Object with allowed, remaining, and resetsAt
 */
export async function checkAndIncrementRateLimit(
  sessionToken: string,
  limit: number = 5,
  adminClient: SupabaseClient,
  metadata?: RateLimitMetadata
): Promise<RateLimitResult> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const resetsAt = new Date(`${tomorrow}T00:00:00Z`).toISOString();

  try {
    // Check session token against the limit
    const { data: rateLimitRecord, error: selectError } = await adminClient
      .from("free_check_rate_limits")
      .select("check_count")
      .eq("session_token", sessionToken)
      .eq("reset_date", today)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      // PGRST116 = no rows found (expected for new sessions)
      console.error("Rate limit check error:", selectError);
      // If there's an error other than "no rows", allow the request (fail open)
      return { allowed: true, remaining: limit, resetsAt };
    }

    const currentCount = rateLimitRecord?.check_count || 0;

    // Check if limit exceeded
    if (currentCount >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetsAt,
      };
    }

    // Increment count
    if (rateLimitRecord) {
      // Update existing record
      await adminClient
        .from("free_check_rate_limits")
        .update({ check_count: currentCount + 1, updated_at: new Date().toISOString() })
        .eq("session_token", sessionToken)
        .eq("reset_date", today);
    } else {
      // Insert new record
      await adminClient.from("free_check_rate_limits").insert({
        session_token: sessionToken,
        check_count: 1,
        reset_date: today,
        ip_address: metadata?.ip || null,
        country: metadata?.country || null,
        city: metadata?.city || null,
        isp: metadata?.isp || null,
      });
    }

    const remaining = Math.max(0, limit - (currentCount + 1));

    return {
      allowed: true,
      remaining,
      resetsAt,
    };
  } catch (error) {
    console.error("Rate limit error:", error);
    // If there's an error, allow the request (fail open)
    return { allowed: true, remaining: limit, resetsAt };
  }
}
