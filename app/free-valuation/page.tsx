"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, ArrowRight, CheckCircle, Clock, FileText, Code2, Globe } from "lucide-react";
import { getSessionToken } from "@/lib/utils/browser-session";
import { trackFreeValuationSubmitted } from "@/lib/analytics/ga4";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SignalAnalysisPanel } from "@/components/SignalAnalysisPanel";
import type { SignalAnalysis } from "@/lib/valuation/signal-analysis";

interface MethodResult {
  name: string;
  value: number | null;
}

interface ValuationResult {
  companyName: string;
  industry: string;
  stage: string;
  valuation: {
    low: number;
    mid: number;
    high: number;
  };
  confidence: {
    score: number;
    label: "low" | "medium" | "high";
    color: string;
    message: string;
    nextSteps: string[];
    fieldsToAdd: string[];
  };
  enrichmentSources?: string[];
  publicValuation?: {
    knownValuation: number;
    source: string;
    date: string;
    comparison: {
      match: "aligned" | "conservative" | "aggressive";
      variance: number;
      recommendation: string;
    };
  };
  methods: {
    scorecard: number | null;
    berkus: number | null;
    dcfLTG: number | null;
    evalDamScore: number | null;
  };
  methodResults?: MethodResult[];
  keyReasons: string[];
  signalAnalysis?: SignalAnalysis;
}

interface IPData {
  ip?: string;
  country?: string;
  city?: string;
  org?: string;
}

