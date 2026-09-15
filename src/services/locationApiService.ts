/**
 * AgriVerse AI - Global API-Based Administrative Location System
 * 
 * Free-first, dynamic geographic data service supporting:
 * Country -> Admin 1 (State/Province) -> Admin 2 (District/County) -> Admin 3 (Taluk/Tehsil/Sub-district) -> Localities/Villages
 * 
 * Integrates open public geographic APIs:
 * 1. CountriesNow API (Free, zero-auth global countries, ISO codes, states, and cities)
 * 2. OpenStreetMap Nominatim / Overpass (Free, structured administrative boundaries and Taluks/Tehsils)
 * 3. GeoNames API (Optional via VITE_GEONAMES_USERNAME for deep admin hierarchies)
 * 
 * Features:
 * - Dynamic administrative terminology per country
 * - Cascading live fetching with in-memory & sessionStorage caching
 * - Search across all levels
 * - No hardcoded static lists
 */

export interface CountryAdminTerminology {
  country: string;
  state: string;
  district: string;
  subDistrict: string;
  village: string;
}

export interface ApiCountry {
  name: string;
  code: string; // ISO 2-letter
  iso3?: string;
  flag: string;
  geonameId?: number;
}

export interface ApiState {
  name: string;
  code: string;
  countryCode: string;
  geonameId?: number;
}

export interface ApiDistrict {
  name: string;
  code?: string;
  stateName: string;
  countryCode: string;
  geonameId?: number;
}

export interface ApiSubDistrict {
  name: string;
  code?: string;
  districtName: string;
  stateName: string;
  countryCode: string;
  geonameId?: number;
  lat?: string;
  lon?: string;
}

export interface ApiVillage {
  name: string;
  subDistrictName?: string;
  districtName?: string;
  stateName?: string;
  countryCode?: string;
  postcode?: string;
  lat?: string;
  lon?: string;
}

export interface ApiSearchResult {
  formattedLabel: string;
  name: string;
  country: string;
  countryCode: string;
  flag: string;
  state?: string;
  stateCode?: string;
  district?: string;
  subDistrict?: string;
  village?: string;
  level: 'country' | 'state' | 'district' | 'subDistrict' | 'village';
  lat?: string;
  lon?: string;
}

// In-memory caches for fast UI response
const countryCache = new Map<string, ApiCountry[]>();
const stateCache = new Map<string, ApiState[]>();
const districtCache = new Map<string, ApiDistrict[]>();
const subDistrictCache = new Map<string, ApiSubDistrict[]>();
const searchCache = new Map<string, ApiSearchResult[]>();

/**
 * Get dynamic administrative terms based on ISO Country Code or Name
 */
