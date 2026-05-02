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

export function CurrencyToggle({ onCurrencyChange, initialCurrency }: CurrencyToggleProps) {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [localCurrency, setLocalCurrency] = useState<Currency>('USD');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectLocalCurrency = async () => {
      try {
        const countryCode = await getCountryCode();
        if (countryCode) {
          const region = getRegionFromCountry(countryCode);
          const available = getAvailableCurrencies(region);
          const local = available[0] === 'USD' ? (available[1] || 'USD') : available[0];
          setLocalCurrency(local as Currency);
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
    setCurrency(newCurrency);
    onCurrencyChange(newCurrency);
    localStorage.setItem('preferred_currency', newCurrency);
  };

  // Only show toggle if there's a local currency different from USD
  if (loading || localCurrency === 'USD') {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      <div className="inline-flex gap-0 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => handleToggle('USD')}
          className={`px-6 py-2.5 rounded font-semibold text-sm transition-all ${
            currency === 'USD'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 bg-transparent'
          }`}
        >
          USD {CURRENCY_CONFIG['USD'].symbol}
        </button>
        <button
          onClick={() => handleToggle(localCurrency)}
          className={`px-6 py-2.5 rounded font-semibold text-sm transition-all ${
            currency === localCurrency
              ? 'bg-white text-gray-900 shadow-sm'
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
    // Load from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey) as Currency | null;
      if (stored) {
        setCurrency(stored);
      }
    }
    setIsLoaded(true);
  }, [storageKey]);

  const updateCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, newCurrency);
    }
  };

  return { currency, updateCurrency, isLoaded };
}
