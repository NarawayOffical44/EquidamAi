import {
  getAvailableCurrencies,
  getDefaultCurrency,
  getRegionFromCountry,
  type Currency,
  type Region,
} from "@/lib/utils/currency";

export type BenchmarkRegion = Region;

export interface CountryBenchmarkPersonalization {
  countryCode: string;
  countryLabel: string;
  region: BenchmarkRegion;
  defaultCurrency: Currency;
  availableCurrencies: Currency[];
  headlineContext: string;
  proofLine: string;
  benchmarkLine: string;
  reportLine: string;
}

export const BENCHMARK_COUNTRY_OPTIONS = [
  { code: "", label: "Global" },
  { code: "IN", label: "India" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "SG", label: "Singapore" },
  { code: "AE", label: "UAE" },
  { code: "DE", label: "Germany" },
] as const;

const COUNTRY_ALIASES: Record<string, string> = {
  INDIA: "IN",
  IN: "IN",
  US: "US",
  USA: "US",
  "UNITED STATES": "US",
  "UNITED STATES OF AMERICA": "US",
  UK: "GB",
  GB: "GB",
  "UNITED KINGDOM": "GB",
  SINGAPORE: "SG",
  SG: "SG",
  UAE: "AE",
  "UNITED ARAB EMIRATES": "AE",
  AE: "AE",
  GERMANY: "DE",
  DE: "DE",
  EU: "EU",
  EUROPE: "EU",
};

const COUNTRY_LABELS: Record<string, string> = {
  GLOBAL: "Global",
  IN: "India",
  US: "United States",
  GB: "United Kingdom",
  SG: "Singapore",
  AE: "UAE",
  DE: "Germany",
  EU: "Europe",
};

const COUNTRY_FILTER_VARIANTS: Record<string, string[]> = {
  IN: ["IN", "India"],
  US: ["US", "USA", "United States", "United States of America"],
  GB: ["GB", "UK", "United Kingdom"],
  SG: ["SG", "Singapore"],
  AE: ["AE", "UAE", "United Arab Emirates"],
  DE: ["DE", "Germany"],
};

export function normalizeBenchmarkCountry(input?: string | null) {
  const normalized = String(input || "").trim();
  if (!normalized) return "GLOBAL";
  return COUNTRY_ALIASES[normalized.toUpperCase()] || normalized.toUpperCase();
}

export function getCountryFilterVariants(input?: string | null) {
  const countryCode = normalizeBenchmarkCountry(input);
  return COUNTRY_FILTER_VARIANTS[countryCode] || (countryCode === "GLOBAL" || countryCode === "EU" ? [] : [countryCode]);
}

export function getBenchmarkPersonalization(input?: string | null): CountryBenchmarkPersonalization {
  const countryCode = normalizeBenchmarkCountry(input);
  const region = countryCode === "GLOBAL" || countryCode === "EU" ? "other" : getRegionFromCountry(countryCode);
  const defaultCurrency: Currency = countryCode === "GLOBAL" ? "USD" : getDefaultCurrency(region);
  const availableCurrencies: Currency[] = countryCode === "GLOBAL" ? ["USD"] : getAvailableCurrencies(region);
  const countryLabel = COUNTRY_LABELS[countryCode] || countryCode;

  if (countryCode === "IN") {
    return {
      countryCode,
      countryLabel,
      region,
      defaultCurrency,
      availableCurrencies,
      headlineContext: "India-native benchmark context",
      proofLine: "Use INR context, RBI-linked assumptions, MCA/local signals where available, and Indian peer matching before investor discussions.",
      benchmarkLine: "Prioritize Indian peers by stage, industry, ARR, growth, and data freshness, then use global peers only when local data is sparse.",
      reportLine: "Carry the India context into the valuation report so assumptions, comparables, and sensitivity are easier to defend.",
    };
  }

  if (countryCode === "US") {
    return {
      countryCode,
      countryLabel,
      region,
      defaultCurrency,
      availableCurrencies,
      headlineContext: "US fundraising benchmark context",
      proofLine: "Use USD-denominated market context, peer ranges, and investor-ready assumptions for fundraising conversations.",
      benchmarkLine: "Compare similar companies by stage, industry, ARR, growth, and recent valuation signals.",
      reportLine: "Use benchmark context inside the report to explain where the valuation range is conservative or aggressive.",
    };
  }

  if (region === "eu" || countryCode === "EU") {
    return {
      countryCode,
      countryLabel,
      region: "eu",
      defaultCurrency: "EUR",
      availableCurrencies: ["EUR", "USD"] as Currency[],
      headlineContext: "European benchmark context",
      proofLine: "Use EUR context, country-aware peer comparisons, and cross-border market assumptions where relevant.",
      benchmarkLine: "Compare peers by stage, industry, country, ARR, growth, and data freshness without losing global context.",
      reportLine: "Use the report to connect valuation methods, country context, comparables, and investor questions.",
    };
  }

  return {
    countryCode,
    countryLabel,
    region,
    defaultCurrency,
    availableCurrencies,
    headlineContext: "Global benchmark context",
    proofLine: "Use country-aware benchmarks where available, then blend wider market context when local data is limited.",
    benchmarkLine: "Compare similar companies by stage, industry, location, ARR, growth, data quality, and recency.",
    reportLine: "Bring benchmark context into the report so the valuation is supported by more than one method or headline multiple.",
  };
}
