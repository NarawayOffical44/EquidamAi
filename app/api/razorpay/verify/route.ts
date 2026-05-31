import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateUserSubscription } from "@/lib/supabase/subscription";
import {
  getCheckoutPlanAmount,
  getRazorpayConfig,
  getSubscriptionEndDate,
  isSupportedCheckoutCurrency,
  noteString,
  normalizeBillingCycle,
  razorpayRequest,
  verifyRazorpaySignature,
  type RazorpayOrder,
  type RazorpayPayment,
} from "@/lib/razorpay/server";
import { trackServerEvent } from "@/lib/analytics/server-ga4";
import {
  sendPaymentSuccessEmail,
  sendSubscriptionActivatedEmail,
} from "@/lib/email/lifecycle-handler";

export async function POST(request: NextRequest) {
  try {
    const razorpayConfig = getRazorpayConfig();
    if (!razorpayConfig) {
      return NextResponse.json(
        { code: "RAZORPAY_NOT_CONFIGURED", error: "Razorpay checkout is not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const orderId = stringValue(body.razorpay_order_id);
    const paymentId = stringValue(body.razorpay_payment_id);
    const signature = stringValue(body.razorpay_signature);

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: "Missing Razorpay payment confirmation" }, { status: 400 });
    }

    const signatureValid = verifyRazorpaySignature({
      orderId,
      paymentId,
      signature,
      keySecret: razorpayConfig.keySecret,
    });
    if (!signatureValid) {
      return NextResponse.json({ error: "Payment signature verification failed" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Login is required before payment confirmation" }, { status: 401 });
    }

    const [order, payment] = await Promise.all([
      razorpayRequest<RazorpayOrder>(razorpayConfig, `/orders/${orderId}`),
      razorpayRequest<RazorpayPayment>(razorpayConfig, `/payments/${paymentId}`),
    ]);

    if (payment.order_id !== order.id) {
      return NextResponse.json({ error: "Payment does not match the checkout order" }, { status: 400 });
    }

    const notes = order.notes || {};
    const noteUserId = noteString(notes, "userId");
    if (noteUserId !== user.id) {
      return NextResponse.json({ error: "Payment does not belong to this account" }, { status: 403 });
    }

    const plan = noteString(notes, "publicPlan") || noteString(notes, "plan") || "";
    const billingCycle = normalizeBillingCycle(noteString(notes, "billingCycle"));
    const currency = noteString(notes, "currency");

    if (!billingCycle || !isSupportedCheckoutCurrency(currency)) {
      return NextResponse.json({ error: "Payment order is missing checkout metadata" }, { status: 400 });
    }

    const checkout = getCheckoutPlanAmount(plan, billingCycle, currency);
    if (order.amount !== checkout.amountSubunits || payment.amount !== checkout.amountSubunits) {
      return NextResponse.json({ error: "Payment amount does not match the selected plan" }, { status: 400 });
    }
    if (order.currency !== currency || payment.currency !== currency) {
      return NextResponse.json({ error: "Payment currency does not match the selected plan" }, { status: 400 });
    }

    const confirmedPayment =
      payment.status === "captured"
        ? payment
        : payment.status === "authorized"
          ? await razorpayRequest<RazorpayPayment>(razorpayConfig, `/payments/${paymentId}/capture`, {
              method: "POST",
              body: JSON.stringify({
                amount: checkout.amountSubunits,
                currency,
              }),
            })
          : payment;

    if (confirmedPayment.status !== "captured") {
      return NextResponse.json(
        { error: `Payment is not captured. Current status: ${confirmedPayment.status}` },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const subscriptionId = `razorpay:${paymentId}`;
    const updated = await updateUserSubscription(adminClient, user.id, {
      plan: checkout.billingPlan,
      subscription_id: subscriptionId,
      subscription_start_date: new Date().toISOString(),
      subscription_end_date: getSubscriptionEndDate(billingCycle),
      billing_cycle: billingCycle,
      plan_active: true,
    });

    if (!updated) {
      return NextResponse.json({ error: "Payment confirmed, but plan activation failed" }, { status: 500 });
    }

    await trackServerEvent(
      "purchase",
      {
        transaction_id: paymentId,
        payment_provider: "razorpay",
        plan: checkout.billingPlan,
        billing_cycle: billingCycle,
        value: checkout.amount,
        currency,
      },
      user.id
    );

    const userProfile = await getUserProfile(adminClient, user.id);
    const email = user.email || userProfile?.email || payment.email;
    if (email) {
      await Promise.allSettled([
        sendPaymentSuccessEmail(
          email,
          userProfile?.full_name || "there",
          checkout.billingPlan,
          checkout.amountSubunits,
          currency,
          billingCycle === "annual" ? "Annual" : "Monthly"
        ),
        sendSubscriptionActivatedEmail(email, userProfile?.full_name || "there", checkout.billingPlan),
        markLeadConverted(adminClient, email),
      ]);
    }

    return NextResponse.json({
      success: true,
      plan: checkout.publicPlan,
      planActive: true,
      redirectUrl: `/success?provider=razorpay&payment_id=${encodeURIComponent(paymentId)}`,
    });
  } catch (error) {
    console.error("Razorpay verification error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment verification failed" },
      { status: 500 }
    );
  }
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

async function getUserProfile(supabase: ReturnType<typeof createAdminClient>, userId: string) {
  const { data } = await supabase
    .from("users")
    .select("email, full_name, plan")
    .eq("id", userId)
    .maybeSingle();

  return data;
}

async function markLeadConverted(supabase: ReturnType<typeof createAdminClient>, email: string) {
  await supabase
    .from("email_sequence_leads")
    .update({
      converted_to_paid_user: true,
      converted_at: new Date().toISOString(),
    })
    .eq("email", email)
    .is("converted_at", null);
}
