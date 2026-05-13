import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBatchJobDetails, cancelBatchJob } from "@/lib/valuation/bulk-valuation-engine";
import { errorResponse, successResponse } from "@/lib/utils/response";
import { requirePaidUser } from "@/lib/auth/paid-access";

/**
 * GET /api/bulk-valuations/[jobId]
 * Fetch batch job details and progress
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    // Authenticate user
    const supabase = await createClient();
    const paidAccess = await requirePaidUser(supabase);
    if (!paidAccess.ok) return paidAccess.response;
    const { user } = paidAccess;

    // Fetch details
    const { job, items, itemsCount } = await getBatchJobDetails(jobId, user.id);

    // Calculate progress
    const completedCount = items.filter((i: any) => i.status === "completed").length;
    const failedCount = items.filter((i: any) => i.status === "failed").length;
    const progressPercentage = itemsCount > 0 ? Math.round((completedCount / itemsCount) * 100) : 0;

    return successResponse(
      {
        success: true,
        job: {
          ...job,
          progressPercentage,
        },
        items: items.slice(0, 50), // Return first 50 items
        stats: {
          totalItems: itemsCount,
          completed: completedCount,
          failed: failedCount,
          pending: itemsCount - completedCount - failedCount,
        },
      },
      200
    );
  } catch (error: any) {
    console.error("Error fetching batch job:", error);
    return errorResponse(error?.message || "Failed to fetch batch job", 500);
  }
}

/**
 * DELETE /api/bulk-valuations/[jobId]
 * Cancel a batch job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    // Authenticate user
    const supabase = await createClient();
    const paidAccess = await requirePaidUser(supabase);
    if (!paidAccess.ok) return paidAccess.response;
    const { user } = paidAccess;

    // Cancel job
    const result = await cancelBatchJob(jobId, user.id);

    return successResponse(
      {
        success: true,
        message: "Batch job cancelled successfully",
      },
      200
    );
  } catch (error: any) {
    console.error("Error cancelling batch job:", error);
    return errorResponse(error?.message || "Failed to cancel batch job", 500);
  }
}
