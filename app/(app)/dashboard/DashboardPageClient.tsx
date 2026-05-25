"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Clock,
  Database,
  FileText,
  Gauge,
  Loader2,
  Plus,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { SettingsModal } from "@/components/SettingsModal";
import { ProfileMenu } from "@/components/ProfileMenu";
import { UpgradeModal } from "@/components/UpgradeModal";
import { StartupAccessModal } from "@/components/StartupAccessModal";
import { getPlanDisplayName } from "@/lib/plans/plan-limits";

interface Startup {
  id: string;
  company_name: string;
  stage: string;
  created_at: string;
  team_size?: number | null;
  arr?: number | null;
  monthly_growth_rate?: number | null;
  total_addressable_market?: number | null;
}

interface Valuation {
  blended_low_range: number;
  blended_high_range: number;
  blended_weighted_average: number;
  created_at: string;
}

interface StartupWithValuation extends Startup {
  valuations: Valuation[];
}

interface UserInfo {
  id: string;
  email: string;
  full_name: string;
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
  onboarding_role?: "founder" | "investor_agency" | null;
  onboarding_data?: Record<string, unknown>;
  sales_qualification?: Record<string, unknown>;
}

interface PreviewResult {
  low: number;
  mid: number;
  high: number;
  confidence: string;
  currency?: "INR" | "USD";
}

interface PreviewUsage {
  limit: number;
  used: number;
  remaining: number;
  period: "day" | "month";
  resetAt?: string;
}

