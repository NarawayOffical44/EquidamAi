import { BarChart3, Bot, BriefcaseBusiness, CreditCard, Database, LayoutDashboard, TrendingUp } from "lucide-react";
import type { AppWorkspaceSidebarItem } from "@/components/AppWorkspaceSidebar";

export type AppWorkspaceNavKey =
  | "startups"
  | "dashboard"
  | "funding"
  | "exit"
  | "startup-ai"
  | "comparables"
  | "subscription";

export function createAppWorkspaceSidebarItems(
  active: AppWorkspaceNavKey,
  onApiCredits: () => void
): AppWorkspaceSidebarItem[] {
  return [
    { label: "Startups", href: "/dashboard", Icon: Database, active: active === "startups" },
    { label: "Dashboard", href: "/dashboard?view=dashboard", Icon: LayoutDashboard, active: active === "dashboard" },
    { label: "Funding", href: "/dashboard?view=funding", Icon: BriefcaseBusiness, active: active === "funding" },
    { label: "Exit & ROI", href: "/dashboard?view=exit", Icon: TrendingUp, active: active === "exit" },
    { label: "Startup AI", href: "/startup-ai", Icon: Bot, active: active === "startup-ai", dividerBefore: true },
    { label: "Comparables", href: "/dashboard?view=comparables", Icon: BarChart3, active: active === "comparables" },
    { label: "Subscription", href: "/subscription", Icon: CreditCard, active: active === "subscription" },
    { label: "API Credits", onClick: onApiCredits, Icon: CreditCard },
  ];
}
