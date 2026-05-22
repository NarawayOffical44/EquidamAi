import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  getAuthenticatedUser,
  getWorkspaceAccess,
  unauthorizedResponse,
  type WorkspaceAccess,
} from "@/lib/team/access";
import { logger } from "@/lib/utils/logger";
import { getPlanLimits } from "@/lib/plans/plan-limits";

type AccountRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  plan: string | null;
  plan_active: boolean | null;
  billing_cycle: string | null;
  subscription_end_date?: string | null;
  enterprise_team_seats?: number | null;
  onboarding_completed: boolean | null;
  onboarding_role: string | null;
  onboarding_data: Record<string, unknown> | null;
  sales_qualification: Record<string, unknown> | null;
};

function isPlanUsable(planActive?: boolean | null, subscriptionEndDate?: string | null) {
  if (!planActive) return false;
  if (!subscriptionEndDate) return true;
  return new Date(subscriptionEndDate) >= new Date();
}

function buildOwnWorkspaceAccess(account: AccountRow): WorkspaceAccess {
  const planActive = isPlanUsable(account.plan_active, account.subscription_end_date);
  const plan = planActive ? account.plan || "pro" : "free";

  return {
    workspaceId: account.id,
    role: "admin",
    plan,
    planActive,
    billingCycle: account.billing_cycle,
    ownerName: account.full_name,
    ownerEmail: account.email,
    seatLimit: plan === "enterprise" ? account.enterprise_team_seats || 50 : plan === "plus" || plan === "agency" ? 5 : 0,
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return unauthorizedResponse();

    const requestedWorkspaceId = request.nextUrl.searchParams.get("workspaceId");

    const { data: account, error: accountError } = await supabase
      .from("users")
      .select("id, email, full_name, plan, plan_active, billing_cycle, subscription_end_date, enterprise_team_seats, onboarding_completed, onboarding_role, onboarding_data, sales_qualification")
      .eq("id", user.id)
      .maybeSingle<AccountRow>();

    if (accountError) {
      logger.error("Failed to load workspace account", {
        userId: user.id,
        code: accountError.code,
        message: accountError.message,
      });
      return NextResponse.json({ error: "Failed to load account" }, { status: 500 });
    }

    if (!account?.onboarding_completed) {
      return NextResponse.json({ onboarding_required: true }, { status: 428 });
    }

    const adminClient = requestedWorkspaceId && requestedWorkspaceId !== user.id
      ? createAdminClient()
      : null;
    const access = adminClient
      ? await getWorkspaceAccess(adminClient, user.id, requestedWorkspaceId as string)
      : buildOwnWorkspaceAccess(account);

    if (!access) {
      return NextResponse.json({ error: "A paid workspace subscription is required" }, { status: 402 });
    }

    const workspaceClient = access.workspaceId === user.id
      ? supabase
      : adminClient || createAdminClient();

    const { data: profileData, error: profileError } = await workspaceClient
      .from("user_profiles")
      .select("tier, startup_count, max_startups")
      .eq("id", access.workspaceId)
      .maybeSingle();

    if (profileError) {
      logger.warn("Failed to load workspace profile", {
        workspaceId: access.workspaceId,
        code: profileError.code,
        message: profileError.message,
      });
    }

    const { data: startups, error } = await workspaceClient
      .from("startups")
      .select(
        `id, company_name, stage, created_at, team_size, arr, monthly_growth_rate, total_addressable_market, valuations (blended_low_range, blended_high_range, blended_weighted_average, created_at)`
      )
      .eq("user_id", access.workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Failed to load workspace startups", {
        workspaceId: access.workspaceId,
        code: error.code,
        message: error.message,
      });
      return NextResponse.json({ error: "Failed to load workspace" }, { status: 500 });
    }

    const startupCount = startups?.length || 0;
    const planLimits = getPlanLimits(access.plan, access.planActive);

    return NextResponse.json({
      success: true,
      userInfo: {
        id: user.id,
        email: user.email || account?.email || "",
        full_name: user.user_metadata?.full_name || account?.full_name || "",
        plan: access.plan,
        plan_active: access.planActive,
        billing_cycle: access.billingCycle,
        onboarding_role: account.onboarding_role,
        onboarding_data: account.onboarding_data || {},
        sales_qualification: account.sales_qualification || {},
        workspace_id: access.workspaceId,
        workspace_role: access.role,
        workspace_owner_name: access.ownerName,
        workspace_owner_email: access.ownerEmail,
      },
      profileData: {
        ...(profileData || {}),
        tier: profileData?.tier || access.plan,
        startup_count: startupCount,
        max_startups: planLimits.startupProfiles,
      },
      startups: startups || [],
    });
  } catch (error) {
    console.error("Workspace context error:", error);
    return NextResponse.json({ error: "Failed to load workspace" }, { status: 500 });
  }
}