export function getDynamicAdminTerms(countryNameOrCode: string): CountryAdminTerminology {
  const c = countryNameOrCode?.trim().toUpperCase() || '';

  if (c === 'IN' || c === 'INDIA') {
    return {
      country: 'Country',
      state: 'State / UT',
      district: 'District',
      subDistrict: 'Taluk / Tehsil / Sub-district',
      village: 'Village / Gram Panchayat'
    };
  }

  if (c === 'US' || c === 'USA' || c === 'UNITED STATES' || c === 'UNITED STATES OF AMERICA') {
    return {
      country: 'Country',
      state: 'State',
      district: 'County',
      subDistrict: 'Township / Municipality',
      village: 'Locality / Neighborhood'
    };
  }

  if (c === 'CA' || c === 'CAN' || c === 'CANADA') {
    return {
      country: 'Country',
      state: 'Province / Territory',
      district: 'County / Regional Municipality',
      subDistrict: 'Municipality / Township',
      village: 'Community / Settlement'
    };
  }

  if (c === 'GB' || c === 'UK' || c === 'UNITED KINGDOM' || c === 'GREAT BRITAIN') {
    return {
      country: 'Country',
      state: 'Constituent Country / Region',
      district: 'County / Unitary Authority',
      subDistrict: 'District / Borough',
      village: 'Parish / Town'
    };
  }

  if (c === 'AU' || c === 'AUS' || c === 'AUSTRALIA') {
    return {
      country: 'Country',
      state: 'State / Territory',
      district: 'Local Government Area (LGA)',
      subDistrict: 'Suburb / Ward',
      village: 'Locality / Settlement'
    };
  }

  if (c === 'JP' || c === 'JPN' || c === 'JAPAN') {
    return {
      country: 'Country',
      state: 'Prefecture',
      district: 'District / Subprefecture',
      subDistrict: 'Municipality (City/Town)',
      village: 'Village / Chō'
    };
  }

  if (c === 'DE' || c === 'DEU' || c === 'GERMANY') {
    return {
      country: 'Country',
      state: 'Federal State (Bundesland)',
      district: 'District (Landkreis)',
      subDistrict: 'Municipal Association (Amt)',
      village: 'Municipality (Gemeinde)'
    };
  }

  if (c === 'FR' || c === 'FRA' || c === 'FRANCE') {
    return {
      country: 'Country',
      state: 'Region',
      district: 'Department',
      subDistrict: 'Arrondissement / Canton',
      village: 'Commune / Village'
    };
  }

  if (c === 'BR' || c === 'BRA' || c === 'BRAZIL') {
    return {
      country: 'Country',
      state: 'State (Estado)',
      district: 'Mesoregion / Region',
      subDistrict: 'Municipality (Município)',
      village: 'District / Bairro'
    };
  }

  if (c === 'NG' || c === 'NGA' || c === 'NIGERIA') {
    return {
      country: 'Country',
      state: 'State',
      district: 'Local Government Area (LGA)',
      subDistrict: 'Ward / District',
      village: 'Community / Village'
    };
  }

  if (c === 'KE' || c === 'KEN' || c === 'KENYA') {
    return {
      country: 'Country',
      state: 'County',
      district: 'Sub-County',
      subDistrict: 'Ward',
      village: 'Village / Location'
    };
  }

  if (c === 'ZA' || c === 'ZAF' || c === 'SOUTH AFRICA') {
    return {
      country: 'Country',
      state: 'Province',
      district: 'District Municipality',
      subDistrict: 'Local Municipality',
      village: 'Ward / Village'
    };
  }

  if (c === 'PK' || c === 'PAK' || c === 'PAKISTAN') {
    return {
      country: 'Country',
      state: 'Province',
      district: 'District (Zilla)',
      subDistrict: 'Tehsil',
      village: 'Union Council / Village'
    };
  }

  if (c === 'BD' || c === 'BGD' || c === 'BANGLADESH') {
    return {
      country: 'Country',
      state: 'Division',
      district: 'District (Zila)',
      subDistrict: 'Upazila / Thana',
      village: 'Union / Village'
    };
  }

  if (c === 'PH' || c === 'PHL' || c === 'PHILIPPINES') {
    return {
      country: 'Country',
      state: 'Region',
      district: 'Province',
      subDistrict: 'City / Municipality',
      village: 'Barangay'
    };
  }

  if (c === 'ID' || c === 'IDN' || c === 'INDONESIA') {
    return {
      country: 'Country',
      state: 'Province (Provinsi)',
      district: 'Regency / City (Kabupaten/Kota)',
      subDistrict: 'District (Kecamatan)',
      village: 'Village (Desa/Kelurahan)'
    };
  }

  if (c === 'MX' || c === 'MEX' || c === 'MEXICO') {
    return {
      country: 'Country',
      state: 'State (Estado)',
      district: 'Municipality (Municipio)',
      subDistrict: 'Township / Parish',
      village: 'Locality / Pueblo'
    };
  }

  if (c === 'EG' || c === 'EGY' || c === 'EGYPT') {
    return {
      country: 'Country',
      state: 'Governorate (Muhafazah)',
      district: 'Markaz / District',
      subDistrict: 'Local Unit',
      village: 'Village (Qarya)'
    };
  }

  return {
    country: 'Country',
    state: 'State / Province',
    district: 'District / County',
    subDistrict: 'Sub-district / Municipality',
    village: 'Village / Locality'
  };
}

