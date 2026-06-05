/**
 * Federal Reserve Real-Time Interest Rate Data
 * Fetches current WACC components from FRED API
 */

export interface FedRatesData {
  riskFreeRate: number; // Current 10-year Treasury
  federalFundsRate: number; // Fed's current rate
  spreadAI: number; // AI sector risk premium
  spreadSaaS: number; // SaaS sector risk premium
  marketRiskPremium: number; // Historical market premium
  lastUpdated: string;
}

const FRED_API_KEY = process.env.FRED_API_KEY || ""; // Get from https://fred.stlouisfed.org/docs/api/
const LIVE_WACC_CACHE_TTL_MS = 15 * 60 * 1000;
let liveWaccCache: { data: FedRatesData; expiresAt: number } | null = null;
let liveWaccRequest: Promise<FedRatesData> | null = null;

async function fetchFredData(seriesId: string): Promise<number | null> {
  if (!FRED_API_KEY) {
    console.warn("FRED_API_KEY not set, using fallback rates");
    return null;
  }

  try {
    const response = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&limit=1&sort_order=desc`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.observations && data.observations.length > 0) {
      return parseFloat(data.observations[0].value) / 100; // Convert to decimal
    }
  } catch (error) {
    console.error(`Error fetching ${seriesId}:`, error);
  }

  return null;
}

async function fetchLiveWACC(): Promise<FedRatesData> {
  // Fetch real-time data from Federal Reserve
  const riskFreeRate = await fetchFredData("DGS10"); // 10-year Treasury
  const federalFundsRate = await fetchFredData("FEDFUNDS"); // Fed funds rate

  // Fallback to defaults if API fails
  const riskFree = riskFreeRate ?? 0.045; // 4.5% default
  const fedRate = federalFundsRate ?? 0.045; // 4.5% default

  // Risk premiums (these could also be fetched from market data)
  const spreadAI = 0.05; // 5% for AI sector volatility
  const spreadSaaS = 0.03; // 3% for SaaS sector

  return {
    riskFreeRate: riskFree,
    federalFundsRate: fedRate,
    spreadAI,
    spreadSaaS,
    marketRiskPremium: 0.065, // Historical average
    lastUpdated: new Date().toISOString(),
  };
}

export async function getLiveWACC(): Promise<FedRatesData> {
  const now = Date.now();
  if (liveWaccCache && liveWaccCache.expiresAt > now) {
    return liveWaccCache.data;
  }

  if (liveWaccRequest) {
    return liveWaccRequest;
  }

  liveWaccRequest = fetchLiveWACC()
    .then((data) => {
      liveWaccCache = {
        data,
        expiresAt: Date.now() + LIVE_WACC_CACHE_TTL_MS,
      };
      return data;
    })
    .finally(() => {
      liveWaccRequest = null;
    });

  return liveWaccRequest;
}

export function calculateWACC(industry: string, riskFreeRate: number): number {
  const marketRiskPremium = 0.065;
  const beta = industry === "ai" ? 1.5 : industry === "saas" ? 1.2 : 1.0;

  const costOfEquity = riskFreeRate + beta * marketRiskPremium;
  const wacc = Math.min(0.14, Math.max(0.09, costOfEquity)); // Clamp 9-14%

  return wacc;
}
