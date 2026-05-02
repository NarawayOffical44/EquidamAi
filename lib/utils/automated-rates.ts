/**
 * Automated Exchange Rate Management System
 * Server-side caching, periodic updates, Stripe sync
 */

import { createAdminClient } from '@/lib/supabase/admin';

export interface ExchangeRateRecord {
  currency: string;
  rate: number;
  best_rate: number; // Highest rate ever seen
  last_updated: string;
  updated_at: string;
}

const RATE_UPDATE_INTERVAL = 3600000; // 1 hour
const RATES_TABLE = 'exchange_rates';

/**
 * Get cached rates from Supabase (server-side persistent cache)
 */
export async function getCachedRates(): Promise<Record<string, ExchangeRateRecord>> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from(RATES_TABLE)
      .select('*');

    if (error) throw error;

    const rates: Record<string, ExchangeRateRecord> = {};
    if (data) {
      data.forEach((record: any) => {
        rates[record.currency] = record;
      });
    }
    return rates;
  } catch (error) {
    console.error('Failed to get cached rates from Supabase:', error);
    return {};
  }
}

/**
 * Fetch fresh rates from API and update cache automatically
 */
export async function refreshExchangeRates(): Promise<Record<string, number>> {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!response.ok) throw new Error('Failed to fetch rates');

    const data = await response.json();
    const freshRates = data.rates || {};

    // Auto-update Supabase cache
    await updateRatesInDatabase(freshRates);

    return freshRates;
  } catch (error) {
    console.error('Failed to refresh exchange rates:', error);
    // Return cached rates as fallback
    const cached = await getCachedRates();
    const fallback: Record<string, number> = {};
    Object.entries(cached).forEach(([currency, record]) => {
      fallback[currency] = record.rate;
    });
    return fallback;
  }
}

/**
 * Auto-update rates in database and track best rates
 */
async function updateRatesInDatabase(freshRates: Record<string, number>): Promise<void> {
  try {
    const supabase = createAdminClient();
    const cached = await getCachedRates();
    const now = new Date().toISOString();

    const updates = Object.entries(freshRates).map(([currency, rate]) => {
      const cached_record = cached[currency];
      const best_rate = cached_record
        ? Math.max(cached_record.best_rate || rate, rate)
        : rate;

      return {
        currency,
        rate,
        best_rate,
        last_updated: now,
        updated_at: now,
      };
    });

    // Upsert rates (auto-create or update)
    for (const update of updates) {
      await supabase
        .from(RATES_TABLE)
        .upsert(update, { onConflict: 'currency' });
    }
  } catch (error) {
    console.error('Failed to update rates in database:', error);
  }
}

/**
 * Get current best rate for a currency (auto-loaded from DB)
 */
export async function getBestRateForCurrency(currency: string): Promise<number> {
  try {
    const cached = await getCachedRates();
    const record = cached[currency];

    if (record) {
      return record.best_rate || record.rate || 1;
    }
  } catch (error) {
    console.warn(`Failed to get best rate for ${currency}:`, error);
  }

  // Fallback defaults
  const fallbacks: Record<string, number> = {
    INR: 83.5,
    EUR: 0.92,
    USD: 1,
  };

  return fallbacks[currency] || 1;
}

/**
 * Auto-calculate pricing for all currencies (called by scheduled job)
 */
export async function autoCalculatePricing() {
  try {
    // Ensure rates are fresh
    await refreshExchangeRates();

    // Get best rates
    const inrRate = await getBestRateForCurrency('INR');
    const eurRate = await getBestRateForCurrency('EUR');

    // Base USD prices (from Founder/Advisor plans)
    const founderUSD = 60;
    const advisorUSD = 120;

    // Calculate optimized prices with rounding
    const roundINR = (price: number) => Math.round(price / 50) * 50;
    const roundEUR = (price: number) => Math.round(price / 5) * 5;

    const pricing = {
      INR: {
        founder: roundINR(founderUSD * inrRate),
        advisor: roundINR(advisorUSD * inrRate),
      },
      EUR: {
        founder: roundEUR(founderUSD * eurRate),
        advisor: roundEUR(advisorUSD * eurRate),
      },
      USD: {
        founder: founderUSD,
        advisor: advisorUSD,
      },
    };

    // Save to Supabase for reference
    const supabase = createAdminClient();
    await supabase
      .from('pricing_cache')
      .upsert({ id: 'latest', pricing, updated_at: new Date().toISOString() });

    console.log('✓ Pricing auto-calculated:', pricing);
    return pricing;
  } catch (error) {
    console.error('Failed to auto-calculate pricing:', error);
  }
}

/**
 * Setup automatic rate updates (call on server startup)
 */
export function setupAutomatedRateUpdates() {
  if (typeof window !== 'undefined') return; // Skip on client

  // Initial refresh
  refreshExchangeRates().catch(console.error);

  // Auto-refresh every hour
  setInterval(() => {
    refreshExchangeRates().catch(console.error);
  }, RATE_UPDATE_INTERVAL);

  // Auto-calculate pricing every 6 hours
  setInterval(() => {
    autoCalculatePricing().catch(console.error);
  }, 6 * 60 * 60 * 1000);

  console.log('✓ Automated rate updates initialized');
}
