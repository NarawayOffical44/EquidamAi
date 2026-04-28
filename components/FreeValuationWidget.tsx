"use client";

import { useState } from "react";
import { ArrowRight, AlertCircle, CheckCircle } from "lucide-react";

interface ValuationResult {
  companyName: string;
  valuation: {
    low: number;
    mid: number;
    high: number;
  };
  keyReasons: string[];
}

export function FreeValuationWidget() {
  const [step, setStep] = useState<"form" | "loading" | "results">("form");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!websiteUrl.trim()) {
      setError("Please enter a website URL");
      return;
    }
    if (!email.trim()) {
      setError("Please enter an email address");
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
    <div className="w-full">
      {step === "form" && (
        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm"
            />
            <input
              type="tel"
              placeholder="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
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
            <h3 className="text-2xl font-black text-gray-900 mb-2">{result.companyName}</h3>
            <div className="text-4xl font-black text-primary mb-3">
              {formatValuation(result.valuation.low)} — {formatValuation(result.valuation.high)}
            </div>
            <p className="text-sm text-gray-600 mb-4">Mid: {formatValuation(result.valuation.mid)}</p>

            <div className="bg-gray-100 rounded-full h-2 w-full mb-6">
              <div className="h-full bg-gradient-to-r from-primary via-purple-500 to-primary rounded-full" style={{ width: "100%" }} />
            </div>

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
        </div>
      )}
    </div>
  );
}
