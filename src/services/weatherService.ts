import {
  LiveWeatherData,
  LocationCoords,
  HourlyForecastItem,
  DailyForecastItem,
  SevereWeatherAlert,
  FarmingRecommendation,
  getWMOWeatherInfo
} from '../types/weather';
import { freeWeatherProvider, generateAgriVerseAdvisories } from './providers/weatherProvider';

// Re-export legacy WeatherData interface if other components expect it for backward compatibility
export interface LegacyDailyForecast {
  day: string;
  dateStr: string;
  tempMax: number;
  tempMin: number;
  rainProb: number;
  icon: string;
}

export interface WeatherData {
  locationName: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  rainfallChance: number;
  condition: string;
  weatherCode: number;
  hasSevereRainAlert: boolean;
  alertTitle?: string;
  alertDescription?: string;
  forecast: LegacyDailyForecast[];
  lastUpdated: string;
}

/**
 * Convert wind direction degrees to compass directions
 */
export function degreesToCompass(deg: number): string {
  const val = Math.floor((deg / 22.5) + 0.5);
  const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return arr[val % 16] || "N";
}

/**
 * Format ISO datetime string to 12-hour AM/PM time
 */
export function formatTime12h(isoStr: string): string {
  if (!isoStr) return '--:--';
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return isoStr;
  }
}

// Local in-memory cache for fast search responses
const geocodingCache = new Map<string, LocationCoords[]>();

/**
 * Save a selected location to local recent searches history (Max 10 items, no duplicates)
 */
export function saveRecentSearch(loc: LocationCoords): void {
  try {
    const existingStr = localStorage.getItem('agri_recent_searches');
    let list: LocationCoords[] = existingStr ? JSON.parse(existingStr) : [];
    // Filter out duplicates based on lat/lon or name match
    list = list.filter(item => 
      Math.abs(item.lat - loc.lat) > 0.001 || Math.abs(item.lon - loc.lon) > 0.001
    );
    list.unshift(loc);
    // Keep max 10 recent searches
    if (list.length > 10) list = list.slice(0, 10);
    localStorage.setItem('agri_recent_searches', JSON.stringify(list));
  } catch (e) {
    console.warn('Error saving recent search:', e);
  }
}

/**
 * Get recent searches from localStorage
 */
