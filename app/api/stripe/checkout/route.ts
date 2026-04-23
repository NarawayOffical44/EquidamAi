import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { config } from "@/lib/config";

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userEmail, plan, billingCycle = "monthly" } = body;

    if (!userId || !userEmail || !plan) {
      return NextResponse.json(
        { error: "Missing required fields: userId, userEmail, plan" },
        { status: 400 }
      );
    }

    if (!["pro", "plus", "enterprise"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'pro', 'plus', or 'enterprise'." },
        { status: 400 }
      );
    }

    if (!["monthly", "annual"].includes(billingCycle)) {
      return NextResponse.json(
        { error: "Invalid billing cycle. Must be 'monthly' or 'annual'." },
        { status: 400 }
      );
    }

    // 3-tier subscription: Pro ($99/mo), Plus ($199/mo), Enterprise (contact)
    const lineItems: any[] = [];

    if (plan === "pro") {
      // Pro plan: $99/month for 3 profiles
      const amount = billingCycle === "annual" ? config.stripe.pricing.pro.annualUSD : config.stripe.pricing.pro.monthlyUSD;

      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Evaldam Pro",
            description: "3 active startup profiles + professional valuations",
          },
          unit_amount: amount,
          recurring: {
            interval: (billingCycle === "annual" ? "year" : "month") as any,
          },
        },
        quantity: 1,
      });
    } else if (plan === "plus") {
      // Plus plan: $199/month for 15 profiles
      const amount = billingCycle === "annual" ? config.stripe.pricing.plus.annualUSD : config.stripe.pricing.plus.monthlyUSD;

      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Evaldam Plus",
            description: "15 active startup profiles + advanced analytics + team seats",
          },
          unit_amount: amount,
          recurring: {
            interval: (billingCycle === "annual" ? "year" : "month") as any,
          },
        },
        quantity: 1,
      });
    } else if (plan === "enterprise") {
      return NextResponse.json(
        {
          error: "Enterprise plans require custom pricing. Please contact sales@evaldam.ai",
        },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'pro', 'plus', or 'enterprise'." },
        { status: 400 }
      );
    }

    const sessionParams: any = {
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: lineItems.some((item) => item.price_data?.recurring)
        ? "subscription"
        : "payment",
      success_url: `${config.app.siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.app.siteUrl}/checkout?plan=${plan}&billingCycle=${billingCycle}`,
      customer_email: userEmail,
      metadata: {
        userId,
        plan,
        billingCycle,
      },
    };

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
