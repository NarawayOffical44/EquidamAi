import type { SupabaseClient } from "@supabase/supabase-js";

type LeadInsertPayload = Record<string, unknown> & {
  metadata?: Record<string, unknown>;
};

function isMissingMetadataColumn(error: { message?: string } | null) {
  return Boolean(error?.message && /metadata|schema cache/i.test(error.message));
}

export async function insertLead(
  adminClient: SupabaseClient,
  payload: LeadInsertPayload
) {
  const result = await adminClient.from("leads").insert(payload);
  if (!result.error || !payload.metadata || !isMissingMetadataColumn(result.error)) {
    return result;
  }

  const { metadata: _metadata, ...legacyPayload } = payload;
  return adminClient.from("leads").insert(legacyPayload);
}
