import type { SupabaseClient, User } from "@supabase/supabase-js";

export type IndiaFinanceAiPlan = "anonymous" | "free" | "pro" | "plus" | "enterprise";

export type IndiaFinanceAiUsage = {
  plan: IndiaFinanceAiPlan;
  limit: number;
  used: number;
  remaining: number;
  period: "day" | "month";
  upgradeRequired: boolean;
};

type UsageRecord = {
  used: number;
  periodKey: string;
};

const limits: Record<IndiaFinanceAiPlan, { limit: number; period: "day" | "month" }> = {
  anonymous: { limit: 3, period: "day" },
  free: { limit: 10, period: "month" },
  pro: { limit: 100, period: "month" },
  plus: { limit: 300, period: "month" },
  enterprise: { limit: 1000, period: "month" },
};

const globalForUsage = globalThis as typeof globalThis & {
  __indiaFinanceAiUsage?: Map<string, UsageRecord>;
};

const usageStore = globalForUsage.__indiaFinanceAiUsage || new Map<string, UsageRecord>();
globalForUsage.__indiaFinanceAiUsage = usageStore;

function periodKey(period: "day" | "month") {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return period === "day" ? `${year}-${month}-${day}` : `${year}-${month}`;
}

function planFromProfile(profile: { plan?: string | null; plan_active?: boolean | null } | null): IndiaFinanceAiPlan {
  if (!profile?.plan_active) return "free";
  if (profile.plan === "enterprise") return "enterprise";
  if (profile.plan === "plus") return "plus";
  if (profile.plan === "pro") return "pro";
  return "free";
}

function usageKey(plan: IndiaFinanceAiPlan, user: User | null, sessionToken: string, ip: string) {
  if (user) return `user:${user.id}`;
  return `anon:${sessionToken || ip || "unknown"}`;
}

export async function getIndiaFinanceAiAccess(params: {
  supabase: SupabaseClient;
  sessionToken: string;
  ip: string;
}): Promise<{ user: User | null; key: string; usage: IndiaFinanceAiUsage }> {
  const {
    data: { user },
  } = await params.supabase.auth.getUser();

  let plan: IndiaFinanceAiPlan = user ? "free" : "anonymous";

  if (user) {
    const { data: profile } = await params.supabase
      .from("users")
      .select("plan, plan_active")
      .eq("id", user.id)
      .single();

    plan = planFromProfile(profile);
  }

  const limitConfig = limits[plan];
  const key = usageKey(plan, user, params.sessionToken, params.ip);
  const currentPeriodKey = periodKey(limitConfig.period);
  const record = usageStore.get(key);
  const used = record?.periodKey === currentPeriodKey ? record.used : 0;

  return {
    user,
    key,
    usage: {
      plan,
      limit: limitConfig.limit,
      used,
      remaining: Math.max(0, limitConfig.limit - used),
      period: limitConfig.period,
      upgradeRequired: used >= limitConfig.limit,
    },
  };
}

export function recordIndiaFinanceAiUse(key: string, usage: IndiaFinanceAiUsage): IndiaFinanceAiUsage {
  const currentPeriodKey = periodKey(usage.period);
  const record = usageStore.get(key);
  const nextUsed = record?.periodKey === currentPeriodKey ? record.used + 1 : 1;
  usageStore.set(key, { used: nextUsed, periodKey: currentPeriodKey });

  return {
    ...usage,
    used: nextUsed,
    remaining: Math.max(0, usage.limit - nextUsed),
    upgradeRequired: nextUsed >= usage.limit,
  };
}
