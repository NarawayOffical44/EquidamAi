import type { SupabaseClient } from "@supabase/supabase-js";

export async function purgeAllUserData(adminClient: SupabaseClient, userId: string) {
  const { data: startups } = await adminClient
    .from("startups")
    .select("id")
    .eq("user_id", userId);

  const startupIds = (startups || []).map((startup) => startup.id).filter(Boolean);

  if (startupIds.length > 0) {
    await adminClient.from("startup_card_access").delete().in("startup_id", startupIds);
    await adminClient.from("startups").delete().eq("user_id", userId);
  }

  await Promise.allSettled([
    adminClient.from("team_members").delete().eq("workspace_id", userId),
    adminClient.from("team_members").delete().eq("user_id", userId),
    adminClient.from("team_invitations").delete().eq("workspace_id", userId),
    adminClient.from("valuation_batch_jobs").delete().eq("user_id", userId),
    adminClient.from("api_usage_events").delete().eq("user_id", userId),
    adminClient.from("api_credit_transactions").delete().eq("user_id", userId),
    adminClient.from("api_keys").delete().eq("user_id", userId),
    adminClient.from("api_wallets").delete().eq("user_id", userId),
    adminClient.from("startup_ai_chat_history").delete().eq("user_id", userId),
  ]);

  await adminClient
    .from("user_profiles")
    .upsert({
      id: userId,
      tier: "free",
      startup_count: 0,
      max_startups: 1,
      startups_created_this_month: 0,
      monthly_cycle_start_date: new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    });
}
