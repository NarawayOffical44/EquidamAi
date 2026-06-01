import type { SupabaseClient } from "@supabase/supabase-js";
import { updateUserSubscription } from "@/lib/supabase/subscription";
import { logger } from "@/lib/utils/logger";

type BillingPlan = "pro" | "plus" | "startup" | "agency" | "enterprise";

type LeadRecord = {
  id: string;
  metadata?: unknown;
  website_url?: string | null;
};

type PendingPaidCheckout = {
  leadId: string;
  metadata: Record<string, unknown>;
};

export async function claimPendingPaidCheckout(
  admin: SupabaseClient,
  email: string | null | undefined,
  userId: string
) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return { ok: true, claimed: false };

  const pending = await findPendingPaidCheckout(admin, normalizedEmail);
  if (!pending) return { ok: true, claimed: false };

  const billingPlan = stringValue(pending.metadata.billingPlan);
  const subscriptionId = stringValue(pending.metadata.subscriptionId);
  const billingCycle = pending.metadata.billingCycle === "monthly" ? "monthly" : "annual";

  if (!isPaidBillingPlan(billingPlan) || !subscriptionId) {
    logger.error("Pending paid checkout has incomplete activation metadata", {
      email: normalizedEmail,
      leadId: pending.leadId,
    });
    return { ok: false, claimed: false };
  }

  const accountReady = await ensureAccountRow(admin, userId, normalizedEmail);
  if (!accountReady) return { ok: false, claimed: false };

  const updated = await updateUserSubscription(admin, userId, {
    plan: billingPlan,
    subscription_id: subscriptionId,
    subscription_start_date: stringValue(pending.metadata.subscriptionStartDate) || new Date().toISOString(),
    subscription_end_date: stringValue(pending.metadata.subscriptionEndDate) || undefined,
    billing_cycle: billingCycle,
    plan_active: true,
  });

  if (!updated) return { ok: false, claimed: false };

  await markPaidCheckoutClaimed(admin, pending, userId);

  return { ok: true, claimed: true };
}

async function ensureAccountRow(admin: SupabaseClient, userId: string, email: string) {
  const { error } = await admin
    .from("users")
    .upsert(
      {
        id: userId,
        email,
      },
      { onConflict: "id" }
    );

  if (error) {
    logger.error("Could not prepare account for paid checkout activation", { userId, email, error });
    return false;
  }

  return true;
}

async function findPendingPaidCheckout(admin: SupabaseClient, email: string): Promise<PendingPaidCheckout | null> {
  const result = await admin
    .from("leads")
    .select("id, metadata, website_url")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(30);

  let rows = result.data as LeadRecord[] | null;
  if (result.error) {
    logger.warn("Could not load paid checkout metadata column; trying legacy lead metadata", {
      email,
      error: result.error,
    });

    const fallback = await admin
      .from("leads")
      .select("id, website_url")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(30);

    if (fallback.error) {
      logger.error("Could not load pending paid checkout lead", { email, error: fallback.error });
      return null;
    }

    rows = fallback.data as LeadRecord[] | null;
  }

  for (const row of rows || []) {
    const metadata = getLeadMetadata(row);
    if (
      metadata.source === "razorpay_paid_checkout" &&
      metadata.claimStatus === "pending_signup" &&
      typeof metadata.subscriptionId === "string"
    ) {
      return { leadId: row.id, metadata };
    }
  }

  return null;
}

async function markPaidCheckoutClaimed(admin: SupabaseClient, pending: PendingPaidCheckout, userId: string) {
  const claimedMetadata = {
    ...pending.metadata,
    claimStatus: "claimed",
    claimedUserId: userId,
    claimedAt: new Date().toISOString(),
  };

  const result = await admin
    .from("leads")
    .update({
      metadata: claimedMetadata,
      website_url: JSON.stringify(claimedMetadata),
    })
    .eq("id", pending.leadId);

  if (!result.error) return;

  await admin
    .from("leads")
    .update({ website_url: JSON.stringify(claimedMetadata) })
    .eq("id", pending.leadId);
}

function getLeadMetadata(row: LeadRecord) {
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

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeEmail(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized && normalized.includes("@") ? normalized : null;
}

function isPaidBillingPlan(value: string | null): value is BillingPlan {
  return value === "pro" || value === "plus" || value === "startup" || value === "agency" || value === "enterprise";
}
