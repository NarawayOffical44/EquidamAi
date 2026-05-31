import { createHmac, timingSafeEqual } from "crypto";
import { getPricing, type Currency } from "@/lib/utils/currency";
import {
  normalizePlanKey,
  toLegacyBillingPlan,
  type LegacyBillingPlanKey,
  type PlanKey,
} from "@/lib/plans/plan-limits";

export type BillingCycle = "monthly" | "annual";

export type RazorpayConfig = {
  keyId: string;
  keySecret: string;
};

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  status?: string;
  notes?: Record<string, unknown>;
};

export type RazorpayPayment = {
  id: string;
  amount: number;
  currency: string;
  order_id: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  email?: string;
  contact?: string;
};

export function getRazorpayConfig(): RazorpayConfig | null {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.key_id;
  const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.key_secret;

  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

export function isSupportedCheckoutCurrency(value: unknown): value is Currency {
  return value === "INR" || value === "USD" || value === "EUR";
}

export function normalizeBillingCycle(value: unknown): BillingCycle | null {
  return value === "monthly" || value === "annual" ? value : null;
}

export function getCheckoutPlanAmount(
  plan: string,
  billingCycle: BillingCycle,
  currency: Currency
): {
  publicPlan: PlanKey;
  billingPlan: Exclude<LegacyBillingPlanKey, "enterprise">;
  amount: number;
  amountSubunits: number;
  displayName: string;
  description: string;
} {
  const publicPlan = normalizePlanKey(plan);
  const billingPlan = toLegacyBillingPlan(publicPlan);

  if (!billingPlan || billingPlan === "enterprise") {
    throw new Error("Invalid plan. Must be 'startup' or 'agency'.");
  }

  const pricing = getPricing(currency);
  const amount =
    billingPlan === "pro"
      ? billingCycle === "annual"
        ? pricing.pro_annual
        : pricing.pro_price
      : billingCycle === "annual"
        ? pricing.plus_annual
        : pricing.plus_price;

  return {
    publicPlan,
    billingPlan,
    amount,
    amountSubunits: Math.round(amount * 100),
    displayName: billingPlan === "pro" ? "Evaldam Startup" : "Evaldam Agency / Investor",
    description:
      billingPlan === "pro"
        ? "1 active startup profile + full valuation reports"
        : "10 active startup profiles + team seats + portfolio dashboard",
  };
}

export async function razorpayRequest<T>(
  config: RazorpayConfig,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const auth = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.error?.description ||
      data?.error?.reason ||
      data?.error ||
      `Razorpay request failed with status ${response.status}`;
    throw new Error(String(message));
  }

  return data as T;
}

export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
  keySecret: string;
}) {
  const expected = createHmac("sha256", params.keySecret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(params.signature);

  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function noteString(notes: Record<string, unknown> | undefined, key: string) {
  const value = notes?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

export function getSubscriptionEndDate(billingCycle: BillingCycle) {
  const endDate = new Date();
  if (billingCycle === "annual") {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }
  return endDate.toISOString();
}
