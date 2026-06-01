import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendInvoiceEmail } from "@/lib/billing/invoice-email";
import type { Currency } from "@/lib/utils/currency";
import {
  getCheckoutPlanAmount,
  getRazorpayConfig,
  getRazorpaySubscriptionCheckout,
  isSupportedCheckoutCurrency,
  noteString,
  normalizeBillingCycle,
  razorpayRequest,
  type RazorpayOrder,
  type RazorpayPayment,
  type RazorpaySubscription,
} from "@/lib/razorpay/server";

type InvoiceBody = {
  paymentId?: string;
  orderId?: string;
  subscriptionId?: string;
};

type InvoiceClaim = {
  payment_id: string;
  status: string;
};

export async function POST(request: NextRequest) {
  try {
    const razorpayConfig = getRazorpayConfig();
    if (!razorpayConfig) {
      return NextResponse.json({ error: "Invoice email is temporarily unavailable." }, { status: 503 });
    }

    const rawBody = await request.text();
    const signature = request.headers.get("x-evaldam-invoice-signature") || "";
    if (!isValidInternalSignature(rawBody, signature, razorpayConfig.keySecret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = JSON.parse(rawBody) as InvoiceBody;
    const paymentId = stringValue(body.paymentId);
    const orderId = stringValue(body.orderId);
    const subscriptionId = stringValue(body.subscriptionId);
    if (!paymentId || (!orderId && !subscriptionId)) {
      return NextResponse.json({ error: "Payment reference is required." }, { status: 400 });
    }

    const payment = await razorpayRequest<RazorpayPayment>(razorpayConfig, `/payments/${paymentId}`);
    let order: RazorpayOrder | null = null;
    let subscription: RazorpaySubscription | null = null;
    let notes: Record<string, unknown> | undefined;

    if (subscriptionId) {
      subscription = await razorpayRequest<RazorpaySubscription>(razorpayConfig, `/subscriptions/${subscriptionId}`);
      notes = subscription.notes || {};
    } else if (orderId) {
      order = await razorpayRequest<RazorpayOrder>(razorpayConfig, `/orders/${orderId}`);
      if (payment.order_id !== order.id) {
        return NextResponse.json({ error: "Payment could not be matched to this invoice." }, { status: 400 });
      }
      notes = order.notes || {};
    }

    const email = normalizeEmail(noteString(notes, "email") || payment.email);
    if (!email) {
      return NextResponse.json({ error: "No customer email was available for this invoice." }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const claimed = await claimInvoiceEmail(adminClient, paymentId, email);
    if (!claimed) {
      return NextResponse.json({ success: true, duplicate: true });
    }

    const plan = noteString(notes, "publicPlan") || noteString(notes, "plan") || "startup";
    const billingCycle = normalizeBillingCycle(noteString(notes, "billingCycle")) || "monthly";
    const noteCurrency = noteString(notes, "currency");
    const currency: Currency = isSupportedCheckoutCurrency(noteCurrency)
      ? noteCurrency
      : isSupportedCheckoutCurrency(payment.currency)
        ? payment.currency
        : "USD";
    const checkout =
      subscriptionId
        ? getRazorpaySubscriptionCheckout(plan, billingCycle, currency) || getCheckoutPlanAmount(plan, billingCycle, currency)
        : getCheckoutPlanAmount(plan, billingCycle, currency);
    const invoiceNumber = buildInvoiceNumber(paymentId);

    const result = await sendInvoiceEmail({
      invoiceNumber,
      issuedAt: new Date().toISOString(),
      customerName: noteString(notes, "fullName") || "Customer",
      customerEmail: email,
      companyName: noteString(notes, "companyName"),
      planName: checkout.displayName,
      billingPeriod: billingCycle === "annual" ? "Annual" : "Monthly",
      paymentProvider: "Razorpay",
      paymentId,
      subscriptionId: subscription?.id || null,
      amountSubunits: payment.amount || order?.amount || checkout.amountSubunits,
      currency,
    });

    if (!result.success) {
      await markInvoiceEmail(adminClient, paymentId, "failed", invoiceNumber);
      return NextResponse.json({ error: "Invoice email could not be sent." }, { status: 500 });
    }

    await markInvoiceEmail(adminClient, paymentId, "sent", invoiceNumber);
    return NextResponse.json({ success: true, invoiceNumber });
  } catch (error) {
    console.error("Razorpay invoice email error:", error);
    return NextResponse.json({ error: "Could not send invoice email." }, { status: 500 });
  }
}

function isValidInternalSignature(rawBody: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

async function claimInvoiceEmail(adminClient: ReturnType<typeof createAdminClient>, paymentId: string, email: string) {
  const { error } = await adminClient
    .from("payment_invoice_emails")
    .insert({
      payment_id: paymentId,
      email,
      status: "processing",
      updated_at: new Date().toISOString(),
    })
    .select("payment_id, status")
    .maybeSingle<InvoiceClaim>();

  if (!error) return true;
  if (error.code === "42P01") return true;
  if (error.code === "23505") return false;
  throw error;
}

async function markInvoiceEmail(
  adminClient: ReturnType<typeof createAdminClient>,
  paymentId: string,
  status: "sent" | "failed",
  invoiceNumber: string
) {
  await adminClient
    .from("payment_invoice_emails")
    .update({
      status,
      invoice_number: invoiceNumber,
      sent_at: status === "sent" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("payment_id", paymentId);
}

function buildInvoiceNumber(paymentId: string) {
  const date = new Date();
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `EVAL-${yyyy}${mm}${dd}-${paymentId.slice(-8).toUpperCase()}`;
}

function normalizeEmail(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized && normalized.includes("@") ? normalized : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
