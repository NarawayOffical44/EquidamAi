export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import OnboardingPageClient from "./OnboardingPageClient";

export const metadata: Metadata = {
  title: "Account Onboarding",
  description: "Set up your Evaldam AI account with a short role-based onboarding flow.",
  robots: {
    index: false,
    follow: false,
  },
};

function normalizeOnboardingRole(value: unknown) {
  return value === "founder" || value === "investor_agency" ? value : null;
}

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/login");

  const adminClient = createAdminClient();
  const { data: account } = await adminClient
    .from("users")
    .select("onboarding_completed, onboarding_role, onboarding_data")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <OnboardingPageClient
      initialStatus={{
        onboarding_completed: Boolean(account?.onboarding_completed),
        onboarding_role: normalizeOnboardingRole(account?.onboarding_role),
        onboarding_data: account?.onboarding_data && typeof account.onboarding_data === "object"
          ? account.onboarding_data as Record<string, unknown>
          : {},
        error: account ? "" : "Account profile was not found. Please sign out and sign in again.",
      }}
    />
  );
}