/**
 * Generate flag emoji from ISO-2 country code
 */
export function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * Fetch all countries dynamically from free open API
 */
export async function fetchAllCountries(): Promise<ApiCountry[]> {
  const cacheKey = 'all_countries';
  if (countryCache.has(cacheKey)) {
    return countryCache.get(cacheKey)!;
  }

  // Try sessionStorage
  try {
    const sessionData = sessionStorage.getItem('agri_geo_countries');
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      if (Array.isArray(parsed) && parsed.length > 50) {
        countryCache.set(cacheKey, parsed);
        return parsed;
      }
    }
  } catch (e) {
    // Ignore storage parse error
  }

  // 1. Fetch from free CountriesNow API
  try {
    const response = await fetch('https://countriesnow.space/api/v0.1/countries/states');
    if (response.ok) {
      const json = await response.json();
      if (!json.error && Array.isArray(json.data)) {
        const countries: ApiCountry[] = json.data
          .map((item: any) => {
            const code = item.iso2 || item.iso3?.substring(0, 2) || '';
            return {
              name: item.name,
              code: code.toUpperCase(),
              iso3: item.iso3,
              flag: getFlagEmoji(code)
            };
          })
          .filter((c: ApiCountry) => Boolean(c.name && c.code))
          .sort((a: ApiCountry, b: ApiCountry) => {
            if (a.name === 'India') return -1;
            if (b.name === 'India') return 1;
            return a.name.localeCompare(b.name);
          });

        if (countries.length > 0) {
          countryCache.set(cacheKey, countries);
          try {
            sessionStorage.setItem('agri_geo_countries', JSON.stringify(countries));
          } catch (e) { /* ignore */ }
          return countries;
        }
      }
    }
  } catch (err) {
    console.debug('CountriesNow API fetch note, trying secondary free source...', err);
  }

  // 2. Secondary: GeoNames countryInfoJSON if VITE_GEONAMES_USERNAME is set
  const geonamesUser = (import.meta as any).env?.VITE_GEONAMES_USERNAME || 'demo';
  try {
    const response = await fetch(`https://secure.geonames.net/countryInfoJSON?username=${geonamesUser}`);
    if (response.ok) {
      const json = await response.json();
      if (Array.isArray(json.geonames)) {
        const countries: ApiCountry[] = json.geonames.map((item: any) => ({
          name: item.countryName,
          code: item.countryCode,
          iso3: item.isoAlpha3,
          flag: getFlagEmoji(item.countryCode),
          geonameId: item.geonameId
        })).sort((a: ApiCountry, b: ApiCountry) => a.name.localeCompare(b.name));

        if (countries.length > 0) {
          countryCache.set(cacheKey, countries);
          return countries;
        }
      }
    }
  } catch (err) {
    console.debug('GeoNames country fetch note...', err);
  }

  throw new Error('Unable to load countries. Please check your connection and try again.');
}

/**
 * Fetch all first-level administrative divisions (States / Provinces / Regions) for a country dynamically
 */
