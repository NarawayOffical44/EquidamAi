import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createApiKeySecret, getApiKeyPrefix, hashApiKey, maskApiKey } from "@/lib/developer-api/keys";
import { isSupabaseInvalidApiKeyError } from "@/lib/supabase/admin-errors";

function apiKeyServiceConfigResponse() {
  return NextResponse.json(
    { error: "API key service is temporarily unavailable. Please contact support." },
    { status: 503 }
  );
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("api_keys")
    .select("id, name, key_prefix, status, last_used_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("API keys load error:", { code: error.code, message: error.message });
    if (isSupabaseInvalidApiKeyError(error)) return apiKeyServiceConfigResponse();
    return NextResponse.json({ error: "Failed to load API keys" }, { status: 500 });
  }

  return NextResponse.json({
    keys: (data || []).map((key) => ({
      ...key,
      maskedKey: maskApiKey(key.key_prefix),
    })),
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "Default key").trim().slice(0, 80);
  const secret = createApiKeySecret();
  const keyPrefix = getApiKeyPrefix(secret);
  const adminClient = createAdminClient();

  const { data: existingActiveKey, error: existingKeyError } = await adminClient
    .from("api_keys")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (existingKeyError) {
    console.error("API key active lookup error:", { code: existingKeyError.code, message: existingKeyError.message });
    if (isSupabaseInvalidApiKeyError(existingKeyError)) return apiKeyServiceConfigResponse();
    return NextResponse.json({ error: "Failed to verify existing API keys" }, { status: 500 });
  }

  if (existingActiveKey) {
    return NextResponse.json(
      { error: "Revoke the existing API key before creating a new one" },
      { status: 409 }
    );
  }

  const { data, error } = await adminClient
    .from("api_keys")
    .insert({
      user_id: user.id,
      name,
      key_prefix: keyPrefix,
      key_hash: hashApiKey(secret),
    })
    .select("id, name, key_prefix, status, last_used_at, created_at")
    .single();

  if (error || !data) {
    console.error("API key create error:", { code: error?.code, message: error?.message });
    if (isSupabaseInvalidApiKeyError(error)) return apiKeyServiceConfigResponse();
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 });
  }

  const { error: walletError } = await adminClient
    .from("api_wallets")
    .upsert({ user_id: user.id, updated_at: new Date().toISOString() }, { onConflict: "user_id" });

  if (walletError) {
    console.error("API wallet ensure error:", { code: walletError.code, message: walletError.message });
  }

  return NextResponse.json({
    key: {
      ...data,
      maskedKey: maskApiKey(data.key_prefix),
    },
    secret,
  }, { status: 201 });
}
