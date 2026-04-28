"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, ArrowRight } from "lucide-react";

interface ValuationResult {
  companyName: string;
  industry: string;
  stage: string;
  valuation: {
    low: number;
    mid: number;
    high: number;
  };
  methods: {
    scorecard: number | null;
    berkus: number | null;
  };
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
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [error, setError] = useState("");

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

    // Validate inputs
    if (!websiteUrl.trim()) {
      setError("Please enter a website URL");
      return;
    }
    if (!email.trim()) {
      setError("Please enter an email address");
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
          ipData: ipData || undefined,
        }),
      });

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Evaldam AI" width={24} height={24} className="rounded" />
            <span className="font-bold text-gray-900">Evaldam</span>
          </Link>
          <div className="text-xs md:text-sm text-gray-500">
            Free Instant Valuation • No Signup Required
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Form Step */}
        {step === "form" && (
          <div className="animate-fadeIn">
            <div className="text-center mb-12">
              <span className="inline-block px-3 py-1.5 bg-primary/10 rounded-full text-xs font-bold text-primary uppercase tracking-wide mb-4">
                Instant Valuation
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">
                Get Your Free Startup Valuation
              </h1>
              <p className="text-lg text-gray-600 max-w-xl mx-auto">
                Paste your website URL and get an instant pre-money valuation estimate. No credit card, no signup required.
              </p>
            </div>

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
                    Phone <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  />
                  <p className="text-xs text-gray-500 mt-1">For follow-up (optional)</p>
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

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full px-6 py-3.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 mt-8"
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
          </div>
        )}

        {/* Loading Step */}
        {step === "loading" && (
          <div className="text-center py-20 animate-fadeIn">
            <div className="inline-block">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-6" />
            </div>
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
                <div className="text-5xl md:text-6xl font-black text-gray-900 mb-4">
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

              {/* Method Breakdown */}
              {(result.methods.scorecard || result.methods.berkus) && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-6">
                    Method Breakdown
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
                  </div>
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
                <p className="font-semibold mb-1">Quick Estimate Disclaimer</p>
                <p>
                  This is a fast estimate based on 2 lightweight methods using public website data. Get a comprehensive 6-method valuation with detailed analysis by signing up.
                </p>
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
          </div>
        )}
      </div>

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
