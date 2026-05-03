import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const startupId = id;

    // Verify startup belongs to user
    const { data: startup, error: startupError } = await supabase
      .from("startups")
      .select("id, user_id")
      .eq("id", startupId)
      .single();

    if (startupError || !startup) {
      return NextResponse.json(
        { error: "Startup not found" },
        { status: 404 }
      );
    }

    if (startup.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden - not your startup" },
        { status: 403 }
      );
    }

    // Delete all related valuations first
    await adminClient
      .from("valuations")
      .delete()
      .eq("startup_id", startupId);

    // Delete the startup
    const { error: deleteError } = await adminClient
      .from("startups")
      .delete()
      .eq("id", startupId);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete startup", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Startup and all related data deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting startup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
