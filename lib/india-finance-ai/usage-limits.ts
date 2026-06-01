import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { ANONYMOUS_AI_LIMIT, PLAN_LIMITS, normalizePlanKey, type PlanKey, type PlanPeriod } from "@/lib/plans/plan-limits";

export type IndiaFinanceAiPlan = "anonymous" | PlanKey;
export type AiUsageFeature = "startup_ai" | "workspace_chat" | "valuation_preview" | "report_download";

export type IndiaFinanceAiUsage = {
  userId: string | null;
  feature: AiUsageFeature;
  plan: IndiaFinanceAiPlan;
  limit: number;
  used: number;
  remaining: number;
  period: PlanPeriod;
  periodKey: string;
  resetAt: string;
  promptCharacterLimit: number | null;
  upgradeRequired: boolean;
};

function getPeriodWindow(period: PlanPeriod) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const day = now.getUTCDate();
  const monthText = String(month + 1).padStart(2, "0");
  const dayText = String(day).padStart(2, "0");

  if (period === "day") {
    return {
      periodKey: `${year}-${monthText}-${dayText}`,
      resetAt: new Date(Date.UTC(year, month, day + 1, 0, 0, 0)).toISOString(),
    };
  }

  return {
    periodKey: `${year}-${monthText}`,
    resetAt: new Date(Date.UTC(year, month + 1, 1, 0, 0, 0)).toISOString(),
  };
}

function limitForPlan(plan: IndiaFinanceAiPlan, feature: AiUsageFeature) {
  if (feature === "report_download") {
    return {
      limit: plan === "anonymous" ? 0 : PLAN_LIMITS[plan].reportsPerMonth,
      period: "month" as const,
    };
  }
  if (plan === "anonymous") return ANONYMOUS_AI_LIMIT;
  if (feature === "valuation_preview") return PLAN_LIMITS[plan].valuationPreviews;
  return PLAN_LIMITS[plan].aiQuestions;
}

function promptCharacterLimitForPlan(plan: IndiaFinanceAiPlan) {
  if (plan === "anonymous") return ANONYMOUS_AI_LIMIT.promptCharacterLimit;
  return PLAN_LIMITS[plan].aiPromptCharacterLimit;
}

function planFromProfile(profile: { plan?: string | null; plan_active?: boolean | null; subscription_end_date?: string | null } | null): PlanKey {
  const planActive = Boolean(profile?.plan_active) && (
    !profile?.subscription_end_date || new Date(profile.subscription_end_date) >= new Date()
  );
  return normalizePlanKey(profile?.plan, planActive);
}

function usageKey(user: User | null, sessionToken: string, ip: string) {
  if (user) return `user:${user.id}`;
  return `anon:${sessionToken || ip || "unknown"}`;
}

function usageCounterFeature(feature: AiUsageFeature): AiUsageFeature {
  return feature === "startup_ai" ? "workspace_chat" : feature;
}

export async function getAiUsageAccess(params: {
  supabase: SupabaseClient;
  sessionToken: string;
  ip: string;
  feature: AiUsageFeature;
  planOverride?: IndiaFinanceAiPlan;
  usageKeyOverride?: string;
  userIdOverride?: string | null;
}): Promise<{ user: User | null; key: string; usage: IndiaFinanceAiUsage }> {
  const {
    data: { user },
  } = await params.supabase.auth.getUser();

  let plan: IndiaFinanceAiPlan = params.planOverride || (user ? "free" : "anonymous");

  if (user && !params.planOverride) {
    const { data: profile } = await params.supabase
      .from("users")
      .select("plan, plan_active, subscription_end_date")
      .eq("id", user.id)
      .single();

    plan = planFromProfile(profile);
  }

  const limitConfig = limitForPlan(plan, params.feature);
  const counterFeature = usageCounterFeature(params.feature);
  const { periodKey, resetAt } = getPeriodWindow(limitConfig.period);
  const key = params.usageKeyOverride || usageKey(user, params.sessionToken, params.ip);
  const usageUserId = params.userIdOverride ?? user?.id ?? null;
  let used = 0;

  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("ai_usage_counters")
      .select("used_count")
      .eq("usage_key", key)
      .eq("feature", counterFeature)
      .eq("period_key", periodKey)
      .maybeSingle();

    used = Number(data?.used_count || 0);
  } catch {
    used = 0;
  }

  return {
    user,
    key,
    usage: {
      userId: usageUserId,
      feature: counterFeature,
      plan,
      limit: limitConfig.limit,
      used,
      remaining: Math.max(0, limitConfig.limit - used),
      period: limitConfig.period,
      periodKey,
      resetAt,
      promptCharacterLimit: promptCharacterLimitForPlan(plan),
      upgradeRequired: used >= limitConfig.limit,
    },
  };
}