export function getRecentSearches(): LocationCoords[] {
  try {
    const existingStr = localStorage.getItem('agri_recent_searches');
    if (existingStr) {
      const parsed = JSON.parse(existingStr);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading recent searches:', e);
  }
  return [];
}

/**
 * Clear all recent search history
 */
export function clearRecentSearches(): void {
  try {
    localStorage.removeItem('agri_recent_searches');
  } catch (e) {
    console.warn('Error clearing recent searches:', e);
  }
}

/**
 * Get saved user favorite locations from localStorage
 */
export function getSavedLocations(): LocationCoords[] {
  try {
    const existingStr = localStorage.getItem('agri_saved_locations');
    if (existingStr) {
      const parsed = JSON.parse(existingStr);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading saved locations:', e);
  }
  return [];
}

/**
 * Toggle saving/favoriting a location
 */
export function toggleSavedLocation(loc: LocationCoords): boolean {
  try {
    const saved = getSavedLocations();
    const existingIndex = saved.findIndex(item =>
      Math.abs(item.lat - loc.lat) < 0.001 && Math.abs(item.lon - loc.lon) < 0.001
    );

    if (existingIndex >= 0) {
      // Remove from saved
      saved.splice(existingIndex, 1);
      localStorage.setItem('agri_saved_locations', JSON.stringify(saved));
      return false; // Now unsaved
    } else {
      // Add to saved (no duplicates)
      saved.unshift(loc);
      localStorage.setItem('agri_saved_locations', JSON.stringify(saved));
      return true; // Now saved
    }
  } catch (e) {
    console.warn('Error toggling saved location:', e);
    return false;
  }
}

/**
 * Check if a location is in Saved Locations
 */
export function isLocationSaved(loc: LocationCoords): boolean {
  try {
    const saved = getSavedLocations();
    return saved.some(item =>
      Math.abs(item.lat - loc.lat) < 0.001 && Math.abs(item.lon - loc.lon) < 0.001
    );
  } catch (e) {
    return false;
  }
}

/**
 * Remove a single location from Saved Locations
 */
export function removeSavedLocation(loc: LocationCoords): void {
  try {
    const saved = getSavedLocations();
    const updated = saved.filter(item =>
      Math.abs(item.lat - loc.lat) >= 0.001 || Math.abs(item.lon - loc.lon) >= 0.001
    );
    localStorage.setItem('agri_saved_locations', JSON.stringify(updated));
  } catch (e) {
    console.warn('Error removing saved location:', e);
  }
}

/**
 * Distance in kilometers between two GPS points using Haversine formula
 */
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Search locations worldwide using Photon, OpenStreetMap Nominatim, and Open-Meteo in parallel
 * Supports Village, Gram Panchayat, Hobli, Taluk, District, City, PIN code, Landmarks, and Lat/Lon.
 * Ranks up to 20 suggestions prioritizing GPS proximity, same district/state, country, and distance.
 */
export async function searchLocations(
  query: string,
  userContext?: { lat?: number; lon?: number; district?: string; state?: string; country?: string }
): Promise<LocationCoords[]> {
  if (!query || query.trim().length < 2) return [];

  const cleanQuery = query.trim();
  const contextKey = userContext?.lat ? `${userContext.lat.toFixed(2)},${userContext.lon?.toFixed(2)}` : 'default';
  const cacheKey = `${cleanQuery.toLowerCase()}_${contextKey}`;

  // Check in-memory cache
  if (geocodingCache.has(cacheKey)) {
    return geocodingCache.get(cacheKey)!;
  }

  // 1. Direct Lat/Lon coordinate pattern check (e.g. "13.4355, 77.7279" or "13.4355 77.7279")
  const coordMatch = cleanQuery.match(/^([+-]?\d+(?:\.\d+)?)[,\s]+([+-]?\d+(?:\.\d+)?)$/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lon = parseFloat(coordMatch[2]);
    if (!isNaN(lat) && !isNaN(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      const addressName = await reverseGeocode(lat, lon);
      const parts = addressName.split(',').map(s => s.trim());
      const coordResult: LocationCoords[] = [{
        lat,
        lon,
        name: addressName || `Lat ${lat.toFixed(4)}°, Lon ${lon.toFixed(4)}°`,
        district: parts[2] || parts[1] || '',
        state: parts[3] || '',
        country: parts[4] || ''
      }];
      geocodingCache.set(cacheKey, coordResult);
      return coordResult;
    }
  }

  const rawResults: LocationCoords[] = [];
  const encodedQuery = encodeURIComponent(cleanQuery);

  // User location context for biasing
  const userLat = userContext?.lat;
  const userLon = userContext?.lon;
  const userCountry = userContext?.country || 'India';
  const userState = userContext?.state || '';
  const userDistrict = userContext?.district || '';

  // 2a. Photon API (Fast autocomplete, fuzzy matching, Komoot/OSM engine)
  const fetchPhoton = async (): Promise<LocationCoords[]> => {
    try {
      let url = `https://photon.komoot.io/api/?q=${encodedQuery}&limit=25&lang=en`;
      if (userLat !== undefined && userLon !== undefined) {
        url += `&lat=${userLat}&lon=${userLon}`;
      }
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      if (!data.features || !Array.isArray(data.features)) return [];

      return data.features.map((feat: any) => {
        const props = feat.properties || {};
        const coords = feat.geometry?.coordinates || [0, 0];
        const lon = parseFloat(coords[0]);
        const lat = parseFloat(coords[1]);
        if (isNaN(lat) || isNaN(lon)) return null;

        const mainName = props.name || props.village || props.district || props.city || '';
        const village = props.village || props.hamlet || props.locality || props.suburb || props.district || '';
        const taluk = props.county || props.district || '';
        const district = props.district || props.state || '';
        const state = props.state || '';
        const country = props.country || '';
        const postcode = props.postcode ? `PIN: ${props.postcode}` : '';

        // Complete Address Hierarchy: Village -> Taluk -> District -> State -> Postcode -> Country
        const parts = [mainName, village, taluk, district, state, postcode, country].filter(Boolean);
        const uniqueParts = parts.filter((val, idx) => parts.indexOf(val) === idx);
        const fullName = uniqueParts.join(', ') || cleanQuery;

        return {
          lat,
          lon,
          name: fullName,
          district: district || taluk || village || mainName,
          state: state,
          country: country
        };
      }).filter(Boolean) as LocationCoords[];
    } catch (e) {
      console.warn('Photon geocoding error:', e);
      return [];
    }
  };

  // 2b. OpenStreetMap Nominatim API (Primary detailed search)
  const fetchNominatim = async (): Promise<LocationCoords[]> => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&addressdetails=1&limit=25&accept-language=en`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      if (!res.ok) return [];
      const data = await res.json();
      if (!Array.isArray(data)) return [];

      return data.map((item: any) => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        if (isNaN(lat) || isNaN(lon)) return null;

        const addr = item.address || {};
        const village = addr.village || addr.hamlet || addr.suburb || addr.neighbourhood || addr.locality || addr.town || addr.city || addr.amenity || addr.building || item.name || '';
        const taluk = addr.county || addr.subdistrict || addr.tehsil || addr.taluk || addr.hobli || '';
        const district = addr.state_district || addr.district || addr.city_district || '';
        const state = addr.state || addr.province || '';
        const postcode = addr.postcode ? `PIN: ${addr.postcode}` : '';
        const country = addr.country || '';

        // Complete Address Hierarchy: Village -> Taluk -> District -> State -> Postcode -> Country
        const parts = [village, taluk, district, state, postcode, country].filter(Boolean);
        const uniqueParts = parts.filter((val, idx) => parts.indexOf(val) === idx);
        const fullName = uniqueParts.join(', ') || item.display_name || cleanQuery;

        return {
          lat,
          lon,
          name: fullName,
          district: district || taluk || village,
          state: state,
          country: country
        };
      }).filter(Boolean) as LocationCoords[];
    } catch (e) {
      console.warn('Nominatim geocoding error:', e);
      return [];
    }
  };

  // 2c. Open-Meteo / GeoNames Fallback API
  const fetchOpenMeteo = async (): Promise<LocationCoords[]> => {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodedQuery}&count=25&language=en&format=json`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      if (!data.results || !Array.isArray(data.results)) return [];

      return data.results.map((item: any) => {
        const parts = [item.name, item.admin2, item.admin1, item.country].filter(Boolean);
        const uniqueParts = parts.filter((val, idx) => parts.indexOf(val) === idx);
        return {
          lat: item.latitude,
          lon: item.longitude,
          name: uniqueParts.join(', '),
          district: item.admin2 || item.admin1 || item.name,
          state: item.admin1 || '',
          country: item.country || ''
        };
      });
    } catch (e) {
      console.warn('OpenMeteo geocoding error:', e);
      return [];
    }
  };

  // Execute queries in parallel
  const resultsList = await Promise.allSettled([fetchPhoton(), fetchNominatim(), fetchOpenMeteo()]);

  resultsList.forEach((result) => {
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      rawResults.push(...result.value);
    }
  });

  // 3. Deduplicate by geographic coordinate closeness (~0.003deg ~500m threshold)
  const uniqueResults: LocationCoords[] = [];

  for (const item of rawResults) {
    const exists = uniqueResults.some(existing => 
      Math.abs(existing.lat - item.lat) < 0.003 && Math.abs(existing.lon - item.lon) < 0.003
    );
    if (!exists) {
      uniqueResults.push(item);
    }
  }

  // 4. Proximity & Context-aware Ranking Engine
  const rankedResults = uniqueResults.map((item) => {
    let score = 0;

    // Distance scoring if user lat/lon exists
    if (userLat !== undefined && userLon !== undefined) {
      const dist = calculateDistanceKm(userLat, userLon, item.lat, item.lon);
      if (dist < 30) score -= 800;
      else if (dist < 100) score -= 500;
      else if (dist < 300) score -= 300;
      else score += dist / 20;
    }

    // Match district or state
    if (userDistrict && item.district.toLowerCase().includes(userDistrict.toLowerCase())) {
      score -= 400;
    }
    if (userState && item.state.toLowerCase().includes(userState.toLowerCase())) {
      score -= 200;
    }

    // Country match preference (Default India if not specified)
    if (item.country.toLowerCase().includes(userCountry.toLowerCase())) {
      score -= 150;
    }

    // Prefix match on name
    const lowerName = item.name.toLowerCase();
    const lowerQ = cleanQuery.toLowerCase();
    if (lowerName.startsWith(lowerQ)) {
      score -= 300;
    } else if (lowerName.includes(lowerQ)) {
      score -= 100;
    }

    return { item, score };
  });

  // Sort ascending by score (lowest score = highest priority) and return top 20
  rankedResults.sort((a, b) => a.score - b.score);
  const finalResults = rankedResults.slice(0, 20).map((r) => r.item);

  // Cache final ranked results
  if (finalResults.length > 0) {
    geocodingCache.set(cacheKey, finalResults);
  }

  return finalResults;
}

