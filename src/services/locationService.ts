import {
  CountryAdminTerminology,
  ApiCountry,
  ApiState,
  ApiDistrict,
  ApiSubDistrict,
  ApiVillage,
  ApiSearchResult,
  getDynamicAdminTerms,
  getFlagEmoji,
  fetchAllCountries,
  fetchStatesForCountry,
  fetchDistrictsForState,
  fetchSubDistrictsForDistrict,
  searchGlobalLocationsApi
} from './locationApiService';

export type {
  CountryAdminTerminology,
  ApiCountry,
  ApiState,
  ApiDistrict,
  ApiSubDistrict,
  ApiVillage,
  ApiSearchResult
};

export {
  getDynamicAdminTerms,
  getFlagEmoji,
  fetchAllCountries,
  fetchStatesForCountry,
  fetchDistrictsForState,
  fetchSubDistrictsForDistrict,
  searchGlobalLocationsApi
};

export interface LocationFilterState {
  country: string; // 'all' or specific country name
  countryCode?: string;
  state: string; // 'all' or specific state name
  stateCode?: string;
  district: string; // 'all' or specific district name
  subDistrict: string; // 'all' or specific sub-district name
  village: string; // 'all' or specific village name
}

export interface UserLocationData {
  country: string;
  countryCode: string;
  countryName?: string;
  state: string;
  stateCode?: string;
  stateName?: string;
  district: string;
  districtCode?: string;
  districtName?: string;
  subDistrict?: string;
  subDistrictCode?: string;
  subDistrictName?: string;
  village: string;
  villageName?: string;
  pincode?: string;
}

/**
 * Returns dynamic admin terminology for a country
 */
export function getAdminTerminology(countryNameOrCode: string): CountryAdminTerminology {
  return getDynamicAdminTerms(countryNameOrCode);
}

/**
 * Search locations dynamically via API
 */
export async function searchLocationsDynamically(
  query: string,
  countryHint?: string
): Promise<ApiSearchResult[]> {
  return searchGlobalLocationsApi(query, countryHint);
}

/**
 * Format a human-readable location badge
 */
export function formatLocationBadge(post: {
  country?: string;
  countryName?: string;
  state?: string;
  stateName?: string;
  district?: string;
  districtName?: string;
  subDistrict?: string;
  subDistrictName?: string;
  village?: string;
  villageName?: string;
}): string {
  const parts: string[] = [];
  const v = post.villageName || post.village;
  if (v && v.trim() && v !== 'all') {
    parts.push(v.trim());
  }
  const sd = post.subDistrictName || post.subDistrict;
  if (sd && sd.trim() && sd !== 'all') {
    parts.push(sd.trim());
  }
  const d = post.districtName || post.district;
  if (d && d.trim() && d !== 'all') {
    parts.push(d.trim());
  }
  const s = post.stateName || post.state;
  if (s && s.trim() && s !== 'all') {
    parts.push(s.trim());
  }
  const c = post.countryName || post.country;
  if (c && c.trim() && c !== 'all' && c !== 'India') {
    parts.push(c.trim());
  }

  if (parts.length === 0) return 'Global Farmers Network';
  return parts.join(', ');
}

