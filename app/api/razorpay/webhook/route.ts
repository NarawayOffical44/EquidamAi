import { createHash, createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { insertLead } from "@/lib/leads/store";
import {
  getCheckoutPlanAmount,
  getRazorpayConfig,
  getRazorpaySubscriptionCheckout,
  getSubscriptionEndDate,
  isSupportedCheckoutCurrency,
  normalizeBillingCycle,
  noteString,
  razorpayRequest,
  type RazorpayOrder,
  type RazorpayPayment,
  type RazorpaySubscription,
} from "@/lib/razorpay/server";
import { updateUserSubscription } from "@/lib/supabase/subscription";
import { logger } from "@/lib/utils/logger";

type ActivationParams = {
  email: string | null;
  phone: string | null;
  companyName: string | null;
  fullName: string | null;
  paymentId: string;
  subscriptionId: string;
  plan: string;
  billingPlan: "pro" | "plus" | "startup" | "agency" | "enterprise";
  billingCycle: "monthly" | "annual";
  currency: string;
  amount: number;
  amountSubunits: number;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  paymentMode: string;
  recurring: boolean;
  razorpaySubscriptionId?: string;
};

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error("Razorpay webhook secret is not configured");
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  if (!isValidWebhookSignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  const event = stringValue(payload.event);
  const adminClient = createAdminClient();
  const webhookEventId = buildRazorpayWebhookEventId(rawBody);
  let claim: "claimed" | "processed" | "processing";
  try {
    claim = await claimWebhookEvent(adminClient, webhookEventId, `razorpay.${event || "unknown"}`);
  } catch (error) {
    logger.error("Razorpay webhook idempotency check failed", {
      event,
      error: String(error),
    });
    return NextResponse.json({ error: "Webhook processing is temporarily unavailable." }, { status: 500 });
  }

  if (claim !== "claimed") {
    return NextResponse.json({ received: true, duplicate: true, status: claim }, { status: 200 });
  }

  try {
    const activated =
      event === "payment.captured" || event === "order.paid"
        ? await activatePaymentWebhook(payload)
        : event === "subscription.activated" || event === "subscription.charged"
          ? await activateSubscriptionWebhook(payload)
          : false;

    await markWebhookEventProcessed(adminClient, webhookEventId);
    return NextResponse.json({ received: true, activated });
  } catch (error) {
    await markWebhookEventFailed(adminClient, webhookEventId, error);
    logger.error("Razorpay webhook activation failed", {
      event,
      error: String(error),
    });
    return NextResponse.json({ error: "Webhook activation failed." }, { status: 500 });
  }
}

async function activatePaymentWebhook(payload: Record<string, unknown>) {
  const config = getRazorpayConfig();
  if (!config) return false;

  const payment = paymentEntity(payload);
  if (!payment?.id || payment.status !== "captured") return false;

  const subscriptionId = stringValue((payment as Record<string, unknown>).subscription_id);
  if (subscriptionId) {
    return activateSubscriptionWebhook(payload, subscriptionId, payment);
  }

  const orderId = stringValue(payment.order_id);
  if (!orderId) return false;

  const order = await razorpayRequest<RazorpayOrder>(config, `/orders/${orderId}`);
  const notes = order.notes || {};
  const plan = noteString(notes, "publicPlan") || noteString(notes, "plan") || "";
  const billingCycle = normalizeBillingCycle(noteString(notes, "billingCycle"));
  const currency = noteString(notes, "currency");
  if (!billingCycle || !isSupportedCheckoutCurrency(currency)) return false;

  const checkout = getCheckoutPlanAmount(plan, billingCycle, currency);
  if (order.amount !== checkout.amountSubunits || payment.amount !== checkout.amountSubunits) return false;
  if (order.currency !== currency || payment.currency !== currency) return false;

  return activatePaidAccess({
    email: normalizeEmail(noteString(notes, "email") || payment.email),
    phone: noteString(notes, "phone") || payment.contact || null,
    companyName: noteString(notes, "companyName"),
    fullName: noteString(notes, "fullName"),
    paymentId: payment.id,
    subscriptionId: `razorpay:${payment.id}`,
    plan: checkout.publicPlan,
    billingPlan: checkout.billingPlan,
    billingCycle,
    currency,
    amount: checkout.amount,
    amountSubunits: checkout.amountSubunits,
    subscriptionStartDate: new Date().toISOString(),
    subscriptionEndDate: getSubscriptionEndDate(billingCycle),
    paymentMode: "one_time_order",
    recurring: false,
  });
}

async function activateSubscriptionWebhook(
  payload: Record<string, unknown>,
  fallbackSubscriptionId?: string,
  fallbackPayment?: RazorpayPayment
) {
  const config = getRazorpayConfig();
  if (!config) return false;

  const subscriptionFromPayload = subscriptionEntity(payload);
  const subscriptionId = subscriptionFromPayload?.id || fallbackSubscriptionId;
  if (!subscriptionId) return false;

  const [subscription, payment] = await Promise.all([
    subscriptionFromPayload?.notes
      ? Promise.resolve(subscriptionFromPayload)
      : razorpayRequest<RazorpaySubscription>(config, `/subscriptions/${subscriptionId}`),
    fallbackPayment
      ? Promise.resolve(fallbackPayment)
      : Promise.resolve(paymentEntity(payload)),
  ]);

  if (!subscription?.id) return false;
  if (subscription.status === "cancelled" || subscription.status === "expired" || subscription.status === "halted") return false;

  const notes = subscription.notes || {};
  const plan = noteString(notes, "publicPlan") || noteString(notes, "plan") || "";
  const billingCycle = normalizeBillingCycle(noteString(notes, "billingCycle"));
  const currency = noteString(notes, "currency");
  if (!billingCycle || !isSupportedCheckoutCurrency(currency)) return false;

  const checkout = getRazorpaySubscriptionCheckout(plan, billingCycle, currency);
  if (!checkout || subscription.plan_id !== checkout.planId) return false;

  if (payment?.id) {
    if (payment.amount !== checkout.amountSubunits || payment.currency !== checkout.currency) return false;
    if (payment.status !== "captured" && payment.status !== "authorized") return false;
  }

  return activatePaidAccess({
    email: normalizeEmail(noteString(notes, "email") || payment?.email),
    phone: noteString(notes, "phone") || payment?.contact || null,
    companyName: noteString(notes, "companyName"),
    fullName: noteString(notes, "fullName"),
    paymentId: payment?.id || subscription.id,
    subscriptionId: `razorpay_subscription:${subscription.id}`,
    plan: checkout.publicPlan,
    billingPlan: checkout.billingPlan,
    billingCycle,
    currency: checkout.currency,
    amount: checkout.amount,
    amountSubunits: checkout.amountSubunits,
    subscriptionStartDate: toIsoDate(subscription.current_start || subscription.start_at) || new Date().toISOString(),
    subscriptionEndDate: toIsoDate(subscription.current_end || subscription.end_at) || getSubscriptionEndDate(billingCycle),
    paymentMode: "razorpay_subscription",
    recurring: true,
    razorpaySubscriptionId: subscription.id,
  });
}

async function activatePaidAccess(params: ActivationParams) {
  const adminClient = createAdminClient();
  const account = params.email ? await findUserByEmail(adminClient, params.email) : null;

  if (account?.id) {
    return updateUserSubscription(adminClient, account.id, {
      plan: params.billingPlan,
      subscription_id: params.subscriptionId,
      subscription_start_date: params.subscriptionStartDate,
      subscription_end_date: params.subscriptionEndDate,
      billing_cycle: params.billingCycle,
      plan_active: true,
    });
  }

  if (!params.email) return false;

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

  const result = await insertLead(adminClient, {
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

async function findUserByEmail(adminClient: ReturnType<typeof createAdminClient>, email: string) {
  const { data } = await adminClient
    .from("users")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  return data;
}

function paymentEntity(payload: Record<string, unknown>) {
  return asRecord(asRecord(asRecord(payload.payload).payment).entity) as RazorpayPayment | null;
}

function subscriptionEntity(payload: Record<string, unknown>) {
  return asRecord(asRecord(asRecord(payload.payload).subscription).entity) as RazorpaySubscription | null;
}

function isValidWebhookSignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeEmail(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized && normalized.includes("@") ? normalized : null;
}

function toIsoDate(unixSeconds: number | null | undefined) {
  if (!unixSeconds || !Number.isFinite(unixSeconds)) return null;
  return new Date(unixSeconds * 1000).toISOString();
}

function buildRazorpayWebhookEventId(rawBody: string) {
  return `razorpay:${createHash("sha256").update(rawBody).digest("hex")}`;
}

async function claimWebhookEvent(
  adminClient: ReturnType<typeof createAdminClient>,
  eventId: string,
  eventType: string
) {
  const { data, error } = await adminClient.rpc("claim_stripe_webhook_event", {
    p_event_id: eventId,
    p_event_type: eventType,
  });
  if (error) throw error;
  return (data || "claimed") as "claimed" | "processed" | "processing";
}

async function markWebhookEventProcessed(adminClient: ReturnType<typeof createAdminClient>, eventId: string) {
  const { error } = await adminClient.rpc("mark_stripe_webhook_event_processed", {
    p_event_id: eventId,
  });
  if (error) {
    logger.warn("Failed to mark Razorpay webhook processed", { eventId, error });
  }
}

async function markWebhookEventFailed(
  adminClient: ReturnType<typeof createAdminClient>,
  eventId: string,
  error: unknown
) {
  const { error: updateError } = await adminClient.rpc("mark_stripe_webhook_event_failed", {
    p_event_id: eventId,
    p_last_error: error instanceof Error ? error.message : String(error),
  });
  if (updateError) {
    logger.warn("Failed to mark Razorpay webhook failed", { eventId, error: updateError });
  }
}
