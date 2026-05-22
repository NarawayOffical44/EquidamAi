import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { config } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { getPricing, type Currency } from "@/lib/utils/currency";
import { getRequestAttribution } from "@/lib/leads/attribution";
import { normalizePlanKey, toLegacyBillingPlan } from "@/lib/plans/plan-limits";

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, billingCycle = "monthly", currency = "USD", attribution } = body;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id || !user.email || !plan) {
      return NextResponse.json(
        { error: "Login is required before payment" },
        { status: 400 }
      );
    }

    const normalizedPlan = normalizePlanKey(plan);
    const billingPlan = toLegacyBillingPlan(plan);

    if (!billingPlan) {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'startup', 'agency', or 'enterprise'." },
        { status: 400 }
      );
    }

    if (!["monthly", "annual"].includes(billingCycle)) {
      return NextResponse.json(
        { error: "Invalid billing cycle. Must be 'monthly' or 'annual'." },
        { status: 400 }
      );
    }

    if (!["INR", "USD", "EUR"].includes(currency)) {
      return NextResponse.json(
        { error: "Invalid currency. Must be INR, USD, or EUR." },
        { status: 400 }
      );
    }

    // 3-tier subscription. Price data follows the public pricing table.
    const lineItems: any[] = [];
    const pricing = getPricing(currency as Currency);

    if (billingPlan === "pro") {
      const amount = billingCycle === "annual" ? pricing.pro_annual : pricing.pro_price;

      lineItems.push({
        price_data: {
          currency: String(currency).toLowerCase(),
          product_data: {
            name: "Evaldam Startup",
            description: "1 active startup profile + full valuation reports",
          },
          unit_amount: Math.round(amount * 100),
          recurring: {
            interval: (billingCycle === "annual" ? "year" : "month") as any,
          },
        },
        quantity: 1,
      });
    } else if (billingPlan === "plus") {
      const amount = billingCycle === "annual" ? pricing.plus_annual : pricing.plus_price;

      lineItems.push({
        price_data: {
          currency: String(currency).toLowerCase(),
          product_data: {
            name: "Evaldam Agency / Investor",
            description: "10 active startup profiles + team seats + portfolio dashboard",
          },
          unit_amount: Math.round(amount * 100),
          recurring: {
            interval: (billingCycle === "annual" ? "year" : "month") as any,
          },
        },
        quantity: 1,
      });
    } else if (billingPlan === "enterprise") {
      return NextResponse.json(
        {
          error: "Enterprise plans require custom pricing. Please contact sales@equidamai.com",
        },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'startup', 'agency', or 'enterprise'." },
        { status: 400 }
      );
    }

    const cleanAttribution = getRequestAttribution(request, attribution);
    const metadata = {
      userId: user.id,
      plan: billingPlan,
      publicPlan: normalizedPlan,
      billingCycle,
      currency,
      customerCategory: inferCustomerCategory(normalizedPlan),
      landingPage: cleanAttribution.landingPage || "",
      currentPage: cleanAttribution.currentPage || "",
      utmSource: cleanAttribution.utmSource || "",
      utmCampaign: cleanAttribution.utmCampaign || "",
    };
    const sessionParams: any = {
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: lineItems.some((item) => item.price_data?.recurring)
        ? "subscription"
        : "payment",
      success_url: `${config.app.siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.app.siteUrl}/checkout?plan=${normalizedPlan}&billingCycle=${billingCycle}`,
      customer_email: user.email,
      metadata,
    };
    if (sessionParams.mode === "subscription") {
      sessionParams.subscription_data = { metadata };
    }

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Checkout failed", details: String(error) },
      { status: 500 }
    );
  }
}

function inferCustomerCategory(plan: string) {
  const normalizedPlan = normalizePlanKey(plan);
  if (normalizedPlan === "agency") return "agency_or_advisor";
  if (normalizedPlan === "enterprise") return "enterprise_or_portfolio";
  return "founder_or_startup";
}
