/**
 * Geolocation detection utility
 * Detects user region from various sources
 */

export interface GeoLocationData {
  country_code: string;
  country_name: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

/**
 * Get country code from browser
 * Uses navigator.language or localStorage fallback
 */
export function getBrowserCountry(): string | null {
  // Try from localStorage first (previously detected)
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('user_country_code');
    if (cached) return cached;

    // Try from navigator.language
    const lang = navigator.language;
    if (lang && lang.length >= 5) {
      const countryCode = lang.substring(3, 5).toUpperCase();
      return countryCode;
    }
  }

  return null;
}

/**
 * Detect geolocation from server-side API response
 * Can use CloudFlare headers, IP geolocation services, etc.
 */
export async function detectGeolocationServer(req?: any): Promise<GeoLocationData | null> {
  try {
    // Check for CloudFlare headers (if behind CloudFlare)
    if (req?.headers) {
      const cfCountry = req.headers.get('cf-ipcountry');
      if (cfCountry) {
        return {
          country_code: cfCountry,
          country_name: cfCountry,
          region: cfCountry,
          city: '',
          latitude: 0,
          longitude: 0,
          timezone: '',
        };
      }
    }

    // Fallback: Try to fetch from free IP geolocation service
    // Note: This should only be called on server side
    const response = await fetch('https://ipapi.co/json/', {
      headers: { 'User-Agent': 'Evaldam/1.0' },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        country_code: data.country_code || 'US',
        country_name: data.country_name || '',
        region: data.region || '',
        city: data.city || '',
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        timezone: data.timezone || '',
      };
    }
  } catch (error) {
    console.error('Geolocation detection error:', error);
  }

  return null;
}

/**
 * Detect region from client-side geolocation API
 * Less reliable than server-side but doesn't require API calls
 */
export function detectRegionClient(): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          // We got location permission, but we don't actually need coordinates
          // This is just to confirm user location access
          resolve(getBrowserCountry());
        },
        () => {
          // User denied permission or error
          resolve(getBrowserCountry());
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    } else {
      resolve(getBrowserCountry());
    }
  });
}

/**
 * Store detected country in localStorage for future use
 */
export function cacheCountryCode(countryCode: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user_country_code', countryCode);
    localStorage.setItem('user_country_code_timestamp', Date.now().toString());
  }
}

/**
 * Check if cached country code is still valid (24 hours)
 */
export function isCachedCountryValid(): boolean {
  if (typeof window !== 'undefined') {
    const timestamp = localStorage.getItem('user_country_code_timestamp');
    if (timestamp) {
      const age = Date.now() - parseInt(timestamp);
      return age < 24 * 60 * 60 * 1000; // 24 hours
    }
  }
  return false;
}

/**
 * Get or detect country code with caching
 */
export async function getCountryCode(): Promise<string> {
  // Check if we have a valid cached value
  if (isCachedCountryValid()) {
    const cached = localStorage.getItem('user_country_code');
    if (cached) return cached;
  }

  // Try browser detection first
  let country = getBrowserCountry();
  if (country) {
    cacheCountryCode(country);
    return country;
  }

  // Default to US
  return 'US';
}
