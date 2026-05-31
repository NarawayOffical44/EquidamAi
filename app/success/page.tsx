export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import SuccessPage from './SuccessPageClient';
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateUserSubscription } from "@/lib/supabase/subscription";

export const metadata: Metadata = {
  title: "Payment Successful",
  description: "Your Evaldam AI subscription payment was successful and your account is being updated.",
  robots: {
    index: false,
    follow: false,
  },
};

type SuccessPageProps = {
  searchParams: Promise<{
    session_id?: string | string[];
    provider?: string | string[];
    payment_id?: string | string[];
  }>;
};

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-04-10" as any,
  });
}

async function syncApiCreditTopUp(
  adminClient: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session,
  userId: string
) {
  const amountMicroUsd = Number(session.metadata?.amountMicroUsd || 0);
  if (amountMicroUsd <= 0) return;

  const { data: existingCredit, error: existingCreditError } = await adminClient
    .from("api_credit_transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("stripe_session_id", session.id)
    .eq("type", "top_up")
    .maybeSingle();

  if (existingCreditError) throw existingCreditError;
  if (existingCredit?.id) return;

  const { error } = await adminClient.rpc("add_api_credits", {
    p_user_id: userId,
    p_amount_micro_usd: amountMicroUsd,
    p_stripe_session_id: session.id,
    p_description: "API credit top-up",
    p_metadata: {
      amount_total: session.amount_total,
      amount_usd: session.metadata?.amountUsd,
      currency: session.currency,
    },
  });
  if (error) throw error;
}

export default async function Page({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const sessionId = firstParam(params.session_id);
  const provider = firstParam(params.provider);
  const paymentId = firstParam(params.payment_id);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const nextPath =
      provider === "razorpay" && paymentId
        ? `/success?provider=razorpay&payment_id=${encodeURIComponent(paymentId)}`
        : `/success?session_id=${sessionId || ""}`;
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (provider === "razorpay" && paymentId) {
    const adminClient = createAdminClient();
    const { data: account } = await adminClient
      .from("users")
      .select("plan_active, subscription_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!account?.plan_active || account.subscription_id !== `razorpay:${paymentId}`) {
      redirect("/pricing");
    }

    return <SuccessPage checkoutType="subscription" />;
  }

  if (!sessionId || !sessionId.startsWith("cs_")) redirect("/pricing");

  const stripe = getStripeClient();
  if (!stripe) redirect("/pricing");

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    redirect("/pricing");
  }

  if (session.metadata?.userId !== user.id) redirect("/dashboard");
  if (session.status !== "complete" || session.payment_status !== "paid") redirect("/pricing");

  const checkoutType = session.metadata?.type === "api_credit_topup" ? "api_credit_topup" : "subscription";
  const adminClient = createAdminClient();

  if (checkoutType === "api_credit_topup") {
    await syncApiCreditTopUp(adminClient, session, user.id);
  } else {
    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : session.subscription?.id || "";
    if (subscriptionId) {
      const plan = session.metadata?.plan === "plus" || session.metadata?.plan === "enterprise"
        ? session.metadata.plan
        : "pro";
      const billingCycle = session.metadata?.billingCycle === "annual" ? "annual" : "monthly";
      const { data: account } = await adminClient
        .from("users")
        .select("plan_active, subscription_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!account?.plan_active || account.subscription_id !== subscriptionId) {
        await updateUserSubscription(adminClient, user.id, {
          plan,
          subscription_id: subscriptionId,
          subscription_start_date: new Date().toISOString(),
          billing_cycle: billingCycle,
          plan_active: true,
        });
      }
    }
  }

  return <SuccessPage checkoutType={checkoutType} />;
}
