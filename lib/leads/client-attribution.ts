"use client";

const STORAGE_KEY = "evaldam_lead_attribution";

function readStoredAttribution(): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function utmValue(params: URLSearchParams, key: string) {
  return params.get(key) || undefined;
}

export function captureLeadAttribution() {
  if (typeof window === "undefined") return;

  const existing = readStoredAttribution();
  const params = new URLSearchParams(window.location.search);
  const currentPage = `${window.location.pathname}${window.location.search}`;
  const next = {
    ...existing,
    landingPage: existing.landingPage || currentPage,
    referrer: existing.referrer || document.referrer || undefined,
    utmSource: existing.utmSource || utmValue(params, "utm_source"),
    utmMedium: existing.utmMedium || utmValue(params, "utm_medium"),
    utmCampaign: existing.utmCampaign || utmValue(params, "utm_campaign"),
    utmTerm: existing.utmTerm || utmValue(params, "utm_term"),
    utmContent: existing.utmContent || utmValue(params, "utm_content"),
    gclid: existing.gclid || utmValue(params, "gclid"),
    capturedAt: existing.capturedAt || new Date().toISOString(),
    currentPage,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function getLeadAttribution() {
  if (typeof window === "undefined") return {};
  captureLeadAttribution();
  return readStoredAttribution();
}
