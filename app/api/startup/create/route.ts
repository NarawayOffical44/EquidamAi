import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { checkStartupCreationLimit } from "@/lib/utils/startup-limits";

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Check startup creation limit
    const adminClient = createAdminClient();
    const limitCheck = await checkStartupCreationLimit(user.id, adminClient);

    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Startup limit reached",
          message: limitCheck.message,
          tier: limitCheck.tier,
          current: limitCheck.current,
          max: limitCheck.max,
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      company_name,
      stage,
      website_url,
      arr,
      monthly_growth_rate,
      description,
      industry,
      team_size,
      founding_year,
      problem,
      solution,
    } = body;

    if (!company_name) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    // Create startup
    const { data: startupData, error: startupError } = await supabase
      .from("startups")
      .insert({
        user_id: user.id,
        company_name,
        stage: stage || "seed",
        website_url: website_url || null,
        arr: arr || 0,
        monthly_growth_rate: monthly_growth_rate || 0,
        description: description || null,
        industry: industry || null,
        team_size: team_size || 1,
        founding_year: founding_year || new Date().getFullYear(),
      })
      .select()
      .single();

    if (startupError) {
      return NextResponse.json(
        { error: "Failed to create startup", details: startupError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: startupData,
        message: "Startup created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating startup:", error);
    return NextResponse.json(
      {
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
