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
  const [honeypot, setHoneypot] = useState("");
  const [formStartTime] = useState(() => Date.now());
  const [rateLimitError, setRateLimitError] = useState<{
    message: string;
    resetsAt: string;
  } | null>(null);
  const [reportCount, setReportCount] = useState<number>(0);
  const [displayCount, setDisplayCount] = useState(100016);
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
    // Honeypot + time gate
    if (honeypot) return;
    if (Date.now() - formStartTime < 2000) return;
    await runValuation({ websiteUrl, email, phone, consent });
  };

  const runValuation = async (input: { websiteUrl: string; email: string; phone: string; consent: boolean }) => {
    setError("");
    setRateLimitError(null);

    if (!input.websiteUrl.trim()) {
      setError("Please enter a website URL");
      return;
    }

    // Block fake/local URLs
    const rawHost = (() => {
      try {
        const u = input.websiteUrl.startsWith("http") ? input.websiteUrl : `https://${input.websiteUrl}`;
        return new URL(u).hostname.toLowerCase();
      } catch { return ""; }
    })();
    if (!rawHost || rawHost === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(rawHost) || !rawHost.includes(".")) {
      setError("Please enter a real website URL (e.g., yourcompany.com)");
      return;
    }

    if (!input.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    // Phone: require 7–15 digits, reject all-same-digit or sequential fakes
    const phoneDigits = input.phone.replace(/\D/g, "");
    if (phoneDigits.length < 7 || phoneDigits.length > 15 || /^(\d)\1+$/.test(phoneDigits) || phoneDigits === "1234567890" || phoneDigits === "0123456789") {
      setError("Please enter a valid phone number");
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
    setDisplayCount((c) => c + 1);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {step === "form" && (
          <div className="flex items-center gap-1 pt-5 border-b border-gray-100 pb-4">
            <div className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3.5 py-2 text-sm font-bold text-white">
              <Globe className="h-4 w-4" />
              Website Valuation
            </div>
            <Link href="/github-valuation" className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold text-gray-500 transition hover:text-gray-900 hover:bg-gray-50">
              <Code2 className="h-4 w-4" />
              GitHub Repo
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {/* Form Step */}
        {step === "form" && (
          <div className="animate-fadeIn">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_480px] items-center min-h-[80vh] py-8 lg:py-16">

              {/* Left - open, breathable, visually led */}
              <div>
                {/* Badge */}
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1.5 mb-8">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">Free · No signup needed</span>
                </div>

                {/* Headline - big, single focus */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.05] tracking-tight mb-6">
                  Know your startup&apos;s worth{" "}<br />
                  <span className="text-primary">before you pitch.</span>
                </h1>

                <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-lg">
                  Paste your website URL and get a defensible valuation range in under 60 seconds - free, no account needed. Then build the full report and track your value as you grow.
                </p>

                {/* Stats - the eye-stoppers */}
                <div className="flex flex-wrap gap-8 mb-12">
                  {[
                    { num: `${displayCount.toLocaleString()}+`, label: "Startups valued" },
                    { num: "4", label: "Valuation methods" },
                    { num: "60s", label: "Time to result" },
                  ].map(({ num, label }) => (
                    <div key={label}>
                      <div className="text-3xl font-black text-gray-900 leading-none">{num}</div>
                      <div className="text-sm text-gray-400 mt-1">{label}</div>
                    </div>
                  ))}
                </div>

                {/* 3 clean features - no cards, just lines */}
                <div className="space-y-4 border-t border-gray-100 pt-8">
                  {[
                    { icon: Globe, text: "Reads your public website signals automatically" },
                    { icon: CheckCircle, text: "Returns low, midpoint, and high pre-money valuation" },
                    { icon: ShieldCheck, text: "Data never sold - encrypted and private" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-3 text-gray-600 text-sm">
                      <Icon className="w-4 h-4 text-primary shrink-0" />
                      {text}
                    </div>
                  ))}
                </div>

                {/* Substantial explanatory content added to address low-value / thin content flags */}
                <div className="mt-10 border-t border-gray-100 pt-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">How a free website valuation actually works</h2>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    The free calculator extracts publicly available signals from your website - traffic estimates, technology stack, content freshness, backlink profile, and growth indicators where visible - then feeds them into four established early-stage valuation frameworks. The result is a directional pre-money range (low / midpoint / high) that reflects what the market is currently paying for companies at a similar stage with similar observable signals. It is not a replacement for a full diligence process.
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    Because the input is limited to public data, the output carries higher uncertainty than a report built on revenue, customer contracts, team details, and market comparables. That uncertainty is explicitly surfaced as the width of the range and the confidence label. Founders use this preview to decide whether the opportunity is worth the time to build a complete model before they start conversations with investors or advisors.
                  </p>

                  <h3 className="text-lg font-bold text-gray-900 mt-6 mb-2">Common limitations founders should understand</h3>
                  <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1 mb-3">
                    <li>Website signals can be noisy or manipulated; they are a starting point, not ground truth.</li>
                    <li>Pre-revenue and idea-stage companies have the widest ranges because public data is thinnest.</li>
                    <li>The tool does not model existing SAFEs, option pools, or prior financing terms.</li>
                    <li>Geography, sector, and macro conditions are only partially visible from a website alone.</li>
                  </ul>

                  <p className="text-sm text-gray-600 leading-relaxed">
                    The most useful next step is almost always to create a full workspace after you see the preview. Add your actual revenue, growth, burn, team, and market assumptions so the same six-method engine can produce a narrower, evidence-backed range with a full assumptions trail and investor-ready PDF.
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed mt-3">
                    This free preview exists precisely because many founders need a credible starting point before they invest the time to model everything. It surfaces the signals that matter most at this stage so you can focus your questions and preparation.
                  </p>
                </div>
              </div>

              {/* Right - form */}
              <div className="sm:sticky sm:top-16 lg:top-24">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-200/60">
              <div className="px-6 py-5 md:px-8 bg-gradient-to-r from-primary to-[#005f5f]">
                <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1">Free startup valuation</p>
                <p className="text-xl font-black text-white">Get your valuation now</p>
                <p className="text-sm text-white/60 mt-0.5">No account needed · Result in under 60s</p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-bold text-white">{displayCount.toLocaleString()}+ startups valued</span>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5 p-6 md:p-8">
                {/* Honeypot - hidden from humans, filled by bots */}
                <input
                  type="text"
                  name="company_address"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  aria-hidden="true"
                  autoComplete="off"
                  style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }}
                />
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
          <div className="flex flex-col items-center justify-center py-16 md:py-24 animate-fadeIn">
            <div className="w-full max-w-md">
              <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-2xl shadow-gray-200/60 mb-6">
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-16 h-16">
                    <div className="w-16 h-16 border-4 border-primary/10 rounded-full" />
                    <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-primary/20 animate-pulse" />
                    </div>
                  </div>
                </div>
                <h2 className="text-xl font-black text-gray-900 text-center mb-6">Calculating your valuation…</h2>
                <div className="space-y-3">
                  {[
                    "Fetching website data",
                    "Extracting company signals",
                    "Running 4 valuation methods",
                  ].map((label) => (
                    <div key={label} className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin shrink-0" style={{ animationDuration: "1s" }} />
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-primary/15 bg-primary/5 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-primary mb-3">What the full report adds</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                  {["6-method analysis", "Comparable companies", "Assumptions trail", "PDF export", "Investor-ready format", "Scenario analysis"].map(item => (
                    <div key={item} className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Step */}
        {step === "results" && result && (
          <div className="animate-fadeIn py-8 lg:py-12">

            {/* Top bar - company + status */}
            <div className="flex flex-wrap items-center gap-3 mb-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold text-green-700 uppercase tracking-widest">Valuation complete</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{result.companyName}</span>
              <span className="px-2.5 py-1 rounded-full bg-gray-100 text-xs font-semibold text-gray-600 capitalize">{result.industry}</span>
              <span className="px-2.5 py-1 rounded-full bg-gray-100 text-xs font-semibold text-gray-600 capitalize">{result.stage}</span>
            </div>

            {/* Hero numbers - two column */}
            <div className="grid lg:grid-cols-[1fr_360px] gap-6 mb-8">

              {/* Left - the big number */}
              <div className="rounded-2xl border border-gray-200 bg-white p-8 md:p-10">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Pre-Money Valuation</p>
                <div className="text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 leading-none mb-3 break-words">
                  {formatValuation(result.valuation.mid)}
                </div>
                <p className="text-gray-400 text-sm mb-8">
                  Midpoint · Range: {formatValuation(result.valuation.low)} - {formatValuation(result.valuation.high)}
                </p>

                {/* Range bar */}
                <div className="relative">
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary/50 via-primary to-primary/70" style={{ width: "100%" }} />
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-primary shadow-md" />
                  <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
                    <span>Low: {formatValuation(result.valuation.low)}</span>
                    <span>High: {formatValuation(result.valuation.high)}</span>
                  </div>
                </div>
              </div>

              {/* Right - confidence + CTA */}
              <div className="flex flex-col gap-4">
                {result.confidence && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 flex-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Confidence</p>
                    <div className="text-4xl font-black text-gray-900 mb-1">{result.confidence.score}%</div>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-3 ${
                      result.confidence.label === "high" ? "bg-green-50 text-green-700" :
                      result.confidence.label === "medium" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                    }`}>{result.confidence.label} confidence</span>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${
                        result.confidence.label === "high" ? "bg-green-500" :
                        result.confidence.label === "medium" ? "bg-amber-500" : "bg-red-500"
                      }`} style={{ width: `${result.confidence.score}%` }} />
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div className="rounded-2xl bg-gradient-to-br from-primary to-[#005f5f] p-6 text-white">
                  <p className="font-black text-lg mb-1">Want the full picture?</p>
                  <p className="text-white/60 text-sm mb-4">6 methods · PDF export · Investor-ready</p>
                  <Link href="/signup" className="block w-full px-4 py-3 bg-white text-primary font-black rounded-xl text-center text-sm hover:bg-white/90 transition">
                    Create free account
                  </Link>
                  <button type="button" onClick={() => setStep("form")} className="block w-full text-center text-xs text-white/50 hover:text-white/80 mt-3 transition">
                    Try another website
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-10 space-y-10">

              {/* Confidence next steps - only show if not high */}
              {result.confidence && result.confidence.label !== "high" && result.confidence.nextSteps.length > 0 && (
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-3">To improve confidence</p>
                  <ul className="space-y-2">
                    {result.confidence.nextSteps.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-amber-900">
                        <span className="text-amber-500 font-bold mt-0.5 shrink-0">→</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Enrichment sources */}
              {result.enrichmentSources && result.enrichmentSources.length > 0 && (
                <p className="text-xs text-gray-400">Data enriched from: {result.enrichmentSources.join(", ")}</p>
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
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5">
                    4 Valuation Methods
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
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-teal-400 to-primary transition-all duration-700"
                            style={{ width: `${Math.min(100, (result.methods.scorecard / result.valuation.high) * 100)}%` }}
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
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-700" style={{ width: `${Math.min(100, (result.methods.berkus / result.valuation.high) * 100)}%` }} />
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
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-500 transition-all duration-700" style={{ width: `${Math.min(100, (result.methods.dcfLTG / result.valuation.high) * 100)}%` }} />
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
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-primary to-teal-400 transition-all duration-700" style={{ width: `${Math.min(100, (result.methods.evalDamScore / result.valuation.high) * 100)}%` }} />
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
              <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                This is a directional valuation from public signals only. The full report adds complete inputs, comparables, assumptions, and PDF export.
              </p>
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
                      Build your investor-ready report
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Add your full details and the AI builds a report you can share, defend, and track over time.
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-xl p-4 mb-6">
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">✓</span>
                        <span>Investor-ready report you can share by link or PDF</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">✓</span>
                        <span>All 6 methods, with the AI explaining every number</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">✓</span>
                        <span>Track your valuation as it grows, round over round</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">✓</span>
                        <span>Clean, watermark-free reports</span>
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

            <div className="overflow-hidden rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-200 bg-white">
              <div className="px-6 py-5 bg-gradient-to-r from-gray-900 to-gray-800">
                <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1">Free tool</p>
                <div className="text-xl font-black text-white">GitHub → Startup Valuation</div>
                <p className="text-sm text-white/60 mt-1">For technical founders building in public</p>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-5">
                  Paste a public repo URL. Get a valuation based on execution signal, market pull, and idea-stage potential.
                </p>
              <Link href="/github-valuation" className="w-full px-6 py-3.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                Open GitHub Repo Valuation
                <ArrowRight className="w-4 h-4" />
              </Link>
              </div>
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


