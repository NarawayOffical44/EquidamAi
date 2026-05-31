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
import { insertLead } from "@/lib/leads/store";
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

    const [order, payment] = await Promise.all([
      razorpayRequest<RazorpayOrder>(razorpayConfig, `/orders/${orderId}`),
      razorpayRequest<RazorpayPayment>(razorpayConfig, `/payments/${paymentId}`),
    ]);

    if (payment.order_id !== order.id) {
      return NextResponse.json({ error: "Payment does not match the checkout order" }, { status: 400 });
    }

    const notes = order.notes || {};
    const noteUserId = noteString(notes, "userId");
    if (noteUserId && !user?.id) {
      return NextResponse.json({ error: "Login is required before payment confirmation" }, { status: 401 });
    }
    if (noteUserId && noteUserId !== user?.id) {
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
    const subscriptionStartDate = new Date().toISOString();
    const subscriptionEndDate = getSubscriptionEndDate(billingCycle);
    const guestEmail = normalizeEmail(noteString(notes, "email") || payment.email || user?.email);
    const existingGuestAccount = !user?.id && guestEmail
      ? await findUserByEmail(adminClient, guestEmail)
      : null;
    const targetUserId = user?.id || existingGuestAccount?.id || null;

    let updated = false;
    if (targetUserId) {
      updated = await updateUserSubscription(adminClient, targetUserId, {
        plan: checkout.billingPlan,
        subscription_id: subscriptionId,
        subscription_start_date: subscriptionStartDate,
        subscription_end_date: subscriptionEndDate,
        billing_cycle: billingCycle,
        plan_active: true,
      });
    } else if (guestEmail) {
      updated = await recordPaidGuestCheckout(adminClient, {
        email: guestEmail,
        phone: noteString(notes, "phone") || payment.contact || null,
        companyName: noteString(notes, "companyName") || null,
        fullName: noteString(notes, "fullName") || null,
        paymentId,
        subscriptionId,
        plan: checkout.publicPlan,
        billingPlan: checkout.billingPlan,
        billingCycle,
        currency,
        amount: checkout.amount,
        amountSubunits: checkout.amountSubunits,
        subscriptionStartDate,
        subscriptionEndDate,
      });
    }

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
      targetUserId || undefined
    );

    const userProfile = targetUserId ? await getUserProfile(adminClient, targetUserId) : null;
    const email = user?.email || userProfile?.email || guestEmail || payment.email;
    if (email) {
      await Promise.allSettled([
        sendPaymentSuccessEmail(
          email,
          userProfile?.full_name || noteString(notes, "fullName") || "there",
          checkout.billingPlan,
          checkout.amountSubunits,
          currency,
          billingCycle === "annual" ? "Annual" : "Monthly"
        ),
        targetUserId
          ? sendSubscriptionActivatedEmail(email, userProfile?.full_name || "there", checkout.billingPlan)
          : Promise.resolve(),
        markLeadConverted(adminClient, email),
      ]);
    }

    const guestSignupUrl = guestEmail
      ? `/signup?email=${encodeURIComponent(guestEmail)}&plan=${encodeURIComponent(checkout.publicPlan)}&billingCycle=${billingCycle}&currency=${currency}&next=${encodeURIComponent("/dashboard")}`
      : "/signup";

    return NextResponse.json({
      success: true,
      plan: checkout.publicPlan,
      planActive: Boolean(targetUserId),
      redirectUrl: targetUserId
        ? `/success?provider=razorpay&payment_id=${encodeURIComponent(paymentId)}`
        : guestSignupUrl,
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

async function findUserByEmail(supabase: ReturnType<typeof createAdminClient>, email: string) {
  const { data } = await supabase
    .from("users")
    .select("id, email, full_name")
    .eq("email", email)
    .maybeSingle();

  return data;
}

async function recordPaidGuestCheckout(
  supabase: ReturnType<typeof createAdminClient>,
  params: {
    email: string;
    phone: string | null;
    companyName: string | null;
    fullName: string | null;
    paymentId: string;
    subscriptionId: string;
    plan: string;
    billingPlan: string;
    billingCycle: string;
    currency: string;
    amount: number;
    amountSubunits: number;
    subscriptionStartDate: string;
    subscriptionEndDate: string;
  }
) {
  const result = await insertLead(supabase, {
    email: params.email,
    phone: params.phone,
    company_name: params.companyName || params.fullName || "Paid checkout",
    website_url: null,
    metadata: {
      source: "razorpay_paid_checkout",
      fullName: params.fullName,
      paymentId: params.paymentId,
      subscriptionId: params.subscriptionId,
      plan: params.plan,
      billingPlan: params.billingPlan,
      billingCycle: params.billingCycle,
      currency: params.currency,
      amount: params.amount,
      amountSubunits: params.amountSubunits,
      subscriptionStartDate: params.subscriptionStartDate,
      subscriptionEndDate: params.subscriptionEndDate,
      paidAt: new Date().toISOString(),
      claimStatus: "pending_signup",
    },
    ip_address: null,
    country: null,
    city: null,
    isp: null,
    valuation_low: null,
    valuation_mid: null,
    valuation_high: null,
  });

  return !result.error;
}

function normalizeEmail(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized && normalized.includes("@") ? normalized : null;
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