export async function fetchStatesForCountry(countryName: string, countryCode?: string): Promise<ApiState[]> {
  if (!countryName || countryName === 'all') return [];

  const cacheKey = `states_${countryName.toLowerCase()}`;
  if (stateCache.has(cacheKey)) {
    return stateCache.get(cacheKey)!;
  }

  // 1. Fetch from CountriesNow API
  try {
    const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: countryName })
    });

    if (response.ok) {
      const json = await response.json();
      if (!json.error && json.data && Array.isArray(json.data.states)) {
        const states: ApiState[] = json.data.states
          .map((st: any) => ({
            name: st.name,
            code: st.state_code || '',
            countryCode: json.data.iso2 || countryCode || ''
          }))
          .filter((st: ApiState) => Boolean(st.name))
          .sort((a: ApiState, b: ApiState) => a.name.localeCompare(b.name));

        if (states.length > 0) {
          stateCache.set(cacheKey, states);
          return states;
        }
      }
    }
  } catch (err) {
    console.debug('CountriesNow state fetch note, trying OpenStreetMap...', err);
  }

  // 2. Secondary: OpenStreetMap Nominatim search for states/regions
  try {
    const params = new URLSearchParams({
      country: countryName,
      featuretype: 'state',
      format: 'json',
      addressdetails: '1',
      limit: '50'
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: { 'User-Agent': 'AgriVerseAI/1.0' }
    });

    if (response.ok) {
      const list = await response.json();
      if (Array.isArray(list) && list.length > 0) {
        const seen = new Set<string>();
        const states: ApiState[] = [];
        for (const item of list) {
          const name = item.name || item.address?.state || item.address?.province;
          if (name && !seen.has(name.toLowerCase())) {
            seen.add(name.toLowerCase());
            states.push({
              name,
              code: item.address?.['ISO3166-2-lvl4']?.split('-')[1] || '',
              countryCode: item.address?.country_code?.toUpperCase() || countryCode || ''
            });
          }
        }
        if (states.length > 0) {
          states.sort((a, b) => a.name.localeCompare(b.name));
          stateCache.set(cacheKey, states);
          return states;
        }
      }
    }
  } catch (err) {
    console.debug('OSM state fetch note...', err);
  }

  throw new Error(`Unable to load states/regions for ${countryName}. Please check your connection.`);
}

/**
 * Fetch second-level administrative divisions (Districts / Counties / Municipalities) dynamically
 */
export async function fetchDistrictsForState(
  countryName: string,
  stateName: string,
  countryCode?: string
): Promise<ApiDistrict[]> {
  if (!countryName || countryName === 'all' || !stateName || stateName === 'all') return [];

  const cacheKey = `districts_${countryName.toLowerCase()}_${stateName.toLowerCase()}`;
  if (districtCache.has(cacheKey)) {
    return districtCache.get(cacheKey)!;
  }

  // 1. Query CountriesNow city/district endpoint
  try {
    const response = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: countryName, state: stateName })
    });

    if (response.ok) {
      const json = await response.json();
      if (!json.error && Array.isArray(json.data) && json.data.length > 0) {
        // Remove duplicates and sort
        const unique = Array.from(new Set(json.data as string[]))
          .filter(Boolean)
          .map((name: string) => ({
            name,
            stateName,
            countryCode: countryCode || ''
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        if (unique.length > 0) {
          districtCache.set(cacheKey, unique);
          return unique;
        }
      }
    }
  } catch (err) {
    console.debug('CountriesNow district fetch note...', err);
  }

  // 2. Query OpenStreetMap Nominatim for counties/districts in state
  try {
    const params = new URLSearchParams({
      state: stateName,
      country: countryName,
      format: 'json',
      addressdetails: '1',
      limit: '50'
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: { 'User-Agent': 'AgriVerseAI/1.0' }
    });

    if (response.ok) {
      const list = await response.json();
      if (Array.isArray(list) && list.length > 0) {
        const seen = new Set<string>();
        const districts: ApiDistrict[] = [];
        for (const item of list) {
          const dName = item.address?.county || item.address?.state_district || item.address?.district || item.name;
          if (dName && !seen.has(dName.toLowerCase())) {
            seen.add(dName.toLowerCase());
            districts.push({
              name: dName,
              stateName,
              countryCode: countryCode || item.address?.country_code?.toUpperCase() || ''
            });
          }
        }
        if (districts.length > 0) {
          districts.sort((a, b) => a.name.localeCompare(b.name));
          districtCache.set(cacheKey, districts);
          return districts;
        }
      }
    }
  } catch (err) {
    console.debug('OSM district fetch note...', err);
  }

  throw new Error(`Unable to load districts for ${stateName}. Please check your connection.`);
}

/**
 * Fetch third-level administrative divisions (Taluks / Tehsils / Sub-districts / Townships) dynamically
 */
export async function fetchSubDistrictsForDistrict(
  countryName: string,
  stateName: string,
  districtName: string,
  countryCode?: string
): Promise<ApiSubDistrict[]> {
  if (!countryName || countryName === 'all' || !stateName || stateName === 'all' || !districtName || districtName === 'all') {
    return [];
  }

  const cacheKey = `subdistricts_${countryName.toLowerCase()}_${stateName.toLowerCase()}_${districtName.toLowerCase()}`;
  if (subDistrictCache.has(cacheKey)) {
    return subDistrictCache.get(cacheKey)!;
  }

  // 1. Structured OpenStreetMap query for sub-districts / taluks / tehsils / townships
  try {
    const isIndia = countryName.toLowerCase() === 'india' || countryCode === 'IN';
    const query = isIndia 
      ? `taluk ${districtName}` 
      : `${districtName} subdistrict ${stateName}`;

    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: '30'
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: { 'User-Agent': 'AgriVerseAI/1.0' }
    });

    if (response.ok) {
      const list = await response.json();
      if (Array.isArray(list) && list.length > 0) {
        const seen = new Set<string>();
        const subDistricts: ApiSubDistrict[] = [];

        for (const item of list) {
          const rawName = item.address?.county || item.address?.municipality || item.address?.town || item.name;
          if (rawName) {
            // Normalize name (keep clean title, e.g. "Bagepalli" or "Bagepalli Taluk")
            const cleanName = rawName.replace(/,.*$/, '').trim();
            if (cleanName && !seen.has(cleanName.toLowerCase())) {
              seen.add(cleanName.toLowerCase());
              subDistricts.push({
                name: cleanName,
                districtName,
                stateName,
                countryCode: countryCode || '',
                lat: item.lat,
                lon: item.lon
              });
            }
          }
        }

        if (subDistricts.length > 0) {
          subDistricts.sort((a, b) => a.name.localeCompare(b.name));
          subDistrictCache.set(cacheKey, subDistricts);
          return subDistricts;
        }
      }
    }
  } catch (err) {
    console.debug('OSM subdistrict fetch note...', err);
  }

  // If no lower admin level found from live query, return empty list (UI handles gracefully)
  return [];
}

