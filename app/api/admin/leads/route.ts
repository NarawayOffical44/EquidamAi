import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchAdminLeadData,
  getAdminAccessForUser,
} from "@/lib/admin/leads";

export async function GET(_request: NextRequest) {
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

    const adminClient = createAdminClient();
    const adminAccess = await getAdminAccessForUser(adminClient, {
      id: user.id,
      email: user.email,
    });

    if (!adminAccess.allowed) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const data = await fetchAdminLeadData(adminClient);

    return NextResponse.json({
      success: true,
      leads: data.leads,
      sourceStatus: data.sourceStatus,
      count: data.leads.length,
      adminAccess: adminAccess.method,
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
