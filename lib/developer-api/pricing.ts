export const API_CREDIT_CURRENCY = "USD";
export const API_RATE_LIMIT_PER_MINUTE = 60;
export const API_MIN_TOP_UP_USD = 5;
export const API_MAX_TOP_UP_USD = 10_000;
export const MICRO_USD_PER_USD = 1_000_000;

export function getApiUsdPerMillionTokens() {
  const value = Number(process.env.EVALDAM_API_USD_PER_MILLION_TOKENS || 0);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export const API_MODEL_PRICING = {
  "evaldam-model": {
    model: "evaldam-model",
    label: "Evaldam Model",
    usdPerMillionTokens: getApiUsdPerMillionTokens(),
    description: "General Evaldam AI model call for startup, finance, and valuation workflows.",
  },
} as const;

export type ApiModelKey = keyof typeof API_MODEL_PRICING;

export function getApiModelPricing(model?: string | null) {
  const key = String(model || "evaldam-model") as ApiModelKey;
  return API_MODEL_PRICING[key] || API_MODEL_PRICING["evaldam-model"];
}

export function estimateTokenCount(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function calculateApiCostMicroUsd(tokenCount: number) {
  const usdPerMillionTokens = getApiUsdPerMillionTokens();
  if (!usdPerMillionTokens) return null;
  return Math.max(1, Math.ceil((Math.max(1, tokenCount) * usdPerMillionTokens * MICRO_USD_PER_USD) / 1_000_000));
}

export function usdToMicroUsd(amountUsd: number) {
  return Math.round(amountUsd * MICRO_USD_PER_USD);
}

export function microUsdToUsd(amountMicroUsd: number) {
  return amountMicroUsd / MICRO_USD_PER_USD;
}

export function formatApiUsd(amountMicroUsd: number) {
  return `$${microUsdToUsd(amountMicroUsd).toFixed(2)}`;
}
