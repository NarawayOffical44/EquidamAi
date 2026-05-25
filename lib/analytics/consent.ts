export const ANALYTICS_CONSENT_KEY = "evaldam_cookie_consent";
export type AnalyticsConsent = "accepted" | "essential";

export function getAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === "undefined") return null;
  let value: string | null = null;

  try {
    value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
  } catch {
    value = null;
  }

  if (!value) {
    const cookieValue = document.cookie
      .split("; ")
      .find((item) => item.startsWith(`${ANALYTICS_CONSENT_KEY}=`))
      ?.split("=")[1];
    value = cookieValue ? decodeURIComponent(cookieValue) : null;
  }

  return value === "accepted" || value === "essential" ? value : null;
}

export function hasAnalyticsConsent() {
  return getAnalyticsConsent() === "accepted";
}

export function setAnalyticsConsent(value: AnalyticsConsent) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
  } catch {
    // Cookie fallback below still persists the choice when localStorage is blocked.
  }

  document.cookie = `${ANALYTICS_CONSENT_KEY}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent("evaldam:analytics-consent", { detail: value }));
}
