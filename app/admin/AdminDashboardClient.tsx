"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Filter, Mail, Phone, Globe, MapPin, Calendar, TrendingUp, RefreshCw } from "lucide-react";

interface Lead {
  id: string;
  email: string;
  phone?: string;
  website_url?: string;
  company_name?: string;
  country?: string;
  city?: string;
  isp?: string;
  ip_address?: string;
  valuation_range?: string;
  created_at: string;
}

interface AdminDashboardClientProps {
  initialLeads: Lead[];
}

export default function AdminDashboardClient({
  initialLeads,
}: AdminDashboardClientProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string>(new Date().toLocaleTimeString());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "email">("newest");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Fetch leads from API
  const refreshLeads = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/leads");
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
        setLastRefresh(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error("Error refreshing leads:", error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshLeads, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    let filteredData = [...leads];

    // Search filter
    if (searchTerm) {
      filteredData = filteredData.filter(
        (lead) =>
          lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.website_url?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Country filter
    if (filterCountry) {
      filteredData = filteredData.filter((lead) => lead.country === filterCountry);
    }

    // Sort
    filteredData.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "email":
          return a.email.localeCompare(b.email);
        default:
          return 0;
      }
    });

    return filteredData;
  }, [leads, searchTerm, filterCountry, sortBy]);

  // Get unique countries
  const countries = useMemo(() => {
    return [...new Set(leads.map((lead) => lead.country).filter(Boolean))].sort();
  }, [leads]);

  // Stats
  const stats = {
    total: leads.length,
    today: leads.filter((lead) => {
      const leadDate = new Date(lead.created_at);
      const today = new Date();
      return (
        leadDate.toDateString() === today.toDateString()
      );
    }).length,
    countries: countries.length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <p className="text-neutral-600 text-sm">Total Leads</p>
          <p className="text-3xl font-bold text-neutral-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <p className="text-neutral-600 text-sm">Leads Today</p>
          <p className="text-3xl font-bold text-neutral-900">{stats.today}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <p className="text-neutral-600 text-sm">Countries</p>
          <p className="text-3xl font-bold text-neutral-900">{stats.countries}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900">Filters & Search</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">Last refresh: {lastRefresh}</span>
            <button
              onClick={refreshLeads}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold text-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search email, company, website..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* Country Filter */}
          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="">All Countries</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="email">Email (A-Z)</option>
          </select>

          {/* Results */}
          <div className="flex items-center justify-end text-sm text-neutral-600 font-semibold">
            {filteredLeads.length} of {initialLeads.length} leads
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-neutral-900 font-semibold">Email</th>
                <th className="px-6 py-3 text-left text-neutral-900 font-semibold">Company</th>
                <th className="px-6 py-3 text-left text-neutral-900 font-semibold">Website</th>
                <th className="px-6 py-3 text-left text-neutral-900 font-semibold">Phone</th>
                <th className="px-6 py-3 text-left text-neutral-900 font-semibold">Location</th>
                <th className="px-6 py-3 text-left text-neutral-900 font-semibold">Date</th>
                <th className="px-6 py-3 text-center text-neutral-900 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-neutral-500">
                    No leads found
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-neutral-200 hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-neutral-400" />
                        <a
                          href={`mailto:${lead.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {lead.email}
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-neutral-900 font-medium">
                      {lead.company_name || "-"}
                    </td>
                    <td className="px-6 py-3">
                      {lead.website_url ? (
                        <a
                          href={lead.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Globe className="w-4 h-4" />
                          Visit
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone}`}
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-4 h-4" />
                          {lead.phone}
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1 text-neutral-600">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {lead.city && lead.country
                            ? `${lead.city}, ${lead.country}`
                            : lead.country || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1 text-neutral-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs font-semibold"
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

      {/* Lead Details Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-neutral-900">Lead Details</h2>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-neutral-900">Contact Info</h3>
                  <div>
                    <p className="text-xs text-neutral-500">Email</p>
                    <a
                      href={`mailto:${selectedLead.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {selectedLead.email}
                    </a>
                  </div>
                  {selectedLead.phone && (
                    <div>
                      <p className="text-xs text-neutral-500">Phone</p>
                      <a
                        href={`tel:${selectedLead.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {selectedLead.phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Company Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-neutral-900">Company Info</h3>
                  {selectedLead.company_name && (
                    <div>
                      <p className="text-xs text-neutral-500">Company Name</p>
                      <p className="text-neutral-900 font-medium">
                        {selectedLead.company_name}
                      </p>
                    </div>
                  )}
                  {selectedLead.website_url && (
                    <div>
                      <p className="text-xs text-neutral-500">Website</p>
                      <a
                        href={selectedLead.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {selectedLead.website_url}
                      </a>
                    </div>
                  )}
                </div>

                {/* Location Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-neutral-900">Location</h3>
                  <div>
                    <p className="text-xs text-neutral-500">Country</p>
                    <p className="text-neutral-900 font-medium">
                      {selectedLead.country || "-"}
                    </p>
                  </div>
                  {selectedLead.city && (
                    <div>
                      <p className="text-xs text-neutral-500">City</p>
                      <p className="text-neutral-900 font-medium">{selectedLead.city}</p>
                    </div>
                  )}
                </div>

                {/* ISP Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-neutral-900">ISP Info</h3>
                  {selectedLead.isp && (
                    <div>
                      <p className="text-xs text-neutral-500">ISP</p>
                      <p className="text-neutral-900 font-medium">{selectedLead.isp}</p>
                    </div>
                  )}
                  {selectedLead.ip_address && (
                    <div>
                      <p className="text-xs text-neutral-500">IP Address</p>
                      <p className="text-neutral-900 font-mono text-sm">
                        {selectedLead.ip_address}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Submitted</span>
                  <span className="text-neutral-900 font-medium">
                    {new Date(selectedLead.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Lead ID</span>
                  <span className="text-neutral-900 font-mono text-xs">{selectedLead.id}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <a
                  href={`mailto:${selectedLead.email}`}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600 transition-colors text-center"
                >
                  Email Lead
                </a>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-900 rounded font-semibold hover:bg-neutral-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
