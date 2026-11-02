/**
 * CITYREACH Geo-Location Service
 * Accurately detects user location for country-specific blog feeds (/in, /ae, /blog)
 * Combines User Preference Cache, Timezone Heuristics, and Fast IP Geolocation.
 */

const STORAGE_KEY = 'cityreach_country_override';

/**
 * Normalizes any country string from stored content or user input into standard codes ('IN' | 'AE' | 'ALL' | 'OTHER')
 */
export function normalizeCountryCode(countryStr) {
  if (!countryStr) return 'ALL';
  const clean = String(countryStr).trim().toLowerCase();

  // India matching
  if (
    clean === 'in' ||
    clean === 'ind' ||
    clean === 'india' ||
    clean === 'bharat' ||
    clean.includes('india')
  ) {
    return 'IN';
  }

  // UAE matching
  if (
    clean === 'ae' ||
    clean === 'uae' ||
    clean === 'united arab emirates' ||
    clean === 'dubai' ||
    clean === 'abu dhabi' ||
    clean.includes('emirates')
  ) {
    return 'AE';
  }

  // Global matching
  if (
    clean === 'all' ||
    clean === 'global' ||
    clean === 'worldwide' ||
    clean === '*' ||
    clean === 'any' ||
    clean === 'international'
  ) {
    return 'ALL';
  }

  return clean.toUpperCase();
}

/**
 * Checks browser timezone as an instant zero-latency heuristic
 */
function detectFromTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Kolkata') || tz.includes('Calcutta') || tz.includes('India')) {
      return 'IN';
    }
    if (tz.includes('Dubai') || tz.includes('Muscat') || tz.includes('Abu_Dhabi') || tz.includes('Riyadh')) {
      return 'AE';
    }
  } catch (e) {
    // ignore
  }
  return null;
}

/**
 * Checks browser languages/locale heuristic
 */
function detectFromLocale() {
  try {
    const lang = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    if (lang.toLowerCase().includes('-in') || lang.toLowerCase().includes('_in')) {
      return 'IN';
    }
    if (lang.toLowerCase().includes('-ae') || lang.toLowerCase().includes('_ae')) {
      return 'AE';
    }
  } catch (e) {
    // ignore
  }
  return null;
}

/**
 * Fetches country code via IP Geolocation with strict timeout (1500ms)
 */
async function detectFromIp() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500);

  try {
    // Try primary fast geo API
    const response = await fetch('https://ipapi.co/json/', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      if (data && data.country_code) {
        return normalizeCountryCode(data.country_code);
      }
    }
  } catch (err) {
    // Fallback attempt with secondary geo endpoint
    try {
      const fallbackRes = await fetch('https://api.country.is/', {
        signal: controller.signal
      });
      if (fallbackRes.ok) {
        const fbData = await fallbackRes.json();
        if (fbData && fbData.country) {
          return normalizeCountryCode(fbData.country);
        }
      }
    } catch (e) {
      // ignore
    }
  } finally {
    clearTimeout(timeoutId);
  }

  return null;
}

/**
 * Main detection routine:
 * 1. Checks localStorage preference
 * 2. Checks Timezone & Locale (instant)
 * 3. Checks IP API (async background)
 */
export async function detectUserCountry() {
  // 1. Manual user override
  const savedPref = localStorage.getItem(STORAGE_KEY);
  if (savedPref) {
    return {
      countryCode: normalizeCountryCode(savedPref),
      source: 'user_saved'
    };
  }

  // 2. Instant heuristics
  const tzDetected = detectFromTimezone();
  if (tzDetected) {
    return {
      countryCode: tzDetected,
      source: 'timezone'
    };
  }

  const localeDetected = detectFromLocale();
  if (localeDetected) {
    return {
      countryCode: localeDetected,
      source: 'locale'
    };
  }

  // 3. IP lookup
  const ipDetected = await detectFromIp();
  if (ipDetected) {
    return {
      countryCode: ipDetected,
      source: 'ip'
    };
  }

  // 4. Default: ALL / Other
  return {
    countryCode: 'ALL',
    source: 'fallback'
  };
}

/**
 * Saves user explicit country selection
 */
export function setCountryPreference(code) {
  const normalized = normalizeCountryCode(code);
  localStorage.setItem(STORAGE_KEY, normalized);
}

/**
 * Clears user country preference
 */
export function clearCountryPreference() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Returns human-readable label and flag for country code
 */
export function getCountryMeta(code) {
  const norm = normalizeCountryCode(code);
  switch (norm) {
    case 'IN':
      return { code: 'IN', slug: 'in', name: 'India', flag: '🇮🇳', label: 'India Edition' };
    case 'AE':
      return { code: 'AE', slug: 'ae', name: 'UAE', flag: '🇦🇪', label: 'UAE Edition' };
    case 'ALL':
    default:
      return { code: 'ALL', slug: 'blog', name: 'Global', flag: '🌐', label: 'Global Edition' };
  }
}
