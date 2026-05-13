import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  methodologyDetails,
  verificationChecklist,
  trustedDataSources,
  generateVerificationGuide,
} from "@/lib/valuation/methodology-documentation";
import { errorResponse, successResponse } from "@/lib/utils/response";
import { requirePaidUser } from "@/lib/auth/paid-access";

/**
 * GET /api/valuations/[valuationId]/methodology
 *
 * Returns complete methodology documentation and verification guide
 * for a specific valuation, allowing users to independently verify results
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ valuationId: string }> }
) {
  try {
    const { valuationId } = await params;

    // Authenticate user
    const supabase = await createClient();
    const paidAccess = await requirePaidUser(supabase);
    if (!paidAccess.ok) return paidAccess.response;
    const { user } = paidAccess;

    // Fetch valuation
    const { data: valuation, error: valuationError } = await supabase
      .from("valuations")
      .select(
        `
        id,
        user_id,
        startup_id,
        blended_low_range,
        blended_high_range,
        blended_weighted_average,
        created_at,
        startups!inner(
          company_name,
          industry,
          stage,
          arr,
          monthly_growth_rate,
          team_size,
          founded_year,
          total_addressable_market
        )
      `
      )
      .eq("id", valuationId)
      .single();

    if (valuationError || !valuation) {
      return errorResponse("Valuation not found", 404);
    }

    // User can only see their own valuations
    if (valuation.user_id !== user.id) {
      return errorResponse("Forbidden", 403);
    }

    const { data: methodRows } = await supabase
      .from("valuation_methods")
      .select("method_name, method_display_name, method_inputs, calculation_steps, assumptions, benchmarks_used, methodology_explanation, key_factors_explanation, limitations")
      .eq("valuation_id", valuationId)
      .order("created_at", { ascending: true });

    // Get method names used
    const methodsUsed = methodRows && methodRows.length > 0 ? methodRows.map((m: any) => m.method_name) : [
      "scorecard",
      "berkus",
      "vc_method",
      "dcf_ltg",
      "dcf_multiples",
    ];

    // Build methodology documentation
    const methodologyDocs = methodsUsed.map((method: string) => {
      const key = method.replace(/[-_]/g, "");
      const details =
        (methodologyDetails as any)[key] ||
        (methodologyDetails as any)[method];
      return {
        method,
        ...details,
      };
    });

    return successResponse(
      {
        success: true,
        valuation: {
          id: valuation.id,
          startup: valuation.startups,
          results: {
            low: valuation.blended_low_range,
            mid: valuation.blended_weighted_average,
            high: valuation.blended_high_range,
          },
          generatedAt: valuation.created_at,
        },
        methodology: {
          methods: methodologyDocs,
          methodEvidence: methodRows || [],
          verificationChecklist,
          trustedDataSources,
        },
        verificationGuide: generateVerificationGuide(
          methodsUsed.map((m: string) => {
            const docs = (methodologyDetails as any)[m.replace(/[-_]/g, "")];
            return docs?.name || m;
          })
        ),
        importantNote:
          "These valuations use industry-standard methodologies from recognized sources. Results can be independently verified using the provided sources and checklist.",
      },
      200
    );
  } catch (error: any) {
    console.error("Error fetching methodology:", error);
    return errorResponse(error?.message || "Failed to fetch methodology", 500);
  }
}
