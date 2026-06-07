"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronRight, ArrowRight, CheckCircle, Code2, Globe, ShieldCheck } from "lucide-react";
import { getSessionToken } from "@/lib/utils/browser-session";
import { trackFreeValuationSubmitted } from "@/lib/analytics/ga4";
import { getLeadAttribution } from "@/lib/leads/client-attribution";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SignalAnalysisPanel } from "@/components/SignalAnalysisPanel";
import type { SignalAnalysis } from "@/lib/valuation/signal-analysis";
import { writeStartupProfilePrefill } from "@/lib/startup-profile-prefill";

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

const pageUrl = "https://equidamai.com/free-valuation";

const freeValuationFaqs = [
  {
    question: "Is this a final startup valuation report?",
    answer:
      "No. The free calculator creates a directional valuation from public website signals. A professional report needs complete startup details, assumptions, valuation methods, and report context after account setup.",
  },
  {
    question: "Why does the free calculator show low, midpoint, and high values?",
    answer:
      "Startup valuation depends on stage, market, traction, team, revenue, assumptions, and investor risk. Low, midpoint, and high values are more honest than a single number when the tool only has public website data.",
  },
  {
    question: "What improves valuation accuracy after signup?",
    answer:
      "Accuracy improves when founders add complete startup details such as revenue, growth, burn, runway, market, team, funding history, assumptions, and proof documents.",
  },
  {
    question: "Can I share the free valuation with investors?",
    answer:
      "Use the free valuation as a starting point for internal thinking. For investor or advisor sharing, create a full valuation report with complete inputs, assumptions, comparables, and PDF output.",
  },
  {
    question: "How is the full Evaldam report different?",
    answer:
      "The full workflow uses more complete founder inputs, a 6-method valuation, assumptions trail, scenario analysis, comparables, report history, and a professional PDF report.",
  },
];

const freeValuationSoftwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": `${pageUrl}#calculator`,
  name: "Startup Valuation Calculator",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: pageUrl,
  publisher: { "@id": "https://equidamai.com/#organization" },
  description:
    "Free startup valuation calculator that uses public website signals to generate a directional pre-money valuation before founders create a full valuation report.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Directional startup valuation",
    "Public website signal extraction",
    "Scorecard, Berkus, DCF Long-Term Growth, and website signal scoring",
    "Confidence notes and next-step guidance",
    "Account path for complete startup details and professional valuation reports",
  ],
};

const freeValuationFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: freeValuationFaqs.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

const jsonLd = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");

