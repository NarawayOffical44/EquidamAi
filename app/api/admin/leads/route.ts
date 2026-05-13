import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchAdminLeadData,
  getConfiguredAdminEmail,
  isAllowedAdminEmail,
} from "@/lib/admin/leads";

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

    if (!isAllowedAdminEmail(user.email)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const adminClient = createAdminClient();
    const data = await fetchAdminLeadData(adminClient);

    return NextResponse.json({
      success: true,
      leads: data.leads,
      sourceStatus: data.sourceStatus,
      count: data.leads.length,
      adminEmail: getConfiguredAdminEmail(),
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
