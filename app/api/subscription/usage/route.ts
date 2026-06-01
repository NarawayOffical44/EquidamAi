import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getAiUsageAccess } from "@/lib/india-finance-ai/usage-limits";
import { claimPendingPaidCheckout } from "@/lib/payments/pending-paid-checkout";
import { getPlanLimits, normalizePlanKey } from "@/lib/plans/plan-limits";
import { countUsedTeamSeats } from "@/lib/team/seat-limits";
import {
  getAuthenticatedUser,
  getPrimaryWorkspaceAccess,
  getWorkspaceAccess,
  unauthorizedResponse,
} from "@/lib/team/access";

type TeamMemberRow = {
  role?: string | null;
  status?: string | null;
  invitation_expires_at?: string | null;
};

type BillingRow = {
  plan: string | null;
  plan_active: boolean | null;
  billing_cycle: string | null;
  subscription_id: string | null;
  subscription_end_date: string | null;
  subscription_cancel_at_period_end?: boolean | null;
  subscription_cancelled_at?: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return unauthorizedResponse();

    const adminClient = createAdminClient();
    await claimPendingPaidCheckout(adminClient, user.email, user.id);

    const requestedWorkspaceId = request.nextUrl.searchParams.get("workspaceId");
    const access = requestedWorkspaceId
      ? await getWorkspaceAccess(adminClient, user.id, requestedWorkspaceId)
      : await getPrimaryWorkspaceAccess(adminClient, user.id);

    if (!access) {
      return NextResponse.json({ error: "Workspace access is required." }, { status: 403 });
    }

    const planKey = normalizePlanKey(access.plan, access.planActive);
    const planLimits = getPlanLimits(planKey, access.planActive);
    const usageKeyOverride = `workspace:${access.workspaceId}`;

    const [
      startupCountResult,
      teamMembersResult,
      reportUsageResult,
      aiUsageResult,
      billingResult,
    ] = await Promise.all([
      adminClient
        .from("startups")
        .select("id", { count: "exact", head: true })
        .eq("user_id", access.workspaceId),
      planLimits.teamSeats > 0
        ? adminClient
            .from("team_members")
            .select("role, status, invitation_expires_at")
            .eq("workspace_id", access.workspaceId)
        : Promise.resolve({ data: [] as TeamMemberRow[], error: null }),
      getAiUsageAccess({
        supabase,
        sessionToken: "",
        ip: request.headers.get("x-forwarded-for") || "",
        feature: "report_download",
        planOverride: planKey,
        usageKeyOverride,
        userIdOverride: access.workspaceId,
      }),
      getAiUsageAccess({
        supabase,
        sessionToken: "",
        ip: request.headers.get("x-forwarded-for") || "",
        feature: "startup_ai",
        planOverride: planKey,
        usageKeyOverride,
        userIdOverride: access.workspaceId,
      }),
      loadBilling(adminClient, access.workspaceId),
    ]);

    const teamMembers = (teamMembersResult.data || []) as TeamMemberRow[];
    const reportUsage = reportUsageResult.usage;
    const aiUsage = aiUsageResult.usage;
    const subscriptionEndDate = billingResult?.subscription_end_date || null;
    const billingPlan = billingResult?.plan || access.plan;
    const rawPlanActive = Boolean(billingResult?.plan_active ?? access.planActive) && (
      !subscriptionEndDate || new Date(subscriptionEndDate) >= new Date()
    );
    const planActive = rawPlanActive && normalizePlanKey(billingPlan, rawPlanActive) !== "free";

    return NextResponse.json({
      success: true,
      billing: {
        plan: billingPlan,
        planActive,
        billingCycle: billingResult?.billing_cycle || access.billingCycle || null,
        subscriptionId: billingResult?.subscription_id || null,
        subscriptionEndDate,
        cancelAtPeriodEnd: Boolean(billingResult?.subscription_cancel_at_period_end),
        cancelledAt: billingResult?.subscription_cancelled_at || null,
      },
      usage: {
        startupProfiles: {
          used: startupCountResult.count || 0,
          limit: planLimits.startupProfiles,
          label: "Startup profiles",
        },
        reportDownloads: {
          used: reportUsage.used,
          limit: reportUsage.limit,
          resetAt: reportUsage.resetAt,
          label: "PDF reports this month",
        },
        aiQuestions: {
          used: aiUsage.used,
          limit: aiUsage.limit,
          resetAt: aiUsage.resetAt,
          label: "Startup AI questions",
        },
        teamSeats: {
          used: countUsedTeamSeats(teamMembers),
          limit: planLimits.teamSeats,
          label: "Team seats",
        },
      },
    });
  } catch (error) {
    console.error("Subscription usage error:", error);
    return NextResponse.json({ error: "Could not load subscription usage." }, { status: 500 });
  }
}

async function loadBilling(adminClient: ReturnType<typeof createAdminClient>, workspaceId: string) {
  const withCancelState = await adminClient
    .from("users")
    .select("plan, plan_active, billing_cycle, subscription_id, subscription_end_date, subscription_cancel_at_period_end, subscription_cancelled_at")
    .eq("id", workspaceId)
    .maybeSingle<BillingRow>();

  if (!withCancelState.error) return withCancelState.data;

  const fallback = await adminClient
    .from("users")
    .select("plan, plan_active, billing_cycle, subscription_id, subscription_end_date")
    .eq("id", workspaceId)
    .maybeSingle<BillingRow>();

  return fallback.data || null;
}
