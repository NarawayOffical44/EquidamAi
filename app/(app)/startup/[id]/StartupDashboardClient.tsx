"use client";


import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MessageSquare, User, DollarSign, FileText, ArrowLeft,
  Send, Loader2, Save, Download, Plus, Clock,
  ChevronRight, TrendingUp, Building2, Upload, Globe, Settings, FileCheck
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { UpgradeModal } from "@/components/UpgradeModal";
import { MethodologicalAssumptions } from "@/components/MethodologicalAssumptions";
import { SettingsModal } from "@/components/SettingsModal";
import { ProfileMenu } from "@/components/ProfileMenu";
import { ReviewPanel } from "./ReviewPanel";
import { trackReportDownload, trackValuationReportGenerated } from "@/lib/analytics/ga4";
import { FREE_AI_PROMPT_CHARACTER_LIMIT } from "@/lib/plans/plan-limits";

type Section = "chat" | "profile" | "financials" | "assumptions" | "reports" | "review";
interface Message { role: "user" | "assistant"; content: string; updates?: Record<string, any> }
interface ChatUsage {
  limit: number;
  used: number;
  remaining: number;
  period: "day" | "month";
  resetAt?: string;
  promptCharacterLimit?: number | null;
}

const PROMPTS = [
  "What are my biggest valuation drivers?",
  "We have a patent pending on our core technology",
  "Our founder previously built and sold a company for $32M",
  "We are seeing 18% month-over-month growth",
  "What are the biggest risks investors will flag?",
  "Compare us with similar startups",
];

const VALUATION_METHODOLOGY_VERSION = "professional-engine-2026.1";
const IMMUTABLE_STARTUP_FIELDS = new Set(["company_name", "stage", "industry", "website_url", "description"]);

const explainers: Record<string, string> = {
  arr: "Annual recurring revenue is the yearly value of repeatable subscription or contracted revenue.",
  growth: "Monthly growth is how quickly revenue, users, or usage is increasing month over month.",
  burn: "Burn rate is how much cash the company spends each month after revenue.",
  runway: "Runway is how many months the company can operate before needing more capital.",
  tam: "TAM is the total market the company could serve if it eventually reached the whole opportunity.",
  margin: "Gross margin is the percentage left after direct delivery costs. Higher margin usually supports stronger valuation.",
  concentration: "Customer concentration shows how much revenue depends on the biggest customer. High concentration increases risk.",
};

function FieldHelp({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs leading-relaxed text-gray-500">{children}</p>;
}

function calculateReadiness(startup: any) {
  const profile = startup?.profile_data || {};
  const proof = profile.proof_documents || {};
  const checks = [
    { key: "company", label: "Company basics", done: Boolean(startup?.company_name && startup?.stage && startup?.industry) },
    { key: "team", label: "Team size", done: Number(startup?.team_size || 0) > 0 },
    { key: "arr", label: "ARR or revenue", done: Number(startup?.arr || 0) > 0 },
    { key: "growth", label: "Growth rate", done: Number(startup?.monthly_growth_rate || 0) > 0 },
    { key: "tam", label: "Market size", done: Number(startup?.total_addressable_market || startup?.total_addressable_market_usd || 0) > 0 },
    { key: "proof", label: "Supporting proof", done: Object.values(proof).some(Boolean) },
  ];
  const score = Math.round((checks.filter((check) => check.done).length / checks.length) * 100);
  return {
    score,
    checks,
    label: score >= 85 ? "Strong" : score >= 60 ? "Usable" : "Needs work",
    color: score >= 85 ? "text-emerald-700 bg-white border-emerald-200" : score >= 60 ? "text-amber-700 bg-white border-amber-200" : "text-red-700 bg-white border-red-200",
  };
}

function normalizeForValuation(value: any): any {
  if (Array.isArray(value)) return value.map(normalizeForValuation);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc: any, key) => {
        const next = value[key];
        if (next !== undefined && typeof next !== "function") acc[key] = normalizeForValuation(next);
        return acc;
      }, {});
  }
  if (typeof value === "number") return Number.isFinite(value) ? Number(value.toFixed(6)) : 0;
  if (typeof value === "string") return value.trim();
  return value ?? null;
}

function stableStringify(value: any) {
  return JSON.stringify(normalizeForValuation(value));
}

