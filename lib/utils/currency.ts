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

// Exchange rate cache with 6-hour TTL
let exchangeRateCache: { rates: Record<string, number>; timestamp: number } | null = null;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

// Store best rates seen (higher rates = better for revenue)
let bestRatesCache: Record<string, number> | null = null;

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

  // Fallback rates (updated regularly, approximate)
  const fallbackRates: Record<string, number> = {
    USD: 1,
    INR: 83.5,  // 1 USD = ~83.5 INR
    EUR: 0.92,  // 1 USD = ~0.92 EUR
  };

  exchangeRateCache = { rates: fallbackRates, timestamp: now };
  return fallbackRates;
}

/**
 * Get best rates (highest rates ever seen for this session/day)
 * Keeps the higher end of exchange rates for pricing stability
 */
async function getBestRates(): Promise<Record<string, number>> {
  if (!bestRatesCache) {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('best_exchange_rates');
      if (stored) {
        try {
          bestRatesCache = JSON.parse(stored);
        } catch (e) {
          console.warn('Failed to parse best rates from localStorage:', e);
        }
      }
    }

    if (!bestRatesCache) {
      // Initialize with current rates
      bestRatesCache = await getExchangeRates();
    }
  }

  // Update with current rates if higher
  const currentRates = await getExchangeRates();
  const updatedRates = { ...bestRatesCache };
  let ratesChanged = false;

  for (const [currency, currentRate] of Object.entries(currentRates)) {
    const bestRate = bestRatesCache[currency] || 0;
    if (currentRate > bestRate) {
      updatedRates[currency] = currentRate;
      ratesChanged = true;
    }
  }

  if (ratesChanged) {
    bestRatesCache = updatedRates;
    if (typeof window !== 'undefined') {
      localStorage.setItem('best_exchange_rates', JSON.stringify(updatedRates));
    }
  }

  return updatedRates;
}

/**
 * Convert USD price to target currency using best (highest) rates
 * @param usdAmount - Amount in USD
 * @param targetCurrency - Target currency (INR, EUR, etc)
 * @param useBestRate - If true, uses highest rate ever seen; if false, uses current rate (default: true)
 */
export async function convertPrice(usdAmount: number, targetCurrency: Currency, useBestRate: boolean = true): Promise<number> {
  if (targetCurrency === 'USD') return usdAmount;

  const rates = useBestRate ? await getBestRates() : await getExchangeRates();
  const rate = rates[targetCurrency] || 1;
  return Math.round(usdAmount * rate);
}

export const PRICING_BY_CURRENCY: Record<Currency, PricingTier> = {
  INR: {
    name: 'INR',
    pro_price: 417,         // ₹416/month (displayed as monthly equivalent)
    plus_price: 833,        // ₹833/month (displayed as monthly equivalent)
    pro_annual: 4999,       // ₹4,999/year (Founder plan)
    plus_annual: 9999,      // ₹9,999/year (Advisor plan)
  },
  USD: {
    name: 'USD',
    pro_price: 5,           // $60/year ÷ 12 months (displayed as monthly equivalent)
    plus_price: 10,         // $120/year ÷ 12 months (displayed as monthly equivalent)
    pro_annual: 60,         // $60/year (Founder plan)
    plus_annual: 120,       // $120/year (Advisor plan)
  },
  EUR: {
    name: 'EUR',
    pro_price: 5,           // €55/year ÷ 12 months (displayed as monthly equivalent)
    plus_price: 9,          // €110/year ÷ 12 months (displayed as monthly equivalent)
    pro_annual: 55,         // €55/year (Founder plan)
    plus_annual: 110,       // €110/year (Advisor plan)
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
 * Get dynamic pricing with real-time exchange rates (best rates)
 * Converts USD base prices to target currency using best (highest) rates
 */
export async function getDynamicPricing(currency: Currency): Promise<PricingTier> {
  if (currency === 'USD') {
    return PRICING_BY_CURRENCY['USD'];
  }

  const baseUSD = PRICING_BY_CURRENCY['USD'];
  const rates = await getBestRates();
  const rate = rates[currency] || 1;

  // Round to nearest 100/50 for nicer pricing
  const roundPrice = (price: number) => {
    if (currency === 'INR') {
      // Round to nearest 50 for INR
      return Math.round(price / 50) * 50;
    }
    // For EUR and others, round to nearest 5
    return Math.round(price / 5) * 5;
  };

  return {
    name: currency,
    pro_price: roundPrice(baseUSD.pro_annual * rate / 12),
    plus_price: roundPrice(baseUSD.plus_annual * rate / 12),
    pro_annual: roundPrice(baseUSD.pro_annual * rate),
    plus_annual: roundPrice(baseUSD.plus_annual * rate),
  };
}

/**
 * Get Stripe price ID for a specific plan and billing cycle
 */
export function getStripePriceId(currency: Currency, plan: 'pro' | 'plus', billingCycle: 'monthly' | 'annual'): string {
  const key = `${plan}_${billingCycle}`;
  return STRIPE_PRICE_IDS[currency]?.[key] || '';
}
