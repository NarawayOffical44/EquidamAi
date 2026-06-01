import { createHmac } from "crypto";
import { after, NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateUserSubscription } from "@/lib/supabase/subscription";
import {
  getCheckoutPlanAmount,
  getRazorpayConfig,
  getRazorpaySubscriptionCheckout,
  getSubscriptionEndDate,
  isSupportedCheckoutCurrency,
  noteString,
  normalizeBillingCycle,
  razorpayRequest,
  verifyRazorpaySignature,
  verifyRazorpaySubscriptionSignature,
  type RazorpayOrder,
  type RazorpayPayment,
  type RazorpaySubscription,
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
        { code: "PAYMENT_UNAVAILABLE", error: "Secure payment is temporarily unavailable. Please try again shortly." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const orderId = stringValue(body.razorpay_order_id);
    const razorpaySubscriptionId = stringValue(body.razorpay_subscription_id);
    const paymentId = stringValue(body.razorpay_payment_id);
    const signature = stringValue(body.razorpay_signature);

    if (!paymentId || !signature || (!orderId && !razorpaySubscriptionId)) {
      return NextResponse.json({ error: "We could not confirm this payment. Reopen checkout and try again." }, { status: 400 });
    }

    if (razorpaySubscriptionId) {
      return await verifySubscriptionCheckout({
        request,
        razorpayConfig,
        razorpaySubscriptionId,
        paymentId,
        signature,
      });
    }

    if (!orderId) {
      return NextResponse.json({ error: "We could not confirm this payment. Reopen checkout and try again." }, { status: 400 });
    }

    const signatureValid = verifyRazorpaySignature({
      orderId,
      paymentId,
      signature,
      keySecret: razorpayConfig.keySecret,
    });
    if (!signatureValid) {
      return NextResponse.json({ error: "We could not confirm this payment yet. If money was deducted, refresh the success page in a moment." }, { status: 400 });
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
      return NextResponse.json({ error: "We could not match this payment to your checkout. If money was deducted, refresh the success page in a moment." }, { status: 400 });
    }

    const notes = order.notes || {};
    const noteUserId = noteString(notes, "userId");
    if (noteUserId && !user?.id) {
      return NextResponse.json({ error: "Sign in to finish activating this payment." }, { status: 401 });
    }
    if (noteUserId && noteUserId !== user?.id) {
      return NextResponse.json({ error: "This payment is linked to a different account." }, { status: 403 });
    }

    const plan = noteString(notes, "publicPlan") || noteString(notes, "plan") || "";
    const billingCycle = normalizeBillingCycle(noteString(notes, "billingCycle"));
    const currency = noteString(notes, "currency");

    if (!billingCycle || !isSupportedCheckoutCurrency(currency)) {
      return NextResponse.json({ error: "We could not activate this payment automatically. Refresh the checkout success page in a moment." }, { status: 400 });
    }

    const checkout = getCheckoutPlanAmount(plan, billingCycle, currency);
    if (order.amount !== checkout.amountSubunits || payment.amount !== checkout.amountSubunits) {
      return NextResponse.json({ error: "We could not activate this payment automatically. Refresh the checkout success page in a moment." }, { status: 400 });
    }
    if (order.currency !== currency || payment.currency !== currency) {
      return NextResponse.json({ error: "We could not activate this payment automatically. Refresh the checkout success page in a moment." }, { status: 400 });
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
        { error: "Payment is still being confirmed. Please refresh in a moment." },
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
        paymentMode: noteString(notes, "paymentMode") || "one_time_order",
        recurring: false,
      });
    }

    if (!updated) {
      return NextResponse.json({ error: "Payment was received. Account activation is still finishing. Refresh the dashboard in a moment." }, { status: 500 });
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

    queueRazorpayInvoiceEmail(request, { paymentId, orderId });

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
      { error: "Payment was received, but confirmation is still processing. Please refresh in a moment." },
      { status: 500 }
    );
  }
}

