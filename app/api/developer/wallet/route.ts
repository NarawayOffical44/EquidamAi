import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { API_CREDIT_CURRENCY, formatApiUsd } from "@/lib/developer-api/pricing";
import { isSupabaseInvalidApiKeyError } from "@/lib/supabase/admin-errors";

function apiWalletServiceConfigResponse() {
  return NextResponse.json(
    { error: "API credit service is temporarily unavailable. Try again in a moment." },
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
  const { error: expireError } = await adminClient.rpc("expire_api_credits", {
    p_user_id: user.id,
  });

  if (expireError) {
    console.error("API credit expiry error:", { code: expireError.code, message: expireError.message });
    if (isSupabaseInvalidApiKeyError(expireError)) return apiWalletServiceConfigResponse();
    return NextResponse.json({ error: "Failed to load API credits" }, { status: 500 });
  }

  const { data: wallet, error: walletError } = await adminClient
    .from("api_wallets")
    .select("balance_micro_usd, low_balance_notified_at, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (walletError) {
    console.error("API wallet load error:", { code: walletError.code, message: walletError.message });
    if (isSupabaseInvalidApiKeyError(walletError)) return apiWalletServiceConfigResponse();
    return NextResponse.json({ error: "Failed to load API credits" }, { status: 500 });
  }

  const { data: monthlyUsed, error: usageError } = await adminClient.rpc("get_api_monthly_usage", {
    p_user_id: user.id,
  });

  if (usageError) {
    console.error("API monthly usage load error:", { code: usageError.code, message: usageError.message });
    if (isSupabaseInvalidApiKeyError(usageError)) return apiWalletServiceConfigResponse();
    return NextResponse.json({ error: "Failed to load API usage" }, { status: 500 });
  }

  const balanceMicroUsd = Number(wallet?.balance_micro_usd || 0);
  const usedThisMonthMicroUsd = Number(monthlyUsed || 0);

  return NextResponse.json({
    wallet: {
      balanceMicroUsd,
      balanceDisplay: formatApiUsd(balanceMicroUsd),
      lowBalance: balanceMicroUsd < 5_000_000,
      currency: API_CREDIT_CURRENCY,
      updatedAt: wallet?.updated_at || null,
    },
    usage: {
      usedThisMonthMicroUsd,
      usedThisMonthDisplay: formatApiUsd(usedThisMonthMicroUsd),
    },
  });
}
