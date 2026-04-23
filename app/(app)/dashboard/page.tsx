"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, TrendingUp, Sparkles, ArrowRight, BarChart3, Settings, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SettingsModal } from "@/components/SettingsModal";

interface Startup { id: string; company_name: string; stage: string; created_at: string; }
interface Valuation { blended_low_range: number; blended_high_range: number; blended_weighted_average: number; }
interface StartupWithValuation extends Startup { valuations: Valuation[]; }
interface UserInfo { id: string; email: string; full_name: string; plan: string; plan_active: boolean; billing_cycle?: string; }

export default function DashboardPage() {
  const [startups, setStartups] = useState<StartupWithValuation[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }
        const { data: userData } = await supabase.from("users").select("plan_active, plan, full_name, email, billing_cycle").eq("id", user.id).single();
        if (!userData?.plan_active) { router.push("/pricing"); return; }
        setUserInfo({ id: user.id, email: user.email || userData?.email || "", full_name: user.user_metadata?.full_name || userData?.full_name || "", plan: userData?.plan || "pro", plan_active: userData?.plan_active || false, billing_cycle: userData?.billing_cycle });
        const { data: startupsData, error } = await supabase.from("startups").select(`id, company_name, stage, created_at, valuations (blended_low_range, blended_high_range, blended_weighted_average)`).eq("user_id", user.id).order("created_at", { ascending: false });
        setStartups(error ? [] : (startupsData as StartupWithValuation[]) || []);
      } catch { /* noop */ } finally { setLoading(false); }
    };
    loadData();
  }, [router, supabase]);

  const fmt = (v: number) => `$${(v / 1_000_000).toFixed(1)}M`;
  const getRange = (s: StartupWithValuation) => {
    if (s.valuations?.length && s.valuations[0]?.blended_low_range) {
      const v = s.valuations[0];
      return { range: `${fmt(v.blended_low_range)} – ${fmt(v.blended_high_range)}`, avg: fmt(v.blended_weighted_average) };
    }
    return null;
  };
  const getTimeAgo = (d: string) => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return "just now"; if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`; if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
    return `${Math.floor(s / 604800)}w ago`;
  };
  const stageLabel = (s: string) => s.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const userName = userInfo?.full_name?.split(" ")[0] || userInfo?.email?.split("@")[0] || "there";
  const userInitial = (userInfo?.full_name || userInfo?.email || "?")[0].toUpperCase();

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">Loading your valuations...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="container-max px-container h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900 tracking-tight">Evaldam AI</span>
          </div>
          <Link href="/startup/new">
            <button className="btn btn-primary btn-sm flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> New Valuation
            </button>
          </Link>
        </div>
      </header>

      <main className="container-max px-container py-10 pb-24">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {userName}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {startups.length > 0 ? `${startups.length} startup valuation${startups.length !== 1 ? "s" : ""}` : "No valuations yet — get started below"}
          </p>
        </div>

        {startups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {startups.map((startup) => {
              const val = getRange(startup);
              return (
                <Link key={startup.id} href={`/startup/${startup.id}`}>
                  <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group h-full flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{startup.company_name}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{getTimeAgo(startup.created_at)}</p>
                      </div>
                      <span className="badge badge-neutral ml-2 flex-shrink-0">{stageLabel(startup.stage)}</span>
                    </div>
                    <div className="flex-1">
                      {val ? (
                        <div className="bg-gray-50 rounded-lg p-3 mt-2">
                          <div className="text-xs text-gray-500 mb-1">Blended Range</div>
                          <div className="font-bold text-gray-900">{val.range}</div>
                          <div className="text-xs text-gray-400 mt-0.5">Avg. {val.avg}</div>
                        </div>
                      ) : (
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mt-2">
                          <div className="text-xs text-amber-700 font-medium">Valuation pending</div>
                          <div className="text-xs text-amber-500 mt-0.5">Click to run valuation</div>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-primary">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">Open Workspace</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </Link>
              );
            })}
            <Link href="/startup/new">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 hover:border-primary/40 hover:bg-rose-50/30 transition-all cursor-pointer flex flex-col items-center justify-center text-center min-h-[180px] group">
                <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-rose-100 flex items-center justify-center mb-3 transition-colors">
                  <Plus className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                </div>
                <span className="text-sm font-medium text-gray-500 group-hover:text-primary transition-colors">Add new startup</span>
              </div>
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-14 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No valuations yet</h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">Create your first startup valuation using our AI-powered 5-method engine.</p>
            <Link href="/startup/new">
              <button className="btn btn-primary flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" /> Create First Valuation
              </button>
            </Link>
          </div>
        )}
      </main>

      {/* Bottom-left profile */}
      <div className="fixed bottom-5 left-5 z-40">
        {profileMenuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setProfileMenuOpen(false)} />
            <div className="absolute bottom-full mb-2 left-0 w-52 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-40">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-900 truncate">{userInfo?.full_name || userName}</p>
                <p className="text-xs text-gray-400 truncate">{userInfo?.email}</p>
              </div>
              <button onClick={() => { setProfileMenuOpen(false); setSettingsOpen(true); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Settings className="w-4 h-4 text-gray-400" /> Settings
              </button>
              <Link href="/pricing">
                <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <Sparkles className="w-4 h-4 text-gray-400" /> Upgrade Plan
                </button>
              </Link>
            </div>
          </>
        )}
        <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm hover:shadow-md transition-all">
          <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{userInitial}</div>
          <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">{userName}</span>
          <ChevronUp className={`w-3.5 h-3.5 text-gray-400 transition-transform ${profileMenuOpen ? "" : "rotate-180"}`} />
        </button>
      </div>

      {settingsOpen && userInfo && <SettingsModal user={userInfo} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