/**
 * Search locations dynamically using live OpenStreetMap Nominatim with debouncing & caching
 */
export async function searchGlobalLocationsApi(
  query: string,
  countryHint?: string
): Promise<ApiSearchResult[]> {
  if (!query || query.trim().length < 2) return [];
  const normalizedQuery = `${query.trim().toLowerCase()}_${countryHint || 'all'}`;

  if (searchCache.has(normalizedQuery)) {
    return searchCache.get(normalizedQuery)!;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const searchQuery = countryHint && countryHint !== 'all' 
      ? `${query.trim()}, ${countryHint}`
      : query.trim();

    const params = new URLSearchParams({
      q: searchQuery,
      format: 'json',
      addressdetails: '1',
      limit: '10'
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'AgriVerseAI/1.0', 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const list = await response.json();
      if (Array.isArray(list)) {
        const results: ApiSearchResult[] = list.map((item: any) => {
          const addr = item.address || {};
          const country = addr.country || countryHint || 'Global';
          const countryCode = (addr.country_code || 'UN').toUpperCase();
          const state = addr.state || addr.region || addr.province || '';
          const district = addr.county || addr.state_district || addr.district || '';
          const subDistrict = addr.municipality || addr.suburb || addr.town || '';
          const village = addr.village || addr.hamlet || addr.neighbourhood || '';

          let level: ApiSearchResult['level'] = 'country';
          if (village) level = 'village';
          else if (subDistrict) level = 'subDistrict';
          else if (district) level = 'district';
          else if (state) level = 'state';

          return {
            formattedLabel: item.display_name,
            name: item.name || village || subDistrict || district || state || country,
            country,
            countryCode,
            flag: getFlagEmoji(countryCode),
            state: state || undefined,
            district: district || undefined,
            subDistrict: subDistrict || undefined,
            village: village || undefined,
            level,
            lat: item.lat,
            lon: item.lon
          };
        });

        searchCache.set(normalizedQuery, results);
        return results;
      }
    }
  } catch (err) {
    console.debug('Search dynamic API note...', err);
  }

  return [];
}
