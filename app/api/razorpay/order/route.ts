import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";
import {
  getCheckoutPlanAmount,
  getRazorpayConfig,
  isSupportedCheckoutCurrency,
  normalizeBillingCycle,
  razorpayRequest,
  type RazorpayOrder,
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
    const currency = "INR";

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
    const checkout = getCheckoutPlanAmount(body.plan, billingCycle, currency);
    const attribution = getRequestAttribution(request, body.attribution);
    const receiptOwner = user?.id
      ? user.id.slice(0, 8)
      : createHash("sha256").update(customerEmail).digest("hex").slice(0, 8);
    const receipt = `eval_${receiptOwner}_${Date.now().toString(36)}`;

    const order = await razorpayRequest<RazorpayOrder>(razorpayConfig, "/orders", {
      method: "POST",
      body: JSON.stringify({
        amount: checkout.amountSubunits,
        currency,
        receipt,
        notes: {
          userId: user?.id || "",
          email: customerEmail,
          fullName: customerName,
          phone: customerPhone,
          companyName: customerCompany,
          plan: checkout.billingPlan,
          publicPlan: checkout.publicPlan,
          billingCycle,
          currency,
          paymentMode: "one_time_order",
          recurring: "false",
          guestCheckout: user?.id ? "false" : "true",
          customerCategory: checkout.publicPlan === "agency" ? "agency_or_advisor" : "founder_or_startup",
          landingPage: attribution.landingPage || "",
          utmSource: attribution.utmSource || "",
          utmCampaign: attribution.utmCampaign || "",
        },
      }),
    });

    return NextResponse.json({
      success: true,
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
