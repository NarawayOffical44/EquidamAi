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

type InvoiceClaim =
  | { kind: "user"; id: string; metadata: Record<string, unknown>; email: string }
  | { kind: "lead"; id: string; metadata: Record<string, unknown>; email: string }
  | { kind: "none" };

type UserInvoiceRow = {
  id: string;
  email: string | null;
  billing_metadata?: unknown;
};

type LeadInvoiceRow = {
  id: string;
  metadata?: unknown;
  website_url?: string | null;
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
    const claim = await claimInvoiceEmail(adminClient, {
      paymentId,
      email,
      userId: noteString(notes, "userId"),
    });
    if (!claim) {
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
      await markInvoiceEmail(adminClient, claim, paymentId, "failed", invoiceNumber);
      return NextResponse.json({ error: "Invoice email could not be sent." }, { status: 500 });
    }

    await markInvoiceEmail(adminClient, claim, paymentId, "sent", invoiceNumber);
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

async function claimInvoiceEmail(
  adminClient: ReturnType<typeof createAdminClient>,
  params: { paymentId: string; email: string; userId: string | null }
): Promise<InvoiceClaim | null> {
  if (params.userId) {
    const user = await loadInvoiceUser(adminClient, params.userId, params.email);
    if (user) {
      const metadata = asRecord(user.billing_metadata);
      if (hasInvoiceAlreadyStarted(metadata, params.paymentId)) return null;

      await updateUserInvoiceMetadata(adminClient, user.id, metadata, params.paymentId, {
        status: "processing",
        email: params.email,
        updatedAt: new Date().toISOString(),
      });

      return { kind: "user", id: user.id, metadata, email: params.email };
    }
  }

  const lead = await loadInvoiceLead(adminClient, params.paymentId, params.email);
  if (lead) {
    const metadata = getLeadMetadata(lead);
    if (hasInvoiceAlreadyStarted(metadata, params.paymentId)) return null;

    const nextMetadata = withInvoiceMetadata(metadata, params.paymentId, {
      status: "processing",
      email: params.email,
      updatedAt: new Date().toISOString(),
    });

    await adminClient
      .from("leads")
      .update({
        metadata: nextMetadata,
        website_url: JSON.stringify(nextMetadata),
      })
      .eq("id", lead.id);

    return { kind: "lead", id: lead.id, metadata, email: params.email };
  }

  return { kind: "none" };
}

async function markInvoiceEmail(
  adminClient: ReturnType<typeof createAdminClient>,
  claim: InvoiceClaim,
  paymentId: string,
  status: "sent" | "failed",
  invoiceNumber: string
) {
  if (claim.kind === "none") return;

  const invoiceState = {
    status,
    email: claim.email,
    invoiceNumber,
    sentAt: status === "sent" ? new Date().toISOString() : null,
    updatedAt: new Date().toISOString(),
  };

  if (claim.kind === "user") {
    await updateUserInvoiceMetadata(adminClient, claim.id, claim.metadata, paymentId, invoiceState);
    return;
  }

  const nextMetadata = withInvoiceMetadata(claim.metadata, paymentId, invoiceState);
  await adminClient
    .from("leads")
    .update({
      metadata: nextMetadata,
      website_url: JSON.stringify(nextMetadata),
    })
    .eq("id", claim.id);
}

async function loadInvoiceUser(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string,
  email: string
) {
  const withBillingMetadata = await adminClient
    .from("users")
    .select("id, email, billing_metadata")
    .eq("id", userId)
    .maybeSingle<UserInvoiceRow>();

  if (!withBillingMetadata.error && withBillingMetadata.data) return withBillingMetadata.data;

  const fallback = await adminClient
    .from("users")
    .select("id, email")
    .eq("email", email)
    .maybeSingle<UserInvoiceRow>();

  return fallback.data || null;
}

async function loadInvoiceLead(
  adminClient: ReturnType<typeof createAdminClient>,
  paymentId: string,
  email: string
) {
  const result = await adminClient
    .from("leads")
    .select("id, metadata, website_url")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(20);

  if (result.error) return null;

  return ((result.data || []) as LeadInvoiceRow[]).find((row) => {
    const metadata = getLeadMetadata(row);
    return metadata.paymentId === paymentId || metadata.razorpayPaymentId === paymentId;
  }) || null;
}

async function updateUserInvoiceMetadata(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string,
  metadata: Record<string, unknown>,
  paymentId: string,
  invoiceState: Record<string, unknown>
) {
  await adminClient
    .from("users")
    .update({ billing_metadata: withInvoiceMetadata(metadata, paymentId, invoiceState) })
    .eq("id", userId);
}

function hasInvoiceAlreadyStarted(metadata: Record<string, unknown>, paymentId: string) {
  const invoices = asRecord(metadata.invoiceEmails);
  const invoice = asRecord(invoices[paymentId]);
  return invoice.status === "processing" || invoice.status === "sent";
}

function withInvoiceMetadata(
  metadata: Record<string, unknown>,
  paymentId: string,
  invoiceState: Record<string, unknown>
) {
  const invoices = asRecord(metadata.invoiceEmails);
  return {
    ...metadata,
    invoiceEmails: {
      ...invoices,
      [paymentId]: invoiceState,
    },
  };
}

function getLeadMetadata(row: LeadInvoiceRow) {
  const metadata = asRecord(row.metadata);
  if (Object.keys(metadata).length > 0) return metadata;
  return parseMetadata(row.website_url);
}

function parseMetadata(value: string | null | undefined) {
  if (!value || !value.trim().startsWith("{")) return {};
  try {
    return asRecord(JSON.parse(value));
  } catch {
    return {};
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
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
