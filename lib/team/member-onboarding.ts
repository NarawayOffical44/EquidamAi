import type { SupabaseClient, User } from "@supabase/supabase-js";

export type TeamMemberUser = Pick<User, "id" | "email" | "user_metadata">;

export async function completeTeamMemberOnboarding(
  adminClient: SupabaseClient,
  user: TeamMemberUser
) {
  const now = new Date().toISOString();
  const { data: account } = await adminClient
    .from("users")
    .select("id, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (account?.onboarding_completed) return;

  const onboardingPatch = {
    onboarding_completed: true,
    onboarding_completed_at: now,
    onboarding_data: { source: "team_invitation" },
    sales_qualification: { source: "team_invitation", role: "member" },
  };

  if (account) {
    await adminClient
      .from("users")
      .update(onboardingPatch)
      .eq("id", user.id);
    return;
  }

  await adminClient
    .from("users")
    .insert({
      id: user.id,
      email: user.email || "",
      full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Team member",
      plan: "free",
      plan_active: false,
      billing_cycle: "annual",
      ...onboardingPatch,
    });
}
