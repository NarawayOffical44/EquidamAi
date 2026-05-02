'use client';

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import {
  Currency,
  getAvailableCurrencies,
  getDefaultCurrency,
  getRegionFromCountry,
  CURRENCY_CONFIG,
} from '@/lib/utils/currency';
import { getCountryCode, cacheCountryCode } from '@/lib/utils/geolocation';

interface CurrencyToggleProps {
  onCurrencyChange: (currency: Currency) => void;
  initialCurrency?: Currency;
  forceShow?: boolean; // Always show toggle even if only one currency available
}

export function CurrencyToggle({ onCurrencyChange, initialCurrency, forceShow = false }: CurrencyToggleProps) {
  const [currency, setCurrency] = useState<Currency>(initialCurrency || 'USD');
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>(['USD']);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<string>('');

  useEffect(() => {
    const detectCurrency = async () => {
      try {
        // Get user's country code
        const countryCode = await getCountryCode();

        if (countryCode) {
          cacheCountryCode(countryCode);
          const detectedRegion = getRegionFromCountry(countryCode);
          setRegion(countryCode);

          // Get available currencies for this region
          const available = getAvailableCurrencies(detectedRegion);
          setAvailableCurrencies(available);

          // Set default currency based on region
          const defaultCurrency = getDefaultCurrency(detectedRegion);
          setCurrency(defaultCurrency);
          onCurrencyChange(defaultCurrency);
        }
      } catch (error) {
        console.error('Failed to detect currency:', error);
        // Fallback to USD
        setAvailableCurrencies(['USD']);
        setCurrency('USD');
        onCurrencyChange('USD');
      } finally {
        setLoading(false);
      }
    };

    detectCurrency();
  }, [onCurrencyChange]);

  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    onCurrencyChange(newCurrency);

    // Cache the user's preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred_currency', newCurrency);
    }
  };

  // Show at least 2 currencies for pricing page (INR + USD, or EUR + USD)
  const displayCurrencies = forceShow
    ? ['USD', 'INR', 'EUR'].filter((c): c is Currency => {
        const isValidCurrency = (val: any): val is Currency =>
          val === 'USD' || val === 'INR' || val === 'EUR';
        return isValidCurrency(c) && (availableCurrencies.includes(c) || forceShow);
      })
    : availableCurrencies;

  // Hide toggle if only one currency and not forced to show
  if (displayCurrencies.length <= 1 && !forceShow) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
        <Globe className="w-4 h-4 text-gray-400 ml-3" />
        {displayCurrencies.map((c) => (
          <button
            key={c}
            onClick={() => handleCurrencyChange(c)}
            className={`px-4 py-2 rounded font-semibold text-sm transition-all ${
              currency === c
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            disabled={loading}
          >
            {c} {CURRENCY_CONFIG[c].symbol}
          </button>
        ))}
      </div>
      {region && !forceShow && (
        <span className="text-xs text-gray-400">
          🌍 {region}
        </span>
      )}
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
