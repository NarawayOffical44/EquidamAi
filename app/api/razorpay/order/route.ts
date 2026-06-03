import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  getCheckoutPlanAmount,
  getRazorpayConfig,
  getRazorpaySubscriptionCheckout,
  getRawRazorpaySubscriptionId,
  getSubscriptionEndDate,
  isSupportedCheckoutCurrency,
  normalizeBillingCycle,
  razorpayRequest,
  type RazorpayOrder,
  type RazorpaySubscription,
} from "@/lib/razorpay/server";
import { getRequestAttribution } from "@/lib/leads/attribution";
import { normalizePlanKey } from "@/lib/plans/plan-limits";
import { updateUserSubscription } from "@/lib/supabase/subscription";
import { normalizeBenchmarkCountry } from "@/lib/personalization/country-benchmarks";

type AccountRow = {
  id: string;
  email: string | null;
  plan: string | null;
  plan_active: boolean | null;
  billing_cycle: string | null;
  subscription_id: string | null;
  subscription_end_date: string | null;
};

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
    const billingCycle = normalizeBillingCycle(body.billingCycle);
    const currency = isSupportedCheckoutCurrency(body.currency) ? body.currency : "USD";
    const benchmarkCountry = normalizePaymentCountry(body.country);

    if (!body.plan || !billingCycle || !isSupportedCheckoutCurrency(currency)) {
      return NextResponse.json(
        { error: "Invalid checkout details. Choose a valid plan, billing cycle, and currency." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const guestLead = user?.id && user.email ? null : parseGuestLead(body.lead);
    if ((!user?.id || !user.email) && !guestLead) {
      return NextResponse.json(
        { error: "Complete your checkout details before payment" },
        { status: 400 }
      );
    }

    const customerEmail = (user?.email || guestLead?.email || "").trim().toLowerCase();
    const customerName = guestLead?.fullName || getUserFullName(user) || "";
    const customerPhone = guestLead?.phone || "";
    const customerCompany = guestLead?.companyName || "";
    const subscriptionCheckout = getRazorpaySubscriptionCheckout(body.plan, billingCycle, currency);
    const checkout = subscriptionCheckout || getCheckoutPlanAmount(body.plan, billingCycle, currency);
    const adminClient = createAdminClient();
    const paidAccount = await findPaidAccountByEmail(adminClient, customerEmail);

    if (paidAccount && (!user?.id || paidAccount.id !== user.id)) {
      const existingPlan = normalizePlanKey(paidAccount.plan, paidAccount.plan_active);
      const requestedPlan = checkout.publicPlan;
      const samePlan = existingPlan === requestedPlan && paidAccount.billing_cycle === billingCycle;
      const canAttachGuestUpgradeAfterPayment = !samePlan && !getRawRazorpaySubscriptionId(paidAccount.subscription_id);

      if (!canAttachGuestUpgradeAfterPayment) {
        return NextResponse.json(
          {
            code: samePlan ? "PLAN_ALREADY_ACTIVE" : "ACTIVE_ACCOUNT_EXISTS",
            error: samePlan
              ? "This plan is already active for this email. Sign in with this email to manage it."
              : "An active paid account already exists for this email. Sign in with this email to upgrade or manage billing.",
          },
          { status: 409 }
        );
      }
    }

    if (paidAccount && user?.id === paidAccount.id) {
      const existingPlan = normalizePlanKey(paidAccount.plan, paidAccount.plan_active);
      const requestedPlan = checkout.publicPlan;
      const samePlan = existingPlan === requestedPlan && paidAccount.billing_cycle === billingCycle;
      const existingRazorpaySubscriptionId = getRawRazorpaySubscriptionId(paidAccount.subscription_id);

      if (samePlan) {
        return NextResponse.json(
          { code: "PLAN_ALREADY_ACTIVE", error: "This plan is already active for your account." },
          { status: 409 }
        );
      }

      if (existingRazorpaySubscriptionId && subscriptionCheckout) {
        const updatedSubscription = await razorpayRequest<RazorpaySubscription>(razorpayConfig, `/subscriptions/${existingRazorpaySubscriptionId}`, {
          method: "PATCH",
          body: JSON.stringify({
            plan_id: subscriptionCheckout.planId,
            quantity: 1,
            schedule_change_at: "now",
            customer_notify: true,
          }),
        });

        const updated = await updateUserSubscription(adminClient, paidAccount.id, {
          plan: checkout.billingPlan,
          subscription_id: `razorpay_subscription:${existingRazorpaySubscriptionId}`,
          subscription_start_date: toIsoDate(updatedSubscription.current_start || updatedSubscription.start_at) || new Date().toISOString(),
          subscription_end_date: toIsoDate(updatedSubscription.current_end || updatedSubscription.end_at) || getSubscriptionEndDate(billingCycle),
          billing_cycle: billingCycle,
          plan_active: true,
        });

        if (!updated) {
          return NextResponse.json(
            { error: "Subscription was updated. Account activation is still processing. Refresh the dashboard in a moment." },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          checkoutMode: "subscription_update",
          plan: checkout.publicPlan,
          billingCycle,
          redirectUrl: `/success?provider=razorpay&subscription_id=${encodeURIComponent(existingRazorpaySubscriptionId)}`,
        });
      }

      if (existingRazorpaySubscriptionId && !subscriptionCheckout) {
        return NextResponse.json(
          {
            code: "ACTIVE_SUBSCRIPTION_EXISTS",
            error: "You already have an active auto-renewing subscription. Cancel it from Settings before switching to one-time annual access.",
          },
          { status: 409 }
        );
      }
    }

    const attribution = getRequestAttribution(request, body.attribution);
    const receiptOwner = user?.id
      ? user.id.slice(0, 8)
      : createHash("sha256").update(customerEmail).digest("hex").slice(0, 8);
    const receipt = `eval_${receiptOwner}_${Date.now().toString(36)}`;

    const notes = {
      userId: user?.id || "",
      email: customerEmail,
      fullName: customerName,
      phone: customerPhone,
      companyName: customerCompany,
      plan: checkout.billingPlan,
      publicPlan: checkout.publicPlan,
      billingCycle,
      currency: subscriptionCheckout?.currency || currency,
      country: benchmarkCountry || "",
      paymentMode: subscriptionCheckout ? "razorpay_subscription" : "one_time_order",
      recurring: subscriptionCheckout ? "true" : "false",
      guestCheckout: user?.id ? "false" : "true",
      landingPage: attribution.landingPage || "",
      utmSource: attribution.utmSource || "",
      utmCampaign: attribution.utmCampaign || "",
    };

    if (subscriptionCheckout) {
      const subscription = await razorpayRequest<RazorpaySubscription>(razorpayConfig, "/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          plan_id: subscriptionCheckout.planId,
          total_count: subscriptionCheckout.totalCount,
          quantity: 1,
          customer_notify: true,
          notes,
        }),
      });

      return NextResponse.json({
        success: true,
        checkoutMode: "subscription",
        keyId: razorpayConfig.keyId,
        subscriptionId: subscription.id,
        amount: subscriptionCheckout.amountSubunits,
        currency: subscriptionCheckout.currency,
        name: "Evaldam AI",
        description: checkout.description,
        plan: checkout.publicPlan,
        billingCycle,
        recurring: true,
        prefill: {
          email: customerEmail,
          name: customerName,
          contact: customerPhone,
        },
      });
    }

    const order = await razorpayRequest<RazorpayOrder>(razorpayConfig, "/orders", {
      method: "POST",
      body: JSON.stringify({
        amount: checkout.amountSubunits,
        currency,
        receipt,
        notes,
      }),
    });

    return NextResponse.json({
      success: true,
      checkoutMode: "order",
      keyId: razorpayConfig.keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      name: "Evaldam AI",
      description: checkout.description,
      plan: checkout.publicPlan,
      billingCycle,
      prefill: {
        email: customerEmail,
        name: customerName,
        contact: customerPhone,
      },
    });
  } catch (error) {
    console.error("Razorpay order error:", error);
    return NextResponse.json(
      { error: "Could not start secure payment. Please try again." },
      { status: 500 }
    );
  }
}

