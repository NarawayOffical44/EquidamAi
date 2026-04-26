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
  const hasIncompleteData = (s: StartupWithValuation) => {
    const requiredFields = ['team_size', 'arr', 'monthly_growth_rate', 'total_addressable_market'];
    return requiredFields.some(field => {
      const val = (s as any)[field];
      return val === null || val === undefined || val === "" || val === 0;
    });
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
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-600">Loading your valuations...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Top Nav - Professional header */}
      <header className="border-b border-gray-200 sticky top-0 z-40 bg-white">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-black tracking-tight text-primary">
            evaldam
          </Link>
          <Link href="/startup/new">
            <button className="btn btn-primary btn-sm flex items-center gap-1.5 font-semibold">
              <Plus className="w-4 h-4" /> New Valuation
            </button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 pb-24">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Welcome back, {userName}</h1>
          <p className="text-gray-600 mt-2">
            {startups.length > 0 ? `${startups.length} startup valuation${startups.length !== 1 ? "s" : ""}` : "No valuations yet — create your first startup valuation"}
          </p>
        </div>

        {startups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {startups.map((startup) => {
              const val = getRange(startup);
              return (
                <Link key={startup.id} href={`/startup/${startup.id}`}>
                  <div className={`rounded-2xl p-6 transition-all cursor-pointer group h-full flex flex-col ${hasIncompleteData(startup) ? 'bg-amber-50 border-2 border-amber-200 hover:shadow-lg hover:border-amber-300' : 'bg-white border border-gray-200 hover:shadow-lg hover:border-gray-300 hover:-translate-y-1'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate text-lg">{startup.company_name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{getTimeAgo(startup.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        {hasIncompleteData(startup) && (
                          <span className="badge bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1">⚠ INCOMPLETE</span>
                        )}
                        <span className="badge badge-neutral text-xs font-semibold">{stageLabel(startup.stage)}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      {val ? (
                        <div className="bg-gray-50 rounded-lg p-3 mt-2">
                          <div className="text-xs text-gray-500 mb-1">Blended Range</div>
                          <div className="font-bold text-gray-900">{val.range}</div>
                          <div className="text-xs text-gray-400 mt-0.5">Avg. {val.avg}</div>
                        </div>
                      ) : (
                        <div className={`rounded-lg p-3 mt-2 border ${hasIncompleteData(startup) ? 'bg-amber-100 border-amber-200' : 'bg-amber-50 border-amber-100'}`}>
                          <div className={`text-xs font-medium ${hasIncompleteData(startup) ? 'text-amber-900' : 'text-amber-700'}`}>
                            {hasIncompleteData(startup) ? 'Complete data to generate valuation' : 'Valuation pending'}
                          </div>
                          <div className={`text-xs mt-0.5 ${hasIncompleteData(startup) ? 'text-amber-800' : 'text-amber-500'}`}>
                            {hasIncompleteData(startup) ? 'Missing required fields' : 'Click to run valuation'}
                          </div>
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
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 hover:border-primary hover:bg-blue-50/20 transition-all cursor-pointer flex flex-col items-center justify-center text-center min-h-[220px] group">
                <div className="w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/15 flex items-center justify-center mb-3 transition-colors">
                  <Plus className="w-6 h-6 text-primary group-hover:text-primary transition-colors" />
                </div>
                <span className="text-base font-semibold text-gray-700 group-hover:text-primary transition-colors">Create new valuation</span>
                <p className="text-xs text-gray-500 mt-1">Analyze a startup with AI</p>
              </div>
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center max-w-lg mx-auto">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-3">No valuations yet</h3>
            <p className="text-gray-600 text-base mb-8 leading-relaxed">Create your first startup valuation using our AI-powered 6-method professional engine.</p>
            <Link href="/startup/new">
              <button className="btn btn-primary btn-lg flex items-center gap-2 mx-auto font-semibold">
                <Plus className="w-4 h-4" /> Create First Valuation
              </button>
            </Link>
          </div>
        )}
      </main>

      {/* Bottom-left profile menu */}
      <div className="fixed bottom-6 left-6 z-40">
        {profileMenuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setProfileMenuOpen(false)} />
            <div className="absolute bottom-full mb-3 left-0 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-40">
              <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
                <p className="text-sm font-semibold text-gray-900 truncate">{userInfo?.full_name || userName}</p>
              </div>
              <button onClick={() => { setProfileMenuOpen(false); setSettingsOpen(true); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Settings className="w-4 h-4 text-gray-400" /> Settings
              </button>
              <Link href="/pricing" className="w-full">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100">
                  <Sparkles className="w-4 h-4 text-primary" /> Upgrade Plan
                </button>
              </Link>
            </div>
          </>
        )}
        <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-lg px-3 py-2.5 shadow-md hover:shadow-lg hover:border-gray-300 transition-all">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{userInitial}</div>
          <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate hidden sm:block">{userName}</span>
          <ChevronUp className={`w-4 h-4 text-gray-400 transition-transform hidden sm:block ${profileMenuOpen ? "rotate-0" : "rotate-180"}`} />
        </button>
      </div>

      {settingsOpen && userInfo && <SettingsModal user={userInfo} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