/**
 * Reverse geocode lat/lon to human readable address (Village, Taluk, District, State, Country)
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  // 1. Try Nominatim reverse geocoding with addressdetails=1
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const village = addr.village || addr.hamlet || addr.suburb || addr.neighbourhood || addr.locality || addr.town || addr.city || addr.amenity || '';
      const taluk = addr.county || addr.subdistrict || addr.tehsil || addr.taluk || addr.hobli || '';
      const district = addr.state_district || addr.district || addr.city_district || '';
      const state = addr.state || addr.province || '';
      const country = addr.country || '';

      const parts = [village, taluk, district, state, country].filter(Boolean);
      const uniqueParts = parts.filter((item, pos) => parts.indexOf(item) === pos);
      if (uniqueParts.length > 0) return uniqueParts.join(', ');
    }
  } catch (e) {
    console.warn('Nominatim reverse geocoding error:', e);
  }

  // 2. Try BigDataCloud free client API fallback
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const village = data.locality || data.village || data.localityInfo?.informative?.[0]?.name || '';
      const taluk = data.localityInfo?.administrative?.[3]?.name || data.localityInfo?.administrative?.[2]?.name || '';
      const district = data.localityInfo?.administrative?.[1]?.name || data.city || '';
      const state = data.principalSubdivision || '';
      const country = data.countryName || '';

      const parts = [village, taluk, district, state, country].filter(Boolean);
      const uniqueParts = parts.filter((item, pos) => parts.indexOf(item) === pos);
      if (uniqueParts.length > 0) return uniqueParts.join(', ');
    }
  } catch (e) {
    console.warn('BigDataCloud reverse geocoding error:', e);
  }

  return `Lat ${lat.toFixed(3)}°, Lon ${lon.toFixed(3)}°`;
}

/**
 * Generate severe weather alerts dynamically based on live meteorological data
 * Strict rule: All alerts are deterministic AgriVerse Agricultural Advisories, not official warnings.
 */