function hashStableValue(value: any) {
  const str = stableStringify(value);
  let hash = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function buildValuationProfile(startup: any) {
  const profileData = startup.profile_data || {};
  const teamSize = Number(startup.team_size || profileData.team_size || 0);
  return {
    id: startup.id,
    userId: startup.user_id,
    companyName: startup.company_name,
    stage: startup.stage,
    websiteUrl: startup.website_url || "",
    annualRecurringRevenue: startup.arr || 0,
    monthlyRecurringRevenue: startup.mrr || 0,
    recentMonthlyRevenue: startup.total_revenue || 0,
    monthlyGrowthRate: startup.monthly_growth_rate || 0,
    industry: startup.industry || "tech",
    totalAddressableMarket: startup.total_addressable_market || startup.total_addressable_market_usd || 0,
    customerCount: startup.customer_count || profileData.customer_count || 0,
    grossMargin: profileData.gross_margin || startup.gross_margin || 0,
    customerConcentration: profileData.customer_concentration || 0,
    runwayMonths: startup.runway_months || profileData.runway_months || 0,
    totalFunded: startup.total_funding_raised || profileData.funding_raised || 0,
    marketDescription: profileData.market_description || "",
    competitiveAdvantage: startup.competitive_advantage || profileData.competitive_moat || "",
    patentCount: profileData.has_patent ? 1 : 0,
    moatScore: profileData.moat_score || 0,
    team: Array.from({ length: Math.max(teamSize, 0) }, (_, index) => ({
      name: index === 0 ? startup.ceo_name || "Founder" : `Team member ${index + 1}`,
      role: index === 0 ? "Founder" : "Team member",
    })),
    extractedFromUrl: profileData.extracted_from_url || startup.website_url || "",
    autoExtractionScore: profileData.auto_extraction_score || undefined,
    description: startup.description || "",
    ...profileData,
  };
}

function buildValuationInputSnapshot(startup: any) {
  const profile = buildValuationProfile(startup);
  return {
    methodologyVersion: VALUATION_METHODOLOGY_VERSION,
    profile,
    databaseInputs: {
      company_name: startup.company_name,
      stage: startup.stage,
      industry: startup.industry || "tech",
      website_url: startup.website_url || "",
      description: startup.description || "",
      arr: Number(startup.arr || 0),
      monthly_growth_rate: Number(startup.monthly_growth_rate || 0),
      total_addressable_market: Number(startup.total_addressable_market || 0),
      team_size: Number(startup.team_size || 0),
      profile_data: startup.profile_data || {},
    },
  };
}

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
  const [userInfo, setUserInfo] = useState<any>(null);
  const [userPlan, setUserPlan] = useState<"free" | "pro" | "plus" | "startup" | "agency" | "enterprise">("free");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [assistantTyping, setAssistantTyping] = useState(false);
  const [chatUsage, setChatUsage] = useState<ChatUsage | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // profile / financials form (mirrors startup row)
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // reports
  const [generating, setGenerating] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);

      // Fetch user info and plan
      const { data: userData } = await supabase
        .from("users")
        .select("plan, full_name, email, plan_active, billing_cycle, onboarding_completed")
        .eq("id", user.id)
        .single();
      if (!userData?.onboarding_completed) {
        router.push("/onboarding");
        return;
      }
      setUserPlan((userData?.plan || "free") as "free" | "pro" | "plus" | "startup" | "agency" | "enterprise");

      const { data: s } = await supabase.from("startups").select("*").eq("id", startupId).single();
      if (s) {
        const workspaceRole = s.user_id === user.id ? "admin" : "member";
        let workspaceInfo: any = null;
        try {
          const workspaceResponse = await fetch(`/api/workspace/context?workspaceId=${encodeURIComponent(s.user_id)}`);
          if (workspaceResponse.ok) workspaceInfo = await workspaceResponse.json();
        } catch {
          workspaceInfo = null;
        }
        setUserInfo({
          id: user.id,
          email: user.email || userData?.email || "",
          full_name: user.user_metadata?.full_name || userData?.full_name || "",
          plan: workspaceInfo?.userInfo?.plan || (workspaceRole === "member" ? "plus" : userData?.plan || "free"),
          plan_active: workspaceInfo?.userInfo?.plan_active ?? (workspaceRole === "member" ? true : userData?.plan_active || false),
          billing_cycle: workspaceInfo?.userInfo?.billing_cycle || userData?.billing_cycle,
          workspace_id: s.user_id,
          workspace_role: workspaceRole,
          workspace_owner_name: workspaceInfo?.userInfo?.workspace_owner_name,
          workspace_owner_email: workspaceInfo?.userInfo?.workspace_owner_email,
        });
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

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, []);

  // ── AI CHAT ──────────────────────────────────────────────────────────────────
  const getApiErrorMessage = (payload: any, fallback: string) =>
    payload?.message ||
    payload?.response ||
    payload?.details ||
    payload?.error?.message ||
    (typeof payload?.error === "string" ? payload.error : "") ||
    fallback;

  const openReportUpgrade = (reason: string) => {
    setUpgradeReason(reason);
    setUpgradeModalOpen(true);
  };

  const sendMessage = async (text?: string) => {
    if (!isWorkspaceAdmin) {
      alert("AI chat is available to the workspace Admin only.");
      return;
    }
    const content = (text || chatInput).trim();
    if (!content || chatLoading || assistantTyping) return;
    const promptLimit = chatUsage?.promptCharacterLimit || (!userInfo?.plan_active ? FREE_AI_PROMPT_CHARACTER_LIMIT : null);
    if (promptLimit && content.length > promptLimit) {
      openReportUpgrade(`Free AI prompts are limited to ${promptLimit.toLocaleString()} characters. Shorten your question or upgrade for longer prompts.`);
      return;
    }
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
      if (data.usage) setChatUsage(data.usage);
      if (!res.ok) {
        const responseText = getApiErrorMessage(data, "Evaldam AI is unavailable. Please try again.");
        if (res.status === 402 || res.status === 413 || res.status === 429 || data.upgradeUrl) {
          openReportUpgrade(responseText);
          return;
        }
        setMessages([...next, { role: "assistant", content: responseText }]);
        return;
      }
      const responseText = data.response || "";
      const assistantMsg: Message = { role: "assistant", content: "" };
      setMessages([...next, assistantMsg]);
      revealAssistantMessage(responseText, data.updates);
    } catch {
      setMessages([...next, { role: "assistant", content: "Sorry, I had trouble with that. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const applyChatUpdates = async (updates?: Record<string, any>) => {
    if (!updates || Object.keys(updates).length === 0) return;

    const allowed = ["arr","monthly_growth_rate","total_addressable_market","team_size"];
    const colUpdates: any = {};
    for (const [k, v] of Object.entries(updates)) {
      if (IMMUTABLE_STARTUP_FIELDS.has(k)) continue;
      if (allowed.includes(k)) colUpdates[k] = v;
    }

    const pdUpdates = updates.profile_data || {};
    const mergedPd = { ...(startup.profile_data || {}), ...pdUpdates };
    const fullUpdated = { ...startup, ...colUpdates, profile_data: mergedPd };
    setStartup(fullUpdated);
    setForm(fullUpdated);

    if (Object.keys(colUpdates).length > 0)
      await supabase.from("startups").update(colUpdates).eq("id", startupId);
    if (Object.keys(pdUpdates).length > 0)
      await supabase.from("startups").update({ profile_data: mergedPd }).eq("id", startupId).then(() => {});
  };

  const revealAssistantMessage = (fullText: string, updates?: Record<string, any>) => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);

    let index = 0;
    const chunkSize = fullText.length > 700 ? 8 : fullText.length > 300 ? 5 : 3;
    setAssistantTyping(true);

    typingTimerRef.current = setInterval(() => {
      index = Math.min(fullText.length, index + chunkSize);
      const visible = fullText.slice(0, index);

      setMessages(current => {
        const copy = [...current];
        const lastIndex = copy.length - 1;
        if (lastIndex >= 0 && copy[lastIndex].role === "assistant") {
          copy[lastIndex] = {
            ...copy[lastIndex],
            content: visible,
            updates: index >= fullText.length ? updates : undefined,
          };
        }
        return copy;
      });

      if (index >= fullText.length && typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
        typingTimerRef.current = null;
        setAssistantTyping(false);
        void applyChatUpdates(updates);
      }
    }, 18);
  };

  // ── SAVE PROFILE / FINANCIALS ─────────────────────────────────────────────
  const saveForm = async () => {
    const nextForm = { ...form, assumptions: form.assumptions || {} };
    setSaving(true);
    // Save known DB columns
    await supabase.from("startups").update({
      team_size: nextForm.team_size ? parseInt(nextForm.team_size) : null,
      arr: nextForm.arr ? parseFloat(nextForm.arr) : 0,
      monthly_growth_rate: nextForm.monthly_growth_rate ? parseFloat(nextForm.monthly_growth_rate) : 0,
      total_addressable_market: nextForm.total_addressable_market ? parseFloat(nextForm.total_addressable_market) : null,
    }).eq("id", startupId);
    // Save extended data to profile_data JSONB (requires: ALTER TABLE startups ADD COLUMN IF NOT EXISTS profile_data JSONB DEFAULT '{}')
    if (nextForm.profile_data && Object.keys(nextForm.profile_data).length > 0) {
      await supabase.from("startups").update({ profile_data: nextForm.profile_data }).eq("id", startupId);
    }
    setSaving(false);
    setStartup({ ...startup, ...nextForm });
    setSaveMsg("Saved ✓");
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const setFormField = (key: string, val: any) => setForm((f: any) => ({ ...f, [key]: val }));
  const setProfileData = (key: string, val: any) =>
    setForm((f: any) => ({ ...f, profile_data: { ...(f.profile_data || {}), [key]: val } }));
  const recordProofDocument = (key: string, label: string, file: File) => {
    setForm((f: any) => ({
      ...f,
      profile_data: {
        ...(f.profile_data || {}),
        proof_documents: {
          ...(f.profile_data?.proof_documents || {}),
          [key]: {
            label,
            fileName: file.name,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            status: "metadata_recorded",
          },
        },
      },
    }));
    setSaveMsg(`${label} recorded - save profile to keep it in the evidence checklist.`);
  };

  // ── RE-EXTRACT HELPERS ───────────────────────────────────────────────────
  const extractFromPdf = async (file: File) => {
    if (!isWorkspaceAdmin) {
      setSaveMsg("Pitch deck extraction is Admin-only.");
      return;
    }
    recordProofDocument("pitchDeck", "Pitch deck", file);
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
    if (!isWorkspaceAdmin) {
      alert("Only the workspace Admin can generate new valuation reports.");
      return;
    }
    setGenerating(true);
    try {
      const latestStartupState = { ...startup, ...form };
      const inputSnapshot = buildValuationInputSnapshot(latestStartupState);
      const inputFingerprint = hashStableValue(inputSnapshot);
      const existingSameInputValuation = valuations.find((valuation) =>
        valuation.report_data?.inputFingerprint === inputFingerprint &&
        valuation.report_data?.methodologyVersion === VALUATION_METHODOLOGY_VERSION
      );

      if (existingSameInputValuation) {
        alert(
          `No material input changes detected.\n\nYour valuation remains ${fmt(existingSameInputValuation.blended_weighted_average)}. Edit the profile, financials, or assumptions to create a new valuation version.`
        );
        setSection("reports");
        return;
      }

      const startupProfile = buildValuationProfile(latestStartupState);
      const res = await fetch("/api/valuate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupProfile,
          userId: user.id,
          startupId: latestStartupState.id,
          inputFingerprint,
          inputSnapshot,
          methodologyVersion: VALUATION_METHODOLOGY_VERSION,
        }),
      });
      const result = await res.json();
      if (result.success) {
        const newVal = result.data.savedValuation;
        if (newVal) {
          setValuations(prev => [newVal, ...prev]);
          trackValuationReportGenerated({
            startupId: latestStartupState.id,
            valuationId: newVal.id,
            methodologyVersion: VALUATION_METHODOLOGY_VERSION,
          });
        }
      } else {
        const errorMsg = getApiErrorMessage(result, "Unknown error");
        // Check if it's a plan limit error
        if (res.status === 402 || res.status === 429 || result.upgradeUrl || errorMsg.includes("FREE_PLAN_LIMIT_REACHED")) {
          openReportUpgrade(
            errorMsg.includes("FREE_PLAN_LIMIT_REACHED")
              ? "A paid plan is required to generate full valuation reports."
              : errorMsg
          );
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

  const downloadReportPdf = async (valuation: any) => {
    try {
      const res = await fetch(`/api/pdf/generate?valuationId=${valuation.id}`);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const errorMsg = getApiErrorMessage(payload, "Could not download this report.");
        if (res.status === 402 || res.status === 429 || payload.upgradeUrl) {
          openReportUpgrade(errorMsg);
          return;
        }
        alert(errorMsg);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const disposition = res.headers.get("Content-Disposition") || "";
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
      const filename = filenameMatch?.[1] || `${startup?.company_name || "valuation"}-report.pdf`;
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      trackReportDownload({
        companyName: startup.company_name || "Startup",
        reportType: "full",
        valuationMid: valuation.blended_weighted_average,
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not download this report.");
    }
  };

  const fmt = (v: number) => v ? `$${(v / 1e6).toFixed(2)}M` : "—";
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const stageLabel = (s: string) => s?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "—";
  const latest = valuations[0];
  const userName = userInfo?.full_name?.split(" ")[0] || userInfo?.email?.split("@")[0] || "there";
  const userInitial = (userInfo?.full_name || userInfo?.email || "?")[0].toUpperCase();
  const isWorkspaceAdmin = userInfo?.workspace_role !== "member";
  const chatPromptCharacterLimit = chatUsage?.promptCharacterLimit || (!userInfo?.plan_active ? FREE_AI_PROMPT_CHARACTER_LIMIT : null);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
  if (!startup) return (
    <div className="min-h-screen bg-white flex items-center justify-center text-center">
      <div>
        <p className="text-gray-500 mb-3">Startup not found.</p>
        <Link href="/dashboard" className="text-primary text-sm hover:underline">← Back to Dashboard</Link>
      </div>
    </div>
  );

  const currentReadiness = calculateReadiness({ ...startup, ...form });

  const nav: { key: Section; Icon: any; label: string }[] = [
    { key: "chat", Icon: MessageSquare, label: "AI Chat" },
    { key: "profile", Icon: User, label: "Profile" },
    { key: "financials", Icon: DollarSign, label: "Financials" },
    { key: "assumptions", Icon: Settings, label: "Assumptions" },
    { key: "reports", Icon: FileText, label: "Reports" },
    { key: "review", Icon: FileCheck, label: "Review" },
  ];

  return (
    <div className="flex min-h-screen bg-white">

      {/* ── FULL-HEIGHT LEFT SIDEBAR ── */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 z-30">
        {/* Logo + back */}
        <div className="h-14 flex items-center gap-2.5 px-5 border-b border-gray-100 flex-shrink-0">
          <Image src="/logo.png" alt="Evaldam AI" width={28} height={28} className="rounded-lg" />
        </div>

        {/* Startup name */}
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-2 transition-colors">
            <ArrowLeft className="w-3 h-3" /> All startups
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border border-primary/20 bg-white rounded-md flex items-center justify-center flex-shrink-0">
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
                section === key ? "border border-primary/20 bg-white text-primary" : "text-gray-500 hover:text-gray-800"
              }`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {key === "reports" && valuations.length > 0 && (
                <span className="ml-auto text-xs border border-slate-200/60 bg-white text-gray-500 px-1.5 py-0.5 rounded-full">{valuations.length}</span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 ml-56 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-14 bg-white backdrop-blur border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0 sticky top-0 z-20">
          <h2 className="text-sm font-semibold text-gray-900">
            {nav.find(n => n.key === section)?.label}
          </h2>
          {section === "reports" && isWorkspaceAdmin && (
            <button onClick={generateValuation} disabled={generating} className="btn btn-primary btn-sm flex items-center gap-1.5">
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {generating ? "Generating..." : "Run Valuation"}
            </button>
          )}
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto px-8 py-8 overflow-y-auto">
          {section !== "reports" && (
            <div className={`mb-6 rounded-lg border p-4 ${currentReadiness.color}`}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide opacity-70">Report readiness</p>
                  <p className="mt-1 text-lg font-black">{currentReadiness.score}% - {currentReadiness.label}</p>
                  <p className="mt-1 text-sm opacity-80">Visible before generation so weak inputs and proof gaps are clear while you work.</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {currentReadiness.checks.map((check) => (
                    <button
                      key={check.key}
                      type="button"
                      onClick={() => setSection(check.key === "company" || check.key === "team" || check.key === "proof" ? "profile" : "financials")}
                      className="rounded-md bg-white px-3 py-2 font-semibold"
                    >
                      {check.label}: {check.done ? "Done" : "Missing"}
                    </button>
                  ))}
                  <button type="button" onClick={() => setSection("review")} className="rounded-md bg-white px-3 py-2 font-semibold">
                    Professional review: Optional
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── CHAT ───────────────────────────────────────────────────────── */}
          {section === "chat" && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col max-w-6xl mx-auto overflow-hidden" style={{ minHeight: "560px", maxHeight: "calc(100vh - 140px)" }}>
              <div className="px-6 py-5 border-b border-gray-100 flex-shrink-0 bg-white">
                <h2 className="text-xl font-bold text-gray-950">Talk to Evaldam AI about this startup</h2>
                <p className="text-sm text-gray-500 mt-1 max-w-3xl">Share new data, ask analysis questions, or get investor insights. I'll update your profile automatically.</p>
                {!isWorkspaceAdmin && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-900">
                    AI chat is Admin-only. Members can update profile and financial inputs directly.
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 mt-4">
                  {PROMPTS.slice(0, 4).map(p => (
                    <button key={p} onClick={() => sendMessage(p)} disabled={!isWorkspaceAdmin}
                      className="text-left text-xs bg-white hover:text-primary text-gray-600 px-3 py-2 rounded-lg border border-gray-100 transition-colors truncate disabled:cursor-not-allowed disabled:opacity-50">
                      {p.length > 38 ? p.slice(0, 38) + "…" : p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-y-auto px-6 py-5 space-y-5 bg-white min-h-[320px] max-h-[calc(100vh-360px)]">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm ${
                      msg.role === "user" ? "bg-primary text-white rounded-br-md" : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
                    }`}>
                      <div className="whitespace-pre-wrap">
                        {msg.content}
                        {msg.role === "assistant" && assistantTyping && i === messages.length - 1 && (
                          <span className="inline-block w-1.5 h-4 ml-0.5 align-[-2px] bg-primary animate-pulse" />
                        )}
                      </div>
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
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              <div className="p-4 border-t border-gray-100 flex-shrink-0 bg-white">
                {chatUsage && (
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
                    <span className="font-semibold text-gray-800">
                      AI questions: {chatUsage.remaining}/{chatUsage.limit} left this {chatUsage.period}
                    </span>
                    {chatUsage.resetAt && (
                      <span>Resets {new Date(chatUsage.resetAt).toLocaleDateString()}</span>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    maxLength={chatPromptCharacterLimit || undefined}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Share new info, ask questions, or discuss your startup..."
                    className="flex-1 input text-sm h-12 rounded-xl"
                    disabled={!isWorkspaceAdmin}
                  />
                  <button onClick={() => sendMessage()} disabled={!isWorkspaceAdmin || !chatInput.trim() || chatLoading || assistantTyping}
                    className="btn btn-primary h-12 w-12 rounded-xl p-0">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                {chatPromptCharacterLimit && (
                  <p className="mt-2 text-xs font-medium text-gray-500">
                    {Math.max(chatPromptCharacterLimit - chatInput.length, 0).toLocaleString()} characters left on Free prompts.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── PROFILE ────────────────────────────────────────────────────── */}
          {section === "profile" && (
            <div className="space-y-5">
              {/* Input sources */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Update from Sources</h3>
                <div className="flex gap-3 flex-wrap items-center">
                  <label className={`btn btn-secondary btn-sm flex items-center gap-2 ${isWorkspaceAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                    <Upload className="w-4 h-4" /> Re-upload Pitch Deck
                    <input type="file" accept=".pdf" className="hidden" disabled={!isWorkspaceAdmin} onChange={e => { const f = e.target.files?.[0]; if (f) extractFromPdf(f); }} />
                  </label>
                  <div className="flex gap-2 flex-1 min-w-48">
                    <input type="url" id="url-input" placeholder="https://yourcompany.com — Enter to extract"
                      className="input input-sm flex-1 text-sm"
                      disabled={!isWorkspaceAdmin}
                      onKeyDown={async e => {
                        if (!isWorkspaceAdmin) return;
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
                    <button className="btn btn-secondary btn-sm" disabled={!isWorkspaceAdmin} onClick={() => {
                      (document.getElementById("url-input") as HTMLInputElement)?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
                    }}>
                      <Globe className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">Proof documents</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {[
                      ["financials", "Financial model / revenue proof"],
                      ["capTable", "Cap table"],
                      ["customerTraction", "Customer traction proof"],
                    ].map(([key, label]) => (
                      <label key={key} className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-primary/40">
                        <span>{label}</span>
                        <span className="text-primary">Upload</span>
                        <input className="hidden" type="file" accept=".pdf,.csv,.xlsx,.xls,.png,.jpg,.jpeg" onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) recordProofDocument(key, label, file);
                        }} />
                      </label>
                    ))}
                  </div>
                  <FieldHelp>These files are recorded as supporting evidence markers today. The report will show which proof exists and which inputs still need verification.</FieldHelp>
                </div>
                {saveMsg && <p className="text-xs text-primary mt-2 font-medium">{saveMsg}</p>}
              </div>

              {/* Company info */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Company Information</h3>
                <p className="mb-4 text-xs text-gray-500">Setup fields are locked after creation. Update traction, proof, and financial assumptions as the company changes.</p>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Company Name</label>
                    <input type="text" value={form.company_name || ""} disabled className="input bg-white text-gray-500" />
                  </div>
                  <div>
                    <label className="form-label">Stage</label>
                    <select value={form.stage || "seed"} disabled className="input bg-white text-gray-500">
                      <option value="pre-revenue">Pre-Revenue</option>
                      <option value="seed">Seed</option>
                      <option value="series-a">Series A</option>
                      <option value="series-b+">Series B+</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Industry</label>
                    <input type="text" value={form.industry || ""} disabled placeholder="e.g. SaaS, AI, Fintech" className="input bg-white text-gray-500" />
                  </div>
                  <div>
                    <label className="form-label">Website</label>
                    <input type="url" value={form.website_url || ""} disabled placeholder="https://" className="input bg-white text-gray-500" />
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
                  <div className="xl:col-span-2">
                    <label className="form-label">Description / Pitch</label>
                    <textarea rows={3} value={form.description || ""} onChange={e => setFormField("description", e.target.value)} placeholder="Describe your startup in 2–3 sentences..." className="input resize-none" />
                  </div>
                  <div className="xl:col-span-2">
                    <label className="form-label">Competitive Moat</label>
                    <textarea rows={2} value={form.profile_data?.competitive_moat || ""} onChange={e => setProfileData("competitive_moat", e.target.value)} placeholder="What makes you defensible against competitors?" className="input resize-none" />
                  </div>
                  <div className="xl:col-span-2">
                    <label className="form-label">Founder Exit History</label>
                    <input type="text" value={form.profile_data?.founder_exits || ""} onChange={e => setProfileData("founder_exits", e.target.value)} placeholder="e.g. Co-founder sold previous company for $32M in 2021" className="input" />
                  </div>
                  <div className="xl:col-span-2 flex items-start gap-3">
                    <input type="checkbox" id="patent" checked={!!form.profile_data?.has_patent} onChange={e => setProfileData("has_patent", e.target.checked)} className="mt-2.5 w-4 h-4 accent-primary flex-shrink-0" />
                    <div className="flex-1">
                      <label htmlFor="patent" className="form-label cursor-pointer">Has Patent / IP Protection</label>
                      {form.profile_data?.has_patent && (
                        <input type="text" value={form.profile_data?.patent_details || ""} onChange={e => setProfileData("patent_details", e.target.value)} placeholder="e.g. Patent pending on core algorithm (USPTO filed 2024)" className="input mt-1 text-sm" />
                      )}
                    </div>
                  </div>
                  <div className="xl:col-span-2">
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
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue Metrics</h3>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Annual Recurring Revenue (ARR)</label>
                    <input type="number" value={form.arr || ""} onChange={e => setFormField("arr", e.target.value)} placeholder="0" className="input" />
                    <FieldHelp>{explainers.arr}</FieldHelp>
                  </div>
                  <div>
                    <label className="form-label">Monthly Growth Rate (%)</label>
                    <input type="number" step="0.1" value={form.monthly_growth_rate || ""} onChange={e => setFormField("monthly_growth_rate", e.target.value)} placeholder="e.g. 15" className="input" />
                    <FieldHelp>{explainers.growth}</FieldHelp>
                  </div>
                  <div>
                    <label className="form-label">Burn Rate ($/month)</label>
                    <input type="number" value={form.profile_data?.burn_rate || ""} onChange={e => setProfileData("burn_rate", parseFloat(e.target.value))} placeholder="e.g. 50000" className="input" />
                    <FieldHelp>{explainers.burn}</FieldHelp>
                  </div>
                  <div>
                    <label className="form-label">Runway (months)</label>
                    <input type="number" value={form.profile_data?.runway_months || ""} onChange={e => setProfileData("runway_months", parseInt(e.target.value))} placeholder="e.g. 18" className="input" />
                    <FieldHelp>{explainers.runway}</FieldHelp>
                  </div>
                  <div>
                    <label className="form-label">Gross Margin (%)</label>
                    <input type="number" value={form.profile_data?.gross_margin || ""} onChange={e => setProfileData("gross_margin", parseFloat(e.target.value))} placeholder="e.g. 75" className="input" />
                    <FieldHelp>{explainers.margin}</FieldHelp>
                  </div>
                  <div>
                    <label className="form-label">Top Customer Concentration (%)</label>
                    <input type="number" value={form.profile_data?.customer_concentration || ""} onChange={e => setProfileData("customer_concentration", parseFloat(e.target.value))} placeholder="e.g. 20" className="input" />
                    <FieldHelp>{explainers.concentration}</FieldHelp>
                  </div>
                  <div className="xl:col-span-2">
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

              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Market Sizing</h3>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">TAM ($) — Total Addressable</label>
                    <input type="number" value={form.total_addressable_market || ""} onChange={e => setFormField("total_addressable_market", e.target.value)} placeholder="e.g. 5000000000" className="input" />
                    <FieldHelp>{explainers.tam}</FieldHelp>
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

              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Funding History</h3>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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


          {/* ── METHODOLOGICAL ASSUMPTIONS ────────────────────────────────── */}
          {section === "assumptions" && (
            <MethodologicalAssumptions
              startup={startup}
              assumptions={startup?.assumptions || {}}
              onUpdate={(assumptions) => {
                setForm((prev: any) => ({ ...prev, assumptions }));
                setSaveMsg("Assumptions will be used in next valuation report.");
              }}
            />
          )}
          {section === "review" && <ReviewPanel valuation={latest} />}
          {/* ── REPORTS ────────────────────────────────────────────────────── */}
          {section === "reports" && (() => {
            const reportInputState = { ...startup, ...form };
            const requiredFields = [
              { key: "team_size", label: "Team information" },
              { key: "arr", label: "Annual Recurring Revenue (ARR)" },
              { key: "monthly_growth_rate", label: "Monthly Growth Rate" },
              { key: "total_addressable_market", label: "Total Addressable Market (TAM)" },
            ];
            const missing = requiredFields.filter(f => {
              const val = (reportInputState as any)[f.key];
              return val === null || val === undefined || val === "" || val === 0;
            });
            const hasIncompleteData = missing.length > 0;
            const readiness = calculateReadiness(reportInputState);

            return (
              <div className="space-y-5">
                <div className={`rounded-lg border p-5 ${readiness.color}`}>
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide opacity-70">Report readiness</p>
                      <h3 className="mt-1 text-2xl font-black">{readiness.score}% - {readiness.label}</h3>
                      <p className="mt-1 text-sm opacity-80">Complete the missing items to make the report more credible before investor sharing.</p>
                    </div>
                    <div className="grid min-w-72 gap-2 text-sm">
                      {readiness.checks.map((check) => (
                        <div key={check.key} className="flex items-center justify-between gap-3 rounded-md border border-slate-200/60 bg-white px-3 py-2">
                          <span>{check.label}</span>
                          <span className="font-black">{check.done ? "Done" : "Missing"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {hasIncompleteData && (
                  <div className="bg-white border border-amber-200 rounded-lg p-4">
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
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                  <h3 className="font-semibold text-gray-900 mb-1">Generate New Valuation Report</h3>
                  <p className="text-sm text-gray-500 mb-5">Runs all 6 methods using current profile + financials data. May take a few minutes.</p>
                  <div className="mb-5 rounded-lg border border-blue-100 bg-white p-3 text-xs text-blue-900">
                    Same saved inputs reuse the existing valuation. A new report version is created only when profile, financials, assumptions, methodology, or the market-data snapshot changes.
                  </div>
                  {!isWorkspaceAdmin && (
                    <div className="mb-5 rounded-lg border border-amber-200 bg-white p-3 text-xs font-semibold text-amber-900">
                      Members can review and update inputs. New report generation is Admin-only.
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 mb-5 text-xs text-gray-500">
                    {["Scorecard Method (Payne)", "Berkus Checklist", "Venture Capital Method", "DCF with Long-Term Growth", "DCF with Exit Multiples", "Evaldam Proprietary Score"].map(m => (
                      <div key={m} className="flex items-center gap-2 py-1">
                        <div className="w-1.5 h-1.5 rounded-full border border-primary bg-white" />{m}
                      </div>
                    ))}
                  </div>
                  <button onClick={generateValuation} disabled={!isWorkspaceAdmin || generating || hasIncompleteData} className="btn btn-primary flex items-center gap-2 disabled:opacity-50">
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                    {generating ? "Generating valuation… (30–60s)" : !isWorkspaceAdmin ? "Admin only" : hasIncompleteData ? "Complete data first" : "Generate Valuation Report"}
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
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
                  <div className="relative space-y-3 pl-6 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-px before:bg-primary/30">
                    {valuations.map((v, i) => (
                      <div key={v.id} className={`relative flex items-center justify-between bg-white p-4 rounded-lg border ${i === 0 ? "border-primary/20" : "border-gray-100"}`}>
                        <div className={`absolute -left-[23px] top-5 w-3.5 h-3.5 rounded-full border-2 border-white ${i === 0 ? "bg-primary" : "bg-white border-gray-300"}`} />
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-500">
                            v{valuations.length - i}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-900">{fmt(v.blended_weighted_average)}</span>
                              {i === 0 && <span className="text-xs border border-primary/20 bg-white text-primary px-2 py-0.5 rounded-full font-medium">Latest</span>}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {fmt(v.blended_low_range)} – {fmt(v.blended_high_range)} · {fmtDate(v.created_at)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            v.confidence_level === "high" ? "bg-white text-green-600" :
                            v.confidence_level === "medium" ? "bg-white text-yellow-600" :
                            "bg-white text-red-600"
                          }`}>{v.confidence_level}</span>
                          <button
                            onClick={() => void downloadReportPdf(v)}
                            className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-primary"
                            title="Download PDF">
                            <Download className="w-4 h-4" />
                          </button>
                          <Link href={`/startup/${startupId}/report/${v.id}`} className="p-1.5 rounded-lg transition-colors" aria-label="Open report">
                            <ChevronRight className="w-4 h-4 text-gray-400" />
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

      <ProfileMenu
        userInfo={userInfo}
        userName={userName}
        userInitial={userInitial}
        onSettingsOpen={() => setSettingsOpen(true)}
        position="left-80"
      />

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        currentPlan={userPlan}
        limitType="report"
        limitReason={upgradeReason}
      />

      {settingsOpen && userInfo && <SettingsModal user={userInfo} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
