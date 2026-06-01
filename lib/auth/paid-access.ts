import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export type PaidPlan = "pro" | "plus" | "startup" | "agency" | "enterprise";

export type PaidAccessResult =
  | {
      ok: true;
      user: User;
      profile: {
        plan: PaidPlan;
        plan_active: boolean;
        subscription_end_date: string | null;
        enterprise_startup_limit?: number | null;
      };
    }
  | {
      ok: false;
      response: NextResponse;
    };

export async function requirePaidUser(
  supabase: SupabaseClient
): Promise<PaidAccessResult> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("plan, plan_active, subscription_end_date, enterprise_startup_limit")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.plan_active) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Paid access is inactive. Free plan limits now apply. Upgrade again to restore paid features.",
          upgradeUrl: "/pricing?plan=startup",
        },
        { status: 402 }
      ),
    };
  }

  if (profile.subscription_end_date && new Date(profile.subscription_end_date) < new Date()) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Your subscription period has ended. Free plan limits now apply. Upgrade again to restore paid features.",
          subscriptionEndDate: profile.subscription_end_date,
          upgradeUrl: "/pricing?plan=startup",
        },
        { status: 402 }
      ),
    };
  }

  return {
    ok: true,
    user,
    profile: {
      plan: profile.plan as PaidPlan,
      plan_active: true,
      subscription_end_date: profile.subscription_end_date,
      enterprise_startup_limit: profile.enterprise_startup_limit,
    },
  };
}
