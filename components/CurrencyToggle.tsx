'use client';

import { useState, useEffect } from 'react';
import {
  Currency,
  getAvailableCurrencies,
  getRegionFromCountry,
  CURRENCY_CONFIG,
} from '@/lib/utils/currency';
import { getCountryCode } from '@/lib/utils/geolocation';

interface CurrencyToggleProps {
  onCurrencyChange: (currency: Currency) => void;
  initialCurrency?: Currency;
}

const LOCALE_TO_CURRENCY: Record<string, Currency> = {
  'en-IN': 'INR',
  'hi': 'INR',
  'gu': 'INR',
  'ta': 'INR',
  'te': 'INR',
  'kn': 'INR',
  'ml': 'INR',
  'de': 'EUR',
  'fr': 'EUR',
  'it': 'EUR',
  'es': 'EUR',
  'nl': 'EUR',
  'pl': 'EUR',
  'pt': 'EUR',
  'en-GB': 'USD',
  'en-US': 'USD',
};

export function CurrencyToggle({ onCurrencyChange, initialCurrency }: CurrencyToggleProps) {
  const selectedCurrency = initialCurrency || 'USD';
  const [detectedCurrency, setDetectedCurrency] = useState<Currency>('USD');
  const [loading, setLoading] = useState(true);
  const localCurrency = selectedCurrency !== 'USD' ? selectedCurrency : detectedCurrency;

  useEffect(() => {
    const detectLocalCurrency = async () => {
      try {
        let detectedCurrency: Currency | null = null;

        // Method 1: Browser locale
        if (typeof window !== 'undefined' && navigator.language) {
          const locale = navigator.language;
          const localeBase = locale.split('-')[0];
          detectedCurrency = LOCALE_TO_CURRENCY[locale] || LOCALE_TO_CURRENCY[localeBase] || null;
        }

        // Method 2: IP-based geolocation (fallback)
        if (!detectedCurrency) {
          try {
            const countryCode = await getCountryCode();
            if (countryCode) {
              const region = getRegionFromCountry(countryCode);
              const available = getAvailableCurrencies(region);
              detectedCurrency = available[0] === 'USD' ? (available[1] || 'USD') : available[0];
            }
          } catch (error) {
            console.warn('IP geolocation failed:', error);
          }
        }

        if (detectedCurrency && detectedCurrency !== 'USD') {
          setDetectedCurrency(detectedCurrency);
        }
      } catch (error) {
        console.error('Failed to detect currency:', error);
      } finally {
        setLoading(false);
      }
    };

    detectLocalCurrency();
  }, []);

  const handleToggle = (newCurrency: Currency) => {
    onCurrencyChange(newCurrency);
  };

  // Only show toggle if there's a local currency different from USD
  if (loading || localCurrency === 'USD') {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      <div className="inline-flex gap-0 rounded-[4px] border border-gray-300 bg-white p-1">
        <button
          onClick={() => handleToggle('USD')}
          className={`px-6 py-2.5 rounded-[2px] font-semibold text-sm transition-all ${
            selectedCurrency === 'USD'
              ? 'border border-primary/20 bg-white text-primary'
              : 'text-gray-500 hover:text-gray-700 bg-transparent'
          }`}
        >
          USD {CURRENCY_CONFIG['USD'].symbol}
        </button>
        <button
          onClick={() => handleToggle(localCurrency)}
          className={`px-6 py-2.5 rounded-[2px] font-semibold text-sm transition-all ${
            selectedCurrency === localCurrency
              ? 'border border-primary/20 bg-white text-primary'
              : 'text-gray-500 hover:text-gray-700 bg-transparent'
          }`}
        >
          {localCurrency} {CURRENCY_CONFIG[localCurrency].symbol}
        </button>
      </div>
    </div>
  );
}

/**
 * Hook for managing currency state across pricing page
 */
export function useCurrency(storageKey = 'selected_currency') {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (!active) return;

      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(storageKey) as Currency | null;
        if (stored) {
          setCurrency(stored);
        }
      }
      setIsLoaded(true);
    });

    return () => {
      active = false;
    };
  }, [storageKey]);

  const updateCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, newCurrency);
    }
  };

  return { currency, updateCurrency, isLoaded };
}
