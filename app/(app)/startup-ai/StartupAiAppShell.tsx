"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppWorkspaceSidebar } from "@/components/AppWorkspaceSidebar";
import { createAppWorkspaceSidebarItems } from "@/components/app-workspace-nav";
import { ProfileMenu } from "@/components/ProfileMenu";
import { SettingsModal } from "@/components/SettingsModal";
import { IndiaFinanceAiChat } from "@/app/india-finance-ai/IndiaFinanceAiChat";
import { getPlanDisplayName, normalizePlanKey } from "@/lib/plans/plan-limits";

interface UserInfo {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  plan: string;
  plan_active: boolean;
  billing_cycle?: string;
  tier?: string;
  startup_count?: number;
  max_startups?: number;
  workspace_id?: string;
  workspace_role?: "admin" | "member" | "startup_contributor";
  workspace_owner_name?: string | null;
  workspace_owner_email?: string | null;
  valuation_count?: number;
}

export function StartupAiAppShell() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [workspaceSidebarOpen, setWorkspaceSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    fetch("/api/workspace/context", { credentials: "include" })
      .then(async (response) => {
        if (response.status === 401) {
          router.push("/login");
          return null;
        }

        if (response.status === 402) {
          router.push("/subscription");
          return null;
        }

        const payload = await response.json();
        if (!response.ok || !payload.success) return null;
        return payload;
      })
      .then((payload) => {
        if (cancelled || !payload?.userInfo) return;
        const profileData = payload.profileData;
        setUserInfo({
          ...payload.userInfo,
          tier: profileData?.tier || (payload.userInfo?.plan_active ? "pro" : "free"),
          startup_count: profileData?.startup_count || 0,
          max_startups: profileData?.max_startups ?? 1,
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [router]);

  const userName = userInfo?.full_name?.split(" ")[0] || userInfo?.email?.split("@")[0] || "Account";
  const userInitial = (userInfo?.full_name || userInfo?.email || "A")[0].toUpperCase();
  const currentPlan = userInfo?.plan_active ? userInfo.plan : "free";
  const normalizedPlan = normalizePlanKey(currentPlan, userInfo?.plan_active);
  const currentPlanLabel = getPlanDisplayName(currentPlan, userInfo?.plan_active);
  const aiAccessLabel = normalizedPlan === "free" ? "Limited Startup AI access" : "Higher Startup AI access";
  const appNavItems = createAppWorkspaceSidebarItems("startup-ai", () => setSettingsOpen(true));

  return (
    <div className="h-screen overflow-hidden bg-white text-gray-900">
      <AppWorkspaceSidebar
        items={appNavItems}
        isOpen={workspaceSidebarOpen}
        onOpenChange={setWorkspaceSidebarOpen}
      />

      <main className="h-screen overflow-hidden bg-white lg:pl-20">
        <IndiaFinanceAiChat embedded showHistorySidebar embeddedHeightClassName="h-screen" />
      </main>

      <ProfileMenu
        userInfo={userInfo || undefined}
        userName={userName}
        userInitial={userInitial}
        onSettingsOpen={() => setSettingsOpen(true)}
        position="left-6"
        planLabel={currentPlanLabel}
        planDetail={aiAccessLabel}
        compactButton={!workspaceSidebarOpen}
      />

      {settingsOpen && userInfo && (
        <SettingsModal
          user={userInfo}
          onClose={() => setSettingsOpen(false)}
          onUserUpdate={(updates) => setUserInfo((current) => current ? { ...current, ...updates } : current)}
        />
      )}
    </div>
  );
}