export function generateSevereWeatherAlerts(
  temp: number,
  humidity: number,
  rainProb: number,
  precipitationMm: number,
  windSpeed: number,
  weatherCode: number,
  locationName: string,
  isOfflineFallback: boolean = false
): SevereWeatherAlert[] {
  return generateAgriVerseAdvisories(
    temp,
    humidity,
    rainProb,
    precipitationMm,
    windSpeed,
    weatherCode,
    locationName,
    isOfflineFallback
  );
}

/**
 * Generate AI Farming Recommendations based on live weather parameters
 */
export function generateFarmingRecommendations(
  temp: number,
  humidity: number,
  rainProb: number,
  windSpeed: number,
  uvIndex: number,
  weatherCode: number
): FarmingRecommendation[] {
  const recs: FarmingRecommendation[] = [];

  // Spraying Guidance
  if (rainProb > 50 || weatherCode >= 61) {
    recs.push({
      id: 'rec_spray_1',
      category: 'Spraying',
      title: 'Postpone Chemical & Fertilizer Spraying',
      advice: `Rainfall chance is ${rainProb}%. Chemical pesticides or urea applied now will wash off into runoff water. Wait for a dry 24-hour window.`,
      urgency: 'high',
      icon: 'CloudRain'
    });
  } else if (windSpeed > 20) {
    recs.push({
      id: 'rec_spray_2',
      category: 'Spraying',
      title: 'Avoid Spraying in High Winds',
      advice: `Wind speed is ${windSpeed} km/h. Spray drift will waste chemicals and damage non-target neighboring crops. Spray early morning when air is calm.`,
      urgency: 'medium',
      icon: 'Wind'
    });
  } else {
    recs.push({
      id: 'rec_spray_3',
      category: 'Spraying',
      title: 'Favorable Spraying Window Active',
      advice: 'Calm winds and clear skies present ideal conditions for bio-pesticide and foliar nutrient applications.',
      urgency: 'low',
      icon: 'CheckCircle'
    });
  }

  // Irrigation Guidance
  if (rainProb > 70) {
    recs.push({
      id: 'rec_irrig_1',
      category: 'Irrigation',
      title: 'Suspend Automated Irrigation Systems',
      advice: 'Natural rainfall expected soon. Save electricity and prevent root waterlogging by holding water pump operations.',
      urgency: 'high',
      icon: 'Droplets'
    });
  } else if (temp > 32 || humidity < 45) {
    recs.push({
      id: 'rec_irrig_2',
      category: 'Irrigation',
      title: 'Schedule Deep Root Micro-Irrigation',
      advice: `High temperature (${temp}°C) and dry air increase water transpiration. Run drip irrigation for 45-60 minutes at sunrise or sunset.`,
      urgency: 'high',
      icon: 'Sun'
    });
  } else {
    recs.push({
      id: 'rec_irrig_3',
      category: 'Irrigation',
      title: 'Normal Moisture Maintenance',
      advice: 'Soil moisture levels are balanced. Maintain routine watering schedules based on crop growth phase.',
      urgency: 'low',
      icon: 'Droplets'
    });
  }

  // Pest & Disease Risk Guidance
  if (humidity > 80 && temp >= 22 && temp <= 32) {
    recs.push({
      id: 'rec_pest_1',
      category: 'Pest Control',
      title: 'High Fungal Disease & Blight Alert',
      advice: `Relative humidity is high at ${humidity}%. Conditions favor Early Blight, Downy Mildew, and Rust spores. Apply organic neem spray or recommended bio-fungicide.`,
      urgency: 'high',
      icon: 'AlertTriangle'
    });
  } else {
    recs.push({
      id: 'rec_pest_2',
      category: 'Pest Control',
      title: 'Routine Pest Scouting',
      advice: 'Inspect undersides of leaves for whiteflies, thrips, and aphids during early morning walkthroughs.',
      urgency: 'low',
      icon: 'ShieldAlert'
    });
  }

  // UV & Labor Safety
  if (uvIndex >= 7) {
    recs.push({
      id: 'rec_uv_1',
      category: 'Protection',
      title: 'High UV Load - Labor Safety Advisory',
      advice: `UV Index is elevated at ${uvIndex}. Rest farm labor between 12:00 PM and 3:00 PM to avoid heat exhaustion and dehydration.`,
      urgency: 'medium',
      icon: 'Sun'
    });
  }

  return recs;
}

