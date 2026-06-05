"use client";

import { useEffect } from "react";
import { setUserProperties } from "@/lib/analytics/ga4";
import { createClient } from "@/lib/supabase/client";

export function AuthenticatedAnalytics() {
  useEffect(() => {
    let active = true;

    const identifyAuthenticatedUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active || !user) return;

      const { data: account } = await supabase
        .from("users")
        .select("plan, plan_active, billing_cycle, onboarding_completed, onboarding_role")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;

      setUserProperties(user.id, {
        plan: account?.plan || "free",
        plan_active: Boolean(account?.plan_active),
        billing_cycle: account?.billing_cycle || "none",
        onboarding_completed: Boolean(account?.onboarding_completed),
        onboarding_role: account?.onboarding_role || "unknown",
      });
    };

    void identifyAuthenticatedUser();

    return () => {
      active = false;
    };
  }, []);

  return null;
}
