import { NextRequest, NextResponse } from "next/server";
import { StartupProfile } from "@/types";
import { ProfessionalValuationEngine } from "@/lib/valuation/professional-engine";
import { generateProfessionalReport } from "@/lib/valuation/report-template";
import { logger } from "@/lib/utils/logger";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { ValidationError } from "@/lib/utils/errors";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { startupProfile, userId } = body;

    // Validation
    if (!startupProfile || !userId) {
      throw new ValidationError(
        "Missing required fields: startupProfile and userId"
      );
    }

    const profile = startupProfile as StartupProfile;

    if (!profile.companyName) {
      throw new ValidationError("Company name is required");
    }

    if (!profile.stage) {
      throw new ValidationError("Company stage is required");
    }

    // Check plan limits
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('plan')
        .eq('id', user.id)
        .single();

      const userPlan = userData?.plan || 'free';

      if (userPlan === 'free') {
        const { count: reportCount } = await supabase
          .from('valuations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if ((reportCount || 0) >= 3) {
          throw new ValidationError(
            'FREE_PLAN_LIMIT_REACHED|Free plan limited to 3 evaluation reports. Upgrade to Pro for unlimited reports.'
          );
        }
      }
    }

    // Check for required fields for accurate valuation
    const requiredFields = [
      { name: "team", label: "Team information (size, background)" },
      { name: "annualRecurringRevenue", label: "Annual Recurring Revenue (ARR)" },
      { name: "monthlyGrowthRate", label: "Monthly Growth Rate (%)" },
      { name: "totalAddressableMarket", label: "Total Addressable Market (TAM)" },
    ];

    const missingFields = requiredFields.filter((field) => {
      const value = (profile as any)[field.name];
      return value === null || value === undefined || value === "" || value === 0;
    });

    if (missingFields.length > 0) {
      const missingLabels = missingFields.map((f) => f.label).join(", ");
      throw new ValidationError(
        `Cannot generate accurate valuation with incomplete data. Missing: ${missingLabels}. Please provide all required information to ensure a comprehensive and accurate report.`
      );
    }

    logger.info("Evaldam: Valuation request", {
      company: profile.companyName,
      stage: profile.stage,
      userId,
    });

    // Run professional valuation engine
    const engine = new ProfessionalValuationEngine(profile, userId);
    const valuation = await engine.execute();

    // Generate professional report
    const reportMarkdown = generateProfessionalReport(valuation, profile);

    const processingTime = Date.now() - startTime;

    logger.info("Evaldam: Valuation complete", {
      company: profile.companyName,
      blendedValuation: valuation.blended.weightedAverage,
      confidenceLevel: valuation.confidenceLevel,
      processingTime: `${processingTime}ms`,
    });

    return successResponse(
      {
        valuation,
        reportMarkdown,
        processingTime,
      },
      200,
      processingTime
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error("Evaldam: Valuation failed", { error: errorMsg, stack: error instanceof Error ? error.stack : undefined });

    return NextResponse.json(
      {
        success: false,
        error: "Valuation failed",
        details: errorMsg,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
