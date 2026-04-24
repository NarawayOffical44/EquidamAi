import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import {
  updateUserSubscription,
  deactivateSubscription,
} from "@/lib/supabase/subscription";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-04-10" as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

/**
 * Stripe Webhook Handler
 * Syncs Stripe subscription data with database
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") || "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    switch (event.type) {
      // New subscription created and payment successful
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!session.metadata?.userId) break;

        const userId = session.metadata.userId;
        const plan = (session.metadata.plan || "pro") as "pro" | "plus" | "enterprise";
        const billingCycle = (session.metadata.billingCycle || "monthly") as "monthly" | "annual";

        await updateUserSubscription(supabase, userId, {
          plan,
          subscription_id: session.subscription as string,
          subscription_start_date: new Date().toISOString(),
          billing_cycle: billingCycle,
          plan_active: true,
        });

        console.log(`Subscription created: user=${userId}, plan=${plan}`);
        break;
      }

      // Subscription updated (plan change, renewal, status change)
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);

        if (customer.deleted || !customer.metadata?.userId) break;

        const userId = customer.metadata.userId;
        const plan = (subscription.metadata?.plan || "pro") as "pro" | "plus" | "enterprise";
        const billingCycle = (subscription.metadata?.billingCycle || "monthly") as "monthly" | "annual";

        const isActive = subscription.status === "active" || subscription.status === "trialing";
        const sub = subscription as any;

        await updateUserSubscription(supabase, userId, {
          plan,
          subscription_id: subscription.id,
          subscription_start_date: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : new Date().toISOString(),
          subscription_end_date: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : undefined,
          billing_cycle: billingCycle,
          plan_active: isActive,
        });

        console.log(`Subscription updated: user=${userId}, status=${subscription.status}`);
        break;
      }

      // Subscription cancelled
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);

        if (customer.deleted || !customer.metadata?.userId) break;

        const userId = customer.metadata.userId;
        await deactivateSubscription(supabase, userId);
        console.log(`Subscription cancelled: user=${userId}`);
        break;
      }

      // Payment failed
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customer = await stripe.customers.retrieve(invoice.customer as string);

        if (customer.deleted || !customer.metadata?.userId) break;

        const userId = customer.metadata.userId;
        console.log(`Payment failed: user=${userId}, invoice=${invoice.id}`);
        // Note: Don't deactivate immediately, Stripe retries. After max retries, handle in subscription.updated event
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
