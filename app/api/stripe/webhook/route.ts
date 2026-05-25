import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import {
  updateUserSubscription,
  deactivateSubscription,
} from "@/lib/supabase/subscription";
import {
  sendFailedPaymentEmail,
  sendPaymentSuccessEmail,
  sendSubscriptionActivatedEmail,
} from "@/lib/email/lifecycle-handler";
import { trackServerEvent } from "@/lib/analytics/server-ga4";
import { MICRO_USD_PER_USD } from "@/lib/developer-api/pricing";
import { toLegacyBillingPlan, type LegacyBillingPlanKey } from "@/lib/plans/plan-limits";

type StripeBillingPlan = LegacyBillingPlanKey;

function getStripeWebhookConfig() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secretKey || !webhookSecret || !supabaseUrl || !supabaseKey) {
    return null;
  }

  return {
    stripe: new Stripe(secretKey, {
      apiVersion: "2024-04-10" as any,
    }),
    webhookSecret,
    supabaseUrl,
    supabaseKey,
  };
}

/**
 * Stripe Webhook Handler
 * Syncs Stripe subscription data with database
 */
export async function POST(request: NextRequest) {
  const config = getStripeWebhookConfig();
  if (!config) {
    console.error("Stripe webhook is missing required Stripe or Supabase environment variables");
    return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature") || "";

  let event: Stripe.Event;
  try {
    event = config.stripe.webhooks.constructEvent(body, signature, config.webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createClient(config.supabaseUrl, config.supabaseKey);

  let claim: "claimed" | "processed" | "processing";
  try {
    claim = await claimStripeEvent(supabase, event);
  } catch (error) {
    console.error("Stripe webhook idempotency check failed:", error);
    return NextResponse.json({ error: "Idempotency check failed" }, { status: 500 });
  }
  if (claim !== "claimed") {
    return NextResponse.json(
      { received: true, duplicate: true, status: claim },
      { status: 200 }
    );
  }

  try {
    switch (event.type) {
      // New subscription created and payment successful
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!session.metadata?.userId) break;

        const userId = session.metadata.userId;
        if (session.metadata.type === "api_credit_topup") {
          const amountMicroUsd = Number(session.metadata.amountMicroUsd || 0);
          if (amountMicroUsd > 0) {
            const { error: creditError } = await supabase.rpc("add_api_credits", {
              p_user_id: userId,
              p_amount_micro_usd: amountMicroUsd,
              p_stripe_session_id: session.id,
              p_description: "API credit top-up",
              p_metadata: {
                amount_total: session.amount_total,
                amount_usd: session.metadata.amountUsd,
                currency: session.currency,
              },
            });
            if (creditError) throw creditError;
          }
          break;
        }

        const plan = requireStripeBillingPlan(
          session.metadata.plan,
          `checkout session ${session.id}`,
          session.metadata.publicPlan
        );
        const billingCycle = (session.metadata.billingCycle || "monthly") as "monthly" | "annual";
        const subscriptionId = stripeObjectId(session.subscription);
        if (!subscriptionId) throw new Error(`Checkout session ${session.id} has no subscription ID`);

        const updated = await updateUserSubscription(supabase, userId, {
          plan,
          subscription_id: subscriptionId,
          subscription_start_date: new Date().toISOString(),
          billing_cycle: billingCycle,
          plan_active: true,
        });
        if (!updated) throw new Error(`Failed to activate subscription for user ${userId}`);

        await trackServerEvent("purchase", {
          transaction_id: session.id,
          plan,
          billing_cycle: billingCycle,
          value: (session.amount_total || 0) / 100,
          currency: (session.currency || "usd").toUpperCase(),
        }, userId);

        const userProfile = await getUserProfile(supabase, userId);
        const email = session.customer_email || userProfile?.email;
        if (email) {
          await Promise.allSettled([
            sendPaymentSuccessEmail(
              email,
              userProfile?.full_name || "there",
              plan,
              session.amount_total || 0
            ),
            sendSubscriptionActivatedEmail(
              email,
              userProfile?.full_name || "there",
              plan
            ),
            markLeadConverted(supabase, email),
          ]);
        }

        console.log(`Subscription created: user=${userId}, plan=${plan}`);
        break;
      }

      // Subscription updated (plan change, renewal, status change)
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        const userId = await resolveUserIdForSubscription(config.stripe, supabase, subscription);
        if (!userId) break;
        const userProfile = await getUserProfile(supabase, userId);
        const plan = requireStripeBillingPlan(
          subscription.metadata?.plan,
          `subscription ${subscription.id}`,
          subscription.metadata?.publicPlan || userProfile?.plan
        );
        const billingCycle = (subscription.metadata?.billingCycle || "monthly") as "monthly" | "annual";

        const isActive = subscription.status === "active" || subscription.status === "trialing";
        const sub = subscription as any;

        const updated = await updateUserSubscription(supabase, userId, {
          plan,
          subscription_id: subscription.id,
          subscription_start_date: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : new Date().toISOString(),
          subscription_end_date: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : undefined,
          billing_cycle: billingCycle,
          plan_active: isActive,
        });
        if (!updated) throw new Error(`Failed to sync subscription ${subscription.id}`);

        console.log(`Subscription updated: user=${userId}, status=${subscription.status}`);
        break;
      }

      // Subscription cancelled
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        const userId = await resolveUserIdForSubscription(config.stripe, supabase, subscription);
        if (!userId) break;

        const deactivated = await deactivateSubscription(supabase, userId);
        if (!deactivated) throw new Error(`Failed to deactivate subscription for user ${userId}`);
        console.log(`Subscription cancelled: user=${userId}`);
        break;
      }

      // Payment failed
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        const userId = await resolveUserIdForInvoice(config.stripe, supabase, invoice);
        if (!userId) break;
        console.log(`Payment failed: user=${userId}, invoice=${invoice.id}`);
        const userProfile = await getUserProfile(supabase, userId);
        const email = userProfile?.email;
        if (email) {
          await sendFailedPaymentEmail(
            email,
            userProfile?.full_name || "there",
            userProfile?.plan || "pro",
            invoice.hosted_invoice_url || `${process.env.NEXT_PUBLIC_SITE_URL || "https://equidamai.com"}/pricing`
          );
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(config.stripe, supabase, charge);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    await markStripeEventProcessed(supabase, event.id);
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    await markStripeEventFailed(supabase, event.id, error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

async function getUserProfile(supabase: any, userId: string) {
  const { data } = await supabase
    .from("users")
    .select("email, full_name, plan")
    .eq("id", userId)
    .single();

  return data;
}

async function claimStripeEvent(supabase: any, event: Stripe.Event) {
  const { data, error } = await supabase.rpc("claim_stripe_webhook_event", {
    p_event_id: event.id,
    p_event_type: event.type,
  });
  if (error) throw error;
  return (data || "claimed") as "claimed" | "processed" | "processing";
}

async function markStripeEventProcessed(supabase: any, eventId: string) {
  const { error } = await supabase.rpc("mark_stripe_webhook_event_processed", {
    p_event_id: eventId,
  });
  if (error) console.error("Failed to mark Stripe webhook processed:", error);
}

async function markStripeEventFailed(supabase: any, eventId: string, error: unknown) {
  const { error: updateError } = await supabase.rpc("mark_stripe_webhook_event_failed", {
    p_event_id: eventId,
    p_last_error: error instanceof Error ? error.message : String(error),
  });
  if (updateError) console.error("Failed to mark Stripe webhook failed:", updateError);
}

function stripeObjectId(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
}

function normalizeStripeBillingPlan(value: unknown): StripeBillingPlan | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "pro" || normalized === "plus" || normalized === "enterprise") {
    return normalized;
  }
  return toLegacyBillingPlan(normalized);
}

function requireStripeBillingPlan(
  value: unknown,
  context: string,
  fallback?: unknown
): StripeBillingPlan {
  const plan = normalizeStripeBillingPlan(value) || normalizeStripeBillingPlan(fallback);
  if (!plan) {
    throw new Error(`Invalid or missing Stripe plan metadata for ${context}`);
  }
  return plan;
}

async function resolveUserIdBySubscriptionId(supabase: any, subscriptionId: string | null) {
  if (!subscriptionId) return null;
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("subscription_id", subscriptionId)
    .maybeSingle();
  return data?.id || null;
}

async function resolveUserIdForCustomer(stripe: Stripe, customerId: string | null) {
  if (!customerId) return null;
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return null;
  return customer.metadata?.userId || null;
}

async function resolveUserIdForSubscription(stripe: Stripe, supabase: any, subscription: Stripe.Subscription) {
  const metadataUserId = subscription.metadata?.userId;
  if (metadataUserId) return metadataUserId;

  const storedUserId = await resolveUserIdBySubscriptionId(supabase, subscription.id);
  if (storedUserId) return storedUserId;

  return resolveUserIdForCustomer(stripe, stripeObjectId(subscription.customer));
}

async function resolveUserIdForInvoice(stripe: Stripe, supabase: any, invoice: Stripe.Invoice) {
  const invoiceRecord = invoice as any;
  const subscriptionId = stripeObjectId(invoiceRecord.subscription);
  const storedUserId = await resolveUserIdBySubscriptionId(supabase, subscriptionId);
  if (storedUserId) return storedUserId;

  if (invoiceRecord.subscription && typeof invoiceRecord.subscription === "object") {
    const subscriptionUserId = await resolveUserIdForSubscription(stripe, supabase, invoiceRecord.subscription as Stripe.Subscription);
    if (subscriptionUserId) return subscriptionUserId;
  }

  return resolveUserIdForCustomer(stripe, stripeObjectId(invoice.customer));
}

async function resolveCheckoutSessionForCharge(stripe: Stripe, charge: Stripe.Charge) {
  const paymentIntentId = stripeObjectId(charge.payment_intent);
  if (!paymentIntentId) return null;

  const sessions = await stripe.checkout.sessions.list({
    payment_intent: paymentIntentId,
    limit: 1,
  } as any);

  return sessions.data[0] || null;
}

async function resolveRefundSubscriptionUserId(stripe: Stripe, supabase: any, charge: Stripe.Charge, session: Stripe.Checkout.Session | null) {
  if (session?.metadata?.userId && session.mode === "subscription") return session.metadata.userId;

  const sessionSubscriptionId = stripeObjectId(session?.subscription);
  const sessionUserId = await resolveUserIdBySubscriptionId(supabase, sessionSubscriptionId);
  if (sessionUserId) return sessionUserId;

  const invoiceId = stripeObjectId((charge as any).invoice);
  if (invoiceId) {
    const invoice = await stripe.invoices.retrieve(invoiceId, {
      expand: ["subscription", "customer"],
    } as any);
    const invoiceUserId = await resolveUserIdForInvoice(stripe, supabase, invoice);
    if (invoiceUserId) return invoiceUserId;
  }

  return resolveUserIdForCustomer(stripe, stripeObjectId(charge.customer));
}

async function handleChargeRefunded(stripe: Stripe, supabase: any, charge: Stripe.Charge) {
  const refundedCents = charge.amount_refunded || 0;
  if (refundedCents <= 0) return;

  const session = await resolveCheckoutSessionForCharge(stripe, charge);

  if (session?.metadata?.type === "api_credit_topup") {
    const userId = session.metadata.userId;
    if (!userId || charge.currency?.toLowerCase() !== "usd") return;

    const refundMicroUsd = Math.round(refundedCents * (MICRO_USD_PER_USD / 100));
    const { error } = await supabase.rpc("adjust_api_credits", {
      p_user_id: userId,
      p_amount_micro_usd: -refundMicroUsd,
      p_type: "refund",
      p_description: "Stripe API credit refund",
    });
    if (error) throw error;
    console.log(`API credit refund applied: user=${userId}, charge=${charge.id}`);
    return;
  }

  if (refundedCents < charge.amount) {
    console.log(`Partial subscription refund observed: charge=${charge.id}`);
    return;
  }

  const userId = await resolveRefundSubscriptionUserId(stripe, supabase, charge, session);
  if (!userId) {
    console.warn(`Could not resolve refunded subscription user: charge=${charge.id}`);
    return;
  }

  const deactivated = await deactivateSubscription(supabase, userId);
  if (!deactivated) throw new Error(`Failed to deactivate refunded subscription for user ${userId}`);
  console.log(`Subscription deactivated after refund: user=${userId}, charge=${charge.id}`);
}

async function markLeadConverted(supabase: any, email: string) {
  await supabase
    .from("email_sequence_leads")
    .update({
      converted_to_paid_user: true,
      converted_at: new Date().toISOString(),
    })
    .eq("email", email)
    .is("converted_at", null);
}
