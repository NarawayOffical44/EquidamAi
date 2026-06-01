import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sanitizeStartupProfilePrefill } from "@/lib/startup-profile-prefill";

export const dynamic = "force-dynamic";

type LeadRow = {
  company_name?: string | null;
  website_url?: string | null;
  metadata?: unknown;
};

const PREFILL_SOURCES = new Set(["razorpay_paid_checkout", "free_valuation", "checkout"]);

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ prefill: null }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("leads")
    .select("company_name, website_url, metadata")
    .ilike("email", user.email)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ prefill: null });
  }

  for (const row of (data || []) as LeadRow[]) {
    const metadata = getMetadata(row);
    const source = stringValue(metadata.source);
    if (!source || !PREFILL_SOURCES.has(source)) continue;

    const prefill = sanitizeStartupProfilePrefill({
      companyName: stringValue(metadata.companyName) || row.company_name || undefined,
      websiteUrl: stringValue(metadata.websiteUrl) || getWebsiteUrl(row.website_url),
      source,
      createdAt: Date.now(),
    });

    if (prefill) return NextResponse.json({ prefill });
  }

  return NextResponse.json({ prefill: null });
}

function getMetadata(row: LeadRow) {
  if (row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)) {
    return row.metadata as Record<string, unknown>;
  }

  if (!row.website_url?.trim().startsWith("{")) return {};
  try {
    const parsed = JSON.parse(row.website_url);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function getWebsiteUrl(value?: string | null) {
  const url = stringValue(value);
  return url && /^https?:\/\//i.test(url) ? url : undefined;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
