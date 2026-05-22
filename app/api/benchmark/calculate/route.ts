import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { calculateBenchmarking } from "@/lib/valuation/benchmarking-engine";
import { BenchmarkCalculationRequest } from "@/types";
import { errorResponse, successResponse } from "@/lib/utils/response";
import { AppError } from "@/lib/utils/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAuthenticatedUser,
  getValuationWorkspaceAccess,
  paidWorkspaceRequiredResponse,
  unauthorizedResponse,
} from "@/lib/team/access";
import {
  getAiLimitMessage,
  getAiUsageAccess,
  recordAiUsageUseIfAvailable,
} from "@/lib/india-finance-ai/usage-limits";
import { normalizePlanKey } from "@/lib/plans/plan-limits";

const BenchmarkCalculationSchema = z.object({
  valuationId: z.string().uuid(),
  industry: z.enum(["saas", "ai", "fintech", "deeptech", "other"]),
  stage: z.enum(["pre-revenue", "seed", "series-a", "series-b+"]),
  arr: z.coerce.number().finite().nonnegative().max(1_000_000_000_000).optional(),
  growthRate: z.coerce.number().finite().min(-100).max(1000).optional(),
  teamSize: z.coerce.number().int().nonnegative().max(1_000_000).optional(),
});

/**
 * POST /api/benchmark/calculate
 * Calculate benchmarking analysis for a valuation
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null);
    const body = BenchmarkCalculationSchema.parse(payload) as BenchmarkCalculationRequest;

    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return unauthorizedResponse();
    const adminClient = createAdminClient();
    const valuationAccess = await getValuationWorkspaceAccess(adminClient, user.id, body.valuationId);
    if (!valuationAccess) return paidWorkspaceRequiredResponse();

    // Verify user owns this valuation
    const { data: valuation, error: valuationError } = await adminClient
      .from("valuations")
      .select("id, user_id")
      .eq("id", body.valuationId)
      .single();

    if (valuationError || !valuation) {
      return errorResponse("Valuation not found", 404);
    }

    const planKey = normalizePlanKey(valuationAccess.access.plan, valuationAccess.access.planActive);
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "authenticated";
    const usageAccess = await getAiUsageAccess({
      supabase,
      sessionToken: `benchmark:${body.valuationId}`,
      ip,
      feature: "workspace_chat",
      planOverride: planKey,
      usageKeyOverride: `workspace:${valuationAccess.access.workspaceId}`,
      userIdOverride: valuationAccess.access.workspaceId,
    });
    const usageReservation = await recordAiUsageUseIfAvailable(usageAccess.key, usageAccess.usage);

    if (!usageReservation.allowed) {
      return errorResponse(
        new AppError("AI_LIMIT_REACHED", getAiLimitMessage(usageReservation.usage), 429, {
          usage: usageReservation.usage,
          upgradeUrl: "/pricing?plan=startup",
        }),
        429
      );
    }

    // Calculate benchmarking
    const result = await calculateBenchmarking(body);

    return successResponse(
      {
        success: true,
        data: result,
        usage: usageReservation.usage,
      },
      200
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        new AppError("VALIDATION_ERROR", "Invalid benchmark calculation request", 400, {
          issues: error.issues,
        }),
        400
      );
    }
    console.error("Benchmark calculation error:", error);
    return errorResponse(error?.message || "Failed to calculate benchmarking", 500);
  }
}
