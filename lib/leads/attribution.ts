import type { NextRequest } from "next/server";

export type LeadAttribution = {
  landingPage?: string | null;
  currentPage?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  gclid?: string | null;
  capturedAt?: string | null;
  userAgent?: string | null;
};

const ATTRIBUTION_KEYS = [
  "landingPage",
  "currentPage",
  "referrer",
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "utmTerm",
  "utmContent",
  "gclid",
  "capturedAt",
  "userAgent",
] as const;

type AttributionKey = (typeof ATTRIBUTION_KEYS)[number];

function cleanString(value: unknown, maxLength = 500) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, maxLength)
    : null;
}

export function cleanLeadAttribution(value: unknown): LeadAttribution {
  const raw = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

  return ATTRIBUTION_KEYS.reduce((acc, key) => {
    acc[key] = cleanString(raw[key], key === "userAgent" ? 300 : 500);
    return acc;
  }, {} as Record<AttributionKey, string | null>);
}

export function getRequestAttribution(
  request: NextRequest,
  submittedAttribution?: unknown
): LeadAttribution {
  const submitted = cleanLeadAttribution(submittedAttribution);
  const requestUrl = new URL(request.url);
  const referer = cleanString(request.headers.get("referer"));
  const userAgent = cleanString(request.headers.get("user-agent"), 300);

  return {
    ...submitted,
    currentPage: submitted.currentPage || requestUrl.pathname,
    referrer: submitted.referrer || referer,
    capturedAt: submitted.capturedAt || new Date().toISOString(),
    userAgent: submitted.userAgent || userAgent,
  };
}

export function withLeadAttribution<T extends Record<string, unknown>>(
  request: NextRequest,
  metadata: T,
  submittedAttribution?: unknown
) {
  return {
    ...metadata,
    attribution: getRequestAttribution(request, submittedAttribution),
  };
}
