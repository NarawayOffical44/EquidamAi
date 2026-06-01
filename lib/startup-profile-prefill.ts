export type StartupProfilePrefill = {
  companyName?: string;
  stage?: string;
  websiteUrl?: string;
  industry?: string;
  description?: string;
  arr?: string | number;
  monthlyGrowthRate?: string | number;
  teamSize?: string | number;
  totalAddressableMarket?: string | number;
  source?: string;
  createdAt?: number;
};

export const STARTUP_PROFILE_PREFILL_KEY = "evaldam_startup_profile_prefill";

const STARTUP_PROFILE_PREFILL_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const ALLOWED_STAGES = new Set(["pre-revenue", "seed", "series-a", "series-b+"]);

export function sanitizeStartupProfilePrefill(value: unknown): StartupProfilePrefill | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const input = value as Record<string, unknown>;
  const prefill: StartupProfilePrefill = {};

  assignString(prefill, "companyName", input.companyName);
  assignString(prefill, "websiteUrl", input.websiteUrl);
  assignString(prefill, "industry", input.industry);
  assignString(prefill, "description", input.description);
  assignString(prefill, "arr", input.arr);
  assignString(prefill, "monthlyGrowthRate", input.monthlyGrowthRate);
  assignString(prefill, "teamSize", input.teamSize);
  assignString(prefill, "totalAddressableMarket", input.totalAddressableMarket);
  assignString(prefill, "source", input.source);

  const stage = normalizeStage(input.stage);
  if (stage) prefill.stage = stage;

  if (typeof input.createdAt === "number" && Number.isFinite(input.createdAt)) {
    prefill.createdAt = input.createdAt;
  }

  return hasProfileValues(prefill) ? prefill : null;
}

export function readStartupProfilePrefill() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STARTUP_PROFILE_PREFILL_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StartupProfilePrefill;
    const createdAt = typeof parsed.createdAt === "number" ? parsed.createdAt : 0;
    if (!createdAt || Date.now() - createdAt > STARTUP_PROFILE_PREFILL_TTL_MS) {
      window.localStorage.removeItem(STARTUP_PROFILE_PREFILL_KEY);
      return null;
    }

    return sanitizeStartupProfilePrefill(parsed);
  } catch {
    window.localStorage.removeItem(STARTUP_PROFILE_PREFILL_KEY);
    return null;
  }
}

export function writeStartupProfilePrefill(value: StartupProfilePrefill) {
  if (typeof window === "undefined") return;

  const nextValues = sanitizeStartupProfilePrefill(value);
  if (!nextValues) return;

  const existing = readStartupProfilePrefill() || {};
  const next = {
    ...existing,
    ...nextValues,
    createdAt: Date.now(),
  };

  window.localStorage.setItem(STARTUP_PROFILE_PREFILL_KEY, JSON.stringify(next));
}

export function clearStartupProfilePrefill() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STARTUP_PROFILE_PREFILL_KEY);
}

function assignString(target: StartupProfilePrefill, key: keyof StartupProfilePrefill, value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    target[key] = String(value) as never;
    return;
  }

  if (typeof value !== "string") return;
  const trimmed = value.trim();
  if (!trimmed) return;
  target[key] = trimmed as never;
}

function normalizeStage(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase().replace(/_/g, "-");
  if (normalized === "idea" || normalized === "preseed" || normalized === "pre-seed") return "pre-revenue";
  if (normalized === "series-a" || normalized === "series a") return "series-a";
  if (normalized === "series-b" || normalized === "series b" || normalized === "series-b+") return "series-b+";
  return ALLOWED_STAGES.has(normalized) ? normalized : null;
}

function hasProfileValues(prefill: StartupProfilePrefill) {
  return Boolean(
    prefill.companyName ||
    prefill.websiteUrl ||
    prefill.industry ||
    prefill.description ||
    prefill.arr ||
    prefill.monthlyGrowthRate ||
    prefill.teamSize ||
    prefill.totalAddressableMarket
  );
}
