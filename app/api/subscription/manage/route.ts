import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getRazorpayConfig, getRawRazorpaySubscriptionId, razorpayRequest } from "@/lib/razorpay/server";
import { purgeAllUserData } from "@/lib/utils/purge-user-data";

const DELETE_CONFIRMATION = "I want to delete my subscription and data";

type AccountRow = {
  id: string;
  email: string | null;
  plan: string | null;
  plan_active: boolean | null;
  subscription_id: string | null;
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

    if (action !== "cancel_and_delete") {
      return NextResponse.json({ error: "Choose a valid subscription action." }, { status: 400 });
    }

    if (confirmation !== DELETE_CONFIRMATION) {
      return NextResponse.json(
        { error: `Type "${DELETE_CONFIRMATION}" to confirm.` },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const { data: account, error: accountError } = await adminClient
      .from("users")
      .select("id, email, plan, plan_active, subscription_id")
      .eq("id", user.id)
      .maybeSingle<AccountRow>();

    if (accountError || !account) {
      return NextResponse.json({ error: "Could not load your subscription." }, { status: 500 });
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