async function verifySubscriptionCheckout(params: {
  request: NextRequest;
  razorpayConfig: NonNullable<ReturnType<typeof getRazorpayConfig>>;
  razorpaySubscriptionId: string;
  paymentId: string;
  signature: string;
}) {
  const signatureValid = verifyRazorpaySubscriptionSignature({
    subscriptionId: params.razorpaySubscriptionId,
    paymentId: params.paymentId,
    signature: params.signature,
    keySecret: params.razorpayConfig.keySecret,
  });

  if (!signatureValid) {
    return NextResponse.json({ error: "We could not confirm this payment yet. If money was deducted, refresh the success page in a moment." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [subscription, payment] = await Promise.all([
    razorpayRequest<RazorpaySubscription>(params.razorpayConfig, `/subscriptions/${params.razorpaySubscriptionId}`),
    razorpayRequest<RazorpayPayment>(params.razorpayConfig, `/payments/${params.paymentId}`),
  ]);

  const notes = subscription.notes || {};
  const noteUserId = noteString(notes, "userId");
  if (noteUserId && !user?.id) {
    return NextResponse.json({ error: "Sign in to finish activating this payment." }, { status: 401 });
  }
  if (noteUserId && noteUserId !== user?.id) {
    return NextResponse.json({ error: "This payment is linked to a different account." }, { status: 403 });
  }

  const plan = noteString(notes, "publicPlan") || noteString(notes, "plan") || "";
  const billingCycle = normalizeBillingCycle(noteString(notes, "billingCycle"));
  const currency = noteString(notes, "currency");

  if (!billingCycle || !isSupportedCheckoutCurrency(currency)) {
    return NextResponse.json({ error: "We could not activate this payment automatically. Refresh the checkout success page in a moment." }, { status: 400 });
  }

  const checkout = getRazorpaySubscriptionCheckout(plan, billingCycle, currency);
  if (!checkout || subscription.plan_id !== checkout.planId) {
    return NextResponse.json({ error: "We could not activate this payment automatically. Refresh the checkout success page in a moment." }, { status: 400 });
  }

  if (payment.amount !== checkout.amountSubunits || payment.currency !== checkout.currency) {
    return NextResponse.json({ error: "We could not activate this payment automatically. Refresh the checkout success page in a moment." }, { status: 400 });
  }

  const confirmedPayment =
    payment.status === "captured"
      ? payment
      : payment.status === "authorized"
        ? await razorpayRequest<RazorpayPayment>(params.razorpayConfig, `/payments/${params.paymentId}/capture`, {
            method: "POST",
            body: JSON.stringify({
              amount: checkout.amountSubunits,
              currency: checkout.currency,
            }),
          })
        : payment;

  if (confirmedPayment.status !== "captured") {
    return NextResponse.json(
      { error: "Payment is still being confirmed. Please refresh in a moment." },
      { status: 400 }
    );
  }

  if (subscription.status === "cancelled" || subscription.status === "expired" || subscription.status === "halted") {
    return NextResponse.json(
      { error: "This subscription is no longer active, so it cannot be activated." },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();
  const subscriptionRecordId = `razorpay_subscription:${subscription.id}`;
  const subscriptionStartDate = toIsoDate(subscription.current_start || subscription.start_at) || new Date().toISOString();
  const subscriptionEndDate = toIsoDate(subscription.current_end || subscription.end_at) || getSubscriptionEndDate(billingCycle);
  const guestEmail = normalizeEmail(noteString(notes, "email") || payment.email || user?.email);
  const existingGuestAccount = !user?.id && guestEmail
    ? await findUserByEmail(adminClient, guestEmail)
    : null;
  const targetUserId = user?.id || existingGuestAccount?.id || null;

  let updated = false;
  if (targetUserId) {
    updated = await updateUserSubscription(adminClient, targetUserId, {
      plan: checkout.billingPlan,
      subscription_id: subscriptionRecordId,
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
      paymentId: params.paymentId,
      subscriptionId: subscriptionRecordId,
      plan: checkout.publicPlan,
      billingPlan: checkout.billingPlan,
      billingCycle,
      currency: checkout.currency,
      amount: checkout.amount,
      amountSubunits: checkout.amountSubunits,
      subscriptionStartDate,
      subscriptionEndDate,
      paymentMode: "razorpay_subscription",
      recurring: true,
      razorpaySubscriptionId: subscription.id,
    });
  }

  if (!updated) {
    return NextResponse.json({ error: "Payment was received. Account activation is still finishing. Refresh the dashboard in a moment." }, { status: 500 });
  }

  await trackServerEvent(
    "purchase",
    {
      transaction_id: params.paymentId,
      payment_provider: "razorpay",
      checkout_mode: "subscription",
      razorpay_subscription_id: subscription.id,
      plan: checkout.billingPlan,
      billing_cycle: billingCycle,
      value: checkout.amount,
      currency: checkout.currency,
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
        checkout.currency,
        billingCycle === "annual" ? "Annual" : "Monthly"
      ),
      targetUserId
        ? sendSubscriptionActivatedEmail(email, userProfile?.full_name || "there", checkout.billingPlan)
        : Promise.resolve(),
      markLeadConverted(adminClient, email),
    ]);
  }

  queueRazorpayInvoiceEmail(params.request, {
    paymentId: params.paymentId,
    subscriptionId: subscription.id,
  });

  const guestSignupUrl = guestEmail
    ? `/signup?email=${encodeURIComponent(guestEmail)}&plan=${encodeURIComponent(checkout.publicPlan)}&billingCycle=${billingCycle}&currency=${checkout.currency}&next=${encodeURIComponent("/dashboard")}`
    : "/signup";

  return NextResponse.json({
    success: true,
    plan: checkout.publicPlan,
    planActive: Boolean(targetUserId),
    redirectUrl: targetUserId
      ? `/success?provider=razorpay&subscription_id=${encodeURIComponent(subscription.id)}&payment_id=${encodeURIComponent(params.paymentId)}`
      : guestSignupUrl,
  });
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
    paymentMode: string;
    recurring: boolean;
    razorpaySubscriptionId?: string;
  }
) {
  const metadata = {
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
    paymentMode: params.paymentMode,
    recurring: params.recurring,
    razorpaySubscriptionId: params.razorpaySubscriptionId || null,
    paidAt: new Date().toISOString(),
    claimStatus: "pending_signup",
  };

  const result = await insertLead(supabase, {
    email: params.email,
    phone: params.phone,
    company_name: params.companyName || params.fullName || "Paid checkout",
    website_url: JSON.stringify(metadata),
    metadata,
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

function toIsoDate(unixSeconds: number | null | undefined) {
  if (!unixSeconds || !Number.isFinite(unixSeconds)) return null;
  return new Date(unixSeconds * 1000).toISOString();
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

function queueRazorpayInvoiceEmail(
  request: NextRequest,
  body: { paymentId: string; orderId?: string; subscriptionId?: string }
) {
  const config = getRazorpayConfig();
  if (!config) return;

  const origin = request.nextUrl.origin;
  const rawBody = JSON.stringify(body);
  const signature = createHmac("sha256", config.keySecret).update(rawBody).digest("hex");

  after(async () => {
    try {
      const response = await fetch(`${origin}/api/razorpay/invoice/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-evaldam-invoice-signature": signature,
        },
        body: rawBody,
        cache: "no-store",
      });

      if (!response.ok) {
        console.error("Razorpay invoice email request failed", {
          status: response.status,
          body: await response.text().catch(() => ""),
        });
      }
    } catch (error) {
      console.error("Razorpay invoice email queue failed:", error);
    }
  });
}