export default function FreeValuationPage() {
  const [step, setStep] = useState<"form" | "loading" | "results">("form");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [ipData, setIpData] = useState<IPData | null>(null);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [error, setError] = useState("");
  const [rateLimitError, setRateLimitError] = useState<{
    message: string;
    resetsAt: string;
  } | null>(null);
  const [reportCount, setReportCount] = useState<number>(0);
  const hasHandledPrefill = useRef(false);

  // Initialize session token on mount
  useEffect(() => {
    // Fetch free report count
    fetch("/api/free-check/stats")
      .then(res => res.json())
      .then(data => setReportCount(data.count || 0))
      .catch(() => setReportCount(0));
  }, []);

  useEffect(() => {
    if (hasHandledPrefill.current || typeof window === "undefined") return;
    hasHandledPrefill.current = true;

    const params = new URLSearchParams(window.location.search);
    const incomingWebsiteUrl = params.get("websiteUrl") || "";
    const incomingEmail = params.get("email") || "";
    const incomingPhone = params.get("phone") || "";
    const incomingConsent = params.get("consent") === "1";
    const shouldAutostart = params.get("autostart") === "1" && params.get("source") === "homepage";

    if (!incomingWebsiteUrl && !incomingEmail && !incomingPhone) return;

    setWebsiteUrl(incomingWebsiteUrl);
    setEmail(incomingEmail);
    setPhone(incomingPhone);
    setConsent(incomingConsent);

    if (shouldAutostart && incomingWebsiteUrl && incomingEmail && incomingPhone && incomingConsent) {
      void runValuation({
        websiteUrl: incomingWebsiteUrl,
        email: incomingEmail,
        phone: incomingPhone,
        consent: incomingConsent,
      });
    }
  }, []);

  useEffect(() => {
    if (step !== "results" || !result) return;
    setShowUpgradePopup(false);
    const timeout = window.setTimeout(() => setShowUpgradePopup(true), 5000);
    return () => window.clearTimeout(timeout);
  }, [step, result]);

  // Fetch IP data on mount
  const fetchIPData = async (): Promise<IPData | null> => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      if (res.ok) {
        const data = await res.json();
        const nextIpData = {
          ip: data.ip,
          country: data.country_name,
          city: data.city,
          org: data.org,
        };
        setIpData(nextIpData);
        return nextIpData;
      }
    } catch (err) {
      console.warn("Could not fetch IP data:", err);
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runValuation({ websiteUrl, email, phone, consent });
  };

  const runValuation = async (input: { websiteUrl: string; email: string; phone: string; consent: boolean }) => {
    setError("");
    setRateLimitError(null);

    // Validate inputs
    if (!input.websiteUrl.trim()) {
      setError("Please enter a website URL");
      return;
    }
    if (!input.email.trim()) {
      setError("Please enter an email address");
      return;
    }
    if (input.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
      setError("Please enter a valid email address");
      return;
    }
    if (!input.phone.trim()) {
      setError("Please enter your phone number");
      return;
    }
    if (!input.consent) {
      setError("Please confirm we can send your valuation result and follow-up guidance");
      return;
    }

    // Ensure websiteUrl is valid URL
    let apiUrl = "";
    try {
      apiUrl = input.websiteUrl.startsWith("http") ? input.websiteUrl : `https://${input.websiteUrl}`;
      new URL(apiUrl);
    } catch {
      setError("Please enter a valid website URL (e.g., example.com)");
      return;
    }

    setStep("loading");
    setShowUpgradePopup(false);

    // Fetch IP data if not already fetched
    let nextIpData = ipData;
    if (!ipData) {
      nextIpData = await fetchIPData();
    }

    // Call API
    try {
      const res = await fetch("/api/free-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteUrl: apiUrl,
          email: input.email.trim() || undefined,
          phone: input.phone.trim() || undefined,
          sessionToken: getSessionToken(),
          ipData: nextIpData || undefined,
          attribution: getLeadAttribution(),
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
      writeStartupProfilePrefill({
        companyName: data.data.companyName,
        websiteUrl: apiUrl,
        industry: data.data.industry,
        stage: data.data.stage,
        source: "free_valuation",
      });
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
    return Boolean(websiteUrl.trim() && email.trim() && phone.trim() && consent);
  };

  return (
    <div className="public-page min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_48%,#ffffff_100%)] text-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(freeValuationSoftwareJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(freeValuationFaqJsonLd) }} />
      <Navbar />

      <main>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        {step === "form" && (
          <div className="mb-8 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/[0.055] px-3 py-2">
                <div className="text-primary">
                  <Globe className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold text-gray-900">Website URL Valuation</span>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-primary">Current tool</span>
            </div>

            <Link href="/github-valuation" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50 hover:text-primary">
                <div>
                  <Code2 className="h-5 w-5" />
                </div>
                GitHub Repo Valuation
                <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* Form Step */}
        {step === "form" && (
          <div className="animate-fadeIn">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_430px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_470px] items-start">

              {/* Left — what you get */}
              <div className="pt-1 lg:pt-6">
                <span className="inline-block px-3 py-1.5 border border-primary/20 bg-white rounded-full text-xs font-bold text-primary uppercase tracking-wide mb-4">Free pre-money valuation</span>
                <h1 className="max-w-3xl text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 leading-[1.04] tracking-tight">Startup valuation calculator from your website</h1>
                <p className="max-w-2xl text-lg md:text-xl text-gray-600 mb-6 leading-relaxed">Paste your website URL and get a directional valuation for investor calls, SAFE cap discussions, or your next fundraising memo.</p>
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">What this free estimate includes</p>
                  <ul className="grid grid-cols-1 gap-2 text-sm text-gray-700 sm:grid-cols-2 lg:grid-cols-3">
                    <li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Website-based signal extraction</li>
                    <li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Low, midpoint, and high pre-money valuation</li>
                    <li className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Confidence notes and key insights</li>
                  </ul>
                  <p className="text-xs text-gray-600 mt-3">Use this as a starting valuation. <Link href="/signup" className="font-semibold text-primary underline underline-offset-2">Create an account to add assumptions, comparables, and PDF export.</Link></p>
                  <p className="text-xs text-gray-600 mt-2">
                    Need market context first? <Link href="/startup-valuation-benchmarks" className="font-semibold text-primary underline underline-offset-2">See how startup valuation benchmarks work.</Link>
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    ["1", "Public signals", "Website, positioning, and available traction clues."],
                    ["2", "Valuation first", "Low, midpoint, and high estimates instead of a false exact number."],
                    ["3", "Full report path", "Add full startup inputs after signup for a professional report."],
                  ].map(([number, title, text]) => (
                    <div key={title} className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">{number}</div>
                      <p className="text-sm font-bold text-gray-900">{title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-gray-500">{text}</p>
                    </div>
                  ))}
                </div>
                {reportCount > 0 && <p className="text-sm text-gray-500 mt-5">Trusted by {reportCount.toLocaleString()}+ startup valuation checks on Evaldam AI</p>}
              </div>

              {/* Right — form */}
              <div className="sm:sticky sm:top-16 lg:top-24">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl shadow-gray-200/70">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 md:px-8">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">Calculator</p>
                <p className="mt-1 text-lg font-bold text-gray-900">Get your free valuation</p>
                <p className="mt-1 text-sm text-gray-500">Website, email, phone, then your result.</p>
                <p className="mt-2 text-xs font-semibold text-primary">No account required for the first valuation.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5 p-6 md:p-8">
                {/* Website URL */}
                <div>
                  <label htmlFor="free-website-url" className="block text-sm font-semibold text-gray-900 mb-2">
                    Your Website URL <span className="text-primary">*</span>
                  </label>
                  <input
                    id="free-website-url"
                    type="text"
                    placeholder="example.com or https://example.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    autoComplete="url"
                  />
                  <p className="text-xs text-gray-500 mt-1">We analyze public website signals to estimate a directional valuation.</p>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="free-email" className="block text-sm font-semibold text-gray-900 mb-2">
                    Email <span className="text-primary">*</span>
                  </label>
                  <input
                    id="free-email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    autoComplete="email"
                  />
                  <p className="text-xs text-gray-500 mt-1">For your valuation result and follow-up report guidance</p>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="free-phone" className="block text-sm font-semibold text-gray-900 mb-2">
                    Phone <span className="text-primary">*</span>
                  </label>
                  <input
                    id="free-phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    autoComplete="tel"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">For founder support and report follow-up</p>
                </div>

                <div className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <input
                    id="free-consent"
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded-lg border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="free-consent" className="text-xs leading-relaxed text-gray-600">
                    Send my valuation result and full-report guidance by email or phone. I can opt out anytime.
                  </label>
                </div>

                {/* Error */}
                {error && (
                  <div className="p-4 bg-white border border-red-200 rounded-xl text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Rate Limit Error */}
                {rateLimitError && (
                  <div className="p-4 bg-white border border-yellow-200 rounded-xl text-sm text-yellow-900">
                    <p className="font-semibold mb-2">Daily limit reached</p>
                    <p className="mb-3">{rateLimitError.message}</p>
                    <p className="text-xs text-yellow-700 mb-4">
                      Resets at: {new Date(rateLimitError.resetsAt).toLocaleTimeString()} UTC
                    </p>
                    <Link href="/signup" className="inline-block px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg transition">
                      Sign up for unlimited checks
                    </Link>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!isFormValid()}
                  className={`w-full px-6 py-3.5 font-bold rounded-xl transition-all flex items-center justify-center gap-2 mt-8 ${
                    isFormValid()
                      ? "bg-primary hover:bg-primary/90 text-white cursor-pointer shadow-lg shadow-primary/20 hover:-translate-y-0.5"
                      : "bg-gray-100 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Get free valuation
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs leading-relaxed text-gray-700">
                  After signup, add revenue, growth, burn, runway, market, team, and assumptions for the full report.
                </div>

                <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500 text-center">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Your data is secure and never shared. See our{" "}
                  <Link href="/privacy" prefetch className="relative z-10 font-semibold text-primary underline underline-offset-2" onClick={(event) => event.stopPropagation()}>
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
            <div className="inline-block rounded-xl border border-gray-200 bg-white p-8 shadow-xl shadow-gray-200/70">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-6 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Calculating your valuation...</h2>
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
            <div className="max-w-2xl mx-auto mt-8 bg-white border border-blue-200 rounded-xl p-6 text-sm shadow-sm">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" /> This Free Estimate
                  </h3>
                  <ul className="space-y-2 text-gray-700 text-xs">
                    <li>✓ Uses website extraction only</li>
                    <li>✓ Basic assumptions about metrics</li>
                    <li>✓ 4-method blend (limited data)</li>
                    <li>✓ Good starting point</li>
                  </ul>
                </div>
                <div className="text-left bg-white rounded-xl p-4">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" /> Pro Subscription
                  </h3>
                  <ul className="space-y-2 text-gray-700 text-xs">
                    <li>✓ Saved inputs and evidence trail</li>
                    <li>✓ Comparable-company context</li>
                    <li>✓ Founder-provided assumptions</li>
                    <li>✓ 6-method detailed analysis</li>
                    <li className="text-primary font-semibold">✓ Stronger investor and advisor conversation</li>
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
              <div className="inline-block px-3 py-1.5 border border-green-200 bg-white rounded-full text-xs font-bold text-green-700 uppercase tracking-wide mb-4">
                ✓ Valuation Complete
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 break-words">
                {result.companyName}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="px-3 py-1 border border-gray-200 bg-white rounded-full text-xs font-semibold text-gray-700 capitalize">
                  {result.industry}
                </span>
                <span className="px-3 py-1 border border-gray-200 bg-white rounded-full text-xs font-semibold text-gray-700 capitalize">
                  {result.stage}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-xl shadow-gray-200/70 border border-gray-200 p-6 md:p-10 space-y-10">
              {/* Main Valuation */}
              <div className="text-center pb-8 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Free Pre-Money Valuation
                </p>
                <div className="text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4 break-words">
                  {formatValuation(result.valuation.low)} — {formatValuation(result.valuation.high)}
                </div>
                <p className="text-xl font-bold text-primary mb-6">
                  Midpoint: {formatValuation(result.valuation.mid)}
                </p>

                {/* Valuation bar */}
                <div className="border border-gray-200 bg-white rounded-full h-3 overflow-hidden mb-4">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: "100%",
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600 px-1">
                  <span>Low</span>
                  <span>Midpoint</span>
                  <span>High</span>
                </div>
              </div>

              {/* Confidence Score Section */}
              {result.confidence && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
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
                      <div className="text-4xl font-bold text-gray-900">
                        {result.confidence.score}%
                      </div>
                      <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        result.confidence.label === "high"
                          ? "bg-white text-green-700"
                          : result.confidence.label === "medium"
                          ? "bg-white text-amber-700"
                          : "bg-white text-red-700"
                      }`}>
                        {result.confidence.label} confidence
                      </span>
                    </div>
                  </div>

                  {/* Confidence Bar */}
                  <div className="border border-gray-200 bg-white rounded-full h-3 overflow-hidden mb-4">
                    <div
                      className={`h-full transition-all ${
                        result.confidence.label === "high"
                          ? "bg-primary"
                          : result.confidence.label === "medium"
                          ? "bg-primary"
                          : "bg-primary"
                      }`}
                      style={{ width: `${result.confidence.score}%` }}
                    />
                  </div>

                  {/* Enrichment Sources */}
                  {result.enrichmentSources && result.enrichmentSources.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        Data enriched from: {result.enrichmentSources.join(", ")}
                      </p>
                    </div>
                  )}

                  {/* Next Steps */}
                  {result.confidence.label !== "high" && result.confidence.nextSteps.length > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-blue-100">
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
                    ? "border-green-300 bg-white"
                    : result.publicValuation.comparison.match === "conservative"
                    ? "border-blue-300 bg-white"
                    : "border-orange-300 bg-orange-50"
                }`}>
                  <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">
                        Comparison with Public Market Data
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

                  <div className={`p-3 rounded-xl text-sm ${
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
                        <div className="border border-gray-200 bg-white rounded-full h-2 overflow-hidden">
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
                        <div className="border border-gray-200 bg-white rounded-full h-2 overflow-hidden">
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
                        <div className="border border-gray-200 bg-white rounded-full h-2 overflow-hidden">
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
                          <span className="text-sm font-semibold text-gray-700">Website Signal Score</span>
                          <span className="text-sm font-bold text-gray-900">
                            {formatValuation(result.methods.evalDamScore)}
                          </span>
                        </div>
                        <div className="border border-gray-200 bg-white rounded-full h-2 overflow-hidden">
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
              <div className="bg-white border border-blue-200 rounded-xl p-4 text-xs text-blue-900">
                <p className="font-semibold mb-1">About This Free Preview</p>
                <p>
                  This directional valuation uses public signals. The full report adds complete inputs, comparables, benchmarks, assumptions, and PDF output.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Free preview</p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>Website-only extraction from public data</li>
                    <li>4-method directional valuation</li>
                    <li>Limited confidence and key insights</li>
                    <li>No saved evidence trail or PDF</li>
                  </ul>
                </div>
                <div className="rounded-xl border-2 border-primary bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary mb-3">Full report</p>
                  <ul className="space-y-2 text-sm text-gray-800">
                    <li>6-method valuation with complete startup details</li>
                    <li>Founder inputs, proof checklist, and assumptions trail</li>
                    <li>Scenarios, sensitivity, comparables, and PDF export</li>
                    <li>Optional professional review status</li>
                  </ul>
                </div>
              </div>

              {/* CTA */}
              <div className="pt-4 border-t border-gray-100">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-4">
                  <p className="text-sm font-bold text-gray-900">Turn this into a full report</p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    Add revenue, growth, burn, runway, market, team, assumptions, and proof details.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <Link href="/signup" className="px-6 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                    Unlock full 6-method report
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setStep("form")}
                    className="px-5 py-4 rounded-xl border border-gray-300 bg-white text-sm font-bold text-gray-800 transition hover:bg-gray-50"
                  >
                    Try another website
                  </button>
                </div>
                <p className="text-xs text-gray-500 text-center mt-3">
                  The full report adds assumptions, comparables, scenarios, and PDF export.
                </p>
              </div>
            </div>

            {/* Upgrade Popup - Shows after 5 seconds */}
            {showUpgradePopup && (
              <div className="fixed inset-0 bg-white backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 animate-fadeIn">
                  <div className="mb-6 text-center">
                    <div className="inline-block px-3 py-1.5 border border-primary/20 bg-white rounded-full mb-4">
                      <span className="text-xs font-bold text-primary uppercase tracking-wide">
                        Ready to Share?
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Create Full Valuation Report
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Add complete startup details before investor calls or advisor review.
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-xl p-4 mb-6">
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">✓</span>
                        <span>Professional valuation report from complete inputs</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">✓</span>
                        <span>6-method detailed valuation analysis</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">✓</span>
                        <span>Report context for advisors, board, and investors</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">✓</span>
                        <span>Watermark-free paid reports</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <Link href="/signup" className="block w-full px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all text-center text-sm">
                      Create full valuation report
                    </Link>
                    <button
                      type="button"
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
          <div className="mb-8 max-w-3xl">
            <span className="inline-block px-3 py-1.5 border border-primary/20 bg-white rounded-full text-xs font-bold text-primary uppercase tracking-wide mb-4">
              Free calculator FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 leading-tight">
              What to know before using a free startup valuation calculator
            </h2>
            <p className="text-base text-gray-600">
              The free valuation helps you start the investor conversation. A professional report needs complete startup inputs, saved assumptions, and report context.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {freeValuationFaqs.map((item) => (
              <div key={item.question} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900">{item.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <span className="inline-block px-3 py-1.5 border border-primary/20 bg-white rounded-full text-xs font-bold text-primary uppercase tracking-wide mb-5">
                Also Free
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                GitHub repo to idea-stage valuation
              </h2>
              <p className="max-w-xl text-base text-gray-600 mb-6">
                For projects that are not companies yet, Evaldam uses the repo as evidence of execution, product maturity, market pull, and startup potential.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

            <div className="bg-white rounded-xl shadow-xl shadow-gray-200/70 border border-gray-200 p-6 md:p-8">
              <div className="rounded-xl border border-gray-200 bg-white p-5 mb-5">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Repo Tool</p>
                <div className="text-3xl font-bold text-gray-900">GitHub → Startup Value</div>
                <p className="text-sm text-gray-600 mt-3">
                  Open the repo valuation page to enter your GitHub URL and optional startup assumptions.
                </p>
              </div>
              <Link href="/github-valuation" className="w-full px-6 py-3.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                Open GitHub Repo Valuation
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      </main>

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


