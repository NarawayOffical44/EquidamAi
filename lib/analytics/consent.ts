export const ANALYTICS_CONSENT_KEY = "evaldam_cookie_consent";
export type AnalyticsConsent = "accepted" | "essential";

export function getAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
  return value === "accepted" || value === "essential" ? value : null;
}

export function hasAnalyticsConsent() {
  return getAnalyticsConsent() === "accepted";
}

export function setAnalyticsConsent(value: AnalyticsConsent) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
  document.cookie = `${ANALYTICS_CONSENT_KEY}=${value}; path=/; max-age=31536000; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent("evaldam:analytics-consent", { detail: value }));
}
