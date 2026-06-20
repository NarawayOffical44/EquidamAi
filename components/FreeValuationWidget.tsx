"use client";

import { useState } from "react";
import { ArrowRight, AlertCircle } from "lucide-react";
import { writeStartupProfilePrefill } from "@/lib/startup-profile-prefill";

function isFakePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return true;
  if (/^(\d)\1+$/.test(digits)) return true; // all same digit
  if (digits === "1234567890" || digits === "0123456789") return true;
  return false;
}

function isFakeWebsite(url: string) {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return true;
    if (!host.includes(".")) return true;
    const tld = host.split(".").pop() || "";
    if (tld.length < 2) return true;
    return false;
  } catch {
    return true;
  }
}

export function FreeValuationWidget() {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [startTime] = useState(() => Date.now());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Honeypot + time gate - silent reject for bots
    if (honeypot) return;
    if (Date.now() - startTime < 2000) return;

    if (!websiteUrl.trim()) {
      setError("Please enter a website URL");
      return;
    }
    if (isFakeWebsite(websiteUrl.trim())) {
      setError("Please enter a real website URL (e.g., yourcompany.com)");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }
    if (!phone.trim() || isFakePhone(phone.trim())) {
      setError("Please enter a valid phone number");
      return;
    }
    if (!consent) {
      setError("Please agree to receive your valuation and updates");
      return;
    }

    let normalizedWebsiteUrl = "";
    try {
      normalizedWebsiteUrl = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`;
      new URL(normalizedWebsiteUrl);
    } catch {
      setError("Please enter a valid website URL");
      return;
    }

    writeStartupProfilePrefill({
      websiteUrl: normalizedWebsiteUrl,
      source: "homepage_free_valuation",
    });

    const params = new URLSearchParams({
      websiteUrl: normalizedWebsiteUrl,
      email: email.trim(),
      phone: phone.trim(),
      consent: "1",
      source: "homepage",
      autostart: "1",
    });

    window.location.href = `/free-valuation?${params.toString()}`;
  };

  const isFormValid = () => {
    return websiteUrl.trim() && email.trim() && phone.trim() && consent;
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="min-w-0 space-y-4">
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
        <div>
          <label htmlFor="widget-website-url" className="sr-only">
            Website URL
          </label>
          <input
            id="widget-website-url"
            type="text"
            placeholder="Paste your website URL (e.g., example.com)"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-primary"
            autoComplete="url"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="widget-email" className="sr-only">
              Email address
            </label>
            <input
              id="widget-email"
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-w-0 rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-primary"
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="widget-phone" className="sr-only">
              Phone number
            </label>
            <input
              id="widget-phone"
              type="tel"
              placeholder="Your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full min-w-0 rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-primary"
              autoComplete="tel"
              required
            />
          </div>
        </div>

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="consent"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-4 w-4 cursor-pointer rounded border border-gray-300 focus:ring-2 focus:ring-primary"
          />
          <label htmlFor="consent" className="cursor-pointer text-xs text-gray-600">
            I agree to receive my valuation results and product updates via email. I understand I can unsubscribe anytime.
          </label>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-white p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!isFormValid()}
          className={`flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-bold transition-all ${
            isFormValid()
              ? "cursor-pointer bg-primary text-white hover:bg-primary/90"
              : "cursor-not-allowed border border-gray-300 bg-white text-gray-500"
          }`}
        >
          Continue to Free Valuation
          <ArrowRight className="h-4 w-4" />
        </button>
        <p className="text-center text-xs font-semibold text-gray-500">Results open on the dedicated free valuation page.</p>
      </form>
    </div>
  );
}
