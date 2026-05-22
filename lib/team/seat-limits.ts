export const TEAM_SEAT_UPGRADE_LABEL = "Agency / Investor or Enterprise";

const BUSINESS_TEAM_SEATS = 5;
const ENTERPRISE_TEAM_SEATS = 999999;

export function normalizeTeamPlan(plan?: string | null) {
  return String(plan || "free").trim().toLowerCase();
}

export function getTeamSeatLimit(plan?: string | null) {
  const normalizedPlan = normalizeTeamPlan(plan);

  if (normalizedPlan === "plus" || normalizedPlan === "business" || normalizedPlan === "advisor" || normalizedPlan === "agency") {
    return BUSINESS_TEAM_SEATS;
  }

  if (normalizedPlan === "enterprise") {
    return ENTERPRISE_TEAM_SEATS;
  }

  return 0;
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
