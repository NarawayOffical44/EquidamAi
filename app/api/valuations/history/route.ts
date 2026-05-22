import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/lib/utils/response";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAuthenticatedUser,
  getPrimaryWorkspaceAccess,
  paidWorkspaceRequiredResponse,
  unauthorizedResponse,
} from "@/lib/team/access";

const DEFAULT_HISTORY_LIMIT = 50;
const MAX_HISTORY_LIMIT = 100;

/**
 * GET /api/valuations/history
 * Fetch valuation history for current user's startups
 *
 * Query params:
 * - startupId?: string (filter by specific startup)
 * - limit?: number (default: 50)
 * - offset?: number (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startupId = searchParams.get("startupId");
    const limit = parseBoundedInteger(searchParams.get("limit"), DEFAULT_HISTORY_LIMIT, 1, MAX_HISTORY_LIMIT);
    const offset = parseBoundedInteger(searchParams.get("offset"), 0, 0, Number.MAX_SAFE_INTEGER);

    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return unauthorizedResponse();
    const adminClient = createAdminClient();
    const access = await getPrimaryWorkspaceAccess(adminClient, user.id);
    if (!access) return paidWorkspaceRequiredResponse();

    // Build query
    let query = adminClient
      .from("valuations")
      .select(
        `
        id,
        startup_id,
        blended_low_range,
        blended_high_range,
        blended_weighted_average,
        created_at,
        startups!inner(
          id,
          company_name,
          industry,
          stage
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", access.workspaceId);

    // Filter by startup if provided
    if (startupId) {
      query = query.eq("startup_id", startupId);
    }

    // Sort by newest first
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching valuation history:", error);
      return errorResponse("Failed to fetch history", 500);
    }

    return successResponse(
      {
        success: true,
        data: data || [],
        pagination: {
          limit,
          offset,
          total: count || 0,
        },
      },
      200
    );
  } catch (error: any) {
    console.error("Valuation history fetch error:", error);
    return errorResponse(error?.message || "Failed to fetch history", 500);
  }
}

function parseBoundedInteger(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}