export async function recordAiUsageUse(key: string, usage: IndiaFinanceAiUsage): Promise<IndiaFinanceAiUsage> {
  let nextUsed = usage.used + 1;

  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient.rpc("increment_ai_usage_counter", {
      p_user_id: usage.userId,
      p_usage_key: key,
      p_feature: usage.feature,
      p_plan_key: usage.plan,
      p_period_key: usage.periodKey,
      p_reset_at: usage.resetAt,
    });
    nextUsed = Number(data || nextUsed);
  } catch {
    nextUsed = usage.used + 1;
  }

  return {
    ...usage,
    used: nextUsed,
    remaining: Math.max(0, usage.limit - nextUsed),
    upgradeRequired: nextUsed >= usage.limit,
  };
}

export async function recordAiUsageUseIfAvailable(
  key: string,
  usage: IndiaFinanceAiUsage
): Promise<{ allowed: boolean; usage: IndiaFinanceAiUsage }> {
  if (usage.used >= usage.limit) {
    return { allowed: false, usage: { ...usage, remaining: 0, upgradeRequired: true } };
  }

  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.rpc("increment_ai_usage_counter_if_available", {
      p_user_id: usage.userId,
      p_usage_key: key,
      p_feature: usage.feature,
      p_plan_key: usage.plan,
      p_period_key: usage.periodKey,
      p_reset_at: usage.resetAt,
      p_limit: usage.limit,
    });

    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    const nextUsed = Number(row?.used_count ?? usage.used);

    return {
      allowed: Boolean(row?.allowed),
      usage: {
        ...usage,
        used: nextUsed,
        remaining: Math.max(0, usage.limit - nextUsed),
        upgradeRequired: nextUsed >= usage.limit,
      },
    };
  } catch {
    return {
      allowed: false,
      usage: {
        ...usage,
        remaining: 0,
        upgradeRequired: true,
      },
    };
  }
}

export function getAiPromptLengthMessage(limit: number) {
  return `Free AI prompts are limited to ${limit.toLocaleString()} characters. Shorten your question or upgrade for longer prompts.`;
}

export function isPromptTooLong(message: string, usage: IndiaFinanceAiUsage) {
  return Boolean(usage.promptCharacterLimit && message.length > usage.promptCharacterLimit);
}

export function getAiLimitMessage(usage: IndiaFinanceAiUsage) {
  const reset = usage.period === "day" ? "tomorrow" : "next month";
  if (usage.feature === "valuation_preview") {
    return `You've used all ${usage.limit} valuation preview${usage.limit === 1 ? "" : "s"} for this ${usage.period}. Your limit resets ${reset}.`;
  }
  if (usage.feature === "report_download") {
    return `You've used all ${usage.limit} report download${usage.limit === 1 ? "" : "s"} for this ${usage.period}. Your limit resets ${reset}.`;
  }
  return `You've used all ${usage.limit} Evaldam AI question${usage.limit === 1 ? "" : "s"} for this ${usage.period}. Your limit resets ${reset}.`;
}

export async function getIndiaFinanceAiAccess(params: {
  supabase: SupabaseClient;
  sessionToken: string;
  ip: string;
}): Promise<{ user: User | null; key: string; usage: IndiaFinanceAiUsage }> {
  return getAiUsageAccess({
    ...params,
    feature: "startup_ai",
  });
}

export async function recordIndiaFinanceAiUse(key: string, usage: IndiaFinanceAiUsage): Promise<IndiaFinanceAiUsage> {
  return recordAiUsageUse(key, usage);
}
