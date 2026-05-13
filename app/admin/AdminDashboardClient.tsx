"use client";

import { useMemo, useState } from "react";
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

const isUrl = (value?: string | null) => Boolean(value && /^https?:\/\//i.test(value));

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

      return [
        lead.email,
        lead.fullName,
        lead.phone,
        lead.companyName,
        lead.websiteUrl,
        lead.useCase,
        lead.plan,
        lead.sourceLabel,
        lead.country,
        lead.city,
        lead.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });

    filtered.sort((a, b) => {
      if (sortBy === "email") return a.email.localeCompare(b.email);
      const left = new Date(a.createdAt).getTime();
      const right = new Date(b.createdAt).getTime();
      return sortBy === "oldest" ? left - right : right - left;
    });

    return filtered;
  }, [leads, searchTerm, sourceFilter, sortBy]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const checkout = leads.filter((lead) => lead.source === "checkout").length;
    const freeValuations = leads.filter((lead) => lead.source === "free_valuation").length;
    const accounts = leads.filter((lead) => lead.source === "account_signup").length;
    const todayCount = leads.filter((lead) => new Date(lead.createdAt).toDateString() === today).length;

    return {
      total: leads.length,
      today: todayCount,
      checkout,
      freeValuations,
      accounts,
    };
  }, [leads]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
        <span className="font-semibold text-gray-900">Admin access:</span> {adminEmail}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        {[
          { label: "All records", value: stats.total, Icon: Database, tone: "border-blue-500" },
          { label: "Captured today", value: stats.today, Icon: Calendar, tone: "border-green-500" },
          { label: "Checkout requests", value: stats.checkout, Icon: TrendingUp, tone: "border-purple-500" },
          { label: "Free valuations", value: stats.freeValuations, Icon: Globe, tone: "border-cyan-500" },
          { label: "Account signups", value: stats.accounts, Icon: UserRound, tone: "border-amber-500" },
        ].map(({ label, value, Icon, tone }) => (
          <div key={label} className={`rounded-lg border-l-4 ${tone} bg-white p-5 shadow-sm`}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p>
              <Icon className="h-4 w-4 text-gray-300" />
            </div>
            <p className="text-2xl font-black text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Data Sources</h2>
            <p className="text-sm text-gray-500">Each source is fetched with service-role access after email verification.</p>
          </div>
          <button
            onClick={refreshLeads}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {sourceStatus.map((source) => (
            <div key={source.key} className="rounded-md border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{source.label}</p>
              <p className="mt-1 text-xl font-black text-gray-900">{source.count}</p>
              {source.error && <p className="mt-1 text-xs text-red-600">{source.error}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
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
                placeholder="Search email, phone, company, plan, source..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <select
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">All sources</option>
                {sources.map(([source, label]) => (
                  <option key={source} value={source}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as "newest" | "oldest" | "email")}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="email">Email A-Z</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
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
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No lead records found.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
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
                          <a
                            href={lead.websiteUrl || undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 flex items-center gap-1 text-xs text-blue-700 hover:underline"
                          >
                            <Globe className="h-3.5 w-3.5" />
                            Website
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-[230px] truncate text-gray-700">{lead.useCase || "-"}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <p>{lead.plan || "-"}</p>
                      {(lead.billingCycle || lead.currency) && (
                        <p className="text-xs text-gray-500">
                          {[lead.billingCycle, lead.currency].filter(Boolean).join(" / ")}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {lead.valuationMid !== null ? (
                        <div>
                          <p className="font-bold text-gray-900">{money(lead.valuationMid)}</p>
                          <p className="text-xs text-gray-500">
                            {money(lead.valuationLow)} - {money(lead.valuationHigh)}
                          </p>
                        </div>
                      ) : (
                        "-"
                      )}
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
                        className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
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

      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="border-b border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                    {selectedLead.sourceLabel}
                  </p>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedLead.companyName || selectedLead.email}</h2>
                  <p className="text-sm text-gray-500">{formatDate(selectedLead.createdAt)}</p>
                </div>
                <button onClick={() => setSelectedLead(null)} className="rounded-md px-3 py-1.5 text-gray-500 hover:bg-gray-100">
                  Close
                </button>
              </div>
            </div>

            <div className="grid gap-5 p-5 md:grid-cols-2">
              <section className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-bold text-gray-900">
                  <Mail className="h-4 w-4" /> Contact
                </h3>
                <dl className="space-y-2 text-sm">
                  <div><dt className="text-gray-500">Email</dt><dd className="font-medium text-gray-900">{selectedLead.email || "-"}</dd></div>
                  <div><dt className="text-gray-500">Full name</dt><dd className="font-medium text-gray-900">{selectedLead.fullName || "-"}</dd></div>
                  <div><dt className="text-gray-500">Phone</dt><dd className="font-medium text-gray-900">{selectedLead.phone || "-"}</dd></div>
                  <div><dt className="text-gray-500">IP</dt><dd className="font-medium text-gray-900">{selectedLead.ipAddress || "-"}</dd></div>
                </dl>
              </section>

              <section className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-bold text-gray-900">
                  <Building2 className="h-4 w-4" /> Company And Intent
                </h3>
                <dl className="space-y-2 text-sm">
                  <div><dt className="text-gray-500">Company</dt><dd className="font-medium text-gray-900">{selectedLead.companyName || "-"}</dd></div>
                  <div><dt className="text-gray-500">Website</dt><dd className="break-all font-medium text-gray-900">{selectedLead.websiteUrl || "-"}</dd></div>
                  <div><dt className="text-gray-500">Use case</dt><dd className="font-medium text-gray-900">{selectedLead.useCase || "-"}</dd></div>
                  <div><dt className="text-gray-500">Plan</dt><dd className="font-medium text-gray-900">{selectedLead.plan || "-"}</dd></div>
                </dl>
              </section>

              <section className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-bold text-gray-900">
                  <TrendingUp className="h-4 w-4" /> Valuation
                </h3>
                <dl className="space-y-2 text-sm">
                  <div><dt className="text-gray-500">Low</dt><dd className="font-medium text-gray-900">{money(selectedLead.valuationLow)}</dd></div>
                  <div><dt className="text-gray-500">Mid</dt><dd className="font-medium text-gray-900">{money(selectedLead.valuationMid)}</dd></div>
                  <div><dt className="text-gray-500">High</dt><dd className="font-medium text-gray-900">{money(selectedLead.valuationHigh)}</dd></div>
                </dl>
              </section>

              <section className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-bold text-gray-900">
                  <MapPin className="h-4 w-4" /> Location And Status
                </h3>
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
              <pre className="max-h-80 overflow-auto rounded-lg bg-gray-950 p-4 text-xs text-gray-100">
                {JSON.stringify(selectedLead.raw, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
