import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  methodologyDetails,
  verificationChecklist,
  trustedDataSources,
  generateVerificationGuide,
} from "@/lib/valuation/methodology-documentation";
import { errorResponse, successResponse } from "@/lib/utils/response";

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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return errorResponse("Unauthorized", 401);
    }

    // Fetch valuation
    const { data: valuation, error: valuationError } = await supabase
      .from("valuations")
      .select(
        `
        id,
        user_id,
        startup_id,
        methods,
        blended_valuation_low,
        blended_valuation_high,
        blended_valuation_mid,
        generated_at,
        startups!inner(
          company_name,
          industry,
          stage,
          arr,
          growth_rate,
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

    // Get method names used
    const methodsUsed = valuation.methods || [
      "scorecard",
      "berkus",
      "vc",
      "dcf-ltg",
      "dcf-multiples",
    ];

    // Build methodology documentation
    const methodologyDocs = methodsUsed.map((method: string) => {
      const key = method.replace(/-/g, "");
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
            low: valuation.blended_valuation_low,
            mid: valuation.blended_valuation_mid,
            high: valuation.blended_valuation_high,
          },
          generatedAt: valuation.generated_at,
        },
        methodology: {
          methods: methodologyDocs,
          verificationChecklist,
          trustedDataSources,
        },
        verificationGuide: generateVerificationGuide(
          methodsUsed.map((m: string) => {
            const docs = (methodologyDetails as any)[m.replace(/-/g, "")];
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
