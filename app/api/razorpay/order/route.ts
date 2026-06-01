import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";
import {
  getCheckoutPlanAmount,
  getRazorpayConfig,
  getRazorpaySubscriptionCheckout,
  isSupportedCheckoutCurrency,
  normalizeBillingCycle,
  razorpayRequest,
  type RazorpayOrder,
  type RazorpaySubscription,
} from "@/lib/razorpay/server";
import { getRequestAttribution } from "@/lib/leads/attribution";

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
