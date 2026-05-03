"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, ArrowRight, CheckCircle, Clock, FileText } from "lucide-react";
import { getSessionToken } from "@/lib/utils/browser-session";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

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
  const [consent, setConsent] = useState(false);
  const [ipData, setIpData] = useState<IPData | null>(null);
  const [sessionToken, setSessionToken] = useState("");
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
    setSessionToken(getSessionToken());

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

    if (!phone.trim()) {
      setError("Please enter your phone number");
      return;
    }

    if (!consent) {
      setError("Please agree to receive our valuation and updates");
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
          email,
          phone: phone || undefined,
          sessionToken,
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
    return websiteUrl.trim() && email.trim() && phone.trim() && consent;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Form Step */}
        {step === "form" && (
          <div className="animate-fadeIn">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">

              {/* Left — what you get */}
              <div className="pt-4">
                <span className="inline-block px-3 py-1.5 bg-primary/10 rounded-full text-xs font-bold text-primary uppercase tracking-wide mb-5">Free · No Signup Required</span>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">Get Your Free Startup Valuation</h1>
                <p className="text-lg text-gray-600 mb-8">Paste your website URL. Our AI reads your public data and returns a pre-money valuation using 4 professional methods — in under 60 seconds.</p>
                <div className="space-y-4 mb-8">
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
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
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
              <div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 md:p-10">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  />
                  <p className="text-xs text-gray-500 mt-1">We'll analyze your public website data</p>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  />
                  <p className="text-xs text-gray-500 mt-1">For valuation report delivery</p>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">For follow-up</p>
                </div>

                {/* Consent Checkbox */}
                <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="w-5 h-5 mt-0.5 border border-gray-300 rounded focus:ring-2 focus:ring-primary cursor-pointer"
                  />
                  <label htmlFor="consent" className="text-sm text-gray-700 cursor-pointer">
                    <span className="font-semibold text-gray-900">I agree to receive my valuation results via email</span>
                    <p className="text-xs text-gray-600 mt-1">We'll send you your valuation and relevant product updates. You can unsubscribe anytime.</p>
                  </label>
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
                      ? "bg-primary hover:bg-primary/90 text-white cursor-pointer"
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
            <div className="inline-block">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-6" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Analyzing your startup...</h2>
            <div className="space-y-2 text-gray-600 mb-8">
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

            {/* Free vs Pro Explanation */}
            <div className="max-w-2xl mx-auto bg-blue-50 border border-blue-200 rounded-xl p-6 text-sm">
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
                    <li>✓ Real public records data</li>
                    <li>✓ Crunchbase funding rounds</li>
                    <li>✓ MCA filings (Indian cos)</li>
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
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
                {result.companyName}
              </h1>
              <div className="flex items-center justify-center gap-2">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-700 capitalize">
                  {result.industry}
                </span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-700 capitalize">
                  {result.stage}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 md:p-10 space-y-10">
              {/* Main Valuation */}
              <div className="text-center pb-8 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Pre-Money Valuation Estimate
                </p>
                <div className="text-3xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-4">
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
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
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
                    <div className="text-right">
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
                <div className={`border-2 rounded-xl p-6 ${
                  result.publicValuation.comparison.match === "aligned"
                    ? "border-green-300 bg-green-50"
                    : result.publicValuation.comparison.match === "conservative"
                    ? "border-blue-300 bg-blue-50"
                    : "border-orange-300 bg-orange-50"
                }`}>
                  <div className="flex items-start justify-between mb-3">
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
                    <div className="text-right">
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
                <p className="font-semibold mb-2">⚠️ Free Estimate vs Real Valuation</p>
                <div className="space-y-2 text-xs">
                  <p>
                    <span className="font-semibold">This Free Estimate:</span> Uses only website extraction + basic assumptions. Good starting point, NOT from public records.
                  </p>
                  <p>
                    <span className="font-semibold text-primary">Pro Subscription:</span> Uses REAL public records (Crunchbase funding rounds, MCA filings, latest news). 6 methods + accurate at ANY startup stage. Suitable for investor meetings.
                  </p>
                  <p className="italic border-t border-blue-200 pt-2 mt-2">
                    Free: 4 methods with basic data. Pro: 6 methods with real verified data from public sources. Accuracy matters when raising capital.
                  </p>
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
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fadeIn">
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
                        <span><span className="font-semibold">REAL PUBLIC RECORDS DATA</span> - Crunchbase, MCA filings</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">✓</span>
                        <span>6-method detailed analysis - accurate at ANY stage</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">✓</span>
                        <span>Professional investor-ready PDF report</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">✓</span>
                        <span>No watermark - branded for your board & investors</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 font-bold">→</span>
                        <span className="text-red-600"><span className="font-semibold">Free estimate ≠ Real valuation</span> - Upgrade now</span>
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
