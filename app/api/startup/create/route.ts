import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { checkStartupCreationLimit, incrementStartupCreationUsageIfNeeded } from "@/lib/utils/startup-limits";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

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
      total_addressable_market,
      profile_data,
    } = body as Record<string, unknown>;

    if (!company_name || typeof company_name !== "string") {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        total_addressable_market: total_addressable_market || 0,
        profile_data: profile_data || {},
      })
      .select()
      .single();

    if (startupError) {
      return NextResponse.json(
        { error: "Failed to create startup", details: startupError.message },
        { status: 500 }
      );
    }

    await incrementStartupCreationUsageIfNeeded(user.id, adminClient, limitCheck.current);

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