export default function FreeValuationPage() {
  const [step, setStep] = useState<"form" | "loading" | "results">("form");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ipData, setIpData] = useState<IPData | null>(null);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [error, setError] = useState("");
  const [rateLimitError, setRateLimitError] = useState<{
    message: string;
    resetsAt: string;
  } | null>(null);
  const [reportCount, setReportCount] = useState<number>(0);

  // Initialize session token on mount
  useEffect(() => {
    // Fetch free report count
    fetch("/api/free-check/stats")
      .then(res => res.json())
      .then(data => setReportCount(data.count || 0))
      .catch(() => setReportCount(0));
  }, []);

  // Show upgrade popup after 5 seconds when results are displayed
  useEffect(() => {
    if (step === "results" && !showUpgradePopup) {
      const timer = setTimeout(() => {
        setShowUpgradePopup(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [step, showUpgradePopup]);

  // Fetch IP data on mount
  const fetchIPData = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      if (res.ok) {
        const data = await res.json();
        setIpData({
          ip: data.ip,
          country: data.country_name,
          city: data.city,
          org: data.org,
        });
      }
    } catch (err) {
      console.warn("Could not fetch IP data:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setRateLimitError(null);

    // Validate inputs
    if (!websiteUrl.trim()) {
      setError("Please enter a website URL");
      return;
    }
    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter your phone number");
      return;
    }

    // Ensure websiteUrl is valid URL
    try {
      new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`);
    } catch {
      setError("Please enter a valid website URL (e.g., example.com)");
      return;
    }

    setStep("loading");

    // Fetch IP data if not already fetched
    if (!ipData) {
      await fetchIPData();
    }

    // Call API
    try {
      const apiUrl = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`;
      const res = await fetch("/api/free-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteUrl: apiUrl,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          sessionToken: getSessionToken(),
          ipData: ipData || undefined,
        }),
      });

      if (res.status === 429) {
        const errorData = await res.json();
        setRateLimitError({
          message: errorData.message,
          resetsAt: errorData.resetsAt,
        });
        setStep("form");
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Valuation failed");
      }

      const data = await res.json();
      setResult(data.data);
      setStep("results");

      // Track free valuation submission in GA4
      trackFreeValuationSubmitted({
        companyName: data.data.companyName,
        industry: data.data.industry,
        stage: data.data.stage,
        valuationMid: data.data.valuation?.mid,
      });
    } catch (err) {
      setError(String(err).replace("Error: ", ""));
      setStep("form");
    }
  };

  const formatValuation = (num: number) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    }
    return `$${(num / 1000).toFixed(0)}K`;
  };

  const isFormValid = () => {
    return Boolean(websiteUrl.trim() && email.trim() && phone.trim());
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_46%,#ffffff_100%)]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        {step === "form" && (
          <div className="mb-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border-2 border-primary bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900">Website URL Valuation</p>
                  <p className="mt-1 text-sm text-gray-500">Best for startups with a website, public positioning, and company-level signals.</p>
                  <span className="mt-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">Current tool</span>
                </div>
              </div>
            </div>

            <Link href="/github-valuation" className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-gray-100 p-2 text-gray-700">
                  <Code2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900">GitHub Repo Valuation</p>
                  <p className="mt-1 text-sm text-gray-500">Best for idea-stage projects, OSS tools, prototypes, AI repos, and devtools.</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary">
                    Open repo tool <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Form Step */}
        {step === "form" && (
          <div className="animate-fadeIn">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-start">

              {/* Left — what you get */}
              <div className="pt-4 lg:pt-10">
                <span className="inline-block px-3 py-1.5 bg-primary/10 rounded-full text-xs font-bold text-primary uppercase tracking-wide mb-5">Free · No Signup Required</span>
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-gray-900 mb-5 leading-tight tracking-tight">Start With a Free Valuation</h1>
                <p className="max-w-xl text-lg text-gray-600 mb-8">Paste your website URL. Our AI reads your public data and returns a pre-money valuation using 4 professional methods — in under 60 seconds.</p>
                <div className="grid gap-3 mb-8 sm:grid-cols-3 lg:grid-cols-1">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">4-Method Blended Estimate</p>
                      <p className="text-sm text-gray-500">Scorecard, Berkus, DCF Long-Term Growth & Evaldam Score</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Instant — Under 60 Seconds</p>
                      <p className="text-sm text-gray-500">No manual inputs. AI extracts your company profile automatically</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Valuation Range + Key Insights</p>
                      <p className="text-sm text-gray-500">Low / mid / high range with the reasoning behind your number</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">What this is NOT</p>
                  <ul className="space-y-1.5 text-sm text-gray-600">
                    <li>✗ Not a certified valuation report</li>
                    <li>✗ Not based on your private financials</li>
                    <li>✗ Not a substitute for investor due diligence</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-3">Use this as a starting point. <Link href="/signup" className="text-primary hover:underline font-semibold">Upgrade for the full 6-method PDF report.</Link></p>
                </div>
                {reportCount > 0 && <p className="text-sm text-gray-500 mt-5">✓ {reportCount.toLocaleString()}+ startups valued with Evaldam</p>}
              </div>

              {/* Right — form */}
              <div className="lg:sticky lg:top-24">
            <div className="bg-white rounded-lg shadow-xl shadow-gray-200/70 border border-gray-200 p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Website URL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Your Website URL <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="example.com or https://example.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  />
                  <p className="text-xs text-gray-500 mt-1">We will analyze your public website data</p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Email <span className="text-primary">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  />
                  <p className="text-xs text-gray-500 mt-1">For your valuation result and follow-up report guidance</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Phone <span className="text-primary">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">For founder support and report follow-up</p>
                </div>

                {/* Error */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Rate Limit Error */}
                {rateLimitError && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-900">
                    <p className="font-semibold mb-2">Daily limit reached</p>
                    <p className="mb-3">{rateLimitError.message}</p>
                    <p className="text-xs text-yellow-700 mb-4">
                      Resets at: {new Date(rateLimitError.resetsAt).toLocaleTimeString()} UTC
                    </p>
                    <Link href="/signup" className="inline-block px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold rounded transition">
                      Sign up for unlimited checks
                    </Link>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!isFormValid()}
                  className={`w-full px-6 py-3.5 font-bold rounded-lg transition-all flex items-center justify-center gap-2 mt-8 ${
                    isFormValid()
                      ? "bg-primary hover:bg-primary/90 text-white cursor-pointer shadow-lg shadow-primary/20 hover:-translate-y-0.5"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Get My Free Valuation
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-xs text-gray-500 text-center">
                  🔒 Your data is secure and never shared. See our{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    privacy policy
                  </Link>
                </p>
              </form>
            </div>
              </div>{/* /right col */}
            </div>{/* /grid */}
          </div>
        )}

        {/* Loading Step */}
        {step === "loading" && (
          <div className="text-center py-10 md:py-20 animate-fadeIn">
            <div className="inline-block rounded-lg border border-gray-200 bg-white p-8 shadow-xl shadow-gray-200/70">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-6 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Analyzing your startup...</h2>
              <div className="space-y-2 text-gray-600">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  Fetching website data
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-100" />
                  Extracting company metrics
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-200" />
                  Calculating valuation
                </div>
              </div>
            </div>

            {/* Free vs Pro Explanation */}
            <div className="max-w-2xl mx-auto mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 text-sm shadow-sm">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-lg">📊</span> This Free Estimate
                  </h3>
                  <ul className="space-y-2 text-gray-700 text-xs">
                    <li>✓ Uses website extraction only</li>
                    <li>✓ Basic assumptions about metrics</li>
                    <li>✓ 4-method blend (limited data)</li>
                    <li>✓ Good starting point</li>
                    <li className="text-red-600 font-semibold">⚠ Not from public records</li>
                  </ul>
                </div>
                <div className="text-left bg-white rounded-lg p-4">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-lg">🔒</span> Pro Subscription
                  </h3>
                  <ul className="space-y-2 text-gray-700 text-xs">
                    <li>✓ Saved inputs and evidence trail</li>
                    <li>✓ Comparable-company context</li>
                    <li>✓ Founder-provided assumptions</li>
                    <li>✓ 6-method detailed analysis</li>
                    <li className="text-primary font-semibold">✓ ACCURATE at any stage</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Step */}
        {step === "results" && result && (
          <div className="animate-fadeIn">
            {/* Success Header */}
            <div className="text-center mb-10">
              <div className="inline-block px-3 py-1.5 bg-green-100 rounded-full text-xs font-bold text-green-700 uppercase tracking-wide mb-4">
                ✓ Valuation Complete
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 break-words">
                {result.companyName}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-700 capitalize">
                  {result.industry}
                </span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-700 capitalize">
                  {result.stage}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-xl shadow-gray-200/70 border border-gray-200 p-6 md:p-10 space-y-10">
              {/* Main Valuation */}
              <div className="text-center pb-8 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Pre-Money Valuation Estimate
                </p>
                <div className="text-3xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-4 break-words">
                  {formatValuation(result.valuation.low)} — {formatValuation(result.valuation.high)}
                </div>
                <p className="text-xl font-bold text-primary mb-6">
                  Mid-point: {formatValuation(result.valuation.mid)}
                </p>

                {/* Range Bar */}
                <div className="bg-gray-100 rounded-full h-3 overflow-hidden mb-4">
                  <div
                    className="h-full bg-gradient-to-r from-primary via-purple-500 to-primary"
                    style={{
                      width: "100%",
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600 px-1">
                  <span>Low Range</span>
                  <span>Mid-point</span>
                  <span>High Range</span>
                </div>
              </div>

              {/* Confidence Score Section */}
              {result.confidence && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
                    <div>
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                        Valuation Confidence
                      </p>
                      <p className={`text-lg font-bold ${
                        result.confidence.label === "high"
                          ? "text-green-700"
                          : result.confidence.label === "medium"
                          ? "text-amber-700"
                          : "text-red-700"
                      }`}>
                        {result.confidence.message}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <div className="text-4xl font-black text-gray-900">
                        {result.confidence.score}%
                      </div>
                      <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        result.confidence.label === "high"
                          ? "bg-green-100 text-green-700"
                          : result.confidence.label === "medium"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {result.confidence.label} confidence
                      </span>
                    </div>
                  </div>

                  {/* Confidence Bar */}
                  <div className="bg-gray-200 rounded-full h-3 overflow-hidden mb-4">
                    <div
                      className={`h-full transition-all ${
                        result.confidence.label === "high"
                          ? "bg-green-500"
                          : result.confidence.label === "medium"
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${result.confidence.score}%` }}
                    />
                  </div>

                  {/* Enrichment Sources */}
                  {result.enrichmentSources && result.enrichmentSources.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        📊 Data enriched from: {result.enrichmentSources.join(", ")}
                      </p>
                    </div>
                  )}

                  {/* Next Steps */}
                  {result.confidence.label !== "high" && result.confidence.nextSteps.length > 0 && (
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
                        To improve confidence:
                      </p>
                      <ul className="space-y-2">
                        {result.confidence.nextSteps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-primary font-bold mt-0.5">→</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.confidence.label === "high" && (
                    <div className="text-sm text-green-700 font-semibold">
                      ✓ Excellent data quality - Your valuation is well-supported by available metrics
                    </div>
                  )}
                </div>
              )}

              {/* Public Valuation Comparison */}
              {result.publicValuation && (
                <div className={`border-2 rounded-lg p-6 ${
                  result.publicValuation.comparison.match === "aligned"
                    ? "border-green-300 bg-green-50"
                    : result.publicValuation.comparison.match === "conservative"
                    ? "border-blue-300 bg-blue-50"
                    : "border-orange-300 bg-orange-50"
                }`}>
                  <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">
                        📊 Comparison with Public Market Data
                      </p>
                      <p className={`text-lg font-bold ${
                        result.publicValuation.comparison.match === "aligned"
                          ? "text-green-700"
                          : result.publicValuation.comparison.match === "conservative"
                          ? "text-blue-700"
                          : "text-orange-700"
                      }`}>
                        Last known valuation: ${(result.publicValuation.knownValuation / 1000000000).toFixed(1)}B
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-xs text-gray-600 mb-1">Source & Date</p>
                      <p className="text-sm font-semibold text-gray-900">{result.publicValuation.source}</p>
                      <p className="text-xs text-gray-500">{new Date(result.publicValuation.date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg text-sm ${
                    result.publicValuation.comparison.match === "aligned"
                      ? "bg-white border border-green-200"
                      : result.publicValuation.comparison.match === "conservative"
                      ? "bg-white border border-blue-200"
                      : "bg-white border border-orange-200"
                  }`}>
                    <p className="font-semibold text-gray-900 mb-2">
                      {result.publicValuation.comparison.match === "aligned"
                        ? "✓ Aligned"
                        : result.publicValuation.comparison.match === "conservative"
                        ? "→ Conservative"
                        : "↑ Aggressive"}
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      {result.publicValuation.comparison.recommendation}
                    </p>
                  </div>
                </div>
              )}

              {/* Method Breakdown - 4 Methods */}
              {(result.methods.scorecard || result.methods.berkus || result.methods.dcfLTG || result.methods.evalDamScore) && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-6">
                    Valuation Methods (4 Approaches)
                  </h3>
                  <div className="space-y-5">
                    {result.methods.scorecard && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-gray-700">Scorecard Method</span>
                          <span className="text-sm font-bold text-gray-900">
                            {formatValuation(result.methods.scorecard)}
                          </span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-cyan-500"
                            style={{
                              width: `${Math.min(
                                100,
                                (result.methods.scorecard / result.valuation.high) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {result.methods.berkus && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-gray-700">Berkus Method</span>
                          <span className="text-sm font-bold text-gray-900">
                            {formatValuation(result.methods.berkus)}
                          </span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-sky-500"
                            style={{
                              width: `${Math.min(
                                100,
                                (result.methods.berkus / result.valuation.high) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {result.methods.dcfLTG && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-gray-700">DCF Long-Term Growth</span>
                          <span className="text-sm font-bold text-gray-900">
                            {formatValuation(result.methods.dcfLTG)}
                          </span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-indigo-500"
                            style={{
                              width: `${Math.min(
                                100,
                                (result.methods.dcfLTG / result.valuation.high) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {result.methods.evalDamScore && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-gray-700">Evaldam Score</span>
                          <span className="text-sm font-bold text-gray-900">
                            {formatValuation(result.methods.evalDamScore)}
                          </span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-violet-500"
                            style={{
                              width: `${Math.min(
                                100,
                                (result.methods.evalDamScore / result.valuation.high) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
                    Blended average of 4 independent approaches for a balanced, comprehensive valuation estimate
                  </p>
                </div>
              )}

              <SignalAnalysisPanel analysis={result.signalAnalysis} />

              {/* Key Reasons */}
              {result.keyReasons.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
                    Key Insights
                  </h3>
                  <ul className="space-y-3">
                    {result.keyReasons.map((reason, idx) => (
                      <li key={idx} className="flex gap-3 items-start">
                        <span className="text-primary font-bold mt-1">→</span>
                        <span className="text-gray-700 text-sm leading-relaxed">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disclaimer */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-900">
                <p className="font-semibold mb-1">About This Valuation</p>
                <p>
                  This estimate uses 4 professional valuation methods (Scorecard, Berkus, DCF Long-Term Growth, Evaldam Score) with equal weighting. Upgrade for stage-optimized analysis with 2 additional methods (VC Method & DCF Exit Multiples) and detailed insights.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-gray-500 mb-3">Free preview</p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>Website-only extraction</li>
                    <li>4-method directional range</li>
                    <li>Limited confidence and key insights</li>
                    <li>No saved evidence trail or PDF</li>
                  </ul>
                </div>
                <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-primary mb-3">Full report</p>
                  <ul className="space-y-2 text-sm text-gray-800">
                    <li>6-method valuation with stage-aware weights</li>
                    <li>Founder inputs, proof checklist, and assumptions trail</li>
                    <li>Scenarios, sensitivity, comparables, and PDF export</li>
                    <li>Optional professional review status</li>
                  </ul>
                </div>
              </div>

              {/* CTA */}
              <div className="pt-4 border-t border-gray-100">
                <Link href="/signup">
                  <button className="w-full px-6 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2">
                    Get Full 6-Method Report
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
                <p className="text-xs text-gray-500 text-center mt-3">
                  Sign up free to unlock detailed insights, investor reports, and more
                </p>
              </div>
            </div>

            {/* Upgrade Popup - Shows after 5 seconds */}
            {showUpgradePopup && (
              <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8 animate-fadeIn">
                  <div className="mb-6 text-center">
                    <div className="inline-block px-3 py-1.5 bg-primary/10 rounded-full mb-4">
                      <span className="text-xs font-bold text-primary uppercase tracking-wide">
                        Ready to Share?
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">
                      Generate Professional Report
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Share your valuation with investors and secure funding
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-lg p-4 mb-6">
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">✓</span>
                        <span>Professional investor-ready PDF report</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">✓</span>
                        <span>6-method detailed valuation analysis</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">✓</span>
                        <span>Share with your board & investors</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">✓</span>
                        <span>Watermark-free paid reports</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <Link href="/signup">
                      <button className="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-all text-center text-sm">
                        Upgrade & Generate Report
                      </button>
                    </Link>
                    <button
                      onClick={() => setShowUpgradePopup(false)}
                      className="w-full px-6 py-2 text-gray-600 hover:text-gray-900 font-semibold text-sm transition"
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <section className="border-t border-gray-100 bg-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <span className="inline-block px-3 py-1.5 bg-primary/10 rounded-full text-xs font-bold text-primary uppercase tracking-wide mb-5">
                Also Free
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-tight">
                GitHub repo to idea-stage valuation
              </h2>
              <p className="max-w-xl text-base text-gray-600 mb-6">
                For projects that are not companies yet, Evaldam uses the repo as evidence of execution, product maturity, market pull, and startup potential.
              </p>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {[
                  "Estimates a pre-money valuation if the repo became a startup today",
                  "Uses GitHub signals plus Berkus and Scorecard-style early-stage logic",
                  "Shows investor risks and milestones that would increase valuation",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-xl shadow-gray-200/70 border border-gray-200 p-6 md:p-8">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 mb-5">
                <p className="text-xs font-black uppercase tracking-wide text-gray-500 mb-3">Repo Tool</p>
                <div className="text-3xl font-black text-gray-900">GitHub → Startup Value</div>
                <p className="text-sm text-gray-600 mt-3">
                  Open the repo valuation page to enter your GitHub URL and optional startup assumptions.
                </p>
              </div>
              <Link href="/github-valuation">
                <button className="w-full px-6 py-3.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2">
                  Open GitHub Repo Valuation
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
        .delay-100 {
          animation-delay: 100ms;
        }
        .delay-200 {
          animation-delay: 200ms;
        }
      `}</style>
    </div>
  );
}
