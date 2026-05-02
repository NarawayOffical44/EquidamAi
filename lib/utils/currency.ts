/**
 * Currency configuration and utilities
 * Supports INR/USD for India, USD/EUR for Europe, USD for others
 * Uses live exchange rates for accurate conversion
 */

export type Currency = 'INR' | 'USD' | 'EUR';
export type Region = 'india' | 'eu' | 'us' | 'other';

export interface PricingTier {
  name: string;
  free_price?: number;
  pro_price: number;
  plus_price: number;
  pro_annual: number;
  plus_annual: number;
}

export const CURRENCY_CONFIG: Record<Currency, { symbol: string; name: string; locale: string }> = {
  INR: { symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  USD: { symbol: '$', name: 'US Dollar', locale: 'en-US' },
  EUR: { symbol: '€', name: 'Euro', locale: 'de-DE' },
};

// Base pricing in USD (source of truth)
const BASE_PRICING_USD = {
  pro_price: 99,
  plus_price: 199,
  pro_annual: 1069,
  plus_annual: 2159,
};

// Exchange rate cache with 6-hour TTL
let exchangeRateCache: { rates: Record<string, number>; timestamp: number } | null = null;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Fetch live exchange rates from Open Exchange Rates or fallback rates
 */
async function getExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now();

  // Return cached rates if valid
  if (exchangeRateCache && now - exchangeRateCache.timestamp < CACHE_TTL) {
    return exchangeRateCache.rates;
  }

  try {
    // Try to fetch from Open Exchange Rates API (free tier)
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 3600 } // Cache for 1 hour at edge
    });

    if (response.ok) {
      const data = await response.json();
      const rates = data.rates || {};
      exchangeRateCache = { rates, timestamp: now };
      return rates;
    }
  } catch (error) {
    console.warn('Failed to fetch live exchange rates:', error);
  }

  // Fallback rates (updated daily, approximate)
  const fallbackRates: Record<string, number> = {
    USD: 1,
    INR: 83.5,  // 1 USD = ~83.5 INR
    EUR: 0.92,  // 1 USD = ~0.92 EUR
  };

  exchangeRateCache = { rates: fallbackRates, timestamp: now };
  return fallbackRates;
}

/**
 * Convert USD price to target currency
 */
export async function convertPrice(usdAmount: number, targetCurrency: Currency): Promise<number> {
  if (targetCurrency === 'USD') return usdAmount;

  const rates = await getExchangeRates();
  const rate = rates[targetCurrency] || 1;
  return Math.round(usdAmount * rate);
}

export const PRICING_BY_CURRENCY: Record<Currency, PricingTier> = {
  INR: {
    name: 'INR',
    pro_price: 8249,        // ₹8,249/month (~$99 at current rate)
    plus_price: 16599,      // ₹16,599/month (~$199 at current rate)
    pro_annual: 89331,      // ₹89,331/year (10% discount)
    plus_annual: 178884,    // ₹178,884/year (10% discount)
  },
  USD: {
    name: 'USD',
    pro_price: 99,
    plus_price: 199,
    pro_annual: 1069,
    plus_annual: 2159,
  },
  EUR: {
    name: 'EUR',
    pro_price: 91,          // €91/month (~$99 at current rate)
    plus_price: 183,        // €183/month (~$199 at current rate)
    pro_annual: 981,        // €981/year (10% discount)
    plus_annual: 1963,      // €1,963/year (10% discount)
  },
};

// Stripe price IDs for each currency/plan combination
export const STRIPE_PRICE_IDS: Record<string, Record<string, string>> = {
  INR: {
    pro_monthly: 'price_INR_pro_monthly',
    pro_annual: 'price_INR_pro_annual',
    plus_monthly: 'price_INR_plus_monthly',
    plus_annual: 'price_INR_plus_annual',
  },
  USD: {
    pro_monthly: 'price_USD_pro_monthly',
    pro_annual: 'price_USD_pro_annual',
    plus_monthly: 'price_USD_plus_monthly',
    plus_annual: 'price_USD_plus_annual',
  },
  EUR: {
    pro_monthly: 'price_EUR_pro_monthly',
    pro_annual: 'price_EUR_pro_annual',
    plus_monthly: 'price_EUR_plus_monthly',
    plus_annual: 'price_EUR_plus_annual',
  },
};

export const CURRENCY_REGIONS: Record<Region, { currencies: Currency[]; default: Currency }> = {
  india: { currencies: ['INR', 'USD'], default: 'INR' },
  eu: { currencies: ['EUR', 'USD'], default: 'EUR' },
  us: { currencies: ['USD'], default: 'USD' },
  other: { currencies: ['USD'], default: 'USD' },
};

/**
 * Detect region from country code
 */
export function getRegionFromCountry(countryCode: string): Region {
  const eu_countries = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH', 'GB', 'NO', 'IS'
  ];

  if (countryCode === 'IN') return 'india';
  if (eu_countries.includes(countryCode)) return 'eu';
  if (countryCode === 'US') return 'us';
  return 'other';
}

/**
 * Get default currency for a region
 */
export function getDefaultCurrency(region: Region): Currency {
  return CURRENCY_REGIONS[region].default;
}

/**
 * Get available currencies for a region
 */
export function getAvailableCurrencies(region: Region): Currency[] {
  return CURRENCY_REGIONS[region].currencies as Currency[];
}

/**
 * Format price based on currency (NO division by 100 - values are already in base currency)
 */
export function formatPrice(amount: number, currency: Currency): string {
  const config = CURRENCY_CONFIG[currency];
  const formatted = amount.toLocaleString(config.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${config.symbol}${formatted}`;
}

/**
 * Get pricing for a specific currency and plan
 */
export function getPricing(currency: Currency) {
  return PRICING_BY_CURRENCY[currency];
}

/**
 * Get Stripe price ID for a specific plan and billing cycle
 */
export function getStripePriceId(currency: Currency, plan: 'pro' | 'plus', billingCycle: 'monthly' | 'annual'): string {
  const key = `${plan}_${billingCycle}`;
  return STRIPE_PRICE_IDS[currency]?.[key] || '';
}
