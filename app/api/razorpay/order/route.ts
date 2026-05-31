import { NextRequest, NextResponse } from "next/server";
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
        { code: "RAZORPAY_NOT_CONFIGURED", error: "Razorpay checkout is not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const billingCycle = normalizeBillingCycle(body.billingCycle);
    const currency = body.currency;

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

    if (!user?.id || !user.email) {
      return NextResponse.json(
        { error: "Login is required before payment" },
        { status: 401 }
      );
    }

    const checkout = getCheckoutPlanAmount(body.plan, billingCycle, currency);
    const attribution = getRequestAttribution(request, body.attribution);
    const receipt = `eval_${user.id.slice(0, 8)}_${Date.now().toString(36)}`;

    const order = await razorpayRequest<RazorpayOrder>(razorpayConfig, "/orders", {
      method: "POST",
      body: JSON.stringify({
        amount: checkout.amountSubunits,
        currency,
        receipt,
        notes: {
          userId: user.id,
          email: user.email,
          plan: checkout.billingPlan,
          publicPlan: checkout.publicPlan,
          billingCycle,
          currency,
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
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Razorpay order error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Razorpay order failed" },
      { status: 500 }
    );
  }
}
