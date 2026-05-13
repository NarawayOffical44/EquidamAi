import { SupabaseClient } from "@supabase/supabase-js";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetsAt: string;
  limitedBy?: string;
}

interface RateLimitMetadata {
  ip?: string;
  country?: string;
  city?: string;
  isp?: string;
}

export function getFreeToolDailyLimit(specificEnvKey?: string): number {
  const rawLimit =
    (specificEnvKey ? process.env[specificEnvKey] : undefined) ||
    process.env.FREE_TOOL_DAILY_LIMIT ||
    "3";
  const parsedLimit = Number.parseInt(rawLimit, 10);
  return Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 3;
}

/**
 * Check and increment rate limit for one browser/user identifier
 * Uses daily reset (based on calendar date, not 24-hour window)
 *
 * @param sessionToken - Unique browser/user limit key
 * @param limit - Maximum checks allowed per day (default: 3)
 * @param adminClient - Supabase admin client with service role key
 * @param metadata - Optional metadata (IP, location)
 * @returns Object with allowed, remaining, and resetsAt
 */
export async function checkAndIncrementRateLimit(
  sessionToken: string,
  limit: number = getFreeToolDailyLimit(),
  adminClient: SupabaseClient,
  metadata?: RateLimitMetadata
): Promise<RateLimitResult> {
  return checkAndIncrementRateLimits([sessionToken], limit, adminClient, metadata);
}

/**
 * Check and increment a shared daily limit across multiple identifiers.
 * This lets free tools enforce limits by session plus submitted details, so
 * clearing browser storage does not reset the allowance for the same lead.
 */
export async function checkAndIncrementRateLimits(
  identifiers: string[],
  limit: number = getFreeToolDailyLimit(),
  adminClient: SupabaseClient,
  metadata?: RateLimitMetadata
): Promise<RateLimitResult> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const resetsAt = new Date(`${tomorrow}T00:00:00Z`).toISOString();
  const keys = Array.from(new Set(identifiers.map((key) => key.trim()).filter(Boolean)));

  if (keys.length === 0) {
    return { allowed: false, remaining: 0, resetsAt, limitedBy: "missing_identifier" };
  }

  try {
    const { data: rateLimitRecords, error: selectError } = await adminClient
      .from("free_check_rate_limits")
      .select("session_token, check_count")
      .in("session_token", keys)
      .eq("reset_date", today);

    if (selectError) {
      console.error("Rate limit check error:", selectError);
      // If storage is unavailable, allow the request so the product does not break.
      return { allowed: true, remaining: limit, resetsAt };
    }

    const records = (rateLimitRecords || []) as Array<{
      session_token: string;
      check_count: number | null;
    }>;
    const recordsByKey = new Map(records.map((record) => [record.session_token, record]));
    const limitedRecord = records.find((record) => (record.check_count || 0) >= limit);

    if (limitedRecord) {
      return {
        allowed: false,
        remaining: 0,
        resetsAt,
        limitedBy: limitedRecord.session_token,
      };
    }

    const nextCounts: number[] = [];

    for (const key of keys) {
      const currentRecord = recordsByKey.get(key);
      const nextCount = (currentRecord?.check_count || 0) + 1;
      nextCounts.push(nextCount);

      if (currentRecord) {
        await adminClient
          .from("free_check_rate_limits")
          .update({ check_count: nextCount, updated_at: new Date().toISOString() })
          .eq("session_token", key)
          .eq("reset_date", today);
      } else {
        await adminClient.from("free_check_rate_limits").insert({
          session_token: key,
          check_count: 1,
          reset_date: today,
          ip_address: metadata?.ip || null,
          country: metadata?.country || null,
          city: metadata?.city || null,
          isp: metadata?.isp || null,
        });
      }
    }

    const remaining = Math.max(0, Math.min(...nextCounts.map((count) => limit - count)));

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
