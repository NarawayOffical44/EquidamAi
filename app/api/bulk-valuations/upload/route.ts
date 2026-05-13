import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createBulkValuationBatch } from "@/lib/valuation/bulk-valuation-engine";
import { errorResponse, successResponse } from "@/lib/utils/response";
import { requirePaidUser } from "@/lib/auth/paid-access";

/**
 * POST /api/bulk-valuations/upload
 * Upload and process a CSV file for bulk valuations
 *
 * Body:
 * - csvBase64: string (base64-encoded CSV)
 * - jobName: string
 * - valuationMethods: string[] (e.g., ['scorecard', 'berkus', 'vc-method'])
 * - includeReportPdf?: boolean
 */
export async function POST(request: NextRequest) {
  try {
    const { csvBase64, jobName, valuationMethods, includeReportPdf } = await request.json();

    // Validate input
    if (!csvBase64 || !jobName || !valuationMethods || valuationMethods.length === 0) {
      return errorResponse(
        "Missing required fields: csvBase64, jobName, valuationMethods",
        400
      );
    }

    if (!Array.isArray(valuationMethods)) {
      return errorResponse("valuationMethods must be an array", 400);
    }

    // Authenticate user
    const supabase = await createClient();
    const paidAccess = await requirePaidUser(supabase);
    if (!paidAccess.ok) return paidAccess.response;
    const { user, profile } = paidAccess;
    if (profile.plan !== "enterprise") {
      return errorResponse("Bulk valuation workflows require Enterprise access", 403);
    }

    // Decode base64
    let csvContent: string;
    try {
      const buffer = Buffer.from(csvBase64, "base64");
      csvContent = buffer.toString("utf-8");
    } catch (error) {
      return errorResponse("Invalid base64-encoded CSV", 400);
    }

    // Create batch
    const result = await createBulkValuationBatch(
      user.id,
      jobName,
      csvContent,
      valuationMethods,
      includeReportPdf || false
    );

    // Check if we should warn about validation errors
    if (result.errors.length > 0) {
      return successResponse(
        {
          success: true,
          batchJobId: result.batchJobId,
          totalItems: result.totalItems,
          validItems: result.validItems,
          warningMessage: `${result.errors.length} rows had validation issues and were skipped`,
          validationErrors: result.errors.slice(0, 10), // Show first 10 errors
        },
        201
      );
    }

    return successResponse(
      {
        success: true,
        batchJobId: result.batchJobId,
        totalItems: result.totalItems,
        validItems: result.validItems,
        message: "Batch job created successfully. Processing will start shortly.",
      },
      201
    );
  } catch (error: any) {
    console.error("Bulk valuation upload error:", error);
    return errorResponse(error?.message || "Failed to process bulk valuation", 500);
  }
}
