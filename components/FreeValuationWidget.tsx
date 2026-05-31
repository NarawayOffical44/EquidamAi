"use client";

import { useState, useEffect } from "react";
import { ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { getSessionToken } from "@/lib/utils/browser-session";
import { SignalAnalysisPanel } from "@/components/SignalAnalysisPanel";
import type { SignalAnalysis } from "@/lib/valuation/signal-analysis";

interface MethodResult {
  name: string;
  value: number | null;
}

interface ValuationResult {
  companyName: string;
  valuation: {
    low: number;
    mid: number;
    high: number;
  };
  methods?: {
    scorecard: number | null;
    berkus: number | null;
    dcfLTG: number | null;
    evalDamScore: number | null;
  };
  methodResults?: MethodResult[];
  keyReasons: string[];
  signalAnalysis?: SignalAnalysis;
}

export function FreeValuationWidget() {
  const [step, setStep] = useState<"form" | "loading" | "results">("form");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [error, setError] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<{
    message: string;
    resetsAt: string;
  } | null>(null);

  // Initialize session token on mount
  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (active) {
        setSessionToken(getSessionToken());
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setRateLimitError(null);

    if (!websiteUrl.trim()) {
      setError("Please enter a website URL");
      return;
    }
    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    if (phone.trim() && phone.trim().length < 3) {
      setError("Please enter a valid phone number or leave it blank");
      return;
    }

    if (!consent) {
      setError("Please agree to receive your valuation result and follow-up guidance");
      return;
    }

    try {
      new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`);
    } catch {
      setError("Please enter a valid website URL");
      return;
    }

    setStep("loading");

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
    return websiteUrl.trim() && email.trim() && consent;
  };

  return (
    <div className="w-full">
      {step === "form" && (
        <form onSubmit={handleSubmit} className="space-y-4 min-w-0">
          <div>
            <label htmlFor="widget-website-url" className="sr-only">Website URL</label>
            <input
              id="widget-website-url"
              type="text"
              placeholder="Paste your website URL (e.g., example.com)"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm"
              autoComplete="url"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="widget-email" className="sr-only">Email address</label>
              <input
                id="widget-email"
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-w-0 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="widget-phone" className="sr-only">Phone number</label>
              <input
                id="widget-phone"
                type="tel"
                placeholder="Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full min-w-0 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm"
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="w-4 h-4 mt-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary cursor-pointer"
            />
            <label htmlFor="consent" className="text-xs text-gray-600 cursor-pointer">
              Send my valuation result and report guidance by email. I can opt out anytime.
            </label>
          </div>

          {error && (
            <div className="p-3 bg-white border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {rateLimitError && (
            <div className="p-4 bg-white border border-yellow-200 rounded-lg text-sm text-yellow-900">
              <p className="font-semibold mb-2">Daily limit reached</p>
              <p className="mb-3">{rateLimitError.message}</p>
              <p className="text-xs text-yellow-700">
                Resets at: {new Date(rateLimitError.resetsAt).toLocaleTimeString()} UTC
              </p>
              <a
                href="/signup"
                className="inline-block mt-3 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded transition"
              >
                Sign up for unlimited checks
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={!isFormValid()}
            className={`w-full px-6 py-3 font-bold rounded-lg transition-all flex items-center justify-center gap-2 text-sm ${
              isFormValid()
                ? "bg-primary hover:bg-primary/90 text-white cursor-pointer"
                : "border border-gray-300 bg-white text-gray-500 cursor-not-allowed"
            }`}
          >
            Get a Starting Range
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {step === "loading" && (
        <div className="text-center py-12">
          <div className="inline-block mb-4">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
          </div>
          <p className="text-gray-600 font-medium">Analyzing your startup...</p>
          <p className="text-xs text-gray-500 mt-2">This may take a moment</p>
        </div>
      )}

      {step === "results" && result && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-bold text-green-700">Valuation Complete</span>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2 break-words">{result.companyName}</h3>
            <div className="mb-3 break-words bg-gradient-to-r from-primary via-[#4dd4d4] to-primary bg-clip-text font-mono text-3xl font-black leading-tight text-transparent tabular-nums sm:text-4xl">
              {formatValuation(result.valuation.low)} — {formatValuation(result.valuation.high)}
            </div>
            <p className="text-sm text-gray-600 mb-4">Mid: <span className="font-mono tabular-nums">{formatValuation(result.valuation.mid)}</span></p>

            {/* Methods Breakdown */}
            {result.methods && (
              <div className="text-left bg-white border border-gray-300 rounded-[4px] p-4 mb-6 text-sm">
                <p className="font-bold text-gray-900 mb-4">Methods Used (4 Approaches):</p>
                <div className="space-y-3">
                  {result.methods.scorecard && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Scorecard Method</span>
                      <span className="font-mono font-bold text-primary tabular-nums">{formatValuation(result.methods.scorecard)}</span>
                    </div>
                  )}
                  {result.methods.berkus && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Berkus Method</span>
                      <span className="font-mono font-bold text-primary tabular-nums">{formatValuation(result.methods.berkus)}</span>
                    </div>
                  )}
                  {result.methods.dcfLTG && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">DCF Long-Term Growth</span>
                      <span className="font-mono font-bold text-primary tabular-nums">{formatValuation(result.methods.dcfLTG)}</span>
                    </div>
                  )}
                  {result.methods.evalDamScore && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Website Signal Score</span>
                      <span className="font-mono font-bold text-primary tabular-nums">{formatValuation(result.methods.evalDamScore)}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-300">
                  Blended average of 4 independent valuation methods for a balanced estimate
                </p>
              </div>
            )}

            {result.keyReasons.length > 0 && (
              <div className="text-left bg-white rounded-lg border border-gray-300 p-4 mb-6 text-sm text-gray-700">
                <p className="font-semibold text-gray-900 mb-2">Key Drivers:</p>
                <ul className="space-y-1 text-xs">
                  {result.keyReasons.slice(0, 2).map((reason, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-primary">→</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <SignalAnalysisPanel analysis={result.signalAnalysis} compact />

          <div className="bg-white border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
            <p className="font-semibold mb-1">Quick Estimate</p>
              <p>This preview gives you a number. The full report helps answer the investor questions behind that number.</p>
            </div>

          <div className="space-y-2">
            <a href="/signup" className="block w-full px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-all text-center text-sm">
              Build the investor-ready report
            </a>
            <button
              type="button"
              onClick={() => setStep("form")}
              className="w-full px-6 py-2.5 border border-gray-300 hover:border-primary hover:text-primary text-gray-900 font-semibold rounded-lg transition-all text-sm"
            >
              Try Another Valuation
            </button>
          </div>

          {/* Upgrade Popup - Shows after 5 seconds */}
          {showUpgradePopup && (
            <div className="fixed inset-0 bg-white flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-[4px] border border-gray-300 shadow-[0_1px_2px_rgba(0,0,0,0.05)] max-w-md w-full p-8 animate-fadeIn">
                <div className="mb-6 text-center">
                  <div className="inline-block px-3 py-1.5 border border-primary/20 bg-white rounded-[4px] mb-4">
                    <span className="text-xs font-bold text-primary uppercase tracking-wide">
                      Upgrade Now
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">
                    Generate Professional Report
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Prepare a fuller report before investor calls or advisor review
                  </p>
                </div>

                <div className="bg-white rounded-[4px] border border-gray-300 p-4 mb-6">
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
                  <a
                    href="/signup"
                    className="block w-full px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-[4px] transition-all text-center text-sm"
                  >
                    Upgrade & Generate Report
                  </a>
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
  );
}
