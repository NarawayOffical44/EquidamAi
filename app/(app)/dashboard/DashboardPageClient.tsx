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
  Plus,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SettingsModal } from "@/components/SettingsModal";
import { ProfileMenu } from "@/components/ProfileMenu";

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
}

export default function DashboardPage() {
  const [startups, setStartups] = useState<StartupWithValuation[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data: userData } = await supabase
          .from("users")
          .select("plan_active, plan, full_name, email, billing_cycle")
          .eq("id", user.id)
          .single();

        if (!userData?.plan_active) {
          router.push("/pricing");
          return;
        }

        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("tier, startup_count, max_startups")
          .eq("id", user.id)
          .single();

        setUserInfo({
          id: user.id,
          email: user.email || userData?.email || "",
          full_name: user.user_metadata?.full_name || userData?.full_name || "",
          plan: userData?.plan || "pro",
          plan_active: userData?.plan_active || false,
          billing_cycle: userData?.billing_cycle,
          tier: profileData?.tier || "free",
          startup_count: profileData?.startup_count || 0,
          max_startups: profileData?.max_startups || 1,
        });

        const { data: startupsData, error } = await supabase
          .from("startups")
          .select(
            `id, company_name, stage, created_at, team_size, arr, monthly_growth_rate, total_addressable_market, valuations (blended_low_range, blended_high_range, blended_weighted_average, created_at)`
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        setStartups(error ? [] : ((startupsData as StartupWithValuation[]) || []));
      } catch {
        setStartups([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, supabase]);

  const fmt = (value: number) => `$${(value / 1_000_000).toFixed(1)}M`;

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
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
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
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Evaldam AI" width={32} height={32} className="rounded-md" />
              <span className="hidden text-sm font-black text-gray-900 sm:inline">Evaldam</span>
            </Link>
            <nav className="hidden items-center gap-6 md:flex">
              <Link href="/valuation-history" className="text-sm font-semibold text-gray-600 transition-colors hover:text-primary">
                History
              </Link>
              <Link href="/comparable-companies" className="text-sm font-semibold text-gray-600 transition-colors hover:text-primary">
                Comparables
              </Link>
              <Link href="/methodology" className="text-sm font-semibold text-gray-600 transition-colors hover:text-primary">
                Methodology
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {userInfo && (
              <span className="hidden rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase text-primary sm:inline-block">
                {userInfo.plan}
              </span>
            )}
            <Link href="/startup/new">
              <button className="btn btn-primary btn-sm flex items-center gap-1.5 font-semibold">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Valuation</span>
                <span className="sm:hidden">New</span>
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 pb-16 sm:px-6 md:py-10 md:pb-24">
        <section className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
            <div className="p-5 md:p-7">
              <div className="mb-4 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
                Valuation workspace
              </div>
              <h1 className="mb-3 text-2xl font-black text-gray-900 md:text-4xl">Welcome back, {userName}</h1>
              <p className="max-w-2xl text-base leading-relaxed text-gray-600 md:text-lg">
                Manage startup profiles, complete missing inputs, generate repeatable reports, and review investor-ready valuation history.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/startup/new">
                  <button className="btn btn-primary flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Create New Valuation
                  </button>
                </Link>
                <Link href="/valuation-history">
                  <button className="btn btn-secondary flex items-center gap-2">
                    <Clock className="h-4 w-4" /> View History
                  </button>
                </Link>
              </div>
            </div>

            <div className="border-t border-gray-200 bg-gray-50 p-5 md:p-7 lg:border-l lg:border-t-0">
              <p className="text-xs font-black uppercase tracking-wide text-gray-400">Plan usage</p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <div>
                  <p className="text-3xl font-black text-gray-900">
                    {hasUnlimitedStartups ? usedStartups : `${usedStartups}/${maxStartups}`}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {hasUnlimitedStartups
                      ? "Unlimited startup profiles"
                      : `${remainingStartups} startup profile${remainingStartups === 1 ? "" : "s"} remaining`}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase text-primary shadow-sm">
                  {userInfo?.plan || "Plan"}
                </span>
              </div>
              {!hasUnlimitedStartups && (
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${usagePct}%` }} />
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {[
            { label: "Startup profiles", value: startups.length, Icon: Database, tone: "text-gray-900" },
            { label: "Avg. valuation", value: avgValuation, Icon: TrendingUp, tone: "text-primary" },
            { label: "Reports ready", value: valuedStartups.length, Icon: FileText, tone: "text-primary" },
            {
              label: "Needs data",
              value: incompleteStartups.length,
              Icon: AlertCircle,
              tone: incompleteStartups.length ? "text-amber-600" : "text-gray-900",
            },
          ].map(({ label, value, Icon, tone }) => (
            <div key={label} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-wide text-gray-400">{label}</p>
                <Icon className="h-4 w-4 text-gray-300" />
              </div>
              <p className={`text-2xl font-black ${tone}`}>{value}</p>
            </div>
          ))}
        </div>

        {startups.length > 0 ? (
          <>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900">Startup workspaces</h2>
                <p className="text-sm text-gray-500">Open a profile to update inputs, run reports, or review valuation history.</p>
              </div>
              <Link href="/comparable-companies" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                Explore comparables <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {startups.map((startup) => {
                const valuation = getRange(startup);
                const incomplete = hasIncompleteData(startup);
                const href = incomplete ? `/startup/${startup.id}?tab=profile` : `/startup/${startup.id}`;

                return (
                  <Link key={startup.id} href={href}>
                    <div
                      className={`group flex h-full cursor-pointer flex-col rounded-lg p-5 shadow-sm transition-all ${
                        incomplete
                          ? "border border-amber-200 bg-amber-50 hover:border-amber-300 hover:shadow-lg"
                          : "border border-gray-200 bg-white hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
                      }`}
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-lg font-black text-gray-900">{startup.company_name}</h3>
                          <p className="mt-1 text-xs text-gray-500">Created {getTimeAgo(startup.created_at)}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-black uppercase text-gray-600">
                            {stageLabel(startup.stage)}
                          </span>
                          {incomplete && (
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black uppercase text-amber-800">
                              Needs data
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex-1">
                        {valuation ? (
                          <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-gray-400">
                              <Gauge className="h-3.5 w-3.5" /> Blended range
                            </div>
                            <div className="text-lg font-black text-gray-900">{valuation.range}</div>
                            <div className="mt-1 text-xs text-gray-500">Mid-point {valuation.avg}</div>
                          </div>
                        ) : (
                          <div className={`mt-2 rounded-lg border p-4 ${incomplete ? "border-amber-200 bg-amber-100" : "border-gray-200 bg-gray-50"}`}>
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
                        <ArrowRight className="h-4 w-4 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                      </div>
                    </div>
                  </Link>
                );
              })}

              <Link href="/startup/new">
                <div className="group flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 text-center transition-all hover:border-primary hover:bg-primary/5">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/15">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-base font-bold text-gray-700 transition-colors group-hover:text-primary">Create new valuation</span>
                  <p className="mt-1 text-xs text-gray-500">Add a startup workspace</p>
                </div>
              </Link>
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-xl rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <BarChart3 className="h-10 w-10 text-primary" />
            </div>
            <h3 className="mb-3 text-2xl font-black text-gray-900">No valuations yet</h3>
            <p className="mb-8 text-base leading-relaxed text-gray-600">
              Create your first startup workspace, add your current fundraising inputs, then generate a repeatable investor-ready valuation report.
            </p>
            <Link href="/startup/new">
              <button className="btn btn-primary btn-lg mx-auto flex items-center gap-2 font-semibold">
                <Plus className="h-4 w-4" /> Create First Valuation
              </button>
            </Link>
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

      {settingsOpen && userInfo && <SettingsModal user={userInfo} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
