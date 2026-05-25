import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePaidUser } from "@/lib/auth/paid-access";
import {
  getAuthenticatedUser,
  getStartupWorkspaceAccess,
  unauthorizedResponse,
} from "@/lib/team/access";

const STARTUP_INPUT_NUMBER_FIELDS = [
  "team_size",
  "arr",
  "monthly_growth_rate",
  "total_addressable_market",
] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const adminClient = createAdminClient();
    const startupAccess = await getStartupWorkspaceAccess(adminClient, user.id, id);

    if (!startupAccess) {
      return NextResponse.json({ error: "Startup not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      startup: startupAccess.startup,
      access: {
        workspaceId: startupAccess.access.workspaceId,
        role: startupAccess.access.role,
        plan: startupAccess.access.plan,
        planActive: startupAccess.access.planActive,
        billingCycle: startupAccess.access.billingCycle,
        ownerName: startupAccess.access.ownerName,
        ownerEmail: startupAccess.access.ownerEmail,
      },
    });
  } catch (error) {
    console.error("Error loading startup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const adminClient = createAdminClient();
    const startupAccess = await getStartupWorkspaceAccess(adminClient, user.id, id);

    if (!startupAccess) {
      return NextResponse.json({ error: "Startup not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
    }

    const updatePayload = buildStartupInputUpdate(body as Record<string, unknown>, startupAccess.startup);
    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No editable startup inputs provided" }, { status: 400 });
    }

    const { data: updatedStartup, error: updateError } = await adminClient
      .from("startups")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update startup", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      startup: updatedStartup,
      access: {
        workspaceId: startupAccess.access.workspaceId,
        role: startupAccess.access.role,
      },
    });
  } catch (error) {
    console.error("Error updating startup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const paidAccess = await requirePaidUser(supabase);
    if (!paidAccess.ok) return paidAccess.response;
    const { user } = paidAccess;

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

function buildStartupInputUpdate(
  body: Record<string, unknown>,
  startup: Record<string, unknown>
) {
  const updatePayload: Record<string, unknown> = {};

  for (const field of STARTUP_INPUT_NUMBER_FIELDS) {
    if (!(field in body)) continue;
    const value = body[field];
    if (value === null || value === "") {
      updatePayload[field] = field === "team_size" || field === "total_addressable_market" ? null : 0;
      continue;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) continue;
    updatePayload[field] = field === "team_size" ? Math.max(0, Math.floor(parsed)) : Math.max(0, parsed);
  }

  if (body.profile_data && typeof body.profile_data === "object" && !Array.isArray(body.profile_data)) {
    updatePayload.profile_data = {
      ...((startup.profile_data as Record<string, unknown> | null) || {}),
      ...(body.profile_data as Record<string, unknown>),
    };
  }

  return updatePayload;
}