export default function DashboardPage() {
  const [startups, setStartups] = useState<StartupWithValuation[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");
  const [upgradeLimitType, setUpgradeLimitType] = useState<"startup" | "report" | "team" | "startupAccess">("report");
  const [startupAccessTarget, setStartupAccessTarget] = useState<StartupWithValuation | null>(null);
  const [nowMs, setNowMs] = useState(0);
  const [previewForm, setPreviewForm] = useState({
    companyName: "",
    stage: "seed",
    industry: "",
    arr: "",
    monthlyGrowthRate: "",
    teamSize: "",
    totalAddressableMarket: "",
  });
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [previewUsage, setPreviewUsage] = useState<PreviewUsage | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [dashboardError, setDashboardError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/api/workspace/context", { credentials: "include" });

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (response.status === 428) {
          setDashboardError("Account setup is still syncing. Refresh this page after the database schema cache reloads.");
          setLoading(false);
          return;
        }

        if (response.status === 402) {
          router.push("/pricing");
          return;
        }

        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || "Failed to load workspace");
        const profileData = payload.profileData;

        setUserInfo({
          ...payload.userInfo,
          tier: profileData?.tier || (payload.userInfo?.plan_active ? "pro" : "free"),
          startup_count: profileData?.startup_count || 0,
          max_startups: profileData?.max_startups ?? 1,
        });

        setStartups((payload.startups as StartupWithValuation[]) || []);
        setNowMs(Date.now());
        setDashboardError("");
      } catch (error) {
        setStartups([]);
        setDashboardError(error instanceof Error ? error.message : "Could not load your workspace");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const fmt = (value: number) => `$${(value / 1_000_000).toFixed(1)}M`;
  const fmtPreview = (value: number) => {
    if (previewResult?.currency === "INR") {
      if (value >= 10_000_000) return `INR ${(value / 10_000_000).toFixed(1)}Cr`;
      if (value >= 100_000) return `INR ${(value / 100_000).toFixed(1)}L`;
      return `INR ${Math.round(value).toLocaleString("en-IN")}`;
    }
    return fmt(value);
  };

  const getRange = (startup: StartupWithValuation) => {
    const valuation = startup.valuations?.[0];
    if (!valuation?.blended_low_range) return null;
    return {
      range: `${fmt(valuation.blended_low_range)} - ${fmt(valuation.blended_high_range)}`,
      avg: fmt(valuation.blended_weighted_average),
    };
  };

  const hasIncompleteData = (startup: StartupWithValuation) => {
    const requiredFields: Array<keyof Startup> = [
      "team_size",
      "arr",
      "monthly_growth_rate",
      "total_addressable_market",
    ];
    return requiredFields.some((field) => {
      const value = startup[field];
      return value === null || value === undefined || value === "" || value === 0;
    });
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor(((nowMs || new Date(date).getTime()) - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  };

  const stageLabel = (stage: string) =>
    stage.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  const userName = userInfo?.full_name?.split(" ")[0] || userInfo?.email?.split("@")[0] || "there";
  const userInitial = (userInfo?.full_name || userInfo?.email || "?")[0].toUpperCase();
  const isWorkspaceAdmin = userInfo?.workspace_role === "admin" || !userInfo?.workspace_role;
  const isStartupContributor = userInfo?.workspace_role === "startup_contributor";
  const isFreePlan = !userInfo?.plan_active;
  const valuedStartups = startups.filter((startup) => getRange(startup));
  const incompleteStartups = startups.filter(hasIncompleteData);
  const avgValuation = valuedStartups.length
    ? fmt(
        valuedStartups.reduce(
          (sum, startup) => sum + (startup.valuations?.[0]?.blended_weighted_average || 0),
          0
        ) / valuedStartups.length
      )
    : "-";
  const maxStartups = userInfo?.max_startups ?? 1;
  const usedStartups = userInfo?.startup_count || startups.length;
  const hasUnlimitedStartups = maxStartups === -1 || maxStartups > 999;
  const remainingStartups = hasUnlimitedStartups ? null : Math.max(maxStartups - usedStartups, 0);
  const usagePct = hasUnlimitedStartups ? 0 : Math.min((usedStartups / Math.max(maxStartups, 1)) * 100, 100);
  const currentPlan = (userInfo?.plan === "pro" || userInfo?.plan === "plus" || userInfo?.plan === "startup" || userInfo?.plan === "agency" || userInfo?.plan === "enterprise")
    ? userInfo.plan
    : "free";
  const currentPlanLabel = getPlanDisplayName(currentPlan, userInfo?.plan_active);
  const isPortfolioWorkspace =
    currentPlan === "plus" ||
    currentPlan === "agency" ||
    currentPlan === "enterprise" ||
    userInfo?.onboarding_role === "investor_agency";
  const remainingProfileLabel = isPortfolioWorkspace
    ? remainingStartups === 1 ? "company" : "companies"
    : remainingStartups === 1 ? "startup profile" : "startup profiles";
  const workspaceLabel = isPortfolioWorkspace ? "Portfolio dashboard" : "Valuation workspace";
  const workspaceCountLabel = isPortfolioWorkspace ? "Portfolio companies" : "Startup profiles";
  const createWorkspaceLabel = isFreePlan
    ? "Create Free Startup"
    : isPortfolioWorkspace
      ? "Add Portfolio Company"
      : "Create New Valuation";
  const compactCreateWorkspaceLabel = isFreePlan
    ? "Free Startup"
    : isPortfolioWorkspace
      ? "Add Company"
      : "New Valuation";

  const openUpgrade = (reason: string, type: "startup" | "report" | "team" | "startupAccess" = "report") => {
    setUpgradeReason(reason);
    setUpgradeLimitType(type);
    setUpgradeModalOpen(true);
  };

  const handlePaidStartupAction = () => {
    if (isFreePlan && startups.length >= 1) {
      openUpgrade("Free includes one lifetime startup. Upgrade to Startup to add another startup profile.", "startup");
      return;
    }
    router.push("/startup/new");
  };

  const handleShareStartup = (startup: StartupWithValuation) => {
    if (!isWorkspaceAdmin) {
      openUpgrade("Only the workspace Admin can invite startup contacts to update a startup card.", "startupAccess");
      return;
    }

    if (currentPlan !== "enterprise" || !userInfo?.plan_active) {
      openUpgrade(
        "Invite Startup lets an incubator, investor, or portfolio Admin share one startup card with the startup team so they can update their own details. Upgrade to Enterprise to use it.",
        "startupAccess"
      );
      return;
    }

    setStartupAccessTarget(startup);
  };

  const calculatePreview = async () => {
    setPreviewLoading(true);
    setPreviewError("");
    try {
      const response = await fetch("/api/valuation-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(previewForm),
      });
      const data = await response.json();
      if (!response.ok) {
        setPreviewUsage(data.usage || null);
        if (response.status === 429) {
          openUpgrade(data.message || "Upgrade to continue checking valuation previews.", "report");
        }
        throw new Error(data.message || data.error || "Could not calculate preview");
      }

      setPreviewResult(data.data.result);
      setPreviewUsage(data.data.usage || null);
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : "Could not calculate preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-gray-600">Loading your valuation workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Evaldam AI" width={32} height={32} className="rounded-md" />
              <span className="hidden text-sm font-black text-gray-900 sm:inline">Evaldam</span>
            </Link>
            <nav className="hidden items-center gap-6 md:flex">
              {!isFreePlan && !isStartupContributor && (
                <>
                  <Link href="/valuation-history" className="text-sm font-semibold text-gray-600 transition-colors hover:text-primary">
                    History
                  </Link>
                  <Link href="/comparable-companies" className="text-sm font-semibold text-gray-600 transition-colors hover:text-primary">
                    Comparables
                  </Link>
                </>
              )}
              <Link href="/methodology" className="text-sm font-semibold text-gray-600 transition-colors hover:text-primary">
                Methodology
              </Link>
              <Link href="/startup-ai" className="text-sm font-semibold text-gray-600 transition-colors hover:text-primary">
                Startup AI
              </Link>
              <Link href="/pricing#api-credits" className="text-sm font-semibold text-gray-600 transition-colors hover:text-primary">
                API Credits
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {userInfo && (
              <span className="hidden rounded-full border border-primary/20 bg-white px-3 py-1 text-xs font-black uppercase text-primary sm:inline-block">
                {currentPlanLabel}
              </span>
            )}
            {isWorkspaceAdmin ? (
              <button type="button" onClick={handlePaidStartupAction} className="btn btn-primary btn-sm flex items-center gap-1.5 font-semibold">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{compactCreateWorkspaceLabel}</span>
                <span className="sm:hidden">New</span>
              </button>
            ) : (
              <span className="rounded-full border border-slate-200/60 bg-white px-3 py-1 text-xs font-black uppercase text-gray-500">
                {isStartupContributor ? "Startup Access" : "Member"}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 pb-16 sm:px-6 md:py-10 md:pb-24">
        {dashboardError && (
          <div className="mb-6 rounded-[4px] border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-800">
            {dashboardError}
          </div>
        )}

        <section className="mb-6 overflow-hidden rounded-[4px] border border-slate-200/60 bg-white">
          <div className="grid gap-0 lg:grid-cols-[1fr_300px]">
            <div className="p-5 md:p-7">
              <div className="mb-4 inline-flex rounded-full border border-primary/20 bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
                {workspaceLabel}
              </div>
              <h1 className="mb-3 text-2xl font-black text-gray-900 md:text-4xl">Welcome back, {userName}</h1>
              <p className="max-w-2xl text-base leading-relaxed text-gray-600 md:text-lg">
                {isFreePlan
                  ? "Free includes two separate starting points: 5 quick valuation previews each month and 1 saved startup workspace with watermarked reports."
                  : isPortfolioWorkspace
                  ? "Manage each portfolio or client company as a workspace, spot missing inputs, generate repeatable reports, and track valuation history in one dashboard."
                  : "Manage startup profiles, complete missing inputs, generate repeatable reports, and review investor-ready valuation history."}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {isWorkspaceAdmin && (
                  <button type="button" onClick={handlePaidStartupAction} className="btn btn-primary flex items-center gap-2">
                    <Plus className="h-4 w-4" /> {createWorkspaceLabel}
                  </button>
                )}
                {!isStartupContributor && (
                  <Link href="/valuation-history" className="btn btn-secondary flex items-center gap-2">
                    <Clock className="h-4 w-4" /> View History
                  </Link>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200/60 bg-white p-4 lg:border-l lg:border-t-0">
              <p className="text-[10px] font-bold uppercase text-gray-500">Plan usage</p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-2xl font-black text-gray-900 tabular-nums">
                    {isFreePlan ? "Free" : hasUnlimitedStartups ? usedStartups : `${usedStartups}/${maxStartups}`}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {isFreePlan
                      ? "1 lifetime startup + 3 watermarked downloads/month"
                      : hasUnlimitedStartups
                      ? `Unlimited ${isPortfolioWorkspace ? "portfolio companies" : "startup profiles"}`
                      : `${remainingStartups} ${remainingProfileLabel} remaining`}
                  </p>
                </div>
                <span className="rounded-[4px] bg-white px-3 py-1 text-[10px] font-bold uppercase text-primary">
                  {currentPlanLabel || "Plan"}
                </span>
              </div>
              {!isFreePlan && !hasUnlimitedStartups && (
                <div className="mt-5 h-2 overflow-hidden rounded-full border border-slate-200/60 bg-white">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${usagePct}%` }} />
                </div>
              )}
            </div>
          </div>
        </section>

        {!isWorkspaceAdmin && (
          <div className="mb-6 rounded-[4px] border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-amber-900">
            {isStartupContributor
              ? "Startup access: you can update the assigned startup card details. Creating startups, AI, reports, sharing, billing, and team settings are handled by the workspace Admin."
              : "Member access: you can view and update existing startup inputs. Billing, team changes, report generation, sharing, and deletion are handled by the workspace Admin."}
          </div>
        )}

        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {[
            { label: workspaceCountLabel, value: startups.length, Icon: Database, tone: "text-slate-900" },
            { label: "Avg. valuation", value: avgValuation, Icon: TrendingUp, tone: "text-teal-700" },
            { label: "Reports ready", value: valuedStartups.length, Icon: FileText, tone: "text-slate-900" },
            {
              label: "Needs data",
              value: incompleteStartups.length,
              Icon: AlertCircle,
              tone: incompleteStartups.length ? "text-amber-700" : "text-slate-900",
            },
          ].map(({ label, value, Icon, tone }) => (
            <div key={label} className="rounded-[4px] border border-slate-200/60 bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[10px] font-bold uppercase text-gray-500">{label}</p>
                <Icon className="h-4 w-4 text-gray-300" />
              </div>
              <p className={`font-mono text-2xl font-black tabular-nums ${tone}`}>{value}</p>
            </div>
          ))}
        </div>

        {startups.length > 0 ? (
          <>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900">{isPortfolioWorkspace ? "Portfolio workspaces" : "Startup workspaces"}</h2>
                <p className="text-sm text-gray-500">
                  {isPortfolioWorkspace
                    ? "Open a portfolio or client company profile to update inputs, run reports, or review valuation history."
                    : "Open a profile to update inputs, run reports, or review valuation history."}
                </p>
              </div>
              {!isStartupContributor && (
                <Link href="/comparable-companies" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                  Explore comparables <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {startups.map((startup) => {
                const valuation = getRange(startup);
                const incomplete = hasIncompleteData(startup);
                const href = incomplete ? `/startup/${startup.id}?tab=profile` : `/startup/${startup.id}`;

                return (
                  <div
                    key={startup.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(href)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") router.push(href);
                    }}
                  >
                    <div
                      className={`group flex h-full cursor-pointer flex-col rounded-lg p-5 shadow-sm transition-all ${
                        incomplete
                          ? "overflow-hidden border border-amber-200 bg-white hover:border-amber-300 hover:shadow-lg"
                          : "border border-gray-200 bg-white hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
                      }`}
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-lg font-black text-gray-900">{startup.company_name}</h3>
                          <p className="mt-1 text-xs text-gray-500">Created {getTimeAgo(startup.created_at)}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span className="rounded-full border border-slate-200/60 bg-white px-2 py-1 text-[10px] font-black uppercase text-gray-600">
                            {stageLabel(startup.stage)}
                          </span>
                          {incomplete && (
                            <span className="rounded-full border border-amber-200 bg-white px-2 py-1 text-[10px] font-black uppercase text-amber-800">
                              Needs data
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex-1">
                        {valuation ? (
                          <div className="mt-2 rounded-lg border border-gray-200 bg-white p-4">
                            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-gray-400">
                              <Gauge className="h-3.5 w-3.5" /> Blended range
                            </div>
                            <div className="font-mono text-lg font-black text-gray-900 tabular-nums">{valuation.range}</div>
                            <div className="mt-1 text-xs text-gray-500">Mid-point <span className="font-mono tabular-nums">{valuation.avg}</span></div>
                          </div>
                        ) : (
                          <div className={`mt-2 rounded-lg border bg-white p-4 ${incomplete ? "border-amber-200" : "border-gray-200"}`}>
                            <div className={`mb-2 text-xs font-black uppercase ${incomplete ? "text-amber-900" : "text-gray-700"}`}>
                              {incomplete ? "Add missing inputs" : "Valuation pending"}
                            </div>
                            <div className={`text-xs leading-relaxed ${incomplete ? "text-amber-800" : "text-gray-500"}`}>
                              {incomplete
                                ? "Complete financials to unlock full 6-method analysis."
                                : "Open the workspace to generate your report."}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                        <div className="flex items-center gap-1.5 text-primary">
                          <TrendingUp className="h-3.5 w-3.5" />
                          <span className="text-xs font-bold">Open workspace</span>
                        </div>
                        {!isStartupContributor && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              handleShareStartup(startup);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200/60 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-600 transition hover:border-primary/30 hover:text-primary"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            Share / Invite
                          </button>
                        )}
                        <ArrowRight className="h-4 w-4 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                      </div>
                    </div>
                  </div>
                );
              })}

              {isWorkspaceAdmin && (
                <button
                  type="button"
                  onClick={handlePaidStartupAction}
                  className="group flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 text-center transition-all hover:border-primary"
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-white transition-colors">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-base font-bold text-gray-700 transition-colors group-hover:text-primary">{isPortfolioWorkspace ? "Add portfolio company" : "Create new valuation"}</span>
                  <p className="mt-1 text-xs text-gray-500">{isPortfolioWorkspace ? "Add a company workspace" : "Add a startup workspace"}</p>
                </button>
              )}
            </div>
          </>
        ) : isFreePlan ? (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <h2 className="text-xl font-black text-gray-900">Check a valuation preview</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Enter numbers for a quick range. This does not use your 1 saved startup workspace.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="preview-company-name" className="form-label">Company name</label>
                  <input id="preview-company-name" className="input" value={previewForm.companyName} onChange={(e) => setPreviewForm({ ...previewForm, companyName: e.target.value })} placeholder="Your company" />
                </div>
                <div>
                  <label htmlFor="preview-stage" className="form-label">Stage</label>
                  <select id="preview-stage" className="input" value={previewForm.stage} onChange={(e) => setPreviewForm({ ...previewForm, stage: e.target.value })}>
                    <option value="pre-revenue">Pre-revenue</option>
                    <option value="seed">Seed</option>
                    <option value="series-a">Series A</option>
                    <option value="series-b+">Series B+</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="preview-industry" className="form-label">Industry</label>
                  <input id="preview-industry" className="input" value={previewForm.industry} onChange={(e) => setPreviewForm({ ...previewForm, industry: e.target.value })} placeholder="SaaS, AI, fintech..." />
                </div>
                <div>
                  <label htmlFor="preview-team-size" className="form-label">Team size</label>
                  <input id="preview-team-size" className="input" type="number" min={0} value={previewForm.teamSize} onChange={(e) => setPreviewForm({ ...previewForm, teamSize: e.target.value })} placeholder="5" />
                </div>
                <div>
                  <label htmlFor="preview-arr" className="form-label">ARR / yearly revenue</label>
                  <input id="preview-arr" className="input" type="number" min={0} value={previewForm.arr} onChange={(e) => setPreviewForm({ ...previewForm, arr: e.target.value })} placeholder="500000" />
                </div>
                <div>
                  <label htmlFor="preview-monthly-growth" className="form-label">Monthly growth %</label>
                  <input id="preview-monthly-growth" className="input" type="number" value={previewForm.monthlyGrowthRate} onChange={(e) => setPreviewForm({ ...previewForm, monthlyGrowthRate: e.target.value })} placeholder="10" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="preview-tam" className="form-label">Market size / TAM</label>
                  <input id="preview-tam" className="input" type="number" min={0} value={previewForm.totalAddressableMarket} onChange={(e) => setPreviewForm({ ...previewForm, totalAddressableMarket: e.target.value })} placeholder="500000000" />
                </div>
              </div>
              {previewError && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-semibold text-amber-900">
                  {previewError}
                </div>
              )}
              {previewUsage && (
                <p className="mt-3 text-xs font-semibold text-gray-500">
                  {previewUsage.remaining}/{previewUsage.limit} previews left this {previewUsage.period}
                </p>
              )}
              <button type="button" onClick={calculatePreview} disabled={previewLoading} className="btn btn-primary mt-5 flex items-center gap-2">
                {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />} {previewLoading ? "Checking..." : "Check valuation"}
              </button>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-black uppercase tracking-wide text-primary">Free plan result</p>
              {previewResult ? (
                <div className="mt-4">
                  <h3 className="text-2xl font-black text-gray-900">{previewForm.companyName || "Preview valuation"}</h3>
                  <div className="mt-5 rounded-lg border border-primary/20 bg-white p-4">
                    <p className="text-xs font-black uppercase text-primary">Indicative range</p>
                    <p className="mt-2 text-2xl font-black text-gray-900">
                      {fmtPreview(previewResult.low)} - {fmtPreview(previewResult.high)}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">Mid-point {fmtPreview(previewResult.mid)} - {previewResult.confidence} input confidence</p>
                  </div>
                  <div className="mt-5 rounded-lg border border-amber-200 bg-white p-4 text-sm text-amber-900">
                    This is a preview only. Upgrade to create a full workspace, run the full methodology, and download the investor-ready report.
                  </div>
                  <button
                    type="button"
                    onClick={() => openUpgrade("Upgrade to download the report and run the full investor-ready valuation workflow.", "report")}
                    className="btn btn-primary mt-5 w-full flex items-center justify-center gap-2"
                  >
                    Upgrade to download report <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="mt-8 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-slate-200/60 bg-white">
                    <Gauge className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-black text-gray-900">Your preview will appear here</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">
                    Use the form to estimate a range before deciding whether to generate a full paid report.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-xl rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-white">
              <BarChart3 className="h-10 w-10 text-primary" />
            </div>
            <h3 className="mb-3 text-2xl font-black text-gray-900">No valuations yet</h3>
            <p className="mb-8 text-base leading-relaxed text-gray-600">
              Create your first startup workspace, add your current fundraising inputs, then generate a repeatable investor-ready valuation report.
            </p>
            {isWorkspaceAdmin ? (
              <button type="button" onClick={handlePaidStartupAction} className="btn btn-primary btn-lg mx-auto flex items-center gap-2 font-semibold">
                <Plus className="h-4 w-4" /> {isPortfolioWorkspace ? "Add First Company" : "Create First Valuation"}
              </button>
            ) : (
              <p className="text-sm font-semibold text-gray-500">Ask the workspace Admin to add {isPortfolioWorkspace ? "companies" : "startup profiles"}.</p>
            )}
          </div>
        )}
      </main>

      <ProfileMenu
        userInfo={userInfo || undefined}
        userName={userName}
        userInitial={userInitial}
        onSettingsOpen={() => setSettingsOpen(true)}
        position="left-6"
      />

      {settingsOpen && userInfo && (
        <SettingsModal
          user={{ ...userInfo, valuation_count: valuedStartups.length }}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        currentPlan={currentPlan}
        limitType={upgradeLimitType}
        limitReason={upgradeReason}
      />
      {startupAccessTarget && (
        <StartupAccessModal
          isOpen={Boolean(startupAccessTarget)}
          startupId={startupAccessTarget.id}
          startupName={startupAccessTarget.company_name}
          onClose={() => setStartupAccessTarget(null)}
        />
      )}
    </div>
  );
}