/**
 * Main function: Fetch complete live weather data directly via FreeWeatherProvider
 */
export async function fetchLiveWeather(
  lat: number = 13.4355,
  lon: number = 77.7279,
  customName?: string
): Promise<LiveWeatherData> {
  const resolvedName = customName || await reverseGeocode(lat, lon);
  return await freeWeatherProvider.getLiveWeatherData(lat, lon, resolvedName, false);
}

/**
 * Backward compatibility helper for legacy caller code expecting getLiveWeather(...)
 */
export async function getLiveWeather(
  latitude?: number,
  longitude?: number,
  uid: string = 'guest'
): Promise<WeatherData> {
  const lat = latitude ?? 13.4355;
  const lon = longitude ?? 77.7279;

  try {
    const live = await fetchLiveWeather(lat, lon);
    const hasSevere = live.alerts.some(a => a.severity === 'critical' || a.severity === 'warning');
    const primaryAlert = live.alerts[0];

    const mappedForecast: LegacyDailyForecast[] = live.dailyForecast.map(d => ({
      day: d.dayName,
      dateStr: d.date,
      tempMax: d.tempMax,
      tempMin: d.tempMin,
      rainProb: d.rainProb,
      icon: d.rainProb > 50 ? 'rain' : 'cloud'
    }));

    return {
      locationName: live.location.name,
      temperature: live.temperature,
      humidity: live.humidity,
      windSpeed: live.windSpeed,
      rainfallChance: live.currentHourlyRainProb ?? live.rainfallChance,
      condition: live.condition,
      weatherCode: live.weatherCode,
      hasSevereRainAlert: hasSevere,
      alertTitle: primaryAlert?.title,
      alertDescription: primaryAlert?.description,
      forecast: mappedForecast,
      lastUpdated: live.lastUpdated
    };
  } catch (e) {
    console.warn('Live weather fetch error in legacy getLiveWeather wrapper:', e);
    
    // Return structured default if offline/network error
    return {
      locationName: 'Local Farmland Region',
      temperature: 28,
      humidity: 80,
      windSpeed: 14,
      rainfallChance: 65,
      condition: 'Favorable Crop Conditions',
      weatherCode: 2,
      hasSevereRainAlert: false,
      forecast: [
        { day: 'Today', dateStr: 'Today', tempMax: 28, tempMin: 22, rainProb: 65, icon: 'rain' },
        { day: 'Tomorrow', dateStr: 'Tomorrow', tempMax: 29, tempMin: 21, rainProb: 40, icon: 'cloud' },
        { day: 'Sun', dateStr: 'Day 3', tempMax: 30, tempMin: 22, rainProb: 20, icon: 'sun' },
        { day: 'Mon', dateStr: 'Day 4', tempMax: 31, tempMin: 23, rainProb: 15, icon: 'sun' },
        { day: 'Tue', dateStr: 'Day 5', tempMax: 29, tempMin: 21, rainProb: 30, icon: 'cloud' }
      ],
      lastUpdated: new Date().toISOString()
    };
  }
}
