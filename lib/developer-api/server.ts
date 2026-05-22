import type { SupabaseClient } from "@supabase/supabase-js";
import { API_RATE_LIMIT_PER_MINUTE, calculateApiCostMicroUsd, getApiModelPricing } from "@/lib/developer-api/pricing";
import { hashApiKey } from "@/lib/developer-api/keys";

export type ApiAuthResult =
  | {
      ok: true;
      key: {
        id: string;
        user_id: string;
        name: string;
        status: string;
      };
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

export async function authenticateApiKey(
  adminClient: SupabaseClient,
  authorizationHeader: string | null
): Promise<ApiAuthResult> {
  const token = parseBearerToken(authorizationHeader);
  if (!token) return { ok: false, status: 401, error: "Missing API key" };

  const { data: apiKey, error } = await adminClient
    .from("api_keys")
    .select("id, user_id, name, status")
    .eq("key_hash", hashApiKey(token))
    .eq("status", "active")
    .maybeSingle();

  if (error || !apiKey) return { ok: false, status: 401, error: "Invalid API key" };

  await adminClient
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", apiKey.id);

  return { ok: true, key: apiKey };
}

export async function checkApiRateLimit(
  adminClient: SupabaseClient,
  apiKeyId: string,
  maxPerMinute = API_RATE_LIMIT_PER_MINUTE
) {
  const now = new Date();
  const windowKey = now.toISOString().slice(0, 16);
  const expiresAt = new Date(now.getTime() + 120_000).toISOString();
  const { data, error } = await adminClient.rpc("increment_api_rate_limit_counter", {
    p_api_key_id: apiKeyId,
    p_window_key: windowKey,
    p_expires_at: expiresAt,
  });

  if (error) {
    return {
      allowed: false,
      used: maxPerMinute,
      limit: maxPerMinute,
    };
  }

  const used = Number(data || 0);

  return {
    allowed: used <= maxPerMinute,
    used,
    limit: maxPerMinute,
  };
}

export async function getWalletBalance(adminClient: SupabaseClient, userId: string) {
  await adminClient.rpc("expire_api_credits", {
    p_user_id: userId,
  });

  const { data } = await adminClient
    .from("api_wallets")
    .select("balance_micro_usd")
    .eq("user_id", userId)
    .maybeSingle();

  return Number(data?.balance_micro_usd || 0);
}

export async function reserveApiCredits(
  adminClient: SupabaseClient,
  userId: string,
  amountMicroUsd: number
) {
  const { data, error } = await adminClient.rpc("deduct_api_credits", {
    p_user_id: userId,
    p_amount_micro_usd: amountMicroUsd,
  });

  if (error) return { ok: false as const, balance: 0, error: error.message };
  return { ok: true as const, balance: Number(data || 0) };
}

export async function refundApiCredits(
  adminClient: SupabaseClient,
  userId: string,
  amountMicroUsd: number,
  description = "Unused API credit reservation refunded"
) {
  if (amountMicroUsd <= 0) return;
  await adminClient.rpc("adjust_api_credits", {
    p_user_id: userId,
    p_amount_micro_usd: amountMicroUsd,
    p_type: "refund",
    p_description: description,
  });
}

export async function recordApiUsage(params: {
  adminClient: SupabaseClient;
  userId: string;
  apiKeyId: string;
  model: string;
  requestId: string;
  costMicroUsd: number;
  status: "success" | "failed";
  inputTokens?: number | null;
  outputTokens?: number | null;
  errorMessage?: string | null;
}) {
  const {
    adminClient,
    userId,
    apiKeyId,
    model,
    requestId,
    costMicroUsd,
    status,
    inputTokens = null,
    outputTokens = null,
    errorMessage = null,
  } = params;

  await adminClient.from("api_usage_events").insert({
    user_id: userId,
    api_key_id: apiKeyId,
    request_id: requestId,
    model,
    cost_micro_usd: costMicroUsd,
    status,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    error_message: errorMessage,
  });
}

export async function hasEnoughApiCredits(
  adminClient: SupabaseClient,
  userId: string,
  model?: string | null,
  estimatedTokens?: number
) {
  const pricing = getApiModelPricing(model);
  const required = calculateApiCostMicroUsd(estimatedTokens || 1000);
  if (!required) {
    return {
      allowed: false,
      balance: 0,
      required: 0,
      pricing,
      pricingConfigured: false,
    };
  }

  const balance = await getWalletBalance(adminClient, userId);
  return {
    allowed: balance >= required,
    balance,
    required,
    pricing,
    pricingConfigured: true,
  };
}

function parseBearerToken(header: string | null) {
  if (!header) return null;
  const [scheme, token] = header.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}
