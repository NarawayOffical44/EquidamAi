import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getReviewerProfile } from "@/lib/auth/reviewer-checks";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@equidamai.com";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const reviewerProfile = await getReviewerProfile(user.id);
    const isAdmin = reviewerProfile?.role === "admin" || user.email === ADMIN_EMAIL;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Fetch all leads
    const adminClient = createAdminClient();
    const { data: leads, error } = await adminClient
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch leads", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      leads: leads || [],
      count: leads?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
