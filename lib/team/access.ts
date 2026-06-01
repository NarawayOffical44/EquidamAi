import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { canUseTeamSeats, getTeamSeatLimit } from "@/lib/team/seat-limits";
import { normalizePlanKey } from "@/lib/plans/plan-limits";

export type WorkspaceRole = "admin" | "member" | "startup_contributor";
type StartupRow = Record<string, unknown> & { id: string; user_id: string };
type ValuationRow = Record<string, unknown> & { id: string; user_id: string; startup_id: string };

export interface WorkspaceAccess {
  workspaceId: string;
  role: WorkspaceRole;
  plan: string;
  planActive: boolean;
  billingCycle?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  seatLimit: number;
}

export interface StartupWorkspaceAccess {
  access: WorkspaceAccess;
  startup: StartupRow;
  startupCardAccessId?: string;
}

export interface ValuationWorkspaceAccess {
  access: WorkspaceAccess;
  valuation: ValuationRow;
}

export async function getAuthenticatedUser(supabase: SupabaseClient): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function paidWorkspaceRequiredResponse() {
  return NextResponse.json(
    {
      error: "Paid workspace access is inactive or ended. Free plan limits now apply. Upgrade again to restore this feature.",
      upgradeUrl: "/pricing?plan=startup",
    },
    { status: 402 }
  );
}

export function adminOnlyResponse(message = "Only the workspace Admin can perform this action") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function isWorkspaceAdmin(access: WorkspaceAccess | null | undefined) {
  return access?.role === "admin";
}

export async function getWorkspaceAccess(
  adminClient: SupabaseClient,
  userId: string,
  workspaceId: string
): Promise<WorkspaceAccess | null> {
  const { data: owner } = await adminClient
    .from("users")
    .select("id, email, full_name, plan, plan_active, billing_cycle, subscription_end_date")
    .eq("id", workspaceId)
    .single();

  if (!owner) return null;

  const ownerPlanUsable = isPlanUsable(owner.plan_active, owner.subscription_end_date);
  const accessPlan = ownerPlanUsable ? owner.plan || "free" : "free";

  const accessBase = {
    workspaceId,
    plan: accessPlan,
    planActive: ownerPlanUsable,
    billingCycle: owner.billing_cycle,
    ownerName: owner.full_name,
    ownerEmail: owner.email,
    seatLimit: getTeamSeatLimit(accessPlan),
  };

  if (userId === workspaceId) {
    return {
      ...accessBase,
      role: "admin",
    };
  }

  if (!canUseTeamSeats(accessPlan, ownerPlanUsable)) {
    return null;
  }

  const { data: membership } = await adminClient
    .from("team_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "accepted")
    .maybeSingle();

  if (!membership) return null;

  return {
    ...accessBase,
    role: "member",
  };
}

export async function getPrimaryWorkspaceAccess(
  adminClient: SupabaseClient,
  userId: string
): Promise<WorkspaceAccess | null> {
  const ownAccess = await getWorkspaceAccess(adminClient, userId, userId);
  if (ownAccess) return ownAccess;

  const { data: memberships } = await adminClient
    .from("team_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .eq("status", "accepted")
    .order("accepted_at", { ascending: false, nullsFirst: false })
    .limit(10);

  for (const membership of memberships || []) {
    const access = await getWorkspaceAccess(adminClient, userId, membership.workspace_id);
    if (access) return access;
  }

  return null;
}

export async function getPrimaryStartupCardAccess(
  adminClient: SupabaseClient,
  userId: string
): Promise<StartupWorkspaceAccess | null> {
  const { data: cardAccess } = await adminClient
    .from("startup_card_access")
    .select("id, startup_id")
    .eq("user_id", userId)
    .eq("status", "accepted")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!cardAccess?.startup_id) return null;
  return getStartupWorkspaceAccess(adminClient, userId, cardAccess.startup_id);
}

export async function getOwnTeamAdminAccess(
  adminClient: SupabaseClient,
  userId: string
): Promise<WorkspaceAccess | null> {
  const access = await getWorkspaceAccess(adminClient, userId, userId);
  if (!access || !canUseTeamSeats(access.plan, access.planActive)) return null;
  return access;
}

export async function getStartupWorkspaceAccess(
  adminClient: SupabaseClient,
  userId: string,
  startupId: string
): Promise<StartupWorkspaceAccess | null> {
  const { data: startup } = await adminClient
    .from("startups")
    .select("*")
    .eq("id", startupId)
    .single();

  if (!startup) return null;

  const access = await getWorkspaceAccess(adminClient, userId, startup.user_id);
  if (access) return { access, startup };

  const { data: cardAccess } = await adminClient
    .from("startup_card_access")
    .select("id, workspace_id")
    .eq("startup_id", startupId)
    .eq("user_id", userId)
    .eq("status", "accepted")
    .maybeSingle();

  if (!cardAccess || cardAccess.workspace_id !== startup.user_id) return null;

  const ownerAccess = await getWorkspaceAccess(adminClient, startup.user_id, startup.user_id);
  if (
    !ownerAccess ||
    !ownerAccess.planActive ||
    !["agency", "enterprise"].includes(normalizePlanKey(ownerAccess.plan, ownerAccess.planActive))
  ) {
    return null;
  }

  return {
    access: {
      ...ownerAccess,
      role: "startup_contributor",
    },
    startup,
    startupCardAccessId: cardAccess.id,
  };
}

export async function getValuationWorkspaceAccess(
  adminClient: SupabaseClient,
  userId: string,
  valuationId: string
): Promise<ValuationWorkspaceAccess | null> {
  const { data: valuation } = await adminClient
    .from("valuations")
    .select("*")
    .eq("id", valuationId)
    .single();

  if (!valuation) return null;

  const access = await getWorkspaceAccess(adminClient, userId, valuation.user_id);
  if (!access) return null;

  return { access, valuation };
}

function isPlanUsable(planActive?: boolean | null, subscriptionEndDate?: string | null) {
  if (!planActive) return false;
  if (!subscriptionEndDate) return true;
  return new Date(subscriptionEndDate) >= new Date();
}
