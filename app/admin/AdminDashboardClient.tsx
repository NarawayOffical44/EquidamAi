"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  Building2,
  Calendar,
  Database,
  Filter,
  Globe,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  TrendingUp,
  UserRound,
  BarChart2,
  Users,
  Repeat2,
  GitBranch,
  ArrowRight,
} from "lucide-react";
import type { AdminLead, AdminSourceStatus } from "@/lib/admin/leads";

interface AdminDashboardClientProps {
  initialLeads: AdminLead[];
  initialSourceStatus: AdminSourceStatus[];
  adminEmail: string;
}

const money = (value: number | null) => {
  if (value === null) return "-";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString("en-US")}`;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const formatDateOnly = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const dateKey = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const monthKey = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const isUrl = (value?: string | null) => Boolean(value && /^https?:\/\//i.test(value));

const SOURCE_COLORS: Record<string, string> = {
  free_valuation: "#3b82f6",
  github_repo_valuation: "#8b5cf6",
  account_signup: "#f59e0b",
  checkout: "#10b981",
  contact_form: "#06b6d4",
  enterprise_inquiry: "#ef4444",
  email_sequence: "#f97316",
  sample_report_download: "#84cc16",
  unknown: "#9ca3af",
};

const sourceColor = (source: string) => SOURCE_COLORS[source] ?? "#9ca3af";

export default function AdminDashboardClient({
  initialLeads,
  initialSourceStatus,
  adminEmail,
}: AdminDashboardClientProps) {
  const [leads, setLeads] = useState<AdminLead[]>(initialLeads);
  const [sourceStatus, setSourceStatus] = useState<AdminSourceStatus[]>(initialSourceStatus);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState("Initial load");
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "email">("newest");
  const [selectedLead, setSelectedLead] = useState<AdminLead | null>(null);
  const [activeTab, setActiveTab] = useState<"analytics" | "leads">("analytics");
  const [chartGranularity, setChartGranularity] = useState<"daily" | "monthly">("daily");

  const refreshLeads = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/leads", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
        setSourceStatus(data.sourceStatus || []);
        setLastRefresh(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error("Error refreshing leads:", error);
    } finally {
      setLoading(false);
    }
  };

  // ── Analytics computations ──────────────────────────────────────────────

  const analytics = useMemo(() => {
    // Distinct contacts by email
    const emailSet = new Set(leads.map((l) => l.email.toLowerCase().trim()).filter(Boolean));
    const distinctContacts = emailSet.size;

    // Return logins (account_signup leads where lastSignInAt > createdAt + 1h)
    const accountLeads = leads.filter((l) => l.source === "account_signup");
    const returnLogins = accountLeads.filter((l) => {
      if (!l.lastSignInAt) return false;
      const signIn = new Date(l.lastSignInAt).getTime();
      const created = new Date(l.createdAt).getTime();
      return signIn - created > 3_600_000;
    });
    const returnLoginRate = accountLeads.length > 0
      ? Math.round((returnLogins.length / accountLeads.length) * 100)
      : 0;

    // Paid conversion
    const paidAccounts = accountLeads.filter((l) => l.status === "paid_active").length;
    const paidConvRate = accountLeads.length > 0
      ? Math.round((paidAccounts / accountLeads.length) * 100)
      : 0;

    // Source counts
    const freeValuations = leads.filter((l) => l.source === "free_valuation").length;
    const githubValuations = leads.filter((l) => l.source === "github_repo_valuation").length;
    const checkouts = leads.filter((l) => l.source === "checkout").length;

    // Activity chart data
    const now = new Date();
    let chartData: { label: string; key: string }[] = [];

    if (chartGranularity === "daily") {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        chartData.push({ label: key.slice(5), key });
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        chartData.push({ label: key, key });
      }
    }

    const allSources = Array.from(new Set(leads.map((l) => l.source)));
    const activityMap = new Map<string, Record<string, number>>();
    chartData.forEach(({ key }) => {
      activityMap.set(key, {});
    });

    leads.forEach((lead) => {
      const k = chartGranularity === "daily" ? dateKey(lead.createdAt) : monthKey(lead.createdAt);
      if (!k || !activityMap.has(k)) return;
      const row = activityMap.get(k)!;
      row[lead.source] = (row[lead.source] ?? 0) + 1;
    });

    const activityChartData = chartData.map(({ key, label }) => ({
      label,
      ...activityMap.get(key),
    }));

    // Pie/donut source breakdown
    const sourceMap = new Map<string, { label: string; count: number }>();
    leads.forEach((l) => {
      const existing = sourceMap.get(l.source);
      if (existing) existing.count += 1;
      else sourceMap.set(l.source, { label: l.sourceLabel, count: 1 });
    });
    const pieData = Array.from(sourceMap.values()).sort((a, b) => b.count - a.count);

    // Funnel
    const funnel = [
      { label: "Free Valuations", count: freeValuations, color: "#3b82f6" },
      { label: "GitHub Valuations", count: githubValuations, color: "#8b5cf6" },
      { label: "Account Signups", count: accountLeads.length, color: "#f59e0b" },
      { label: "Paid Accounts", count: paidAccounts, color: "#10b981" },
    ];

    // Today / 7-day totals
    const todayStr = new Date().toDateString();
    const last7Start = new Date();
    last7Start.setDate(last7Start.getDate() - 6);
    last7Start.setHours(0, 0, 0, 0);
    const todayCount = leads.filter((l) => new Date(l.createdAt).toDateString() === todayStr).length;
    const last7Count = leads.filter((l) => new Date(l.createdAt) >= last7Start).length;

    return {
      distinctContacts,
      returnLogins: returnLogins.length,
      returnLoginRate,
      paidAccounts,
      paidConvRate,
      freeValuations,
      githubValuations,
      checkouts,
      accountSignups: accountLeads.length,
      activityChartData,
      allSources,
      pieData,
      funnel,
      todayCount,
      last7Count,
      totalLeads: leads.length,
    };
  }, [leads, chartGranularity]);

  // ── Leads tab data ───────────────────────────────────────────────────────

  const sources = useMemo(
    () => Array.from(new Map(leads.map((lead) => [lead.source, lead.sourceLabel])).entries()),
    [leads]
  );

  const filteredLeads = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = leads.filter((lead) => {
      const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
      if (!matchesSource) return false;
      if (!term) return true;
      return [lead.email, lead.fullName, lead.phone, lead.companyName, lead.websiteUrl, lead.useCase, lead.plan, lead.sourceLabel, lead.country, lead.city, lead.status]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
    filtered.sort((a, b) => {
      if (sortBy === "email") return a.email.localeCompare(b.email);
      const left = new Date(a.createdAt).getTime();
      const right = new Date(b.createdAt).getTime();
      return sortBy === "oldest" ? left - right : right - left;
    });
    return filtered;
  }, [leads, searchTerm, sourceFilter, sortBy]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Admin info bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm flex items-center justify-between">
        <span><span className="font-semibold text-gray-900">Admin:</span> {adminEmail}</span>
        <button
          onClick={refreshLeads}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1 w-fit">
        {(["analytics", "leads"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === tab
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "analytics" ? <BarChart2 className="h-4 w-4" /> : <Database className="h-4 w-4" />}
            {tab === "analytics" ? "Analytics" : "Lead Feed"}
          </button>
        ))}
      </div>

      {/* ── ANALYTICS TAB ── */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Distinct contacts", value: analytics.distinctContacts, Icon: Users, tone: "border-blue-500", sub: `${analytics.totalLeads} total records` },
              { label: "Return logins", value: analytics.returnLogins, Icon: Repeat2, tone: "border-purple-500", sub: `${analytics.returnLoginRate}% of signups` },
              { label: "Paid accounts", value: analytics.paidAccounts, Icon: TrendingUp, tone: "border-green-500", sub: `${analytics.paidConvRate}% conv. rate` },
              { label: "GitHub valuations", value: analytics.githubValuations, Icon: GitBranch, tone: "border-cyan-500", sub: `${analytics.freeValuations} free valuations` },
            ].map(({ label, value, Icon, tone, sub }) => (
              <div key={label} className={`rounded-xl border-l-4 ${tone} bg-white p-5 shadow-sm`}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p>
                  <Icon className="h-4 w-4 text-gray-300" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
                <p className="mt-1 text-xs text-gray-400">{sub}</p>
              </div>
            ))}
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
            {[
              { label: "Today", value: analytics.todayCount },
              { label: "Last 7 days", value: analytics.last7Count },
              { label: "Account signups", value: analytics.accountSignups },
              { label: "Checkouts", value: analytics.checkouts },
              { label: "Free valuations", value: analytics.freeValuations },
              { label: "Total records", value: analytics.totalLeads },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Activity chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Activity Over Time</h2>
              <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                {(["daily", "monthly"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setChartGranularity(g)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                      chartGranularity === g ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {g === "daily" ? "Daily (30d)" : "Monthly (12m)"}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analytics.activityChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} interval={chartGranularity === "daily" ? 4 : 0} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                  cursor={{ fill: "#f9fafb" }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {analytics.allSources.map((source) => (
                  <Bar key={source} dataKey={source} stackId="a" fill={sourceColor(source)} name={source.replace(/_/g, " ")} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Conversion funnel */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Conversion Funnel</h2>
              <div className="space-y-3">
                {analytics.funnel.map((step, i) => {
                  const pct = analytics.funnel[0].count > 0
                    ? Math.round((step.count / analytics.funnel[0].count) * 100)
                    : 0;
                  const dropOff = i > 0 && analytics.funnel[i - 1].count > 0
                    ? Math.round((1 - step.count / analytics.funnel[i - 1].count) * 100)
                    : null;
                  return (
                    <div key={step.label}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {i > 0 && <ArrowRight className="h-3.5 w-3.5 text-gray-300" />}
                          <span className="font-medium text-gray-700">{step.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {dropOff !== null && (
                            <span className="text-xs text-red-400">-{dropOff}% drop</span>
                          )}
                          <span className="font-bold text-gray-900">{step.count.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: step.color }}
                        />
                      </div>
                      <p className="mt-0.5 text-right text-xs text-gray-400">{pct}% of top</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Source breakdown donut */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Source Breakdown</h2>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={analytics.pieData}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={2}
                    >
                      {analytics.pieData.map((entry, index) => (
                        <Cell key={index} fill={sourceColor(Object.keys(SOURCE_COLORS)[index] ?? "unknown")} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2 min-w-0">
                  {analytics.pieData.map((entry, i) => (
                    <div key={entry.label} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: sourceColor(Object.keys(SOURCE_COLORS)[i] ?? "unknown") }}
                        />
                        <span className="truncate text-gray-600">{entry.label}</span>
                      </div>
                      <span className="font-bold text-gray-900">{entry.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Data sources */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-base font-bold text-gray-900">Data Sources</h2>
            <div className="grid gap-3 md:grid-cols-5">
              {sourceStatus.map((source) => (
                <div key={source.key} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{source.label}</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">{source.count}</p>
                  {source.error && <p className="mt-1 text-xs text-red-600">{source.error}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── LEADS TAB ── */}
      {activeTab === "leads" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Unified Lead Feed</h2>
                <p className="text-xs text-gray-500">Last refresh: {lastRefresh}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_180px_160px]">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search email, phone, company, plan, source…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="all">All sources</option>
                    {sources.map(([source, label]) => (
                      <option key={source} value={source}>{label}</option>
                    ))}
                  </select>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "email")}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="email">Email A-Z</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full min-w-[1120px] text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Source</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Contact</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Company</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Intent</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Plan</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Valuation</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Location</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Captured</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500">No lead records found.</td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <tr key={lead.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span
                            className="rounded-full px-2.5 py-1 text-xs font-bold text-white"
                            style={{ backgroundColor: sourceColor(lead.source) }}
                          >
                            {lead.sourceLabel}
                          </span>
                          {lead.status && <p className="mt-1 text-xs text-gray-500">{lead.status}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 font-semibold text-blue-700 hover:underline">
                              <Mail className="h-3.5 w-3.5" />
                              {lead.email || "-"}
                            </a>
                            {lead.fullName && <p className="text-xs text-gray-500">{lead.fullName}</p>}
                            {lead.phone && (
                              <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:underline">
                                <Phone className="h-3.5 w-3.5" />
                                {lead.phone}
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-[180px]">
                            <p className="truncate font-medium text-gray-900">{lead.companyName || "-"}</p>
                            {isUrl(lead.websiteUrl) && (
                              <a href={lead.websiteUrl || undefined} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1 text-xs text-blue-700 hover:underline">
                                <Globe className="h-3.5 w-3.5" /> Website
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3"><p className="max-w-[230px] truncate text-gray-700">{lead.useCase || "-"}</p></td>
                        <td className="px-4 py-3 text-gray-700">
                          <p>{lead.plan || "-"}</p>
                          {(lead.billingCycle || lead.currency) && (
                            <p className="text-xs text-gray-500">{[lead.billingCycle, lead.currency].filter(Boolean).join(" / ")}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {lead.valuationMid !== null ? (
                            <div>
                              <p className="font-bold text-gray-900">{money(lead.valuationMid)}</p>
                              <p className="text-xs text-gray-500">{money(lead.valuationLow)} – {money(lead.valuationHigh)}</p>
                            </div>
                          ) : "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-gray-400" />
                            <span>{[lead.city, lead.country].filter(Boolean).join(", ") || "-"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(lead.createdAt)}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Lead detail modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="border-b border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span
                    className="mb-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold text-white"
                    style={{ backgroundColor: sourceColor(selectedLead.source) }}
                  >
                    {selectedLead.sourceLabel}
                  </span>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedLead.companyName || selectedLead.email}</h2>
                  <p className="text-sm text-gray-500">{formatDate(selectedLead.createdAt)}</p>
                </div>
                <button onClick={() => setSelectedLead(null)} className="rounded-lg px-3 py-1.5 text-gray-500 hover:bg-gray-100">Close</button>
              </div>
            </div>

            <div className="grid gap-5 p-5 md:grid-cols-2">
              <section className="rounded-xl border border-gray-200 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-bold text-gray-900"><Mail className="h-4 w-4" /> Contact</h3>
                <dl className="space-y-2 text-sm">
                  <div><dt className="text-gray-500">Email</dt><dd className="font-medium text-gray-900">{selectedLead.email || "-"}</dd></div>
                  <div><dt className="text-gray-500">Full name</dt><dd className="font-medium text-gray-900">{selectedLead.fullName || "-"}</dd></div>
                  <div><dt className="text-gray-500">Phone</dt><dd className="font-medium text-gray-900">{selectedLead.phone || "-"}</dd></div>
                  <div><dt className="text-gray-500">IP</dt><dd className="font-medium text-gray-900">{selectedLead.ipAddress || "-"}</dd></div>
                  {selectedLead.lastSignInAt && (
                    <div><dt className="text-gray-500">Last sign-in</dt><dd className="font-medium text-gray-900">{formatDate(selectedLead.lastSignInAt)}</dd></div>
                  )}
                </dl>
              </section>

              <section className="rounded-xl border border-gray-200 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-bold text-gray-900"><Building2 className="h-4 w-4" /> Company & Intent</h3>
                <dl className="space-y-2 text-sm">
                  <div><dt className="text-gray-500">Company</dt><dd className="font-medium text-gray-900">{selectedLead.companyName || "-"}</dd></div>
                  <div><dt className="text-gray-500">Website</dt><dd className="break-all font-medium text-gray-900">{selectedLead.websiteUrl || "-"}</dd></div>
                  <div><dt className="text-gray-500">Use case</dt><dd className="font-medium text-gray-900">{selectedLead.useCase || "-"}</dd></div>
                  <div><dt className="text-gray-500">Plan</dt><dd className="font-medium text-gray-900">{selectedLead.plan || "-"}</dd></div>
                </dl>
              </section>

              <section className="rounded-xl border border-gray-200 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-bold text-gray-900"><TrendingUp className="h-4 w-4" /> Valuation</h3>
                <dl className="space-y-2 text-sm">
                  <div><dt className="text-gray-500">Low</dt><dd className="font-medium text-gray-900">{money(selectedLead.valuationLow)}</dd></div>
                  <div><dt className="text-gray-500">Mid</dt><dd className="font-medium text-gray-900">{money(selectedLead.valuationMid)}</dd></div>
                  <div><dt className="text-gray-500">High</dt><dd className="font-medium text-gray-900">{money(selectedLead.valuationHigh)}</dd></div>
                </dl>
              </section>

              <section className="rounded-xl border border-gray-200 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-bold text-gray-900"><MapPin className="h-4 w-4" /> Location & Status</h3>
                <dl className="space-y-2 text-sm">
                  <div><dt className="text-gray-500">Country</dt><dd className="font-medium text-gray-900">{selectedLead.country || "-"}</dd></div>
                  <div><dt className="text-gray-500">City</dt><dd className="font-medium text-gray-900">{selectedLead.city || "-"}</dd></div>
                  <div><dt className="text-gray-500">Status</dt><dd className="font-medium text-gray-900">{selectedLead.status || "-"}</dd></div>
                  <div><dt className="text-gray-500">Record ID</dt><dd className="break-all font-mono text-xs text-gray-900">{selectedLead.id}</dd></div>
                </dl>
              </section>
            </div>

            <div className="border-t border-gray-200 p-5">
              <h3 className="mb-3 font-bold text-gray-900">Raw Record</h3>
              <pre className="max-h-80 overflow-auto rounded-xl bg-gray-950 p-4 text-xs text-gray-100">
                {JSON.stringify(selectedLead.raw, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
