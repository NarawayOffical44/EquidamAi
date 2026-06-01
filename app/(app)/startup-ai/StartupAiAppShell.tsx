"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, Bot, ChevronLeft, ChevronRight, CreditCard, Database, LayoutDashboard } from "lucide-react";
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

const appNavItems = [
  { label: "Startups", href: "/dashboard", Icon: Database },
  { label: "Dashboard", href: "/dashboard?view=dashboard", Icon: LayoutDashboard },
  { label: "Startup AI", href: "/startup-ai", Icon: Bot, active: true },
  { label: "Comparables", href: "/comparable-companies", Icon: BarChart3 },
  { label: "API Credits", href: "/pricing#api-credits", Icon: CreditCard },
];

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
          router.push("/pricing");
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

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-gray-950">
      {workspaceSidebarOpen && (
        <button
          type="button"
          aria-label="Close workspace sidebar"
          className="fixed inset-0 z-30 hidden cursor-default bg-transparent lg:block"
          onClick={() => setWorkspaceSidebarOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-200 bg-white shadow-sm transition-[width] duration-200 lg:flex ${workspaceSidebarOpen ? "w-64" : "w-20"}`}>
        <div className={`flex h-16 items-center border-b border-slate-200 ${workspaceSidebarOpen ? "justify-between px-5" : "justify-center px-3"}`}>
          <div className={`flex min-w-0 items-center gap-3 ${workspaceSidebarOpen ? "" : "justify-center"}`}>
          <Image src="/logo.png" alt="Evaldam AI" width={32} height={32} className="rounded-md" />
          {workspaceSidebarOpen && (
            <div>
            <p className="text-sm font-black leading-tight text-gray-950">Evaldam</p>
          </div>
          )}
          </div>
          <button
            type="button"
            onClick={() => setWorkspaceSidebarOpen((open) => !open)}
            className={`hidden h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-gray-500 transition hover:border-primary/30 hover:text-primary lg:flex ${workspaceSidebarOpen ? "" : "absolute -right-4 top-4 shadow-sm"}`}
            aria-label={workspaceSidebarOpen ? "Collapse workspace sidebar" : "Expand workspace sidebar"}
            title={workspaceSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {workspaceSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        <nav className={`flex-1 space-y-1 py-4 ${workspaceSidebarOpen ? "px-3" : "px-2"}`}>
          {appNavItems.map(({ label, href, Icon, active }) => (
            <Link
              key={href}
              href={href}
              title={workspaceSidebarOpen ? undefined : label}
              className={`flex w-full items-center rounded-md py-2.5 text-left text-sm font-semibold transition-colors ${workspaceSidebarOpen ? "gap-3 px-3" : "justify-center px-2"} ${
                active ? "bg-slate-100 text-gray-950" : "text-gray-600 hover:bg-slate-50 hover:text-gray-950"
              }`}
            >
              <Icon className="h-4 w-4" />
              {workspaceSidebarOpen && label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="h-screen overflow-hidden lg:pl-20">
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
