"use client";

import { useEffect, useState } from "react";
import { getAnalyticsConsent, setAnalyticsConsent, type AnalyticsConsent } from "@/lib/analytics/consent";

export function CookieConsentBanner() {
  const [choice, setChoice] = useState<AnalyticsConsent | null>(null);

  useEffect(() => {
    setChoice(getAnalyticsConsent());
  }, []);

  const choose = (value: AnalyticsConsent) => {
    setAnalyticsConsent(value);
    setChoice(value);
  };

  if (choice) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="z-[60] border-t border-gray-200 bg-white px-4 py-3 shadow-2xl sm:fixed sm:inset-x-0 sm:bottom-0"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-gray-600">
          We use essential cookies to run Evaldam. Analytics cookies help us measure performance and improve the product.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose("essential")}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            Accept analytics
          </button>
        </div>
      </div>
    </div>
  );
}
