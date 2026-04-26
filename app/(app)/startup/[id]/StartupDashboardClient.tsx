"use client";


import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare, User, DollarSign, FileText, ArrowLeft,
  Sparkles, Send, Loader2, Save, Download, Plus, Clock,
  ChevronRight, TrendingUp, Building2, Upload, Globe
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Section = "chat" | "profile" | "financials" | "reports";
interface Message { role: "user" | "assistant"; content: string; updates?: Record<string, any> }

const PROMPTS = [
  "What are my biggest valuation drivers?",
  "We have a patent pending on our core technology",
  "Our founder previously built and sold a company for $32M",
  "We are seeing 18% month-over-month growth",
  "What are the biggest risks investors will flag?",
  "Compare us with similar startups",
];

export default function StartupDashboard() {
  const params = useParams();
  const router = useRouter();
  const startupId = params.id as string;
  const supabase = createClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [section, setSection] = useState<Section>("chat");
  const [startup, setStartup] = useState<any>(null);
  const [valuations, setValuations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // profile / financials form (mirrors startup row)
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // reports
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);

      const { data: s } = await supabase.from("startups").select("*").eq("id", startupId).single();
      if (s) {
        setStartup(s);
        setForm(s);
        setMessages([{
          role: "assistant",
          content: `Hi! I'm Evaldam AI. I have full context about **${s.company_name}**.\n\nTell me anything new about the business — funding milestones, growth metrics, IP, team backgrounds — and I'll help analyze the valuation impact and update your profile automatically.\n\nOr ask me anything about your valuation.`,
        }]);
      }

      const { data: v } = await supabase.from("valuations").select("*")
        .eq("startup_id", startupId).order("created_at", { ascending: false });
      setValuations(v || []);
      setLoading(false);
    };
    load();
  }, [startupId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ── AI CHAT ──────────────────────────────────────────────────────────────────
  const sendMessage = async (text?: string) => {
    const content = (text || chatInput).trim();
    if (!content || chatLoading) return;
    setChatInput("");
    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);
    setChatLoading(true);
    try {
      const res = await fetch(`/api/startup/${startupId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map(m => ({ role: m.role, content: m.content })), startup }),
      });
      const data = await res.json();
      const assistantMsg: Message = { role: "assistant", content: data.response };

      if (data.updates && Object.keys(data.updates).length > 0) {
        assistantMsg.updates = data.updates;
        const allowed = ["company_name","stage","industry","description","arr","monthly_growth_rate","total_addressable_market","team_size","website_url"];
        const colUpdates: any = {};
        for (const [k, v] of Object.entries(data.updates)) {
          if (allowed.includes(k)) colUpdates[k] = v;
        }
        // Merge profile_data
        const pdUpdates = data.updates.profile_data || {};
        const mergedPd = { ...(startup.profile_data || {}), ...pdUpdates };
        const fullUpdated = { ...startup, ...colUpdates, profile_data: mergedPd };
        setStartup(fullUpdated);
        setForm(fullUpdated);

        if (Object.keys(colUpdates).length > 0)
          await supabase.from("startups").update(colUpdates).eq("id", startupId);
        if (Object.keys(pdUpdates).length > 0)
          await supabase.from("startups").update({ profile_data: mergedPd }).eq("id", startupId).then(() => {});
      }
      setMessages([...next, assistantMsg]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Sorry, I had trouble with that. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // ── SAVE PROFILE / FINANCIALS ─────────────────────────────────────────────
  const saveForm = async () => {
    setSaving(true);
    // Save known DB columns
    await supabase.from("startups").update({
      company_name: form.company_name,
      stage: form.stage,
      industry: form.industry,
      website_url: form.website_url,
      description: form.description,
      team_size: form.team_size ? parseInt(form.team_size) : null,
      arr: form.arr ? parseFloat(form.arr) : 0,
      monthly_growth_rate: form.monthly_growth_rate ? parseFloat(form.monthly_growth_rate) : 0,
      total_addressable_market: form.total_addressable_market ? parseFloat(form.total_addressable_market) : null,
    }).eq("id", startupId);
    // Save extended data to profile_data JSONB (requires: ALTER TABLE startups ADD COLUMN IF NOT EXISTS profile_data JSONB DEFAULT '{}')
    if (form.profile_data && Object.keys(form.profile_data).length > 0) {
      await supabase.from("startups").update({ profile_data: form.profile_data }).eq("id", startupId);
    }
    setSaving(false);
    setStartup({ ...startup, ...form });
    setSaveMsg("Saved ✓");
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const setFormField = (key: string, val: any) => setForm((f: any) => ({ ...f, [key]: val }));
  const setProfileData = (key: string, val: any) =>
    setForm((f: any) => ({ ...f, profile_data: { ...(f.profile_data || {}), [key]: val } }));

  // ── RE-EXTRACT HELPERS ───────────────────────────────────────────────────
  const extractFromPdf = async (file: File) => {
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/extract-profile", { method: "POST", body: fd });
    const data = await res.json();
    if (data.success) {
      const x = data.data.autoExtracted;
      setForm((f: any) => ({
        ...f,
        company_name: x.companyName || f.company_name,
        stage: x.stage || f.stage,
        industry: x.industry || f.industry,
        description: x.description || f.description,
        arr: x.annualRecurringRevenue || f.arr,
        monthly_growth_rate: x.monthlyGrowthRate || f.monthly_growth_rate,
        total_addressable_market: x.totalAddressableMarket || f.total_addressable_market,
        team_size: x.team?.length || f.team_size,
      }));
      setSaveMsg("Extracted from deck — review & save");
    }
  };

  // ── GENERATE VALUATION ───────────────────────────────────────────────────
  const generateValuation = async () => {
    if (!startup || !user || generating) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/valuate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupProfile: {
            id: startup.id,
            companyName: startup.company_name,
            stage: startup.stage,
            annualRecurringRevenue: startup.arr || 0,
            monthlyGrowthRate: startup.monthly_growth_rate || 0,
            industry: startup.industry || "tech",
            totalAddressableMarket: startup.total_addressable_market || 0,
            description: startup.description || "",
            ...(startup.profile_data || {}),
          },
          userId: user.id,
        }),
      });
      const result = await res.json();
      if (result.success) {
        const v = result.data.valuation;
        const { data: newVal } = await supabase.from("valuations").insert({
          startup_id: startup.id,
          user_id: user.id,
          blended_low_range: v.blended?.lowRange,
          blended_high_range: v.blended?.highRange,
          blended_weighted_average: v.blended?.weightedAverage,
          confidence_level: v.confidenceLevel || "medium",
          data_completeness: v.dataCompleteness || 80,
          methods_results: v.methods,
          key_reasons: v.blended?.keyReasons,
          report_data: {
            reportMarkdown: result.data.reportMarkdown,
            executiveSummary: v.executiveSummary,
            detailedAnalysis: v.detailedAnalysis,
            sensitivityAnalysis: v.sensitivityAnalysis,
            professionalCitation: v.professionalCitation,
            generatedAt: v.generatedAt,
            startupProfile: startup,
          },
        }).select().single();
        if (newVal) setValuations(prev => [newVal, ...prev]);
      } else {
        const errorMsg = result.details || result.error?.message || result.error || "Unknown error";
        // Check if it's a plan limit error
        if (errorMsg.includes("FREE_PLAN_LIMIT_REACHED")) {
          alert(`📊 Upgrade Required\n\nFree plan limited to 3 evaluation reports. You've used all 3!\n\nUpgrade to Pro for unlimited reports.\n\nClick OK to view pricing.`);
          window.location.href = '/pricing';
          return;
        }
        // Check if it's an incomplete data error
        if (errorMsg.includes("incomplete data") || errorMsg.includes("Missing:")) {
          alert(`⚠️ Cannot generate report:\n\n${errorMsg}\n\nPlease complete the missing fields in the Profile and Financials tabs first.`);
        } else {
          alert("Valuation failed: " + errorMsg);
        }
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setGenerating(false);
    }
  };

  const fmt = (v: number) => v ? `$${(v / 1e6).toFixed(2)}M` : "—";
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const stageLabel = (s: string) => s?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "—";
  const latest = valuations[0];

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
  if (!startup) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-center">
      <div>
        <p className="text-gray-500 mb-3">Startup not found.</p>
        <Link href="/dashboard" className="text-primary text-sm hover:underline">← Back to Dashboard</Link>
      </div>
    </div>
  );

  const nav: { key: Section; Icon: any; label: string }[] = [
    { key: "chat", Icon: MessageSquare, label: "AI Chat" },
    { key: "profile", Icon: User, label: "Profile" },
    { key: "financials", Icon: DollarSign, label: "Financials" },
    { key: "reports", Icon: FileText, label: "Reports" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── FULL-HEIGHT LEFT SIDEBAR ── */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col fixed inset-y-0 left-0 z-30">
        {/* Logo + back */}
        <div className="h-14 flex items-center gap-2.5 px-5 border-b border-gray-100 flex-shrink-0">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-gray-900 tracking-tight text-sm">Evaldam AI</span>
        </div>

        {/* Startup name */}
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-2 transition-colors">
            <ArrowLeft className="w-3 h-3" /> All startups
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-rose-50 rounded-md flex items-center justify-center flex-shrink-0">
              <Building2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{startup.company_name}</p>
              <p className="text-xs text-gray-400">{stageLabel(startup.stage)}{startup.industry ? ` · ${startup.industry}` : ""}</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ key, Icon, label }) => (
            <button key={key} onClick={() => setSection(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                section === key ? "bg-rose-50 text-primary" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {key === "reports" && valuations.length > 0 && (
                <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{valuations.length}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Latest valuation at bottom */}
        {latest && (
          <div className="px-4 py-4 border-t border-gray-100 flex-shrink-0">
            <p className="text-xs text-gray-400 mb-1">Latest Valuation</p>
            <p className="text-base font-bold text-gray-900">{fmt(latest.blended_weighted_average)}</p>
            <p className="text-xs text-gray-400">{fmt(latest.blended_low_range)} – {fmt(latest.blended_high_range)}</p>
          </div>
        )}
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 ml-56 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-8 flex-shrink-0 sticky top-0 z-20">
          <h2 className="text-sm font-semibold text-gray-900">
            {nav.find(n => n.key === section)?.label}
          </h2>
          {section === "reports" && (
            <button onClick={generateValuation} disabled={generating} className="btn btn-primary btn-sm flex items-center gap-1.5">
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {generating ? "Generating..." : "Run Valuation"}
            </button>
          )}
        </header>

        <main className="flex-1 px-8 py-8 overflow-y-auto">

          {/* ── CHAT ───────────────────────────────────────────────────────── */}
          {section === "chat" && (
            <div className="bg-white border border-gray-200 rounded-xl flex flex-col" style={{ height: "calc(100vh - 140px)" }}>
              <div className="p-5 border-b border-gray-100 flex-shrink-0">
                <h2 className="font-bold text-gray-900">Talk to Evaldam AI about this startup</h2>
                <p className="text-xs text-gray-500 mt-0.5">Share new data, ask analysis questions, or get investor insights. I'll update your profile automatically.</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {PROMPTS.slice(0, 4).map(p => (
                    <button key={p} onClick={() => sendMessage(p)}
                      className="text-xs bg-gray-100 hover:bg-primary/10 hover:text-primary text-gray-600 px-3 py-1.5 rounded-full transition-colors">
                      {p.length > 38 ? p.slice(0, 38) + "…" : p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user" ? "bg-primary text-white rounded-br-md" : "bg-gray-100 text-gray-800 rounded-bl-md"
                    }`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      {msg.updates && Object.keys(msg.updates).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-black/10 text-xs opacity-70 flex items-center gap-1">
                          📝 Updated: {Object.keys(msg.updates).filter(k => k !== 'profile_data').concat(
                            msg.updates.profile_data ? Object.keys(msg.updates.profile_data) : []
                          ).join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              <div className="p-4 border-t border-gray-100 flex-shrink-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Share new info, ask questions, or discuss your startup..."
                    className="flex-1 input text-sm"
                  />
                  <button onClick={() => sendMessage()} disabled={!chatInput.trim() || chatLoading}
                    className="btn btn-primary btn-sm px-4">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── PROFILE ────────────────────────────────────────────────────── */}
          {section === "profile" && (
            <div className="space-y-5">
              {/* Input sources */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Update from Sources</h3>
                <div className="flex gap-3 flex-wrap items-center">
                  <label className="btn btn-secondary btn-sm flex items-center gap-2 cursor-pointer">
                    <Upload className="w-4 h-4" /> Re-upload Pitch Deck
                    <input type="file" accept=".pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) extractFromPdf(f); }} />
                  </label>
                  <div className="flex gap-2 flex-1 min-w-48">
                    <input type="url" id="url-input" placeholder="https://yourcompany.com — Enter to extract"
                      className="input input-sm flex-1 text-sm"
                      onKeyDown={async e => {
                        if (e.key !== "Enter") return;
                        const url = (e.target as HTMLInputElement).value;
                        if (!url) return;
                        const fd = new FormData(); fd.append("websiteUrl", url);
                        const res = await fetch("/api/extract-profile", { method: "POST", body: fd });
                        const data = await res.json();
                        if (data.success) {
                          const x = data.data.autoExtracted;
                          setForm((f: any) => ({
                            ...f,
                            company_name: x.companyName || f.company_name,
                            stage: x.stage || f.stage,
                            industry: x.industry || f.industry,
                            description: x.description || f.description,
                          }));
                          setSaveMsg("Extracted from website — review & save");
                        }
                      }}
                    />
                    <button className="btn btn-secondary btn-sm" onClick={() => {
                      (document.getElementById("url-input") as HTMLInputElement)?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
                    }}>
                      <Globe className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {saveMsg && <p className="text-xs text-primary mt-2 font-medium">{saveMsg}</p>}
              </div>

              {/* Company info */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Company Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Company Name</label>
                    <input type="text" value={form.company_name || ""} onChange={e => setFormField("company_name", e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="form-label">Stage</label>
                    <select value={form.stage || "seed"} onChange={e => setFormField("stage", e.target.value)} className="input">
                      <option value="pre-revenue">Pre-Revenue</option>
                      <option value="seed">Seed</option>
                      <option value="series-a">Series A</option>
                      <option value="series-b+">Series B+</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Industry</label>
                    <input type="text" value={form.industry || ""} onChange={e => setFormField("industry", e.target.value)} placeholder="e.g. SaaS, AI, Fintech" className="input" />
                  </div>
                  <div>
                    <label className="form-label">Website</label>
                    <input type="url" value={form.website_url || ""} onChange={e => setFormField("website_url", e.target.value)} placeholder="https://" className="input" />
                  </div>
                  <div>
                    <label className="form-label">LinkedIn URL</label>
                    <input type="url" value={form.profile_data?.linkedin_url || ""} onChange={e => setProfileData("linkedin_url", e.target.value)} placeholder="https://linkedin.com/company/..." className="input" />
                  </div>
                  <div>
                    <label className="form-label">Location</label>
                    <input type="text" value={form.profile_data?.location || ""} onChange={e => setProfileData("location", e.target.value)} placeholder="e.g. San Francisco, CA" className="input" />
                  </div>
                  <div>
                    <label className="form-label">Team Size</label>
                    <input type="number" value={form.team_size || ""} onChange={e => setFormField("team_size", e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="form-label">Founding Year</label>
                    <input type="number" value={form.profile_data?.founding_year || ""} onChange={e => setProfileData("founding_year", parseInt(e.target.value))} placeholder="e.g. 2022" className="input" />
                  </div>
                  <div className="col-span-2">
                    <label className="form-label">Description / Pitch</label>
                    <textarea rows={3} value={form.description || ""} onChange={e => setFormField("description", e.target.value)} placeholder="Describe your startup in 2–3 sentences..." className="input resize-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="form-label">Competitive Moat</label>
                    <textarea rows={2} value={form.profile_data?.competitive_moat || ""} onChange={e => setProfileData("competitive_moat", e.target.value)} placeholder="What makes you defensible against competitors?" className="input resize-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="form-label">Founder Exit History</label>
                    <input type="text" value={form.profile_data?.founder_exits || ""} onChange={e => setProfileData("founder_exits", e.target.value)} placeholder="e.g. Co-founder sold previous company for $32M in 2021" className="input" />
                  </div>
                  <div className="col-span-2 flex items-start gap-3">
                    <input type="checkbox" id="patent" checked={!!form.profile_data?.has_patent} onChange={e => setProfileData("has_patent", e.target.checked)} className="mt-2.5 w-4 h-4 accent-primary flex-shrink-0" />
                    <div className="flex-1">
                      <label htmlFor="patent" className="form-label cursor-pointer">Has Patent / IP Protection</label>
                      {form.profile_data?.has_patent && (
                        <input type="text" value={form.profile_data?.patent_details || ""} onChange={e => setProfileData("patent_details", e.target.value)} placeholder="e.g. Patent pending on core algorithm (USPTO filed 2024)" className="input mt-1 text-sm" />
                      )}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="form-label">Key Investors / Advisors</label>
                    <input type="text" value={form.profile_data?.key_investors || ""} onChange={e => setProfileData("key_investors", e.target.value)} placeholder="e.g. YC alumni, ex-Google VP, Sequoia scout" className="input" />
                  </div>
                </div>
              </div>

              <button onClick={saveForm} disabled={saving} className="btn btn-primary flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          )}

          {/* ── FINANCIALS ─────────────────────────────────────────────────── */}
          {section === "financials" && (
            <div className="space-y-5">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Annual Recurring Revenue (ARR)</label>
                    <input type="number" value={form.arr || ""} onChange={e => setFormField("arr", e.target.value)} placeholder="0" className="input" />
                  </div>
                  <div>
                    <label className="form-label">Monthly Growth Rate (%)</label>
                    <input type="number" step="0.1" value={form.monthly_growth_rate || ""} onChange={e => setFormField("monthly_growth_rate", e.target.value)} placeholder="e.g. 15" className="input" />
                  </div>
                  <div>
                    <label className="form-label">Burn Rate ($/month)</label>
                    <input type="number" value={form.profile_data?.burn_rate || ""} onChange={e => setProfileData("burn_rate", parseFloat(e.target.value))} placeholder="e.g. 50000" className="input" />
                  </div>
                  <div>
                    <label className="form-label">Runway (months)</label>
                    <input type="number" value={form.profile_data?.runway_months || ""} onChange={e => setProfileData("runway_months", parseInt(e.target.value))} placeholder="e.g. 18" className="input" />
                  </div>
                  <div className="col-span-2">
                    <label className="form-label">Revenue Model</label>
                    <select value={form.profile_data?.revenue_model || ""} onChange={e => setProfileData("revenue_model", e.target.value)} className="input">
                      <option value="">Select...</option>
                      <option value="saas-subscription">SaaS Subscription</option>
                      <option value="usage-based">Usage-Based</option>
                      <option value="marketplace">Marketplace / Commission</option>
                      <option value="one-time">One-Time License</option>
                      <option value="freemium">Freemium → Premium</option>
                      <option value="enterprise">Enterprise Contract</option>
                      <option value="transactional">Transactional</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Market Sizing</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">TAM ($) — Total Addressable</label>
                    <input type="number" value={form.total_addressable_market || ""} onChange={e => setFormField("total_addressable_market", e.target.value)} placeholder="e.g. 5000000000" className="input" />
                  </div>
                  <div>
                    <label className="form-label">SAM ($) — Serviceable</label>
                    <input type="number" value={form.profile_data?.sam || ""} onChange={e => setProfileData("sam", parseFloat(e.target.value))} placeholder="e.g. 500000000" className="input" />
                  </div>
                  <div>
                    <label className="form-label">SOM ($) — Obtainable</label>
                    <input type="number" value={form.profile_data?.som || ""} onChange={e => setProfileData("som", parseFloat(e.target.value))} placeholder="e.g. 50000000" className="input" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Funding History</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Total Raised ($)</label>
                    <input type="number" value={form.profile_data?.funding_raised || ""} onChange={e => setProfileData("funding_raised", parseFloat(e.target.value))} placeholder="0" className="input" />
                  </div>
                  <div>
                    <label className="form-label">Last Round Details</label>
                    <input type="text" value={form.profile_data?.last_round || ""} onChange={e => setProfileData("last_round", e.target.value)} placeholder="e.g. Pre-Seed $500K, Q2 2024" className="input" />
                  </div>
                </div>
              </div>

              <button onClick={saveForm} disabled={saving} className="btn btn-primary flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : "Save Financials"}
              </button>
              {saveMsg && <p className="text-sm text-green-600 font-medium">{saveMsg}</p>}
            </div>
          )}

          {/* ── REPORTS ────────────────────────────────────────────────────── */}
          {section === "reports" && (() => {
            const requiredFields = [
              { key: "team_size", label: "Team information" },
              { key: "arr", label: "Annual Recurring Revenue (ARR)" },
              { key: "monthly_growth_rate", label: "Monthly Growth Rate" },
              { key: "total_addressable_market", label: "Total Addressable Market (TAM)" },
            ];
            const missing = requiredFields.filter(f => {
              const val = (startup as any)[f.key];
              return val === null || val === undefined || val === "" || val === 0;
            });
            const hasIncompleteData = missing.length > 0;

            return (
              <div className="space-y-5">
                {hasIncompleteData && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm text-amber-900 font-medium mb-2">⚠️ Incomplete Data</p>
                    <p className="text-xs text-amber-800 mb-3">The following required fields are missing. Complete them for an accurate valuation:</p>
                    <ul className="text-xs text-amber-700 space-y-1 ml-4 list-disc">
                      {missing.map(m => <li key={m.key}>{m.label}</li>)}
                    </ul>
                    <button onClick={() => setSection("financials")} className="text-xs text-amber-700 hover:text-amber-900 font-semibold mt-3 underline">
                      → Go to Financials tab to complete data
                    </button>
                  </div>
                )}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-1">Generate New Valuation Report</h3>
                  <p className="text-sm text-gray-500 mb-5">Runs all 6 methods using current profile + financials data. Takes 30–60 seconds.</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 mb-5 text-xs text-gray-500">
                    {["Scorecard Method (Payne)", "Berkus Checklist", "Venture Capital Method", "DCF with Long-Term Growth", "DCF with Exit Multiples", "Evaldam Proprietary Score"].map(m => (
                      <div key={m} className="flex items-center gap-2 py-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />{m}
                      </div>
                    ))}
                  </div>
                  <button onClick={generateValuation} disabled={generating || hasIncompleteData} className="btn btn-primary flex items-center gap-2 disabled:opacity-50">
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                    {generating ? "Generating valuation… (30–60s)" : hasIncompleteData ? "Complete data first" : "Generate Valuation Report"}
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" /> Report History
                  </h3>
                  <span className="text-xs text-gray-400">{valuations.length} report{valuations.length !== 1 ? "s" : ""}</span>
                </div>
                {valuations.length === 0 ? (
                  <div className="text-center py-10">
                    <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No reports yet. Generate your first above.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {valuations.map((v, i) => (
                      <div key={v.id} className={`flex items-center justify-between p-4 rounded-xl border ${i === 0 ? "bg-primary/5 border-primary/20" : "bg-gray-50 border-gray-100"}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? "bg-primary" : "bg-gray-300"}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-900">{fmt(v.blended_weighted_average)}</span>
                              {i === 0 && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Latest</span>}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {fmt(v.blended_low_range)} – {fmt(v.blended_high_range)} · {fmtDate(v.created_at)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            v.confidence_level === "high" ? "bg-green-50 text-green-600" :
                            v.confidence_level === "medium" ? "bg-yellow-50 text-yellow-600" :
                            "bg-red-50 text-red-600"
                          }`}>{v.confidence_level}</span>
                          <button
                            onClick={() => window.open(`/api/pdf/generate?valuationId=${v.id}`, "_blank")}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-primary"
                            title="Download PDF">
                            <Download className="w-4 h-4" />
                          </button>
                          <Link href={`/startup/${startupId}/report/${v.id}`}>
                            <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            </button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            );
          })()}

        </main>
      </div>
    </div>
  );
}
