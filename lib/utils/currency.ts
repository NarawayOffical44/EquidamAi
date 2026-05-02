/**
 * Currency configuration and utilities
 * Supports INR/USD for India, USD/EUR for Europe, USD for others
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

export const PRICING_BY_CURRENCY: Record<Currency, PricingTier> = {
  INR: {
    name: 'INR',
    pro_price: 7999,        // ₹7,999/month
    plus_price: 15999,      // ₹15,999/month
    pro_annual: 79990,      // ₹79,990/year (10% discount = ~₹6,666/month)
    plus_annual: 159990,    // ₹159,990/year (10% discount = ~₹13,332/month)
  },
  USD: {
    name: 'USD',
    pro_price: 99,          // $99/month
    plus_price: 199,        // $199/month
    pro_annual: 1069,       // $1,069/year (10% discount)
    plus_annual: 2159,      // $2,159/year (10% discount)
  },
  EUR: {
    name: 'EUR',
    pro_price: 89,          // €89/month
    plus_price: 179,        // €179/month
    pro_annual: 963,        // €963/year (10% discount)
    plus_annual: 1939,      // €1,939/year (10% discount)
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
 * Format price based on currency
 */
export function formatPrice(amount: number, currency: Currency): string {
  const config = CURRENCY_CONFIG[currency];
  const formatted = (amount / 100).toLocaleString(config.locale, {
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
