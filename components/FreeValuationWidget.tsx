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
    setSessionToken(getSessionToken());
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

    if (!phone.trim()) {
      setError("Please enter your phone number");
      return;
    }

    if (!consent) {
      setError("Please agree to receive our valuation and updates");
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
    return websiteUrl.trim() && email.trim() && phone.trim() && consent;
  };

  return (
    <div className="w-full">
      {step === "form" && (
        <form onSubmit={handleSubmit} className="space-y-4 min-w-0">
          <div>
            <input
              type="text"
              placeholder="Paste your website URL (e.g., example.com)"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-w-0 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm"
            />
            <input
              type="tel"
              placeholder="Your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full min-w-0 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm"
              required
            />
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
              I agree to receive my valuation results and product updates via email. I understand I can unsubscribe anytime.
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {rateLimitError && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-900">
              <p className="font-semibold mb-2">Daily limit reached</p>
              <p className="mb-3">{rateLimitError.message}</p>
              <p className="text-xs text-yellow-700">
                Resets at: {new Date(rateLimitError.resetsAt).toLocaleTimeString()} UTC
              </p>
              <a
                href="/signup"
                className="inline-block mt-3 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold rounded transition"
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
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Get Instant Valuation
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
          <p className="text-xs text-gray-500 mt-2">This takes about 30-60 seconds</p>
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
            <div className="text-3xl font-black text-primary mb-3 break-words sm:text-4xl">
              {formatValuation(result.valuation.low)} — {formatValuation(result.valuation.high)}
            </div>
            <p className="text-sm text-gray-600 mb-4">Mid: {formatValuation(result.valuation.mid)}</p>

            <div className="bg-gray-100 rounded-full h-2 w-full mb-6">
              <div className="h-full bg-gradient-to-r from-primary via-purple-500 to-primary rounded-full" style={{ width: "100%" }} />
            </div>

            {/* Methods Breakdown */}
            {result.methods && (
              <div className="text-left bg-white border border-gray-200 rounded-lg p-4 mb-6 text-sm">
                <p className="font-bold text-gray-900 mb-4">Methods Used (4 Approaches):</p>
                <div className="space-y-3">
                  {result.methods.scorecard && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Scorecard Method</span>
                      <span className="font-bold text-primary">{formatValuation(result.methods.scorecard)}</span>
                    </div>
                  )}
                  {result.methods.berkus && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Berkus Method</span>
                      <span className="font-bold text-primary">{formatValuation(result.methods.berkus)}</span>
                    </div>
                  )}
                  {result.methods.dcfLTG && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">DCF Long-Term Growth</span>
                      <span className="font-bold text-primary">{formatValuation(result.methods.dcfLTG)}</span>
                    </div>
                  )}
                  {result.methods.evalDamScore && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Evaldam Score</span>
                      <span className="font-bold text-primary">{formatValuation(result.methods.evalDamScore)}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
                  Blended average of 4 independent valuation methods for a balanced estimate
                </p>
              </div>
            )}

            {result.keyReasons.length > 0 && (
              <div className="text-left bg-gray-50 rounded-lg p-4 mb-6 text-sm text-gray-700">
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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
            <p className="font-semibold mb-1">Quick Estimate</p>
            <p>Get a comprehensive 6-method valuation with detailed analysis and investor reports by signing up.</p>
          </div>

          <div className="space-y-2">
            <a href="/signup" className="block w-full px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-all text-center text-sm">
              Get Full Report - Sign Up Free
            </a>
            <button
              onClick={() => setStep("form")}
              className="w-full px-6 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-900 font-semibold rounded-lg transition-all text-sm"
            >
              Try Another Valuation
            </button>
          </div>

          {/* Upgrade Popup - Shows after 5 seconds */}
          {showUpgradePopup && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fadeIn">
                <div className="mb-6 text-center">
                  <div className="inline-block px-3 py-1.5 bg-primary/10 rounded-full mb-4">
                    <span className="text-xs font-bold text-primary uppercase tracking-wide">
                      Upgrade Now
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
                  <a
                    href="/signup"
                    className="block w-full px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-all text-center text-sm"
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
