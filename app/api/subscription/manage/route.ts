import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  getRazorpayConfig,
  getRawRazorpaySubscriptionId,
  razorpayRequest,
  type RazorpaySubscription,
} from "@/lib/razorpay/server";
import { purgeAllUserData } from "@/lib/utils/purge-user-data";

const DELETE_CONFIRMATION = "I want to delete my subscription and data";

type AccountRow = {
  id: string;
  email: string | null;
  plan: string | null;
  plan_active: boolean | null;
  subscription_id: string | null;
  subscription_end_date: string | null;
  subscription_cancel_at_period_end?: boolean | null;
  subscription_cancelled_at?: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) return NextResponse.json({ error: "Sign in to manage your subscription." }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const action = typeof body.action === "string" ? body.action : "";
    const confirmation = typeof body.confirmation === "string" ? body.confirmation.trim() : "";

    if (action !== "cancel_and_delete" && action !== "cancel_at_period_end") {
      return NextResponse.json({ error: "Choose a valid subscription action." }, { status: 400 });
    }

    if (action === "cancel_and_delete" && confirmation !== DELETE_CONFIRMATION) {
      return NextResponse.json(
        { error: `Type "${DELETE_CONFIRMATION}" to confirm.` },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const { account, error: accountError } = await loadAccount(adminClient, user.id);

    if (accountError || !account) {
      return NextResponse.json({ error: "Could not load your subscription." }, { status: 500 });
    }

    if (action === "cancel_at_period_end") {
      return cancelAtPeriodEnd(adminClient, account);
    }

    const rawRazorpaySubscriptionId = getRawRazorpaySubscriptionId(account.subscription_id);
    if (rawRazorpaySubscriptionId) {
      const razorpayConfig = getRazorpayConfig();
      if (!razorpayConfig) {
        return NextResponse.json(
          { error: "Subscription cancellation is temporarily unavailable. Please contact support." },
          { status: 503 }
        );
      }

      await razorpayRequest(razorpayConfig, `/subscriptions/${rawRazorpaySubscriptionId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ cancel_at_cycle_end: 0 }),
      });
    }

    await purgeAllUserData(adminClient, user.id);

    const endedAt = new Date().toISOString();
    const { error: updateError } = await adminClient
      .from("users")
      .update({
        plan: "free",
        plan_active: false,
        subscription_id: null,
        subscription_start_date: null,
        subscription_end_date: endedAt,
        subscription_cancel_at_period_end: false,
        subscription_cancelled_at: null,
        billing_cycle: null,
      })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: "Subscription was cancelled, but account update failed. Please contact support." }, { status: 500 });
    }

    await adminClient
      .from("user_profiles")
      .update({
        tier: "free",
        startup_count: 0,
        max_startups: 1,
        startups_created_this_month: 0,
        updated_at: endedAt,
      })
      .eq("id", user.id);

    return NextResponse.json({
      success: true,
      plan: "free",
      planActive: false,
      message: "Subscription cancelled and workspace data deleted.",
    });
  } catch (error) {
    console.error("Subscription management error:", error);
    return NextResponse.json(
      { error: "Could not update your subscription. Please try again or contact support." },
      { status: 500 }
    );
  }
}

async function cancelAtPeriodEnd(adminClient: ReturnType<typeof createAdminClient>, account: AccountRow) {
  if (!account.plan_active || account.plan === "free") {
    return NextResponse.json({ error: "There is no active paid subscription to cancel." }, { status: 400 });
  }

  const rawRazorpaySubscriptionId = getRawRazorpaySubscriptionId(account.subscription_id);
  if (!rawRazorpaySubscriptionId) {
    return NextResponse.json(
      { error: "This plan does not auto-renew. Your access will end on the date shown in Settings." },
      { status: 400 }
    );
  }

  if (account.subscription_cancel_at_period_end) {
    return NextResponse.json({
      success: true,
      cancelAtPeriodEnd: true,
      subscriptionEndDate: account.subscription_end_date,
      message: "Auto-renewal is already cancelled. Your plan stays active until the current period ends.",
    });
  }

  const razorpayConfig = getRazorpayConfig();
  if (!razorpayConfig) {
    return NextResponse.json(
      { error: "Subscription cancellation is temporarily unavailable. Please contact support." },
      { status: 503 }
    );
  }

  const subscription = await razorpayRequest<RazorpaySubscription>(razorpayConfig, `/subscriptions/${rawRazorpaySubscriptionId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ cancel_at_cycle_end: 1 }),
  });

  const cancelledAt = new Date().toISOString();
  const accessEndsAt = toIsoDate(subscription.current_end || subscription.end_at) || account.subscription_end_date;
  const { error: updateError } = await adminClient
    .from("users")
    .update({
      plan_active: true,
      subscription_cancel_at_period_end: true,
      subscription_cancelled_at: cancelledAt,
      subscription_end_date: accessEndsAt,
    })
    .eq("id", account.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Auto-renewal was cancelled, but Settings could not be updated. Please contact support." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    cancelAtPeriodEnd: true,
    subscriptionEndDate: accessEndsAt,
    cancelledAt,
    message: "Auto-renewal cancelled. Your plan stays active until the current period ends.",
  });
}

async function loadAccount(adminClient: ReturnType<typeof createAdminClient>, userId: string) {
  const withCancelState = await adminClient
    .from("users")
    .select("id, email, plan, plan_active, subscription_id, subscription_end_date, subscription_cancel_at_period_end, subscription_cancelled_at")
    .eq("id", userId)
    .maybeSingle<AccountRow>();

  if (!withCancelState.error) {
    return { account: withCancelState.data, error: null };
  }

  const fallback = await adminClient
    .from("users")
    .select("id, email, plan, plan_active, subscription_id, subscription_end_date")
    .eq("id", userId)
    .maybeSingle<AccountRow>();

  return { account: fallback.data, error: fallback.error };
}

function toIsoDate(unixSeconds: number | null | undefined) {
  if (!unixSeconds || !Number.isFinite(unixSeconds)) return null;
  return new Date(unixSeconds * 1000).toISOString();
}
