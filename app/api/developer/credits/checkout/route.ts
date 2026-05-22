import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { config } from "@/lib/config";
import { API_MAX_TOP_UP_USD, API_MIN_TOP_UP_USD, usdToMicroUsd } from "@/lib/developer-api/pricing";

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function isStripeConfigurationError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return error.name === "StripeAuthenticationError"
    || error.message.includes("Invalid API Key")
    || error.message.includes("STRIPE_SECRET_KEY");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const amountUsd = Number(body.amountUsd || 0);
    if (!Number.isFinite(amountUsd) || amountUsd < API_MIN_TOP_UP_USD) {
      return NextResponse.json({ error: `Minimum API credit top-up is $${API_MIN_TOP_UP_USD}` }, { status: 400 });
    }
    if (amountUsd > API_MAX_TOP_UP_USD) {
      return NextResponse.json({ error: `Maximum API credit top-up is $${API_MAX_TOP_UP_USD.toLocaleString()}` }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id || !user.email) {
      return NextResponse.json({ error: "Login is required before buying API credits" }, { status: 401 });
    }

    const { data: account } = await supabase
      .from("users")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    if (!account?.onboarding_completed) {
      return NextResponse.json({ error: "Complete onboarding before buying API credits" }, { status: 403 });
    }

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Evaldam API Credits - $${amountUsd.toFixed(2)}`,
              description: "Prepaid credits for Evaldam model API usage",
            },
            unit_amount: Math.round(amountUsd * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${config.app.siteUrl}/success?apiCredits=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.app.siteUrl}/dashboard`,
      metadata: {
        type: "api_credit_topup",
        userId: user.id,
        amountUsd: amountUsd.toFixed(2),
        amountMicroUsd: String(usdToMicroUsd(amountUsd)),
      },
    });

    return NextResponse.json({ success: true, url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("API credit checkout error:", error);
    if (isStripeConfigurationError(error)) {
      return NextResponse.json(
        { error: "API credit checkout is not configured for this environment. Contact support." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Checkout failed. Please try again." }, { status: 500 });
  }
}
