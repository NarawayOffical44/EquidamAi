import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  getAuthenticatedUser,
  getPrimaryStartupCardAccess,
  getWorkspaceAccess,
  unauthorizedResponse,
  type WorkspaceAccess,
} from "@/lib/team/access";
import { logger } from "@/lib/utils/logger";
import { getPlanLimits } from "@/lib/plans/plan-limits";
import { claimPendingPaidCheckout } from "@/lib/payments/pending-paid-checkout";

type AccountRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  plan: string | null;
  plan_active: boolean | null;
  billing_cycle: string | null;
  subscription_id?: string | null;
  subscription_start_date?: string | null;
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
  const plan = planActive ? account.plan || "free" : "free";
  const planLimits = getPlanLimits(plan, planActive);

  return {
    workspaceId: account.id,
    role: "admin",
    plan,
    planActive,
    billingCycle: account.billing_cycle,
    ownerName: account.full_name,
    ownerEmail: account.email,
    seatLimit: planLimits.key === "enterprise" ? account.enterprise_team_seats || planLimits.teamSeats : planLimits.teamSeats,
  };
}

async function downgradeExpiredSubscription(adminClient: ReturnType<typeof createAdminClient>, account: AccountRow) {
  if (!account.plan_active || !account.subscription_end_date || new Date(account.subscription_end_date) >= new Date()) {
    return account;
  }

  const endedAt = new Date().toISOString();
  const { error } = await adminClient
    .from("users")
    .update({
      plan: "free",
      plan_active: false,
      subscription_id: null,
      subscription_end_date: endedAt,
    })
    .eq("id", account.id);

  if (error) {
    logger.warn("Failed to downgrade expired subscription", { userId: account.id, error });
    return account;
  }

  await adminClient
    .from("user_profiles")
    .update({
      tier: "free",
      max_startups: 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", account.id);

  return {
    ...account,
    plan: "free",
    plan_active: false,
    subscription_id: null,
    subscription_end_date: endedAt,
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return unauthorizedResponse();

    const requestedWorkspaceId = request.nextUrl.searchParams.get("workspaceId");

    const { data: initialAccount, error: accountError } = await supabase
      .from("users")
      .select("id, email, full_name, avatar_url, plan, plan_active, billing_cycle, subscription_id, subscription_start_date, subscription_end_date, enterprise_team_seats, onboarding_completed, onboarding_role, onboarding_data, sales_qualification")
      .eq("id", user.id)
      .maybeSingle<AccountRow>();

    let account = initialAccount;

    if (accountError) {
      logger.error("Failed to load workspace account", {
        userId: user.id,
        code: accountError.code,
        message: accountError.message,
      });
      return NextResponse.json({ error: "Failed to load account" }, { status: 500 });
    }

    const adminForActivation = createAdminClient();
    if (account) {
      account = await downgradeExpiredSubscription(adminForActivation, account);
    }

    const paymentActivation = await claimPendingPaidCheckout(adminForActivation, user.email || account?.email, user.id);
    if (!paymentActivation.ok) {
      return NextResponse.json(
        { error: "Your payment was received. We are finishing account activation now. Please refresh in a moment." },
        { status: 202 }
      );
    }

    if (paymentActivation.claimed) {
      const { data: refreshedAccount, error: refreshError } = await supabase
        .from("users")
        .select("id, email, full_name, avatar_url, plan, plan_active, billing_cycle, subscription_id, subscription_start_date, subscription_end_date, enterprise_team_seats, onboarding_completed, onboarding_role, onboarding_data, sales_qualification")
        .eq("id", user.id)
        .maybeSingle<AccountRow>();

      if (refreshError) {
        logger.error("Failed to reload activated workspace account", {
          userId: user.id,
          code: refreshError.code,
          message: refreshError.message,
        });
      } else if (refreshedAccount) {
        account = refreshedAccount;
      }
    }

    if (!account?.onboarding_completed) {
      return NextResponse.json({ onboarding_required: true }, { status: 428 });
    }

    if (!requestedWorkspaceId && !isPlanUsable(account.plan_active, account.subscription_end_date)) {
      const contributorAccess = await getPrimaryStartupCardAccess(createAdminClient(), user.id);
      if (contributorAccess) {
        const startup = {
          ...contributorAccess.startup,
          valuations: [],
        };

        return NextResponse.json({
          success: true,
          userInfo: {
            id: user.id,
            email: user.email || account.email || "",
            full_name: user.user_metadata?.full_name || account.full_name || "",
            avatar_url: account.avatar_url || null,
            plan: contributorAccess.access.plan,
            plan_active: contributorAccess.access.planActive,
            billing_cycle: contributorAccess.access.billingCycle,
            subscription_id: account.subscription_id || null,
            subscription_start_date: account.subscription_start_date || null,
            subscription_end_date: account.subscription_end_date || null,
            onboarding_role: account.onboarding_role,
            onboarding_data: account.onboarding_data || {},
            sales_qualification: account.sales_qualification || {},
            workspace_id: contributorAccess.access.workspaceId,
            workspace_role: contributorAccess.access.role,
            workspace_owner_name: contributorAccess.access.ownerName,
            workspace_owner_email: contributorAccess.access.ownerEmail,
          },
          profileData: {
            tier: "startup_contributor",
            startup_count: 1,
            max_startups: 1,
          },
          startups: [startup],
        });
      }
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
        `id, company_name, logo_url, stage, industry, created_at, team_size, arr, monthly_growth_rate, total_addressable_market, valuations (id, blended_low_range, blended_high_range, blended_weighted_average, created_at)`
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
        avatar_url: account.avatar_url || null,
        plan: access.plan,
        plan_active: access.planActive,
        billing_cycle: access.billingCycle,
        subscription_id: account.subscription_id || null,
        subscription_start_date: account.subscription_start_date || null,
        subscription_end_date: account.subscription_end_date || null,
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
