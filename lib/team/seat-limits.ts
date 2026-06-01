import { getPlanLimits } from "@/lib/plans/plan-limits";

export const TEAM_SEAT_UPGRADE_LABEL = "Agency / Investor or Enterprise";

export function normalizeTeamPlan(plan?: string | null) {
  return String(plan || "free").trim().toLowerCase();
}

export function getTeamSeatLimit(plan?: string | null) {
  return getPlanLimits(plan, true).teamSeats;
}

export function canUseTeamSeats(plan?: string | null, planActive?: boolean | null) {
  return Boolean(planActive) && getTeamSeatLimit(plan) > 0;
}

type TeamSeatRow = {
  role?: string | null;
  status?: string | null;
  invitation_expires_at?: string | null;
};

export function isReservedTeamSeat(member: TeamSeatRow | null | undefined) {
  if (!member || member.role === "owner") return false;
  if (member.status === "accepted") return true;
  return member.status === "pending"
    && Boolean(member.invitation_expires_at)
    && new Date(member.invitation_expires_at as string) > new Date();
}

export function countUsedTeamSeats(members: TeamSeatRow[] | null | undefined) {
  return (members || []).filter(isReservedTeamSeat).length;
}