function parseGuestLead(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const lead = value as Record<string, unknown>;
  const fullName = stringValue(lead.fullName);
  const email = stringValue(lead.email)?.toLowerCase();
  const phone = stringValue(lead.phone);
  const companyName = stringValue(lead.companyName);
  const useCase = stringValue(lead.useCase);

  if (!fullName || !email || !email.includes("@") || !phone || !companyName || !useCase) return null;

  return { fullName, email, phone, companyName, useCase };
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getUserFullName(user: { user_metadata?: Record<string, unknown> } | null | undefined) {
  const value = user?.user_metadata?.full_name;
  return typeof value === "string" ? value : "";
}

function normalizePaymentCountry(value: unknown) {
  const normalized = normalizeBenchmarkCountry(typeof value === "string" ? value : null);
  return normalized === "GLOBAL" ? null : normalized;
}

async function findPaidAccountByEmail(adminClient: ReturnType<typeof createAdminClient>, email: string) {
  if (!email) return null;

  const { data } = await adminClient
    .from("users")
    .select("id, email, plan, plan_active, billing_cycle, subscription_id, subscription_end_date")
    .eq("email", email)
    .maybeSingle<AccountRow>();

  if (!data || !isPlanUsable(data.plan_active, data.subscription_end_date)) return null;
  return data;
}

function isPlanUsable(planActive?: boolean | null, subscriptionEndDate?: string | null) {
  if (!planActive) return false;
  if (!subscriptionEndDate) return true;
  return new Date(subscriptionEndDate) >= new Date();
}

function toIsoDate(unixSeconds: number | null | undefined) {
  if (!unixSeconds || !Number.isFinite(unixSeconds)) return null;
  return new Date(unixSeconds * 1000).toISOString();
}
