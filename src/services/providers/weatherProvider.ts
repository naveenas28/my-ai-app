/**
 * Weather Service Provider Abstraction - Zero Cost Open-Meteo Integration
 * 
 * Free Provider: Open-Meteo High Resolution Weather API (Free, no API key required).
 * Paid Provider: Strictly dormant under zero-billing policy.
 * 
 * Authoritative weather engine with:
 * - 10-minute cache TTL
 * - Transparent status tracking: 'REAL DATA' | 'CACHED DATA' | 'OFFLINE FALLBACK'
 * - Current hourly rain probability vs Daily max rain probability separation
 * - Deterministic rule-based AgriVerse Agricultural Advisories (with rule inputs)
 * - Safe offline fallback (no fabricated severe alerts on fallback)
 */

import { APP_FEATURES } from '../../config/features';
import { quotaManager } from '../quotaManager';
import {
  LiveWeatherData,
  LocationCoords,
  HourlyForecastItem,
  DailyForecastItem,
  SevereWeatherAlert,
  FarmingRecommendation,
  WeatherDataSourceStatus,
  getWMOWeatherInfo
} from '../../types/weather';

export interface WeatherReport {
  temperature: number;
  humidity: number;
  windSpeed: number;
  rainfallProbability: number;
  condition: string;
  isRainAlert: boolean;
  alertTitle?: string;
  alertDescription?: string;
  sourceLabel: WeatherDataSourceStatus;
  forecast: Array<{
    day: string;
    tempMax: number;
    tempMin: number;
    rainProb: number;
  }>;
}

export interface IWeatherService {
  getWeather(lat: number, lon: number): Promise<WeatherReport>;
  getLiveWeatherData(
    lat: number,
    lon: number,
    customName?: string,
    forceRefresh?: boolean
  ): Promise<LiveWeatherData>;
}

const LOCAL_STORAGE_CACHE_KEY = 'agri_live_weather_cache';

/**
 * Convert wind direction degrees to compass heading
 */
export function degreesToCompass(deg: number): string {
  const val = Math.floor((deg / 22.5) + 0.5);
  const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return arr[val % 16] || "N";
}

/**
 * Format ISO datetime string or Date to 12-hour AM/PM time
 */
export function formatTime12h(isoStrOrDate?: string | Date): string {
  if (!isoStrOrDate) return '--:--';
  try {
    const d = typeof isoStrOrDate === 'string' ? new Date(isoStrOrDate) : isoStrOrDate;
    if (isNaN(d.getTime())) return typeof isoStrOrDate === 'string' ? isoStrOrDate : '--:--';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return typeof isoStrOrDate === 'string' ? isoStrOrDate : '--:--';
  }
}

/**
 * Generate deterministic AgriVerse Agricultural Advisories based on live meteorological data
 * Strict rule: NEVER generate serious alerts from fallback values.
 */
export function generateAgriVerseAdvisories(
  temp: number,
  humidity: number,
  currentHourlyRainProb: number,
  precipitationMm: number,
  windSpeed: number,
  weatherCode: number,
  locationName: string,
  isOfflineFallback: boolean = false,
  statusLabel: WeatherDataSourceStatus = 'REAL DATA',
  updatedTimeStr?: string
): SevereWeatherAlert[] {
  // Requirement 5: If Open-Meteo fails and application uses offline fallback:
  // Do NOT generate severe-weather alerts from the fallback values.
  if (isOfflineFallback) {
    return [];
  }

  const advisories: SevereWeatherAlert[] = [];
  const timeStr = updatedTimeStr || formatTime12h(new Date());

  // 1. Heavy Rain Advisory:
  // - Trigger when near-term hourly rain probability >= 80%
  // OR relevant precipitation amount >= 10 mm
  // OR Open-Meteo WMO weather code indicates significant rain (63-67, 81, 82).
  const isSignificantRainCode = (weatherCode >= 63 && weatherCode <= 67) || weatherCode === 81 || weatherCode === 82;
  const hasRainProbThreshold = currentHourlyRainProb >= 80;
  const hasPrecipThreshold = precipitationMm >= 10;

  if (hasRainProbThreshold || hasPrecipThreshold || isSignificantRainCode) {
    let thresholdReason = '';
    if (hasRainProbThreshold && hasPrecipThreshold) {
      thresholdReason = `Near-term rain probability >= 80% (${currentHourlyRainProb}%) & precipitation >= 10 mm (${precipitationMm.toFixed(1)} mm)`;
    } else if (hasRainProbThreshold) {
      thresholdReason = `Near-term hourly rain probability >= 80% (${currentHourlyRainProb}%)`;
    } else if (hasPrecipThreshold) {
      thresholdReason = `Expected precipitation amount >= 10 mm (${precipitationMm.toFixed(1)} mm)`;
    } else {
      thresholdReason = `Open-Meteo weather code indicates significant rain (WMO ${weatherCode})`;
    }

    const isCritical = precipitationMm >= 25 || currentHourlyRainProb >= 90;
    advisories.push({
      id: `adv_rain_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'rain',
      severity: isCritical ? 'critical' : 'warning',
      title: '🌧️ Heavy Rain Advisory',
      description: `Elevated precipitation risk for ${locationName}. Rain probability: ${currentHourlyRainProb}%, expected precipitation: ${precipitationMm.toFixed(1)} mm, temperature: ${temp}°C, wind: ${windSpeed} km/h.`,
      recommendedAction: 'Postpone spraying and check field drainage.',
      timestamp: timeStr,
      isAgriVerseAdvisory: true,
      source: 'Open-Meteo',
      statusLabel,
      ruleInputs: {
        rainProbability: currentHourlyRainProb,
        precipitationMm,
        humidity,
        temperature: temp,
        windSpeed,
        weatherCode,
        locationName,
        thresholdReason
      }
    });
  }

  // 2. Thunderstorm:
  // - Trigger for WMO weather codes 95-99.
  if (weatherCode >= 95 && weatherCode <= 99) {
    const thresholdReason = `Open-Meteo weather code indicates thunderstorm activity (WMO ${weatherCode})`;
    advisories.push({
      id: `adv_thunder_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'thunderstorm',
      severity: 'critical',
      title: '⚡ Thunderstorm Advisory',
      description: `Atmospheric electrical instability detected for ${locationName}. Active lightning and squall hazards present.`,
      recommendedAction: 'Move farm workers and livestock away from open fields, metallic fences, and tall isolated trees. Disconnect electric water pumps.',
      timestamp: timeStr,
      isAgriVerseAdvisory: true,
      source: 'Open-Meteo',
      statusLabel,
      ruleInputs: {
        rainProbability: currentHourlyRainProb,
        precipitationMm,
        humidity,
        temperature: temp,
        windSpeed,
        weatherCode,
        locationName,
        thresholdReason
      }
    });
  }

  // 3. Strong Wind:
  // - Trigger when wind speed >= 25 km/h.
  if (windSpeed >= 25) {
    const thresholdReason = `Wind speed >= 25 km/h (${windSpeed} km/h)`;
    advisories.push({
      id: `adv_wind_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'wind',
      severity: windSpeed >= 40 ? 'critical' : 'warning',
      title: '💨 Strong Wind Advisory',
      description: `Elevated wind speed (${windSpeed} km/h) recorded for ${locationName}. Risk of crop lodging and structural damage to farm installations.`,
      recommendedAction: 'Provide bamboo staking support to tall crops (banana, papaya, tomato) and securely fasten polyhouse shade nets.',
      timestamp: timeStr,
      isAgriVerseAdvisory: true,
      source: 'Open-Meteo',
      statusLabel,
      ruleInputs: {
        rainProbability: currentHourlyRainProb,
        precipitationMm,
        humidity,
        temperature: temp,
        windSpeed,
        weatherCode,
        locationName,
        thresholdReason
      }
    });
  }

  // 4. Extreme Heat:
  // - Trigger when temperature >= 35°C.
  if (temp >= 35) {
    const thresholdReason = `Temperature >= 35°C (${temp}°C)`;
    advisories.push({
      id: `adv_heat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'heat',
      severity: temp >= 40 ? 'critical' : 'warning',
      title: '🌡️ Extreme Heat Advisory',
      description: `Extreme high ambient temperature (${temp}°C) detected for ${locationName}. Accelerated soil moisture evaporation and heat stress occurring.`,
      recommendedAction: 'Run drip irrigation during early morning or evening hours and provide shaded hydration for farm animals.',
      timestamp: timeStr,
      isAgriVerseAdvisory: true,
      source: 'Open-Meteo',
      statusLabel,
      ruleInputs: {
        rainProbability: currentHourlyRainProb,
        precipitationMm,
        humidity,
        temperature: temp,
        windSpeed,
        weatherCode,
        locationName,
        thresholdReason
      }
    });
  }

  // 5. Frost/Cold:
  // - Trigger when temperature <= 10°C.
  if (temp <= 10) {
    const thresholdReason = `Temperature <= 10°C (${temp}°C)`;
    advisories.push({
      id: `adv_frost_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'frost',
      severity: temp <= 5 ? 'critical' : 'warning',
      title: '❄️ Frost & Cold Advisory',
      description: `Low ambient temperature (${temp}°C) detected for ${locationName}. Risk of cold injury and frost shock to tender blossoms.`,
      recommendedAction: 'Apply light late-afternoon irrigation to improve soil thermal retention and cover sensitive nursery beds with mulch or straw.',
      timestamp: timeStr,
      isAgriVerseAdvisory: true,
      source: 'Open-Meteo',
      statusLabel,
      ruleInputs: {
        rainProbability: currentHourlyRainProb,
        precipitationMm,
        humidity,
        temperature: temp,
        windSpeed,
        weatherCode,
        locationName,
        thresholdReason
      }
    });
  }

  // 6. Flood/Risk:
  // - Trigger only when the actual weather data supports a high precipitation/flood-risk condition.
  // - Do not create false flood alerts from arbitrary/default values.
  const isHighPrecipFlood = precipitationMm >= 25;
  const isSaturatedFlood = precipitationMm >= 15 && currentHourlyRainProb >= 85 && humidity >= 90;
  if (isHighPrecipFlood || isSaturatedFlood) {
    const thresholdReason = isHighPrecipFlood
      ? `Heavy precipitation volume >= 25 mm (${precipitationMm.toFixed(1)} mm)`
      : `High precipitation (${precipitationMm.toFixed(1)} mm) with high rain probability (${currentHourlyRainProb}%) and high humidity (${humidity}%)`;
    advisories.push({
      id: `adv_flood_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'flood',
      severity: 'critical',
      title: '🌊 Flood Risk Advisory',
      description: `High precipitation volume and soil waterlogging risk detected for ${locationName}. Potential root zone hypoxia and standing runoff hazard.`,
      recommendedAction: 'Dig open trench furrows to drain standing runoff from fields and relocate harvested crops to elevated storage.',
      timestamp: timeStr,
      isAgriVerseAdvisory: true,
      source: 'Open-Meteo',
      statusLabel,
      ruleInputs: {
        rainProbability: currentHourlyRainProb,
        precipitationMm,
        humidity,
        temperature: temp,
        windSpeed,
        weatherCode,
        locationName,
        thresholdReason
      }
    });
  }

  return advisories;
}

/**
 * Generate agricultural farming recommendations based on weather parameters
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
      title: 'High Fungal Disease & Blight Risk',
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
 * FreeWeatherProvider - Single authoritative Open-Meteo implementation
 */
export class FreeWeatherProvider implements IWeatherService {
  private liveCache: Map<string, { data: LiveWeatherData; timestamp: number }> = new Map();
  private CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache TTL

  /**
   * Primary method: Returns complete LiveWeatherData with true 3-tier status:
   * 'REAL DATA' | 'CACHED DATA' | 'OFFLINE FALLBACK'
   */
  async getLiveWeatherData(
    lat: number,
    lon: number,
    customName?: string,
    forceRefresh: boolean = false
  ): Promise<LiveWeatherData> {
    const key = `${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const now = Date.now();
    const cached = this.liveCache.get(key);

    // 1. Check in-memory 10-minute cache if not force refreshing
    if (!forceRefresh && cached && (now - cached.timestamp) < this.CACHE_TTL_MS) {
      quotaManager.recordCacheHit('open_meteo_weather');
      const cachedAlerts = (cached.data.alerts || []).map(a => ({
        ...a,
        statusLabel: 'CACHED DATA' as WeatherDataSourceStatus
      }));
      return {
        ...cached.data,
        alerts: cachedAlerts,
        dataSourceStatus: 'CACHED DATA',
        cachedAt: cached.timestamp,
        isOfflineData: false
      };
    }

    // 2. Check quotaManager rate-limits
    const check = quotaManager.canExecute('open_meteo_weather', 60);
    if (!check.allowed && cached) {
      const cachedAlerts = (cached.data.alerts || []).map(a => ({
        ...a,
        statusLabel: 'CACHED DATA' as WeatherDataSourceStatus
      }));
      return {
        ...cached.data,
        alerts: cachedAlerts,
        dataSourceStatus: 'CACHED DATA',
        cachedAt: cached.timestamp,
        isOfflineData: false
      };
    }

    quotaManager.recordRequest('open_meteo_weather');

    try {
      // 3. Fetch genuine live data from Open-Meteo API
      const resolvedName = customName || `Lat ${lat.toFixed(3)}°, Lon ${lon.toFixed(3)}°`;
      const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,uv_index,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,rain_sum,showers_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;

      const res = await fetch(omUrl);
      if (!res.ok) {
        throw new Error(`Open-Meteo API returned status ${res.status}`);
      }

      const data = await res.json();
      const current = data.current || {};
      const hourly = data.hourly || {};
      const daily = data.daily || {};

      const temp = Math.round(current.temperature_2m ?? 28);
      const feelsLike = Math.round(current.apparent_temperature ?? temp);
      const humidity = Math.round(current.relative_humidity_2m ?? 75);
      const weatherCode = current.weather_code ?? 0;
      const wmoInfo = getWMOWeatherInfo(weatherCode);
      const condition = wmoInfo.label;
      const precipitationMm = current.precipitation ?? 0;
      const windSpeed = Math.round(current.wind_speed_10m ?? 12);
      const windDirection = Math.round(current.wind_direction_10m ?? 0);
      const windDirectionText = degreesToCompass(windDirection);
      const pressure = Math.round(current.pressure_msl ?? current.surface_pressure ?? 1012);

      // Hourly Forecast (Next 24 Hours)
      // Open-Meteo timezone=auto matches local time in current.time and hourly.time
      const times: string[] = hourly.time || [];
      const currentHourPrefix = current.time ? String(current.time).slice(0, 13) : new Date().toISOString().slice(0, 13);
      let startIndex = times.findIndex(t => t.startsWith(currentHourPrefix));
      if (startIndex < 0) startIndex = 0;

      const hourlyList: HourlyForecastItem[] = [];
      for (let i = startIndex; i < Math.min(startIndex + 24, times.length); i++) {
        const tISO = times[i];
        const hTemp = Math.round(hourly.temperature_2m?.[i] ?? temp);
        const hFeels = Math.round(hourly.apparent_temperature?.[i] ?? hTemp);
        const hRainProb = Math.round(hourly.precipitation_probability?.[i] ?? 0);
        const hPrecip = hourly.precipitation?.[i] ?? 0;
        const hCode = hourly.weather_code?.[i] ?? 0;
        const hWmo = getWMOWeatherInfo(hCode);
        const hHum = Math.round(hourly.relative_humidity_2m?.[i] ?? humidity);
        const hUv = Math.round(hourly.uv_index?.[i] ?? 0);

        hourlyList.push({
          time: formatTime12h(tISO),
          temp: hTemp,
          feelsLike: hFeels,
          rainProb: hRainProb,
          precipitationMm: hPrecip,
          weatherCode: hCode,
          condition: hWmo.label,
          humidity: hHum,
          windSpeed,
          uvIndex: hUv
        });
      }

      // Daily Forecast (7 Days)
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dailyDates: string[] = daily.time || [];
      const dailyList: DailyForecastItem[] = [];

      for (let i = 0; i < Math.min(7, dailyDates.length); i++) {
        const dateStr = dailyDates[i];
        const dObj = new Date(dateStr);
        const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : daysOfWeek[dObj.getDay()];
        const dMax = Math.round(daily.temperature_2m_max?.[i] ?? temp);
        const dMin = Math.round(daily.temperature_2m_min?.[i] ?? temp - 5);
        const dRainProb = Math.round(daily.precipitation_probability_max?.[i] ?? 0);
        const dPrecip = daily.precipitation_sum?.[i] ?? 0;
        const dCode = daily.weather_code?.[i] ?? 0;
        const dWmo = getWMOWeatherInfo(dCode);
        const dUvMax = Math.round(daily.uv_index_max?.[i] ?? 5);
        const dWindMax = Math.round(daily.wind_speed_10m_max?.[i] ?? windSpeed);
        const dSunrise = formatTime12h(daily.sunrise?.[i]);
        const dSunset = formatTime12h(daily.sunset?.[i]);

        dailyList.push({
          date: dateStr,
          dayName,
          tempMax: dMax,
          tempMin: dMin,
          rainProb: dRainProb,
          precipitationMm: dPrecip,
          weatherCode: dCode,
          condition: dWmo.label,
          uvIndexMax: dUvMax,
          windSpeedMax: dWindMax,
          sunrise: dSunrise,
          sunset: dSunset
        });
      }

      // REQUIREMENT 2 & 3: Disentangle current hourly rain prob from daily maximum rain prob
      const currentHourlyRainProb = Math.round(hourly.precipitation_probability?.[startIndex] ?? hourlyList[0]?.rainProb ?? 0);
      const dailyMaxRainProb = Math.round(daily.precipitation_probability_max?.[0] ?? dailyList[0]?.rainProb ?? currentHourlyRainProb);
      const uvIndex = dailyList[0]?.uvIndexMax ?? (hourlyList[0]?.uvIndex || 5);
      const sunrise = dailyList[0]?.sunrise || '06:15 AM';
      const sunset = dailyList[0]?.sunset || '06:45 PM';

      const rawVisibilityMeters = hourly.visibility?.[startIndex] ?? 10000;
      const visibilityKm = Math.round((rawVisibilityMeters / 1000) * 10) / 10;

      // REQUIREMENT 3 & 4: Generate deterministic AgriVerse Agricultural Advisories using actual Open-Meteo values
      const alerts = generateAgriVerseAdvisories(
        temp,
        humidity,
        currentHourlyRainProb,
        precipitationMm,
        windSpeed,
        weatherCode,
        resolvedName,
        false,
        'REAL DATA',
        formatTime12h(current.time || new Date())
      );

      const recommendations = generateFarmingRecommendations(
        temp,
        humidity,
        currentHourlyRainProb,
        windSpeed,
        uvIndex,
        weatherCode
      );

      const liveReport: LiveWeatherData = {
        location: {
          lat,
          lon,
          name: resolvedName
        },
        temperature: temp,
        feelsLike,
        condition,
        weatherCode,
        humidity,
        rainfallChance: currentHourlyRainProb, // Current/near-term probability
        currentHourlyRainProb,
        dailyMaxRainProb,
        precipitationMm,
        windSpeed,
        windDirection,
        windDirectionText,
        uvIndex,
        pressure,
        sunrise,
        sunset,
        visibilityKm,
        hourlyForecast: hourlyList,
        dailyForecast: dailyList,
        alerts,
        recommendations,
        lastUpdated: current.time ? new Date(current.time).toISOString() : new Date().toISOString(),
        dataSourceStatus: 'REAL DATA',
        cachedAt: now,
        isOfflineData: false
      };

      // Store in memory cache
      this.liveCache.set(key, { data: liveReport, timestamp: now });

      // Store in localStorage for browser restarts
      try {
        if (typeof window !== 'undefined' && typeof window.localStorage?.setItem === 'function') {
          window.localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(liveReport));
        }
      } catch (e) {
        console.warn('Unable to persist live weather to localStorage:', e);
      }

      return liveReport;
    } catch (err) {
      quotaManager.recordError('open_meteo_weather', err);

      // 4. Return in-memory cache if available
      if (cached) {
        const cachedAlerts = (cached.data.alerts || []).map(a => ({
          ...a,
          statusLabel: 'CACHED DATA' as WeatherDataSourceStatus
        }));
        return {
          ...cached.data,
          alerts: cachedAlerts,
          dataSourceStatus: 'CACHED DATA',
          cachedAt: cached.timestamp,
          isOfflineData: true
        };
      }

      // 5. Return localStorage cache if available
      try {
        if (typeof window !== 'undefined' && typeof window.localStorage?.getItem === 'function') {
          const rawLocal = window.localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
          if (rawLocal) {
            const parsed: LiveWeatherData = JSON.parse(rawLocal);
            const cachedAlerts = (parsed.alerts || []).map(a => ({
              ...a,
              statusLabel: 'CACHED DATA' as WeatherDataSourceStatus
            }));
            return {
              ...parsed,
              alerts: cachedAlerts,
              dataSourceStatus: 'CACHED DATA',
              isOfflineData: true
            };
          }
        }
      } catch (e) {
        console.warn('Unable to read cached weather from localStorage:', e);
      }

      // 6. REQUIREMENT 7: Offline fallback values (marked 'OFFLINE FALLBACK', NO serious weather alerts!)
      const fallbackLocationName = customName || `Lat ${lat.toFixed(3)}°, Lon ${lon.toFixed(3)}°`;
      return {
        location: {
          lat,
          lon,
          name: fallbackLocationName
        },
        temperature: 28,
        feelsLike: 29,
        condition: 'Partly Cloudy',
        weatherCode: 2,
        humidity: 68,
        rainfallChance: 15,
        currentHourlyRainProb: 15,
        dailyMaxRainProb: 25,
        precipitationMm: 0,
        windSpeed: 12,
        windDirection: 90,
        windDirectionText: 'E',
        uvIndex: 5,
        pressure: 1012,
        sunrise: '06:15 AM',
        sunset: '06:45 PM',
        visibilityKm: 10.0,
        hourlyForecast: [
          { time: '10:00 AM', temp: 27, feelsLike: 28, rainProb: 10, precipitationMm: 0, weatherCode: 2, condition: 'Partly Cloudy', humidity: 65, windSpeed: 12, uvIndex: 4 },
          { time: '11:00 AM', temp: 28, feelsLike: 29, rainProb: 15, precipitationMm: 0, weatherCode: 2, condition: 'Partly Cloudy', humidity: 60, windSpeed: 13, uvIndex: 6 },
          { time: '12:00 PM', temp: 29, feelsLike: 30, rainProb: 15, precipitationMm: 0, weatherCode: 1, condition: 'Mainly Clear', humidity: 55, windSpeed: 14, uvIndex: 7 },
          { time: '01:00 PM', temp: 30, feelsLike: 31, rainProb: 20, precipitationMm: 0, weatherCode: 1, condition: 'Mainly Clear', humidity: 52, windSpeed: 14, uvIndex: 8 },
          { time: '02:00 PM', temp: 30, feelsLike: 31, rainProb: 20, precipitationMm: 0, weatherCode: 2, condition: 'Partly Cloudy', humidity: 54, windSpeed: 13, uvIndex: 7 }
        ],
        dailyForecast: [
          { date: 'Today', dayName: 'Today', tempMax: 29, tempMin: 21, rainProb: 25, precipitationMm: 0, weatherCode: 2, condition: 'Partly Cloudy', uvIndexMax: 7, windSpeedMax: 15, sunrise: '06:15 AM', sunset: '06:45 PM' },
          { date: 'Tomorrow', dayName: 'Tomorrow', tempMax: 30, tempMin: 20, rainProb: 20, precipitationMm: 0, weatherCode: 1, condition: 'Mainly Clear', uvIndexMax: 8, windSpeedMax: 14, sunrise: '06:15 AM', sunset: '06:45 PM' },
          { date: 'Day 3', dayName: 'Day 3', tempMax: 31, tempMin: 22, rainProb: 15, precipitationMm: 0, weatherCode: 0, condition: 'Clear Sky', uvIndexMax: 8, windSpeedMax: 12, sunrise: '06:15 AM', sunset: '06:45 PM' }
        ],
        alerts: [], // CRITICAL: NEVER generate serious heavy-rain or thunderstorm alerts on fallback
        recommendations: [
          {
            id: 'rec_offline_1',
            category: 'Soil Care',
            title: 'Standard Soil Moisture Maintenance',
            advice: 'Weather telemetry unavailable. Maintain routine crop scouting and inspect soil moisture manually before watering.',
            urgency: 'low',
            icon: 'Droplets'
          }
        ],
        lastUpdated: new Date().toISOString(),
        dataSourceStatus: 'OFFLINE FALLBACK',
        isOfflineData: true
      };
    }
  }

  /**
   * Backward-compatible legacy adapter returning WeatherReport
   */
  async getWeather(lat: number, lon: number): Promise<WeatherReport> {
    const live = await this.getLiveWeatherData(lat, lon, undefined, false);
    const rainAlert = live.alerts.find(a => a.type === 'rain');

    const mappedForecast = live.dailyForecast.slice(0, 5).map(d => ({
      day: d.dayName,
      tempMax: d.tempMax,
      tempMin: d.tempMin,
      rainProb: d.rainProb
    }));

    return {
      temperature: live.temperature,
      humidity: live.humidity,
      windSpeed: live.windSpeed,
      rainfallProbability: live.currentHourlyRainProb,
      condition: live.condition,
      isRainAlert: Boolean(rainAlert),
      alertTitle: rainAlert?.title,
      alertDescription: rainAlert?.description,
      sourceLabel: live.dataSourceStatus,
      forecast: mappedForecast
    };
  }
}

export class PremiumWeatherProvider implements IWeatherService {
  async getWeather(): Promise<never> {
    throw new Error('PremiumWeatherProvider is dormant. Zero-billing policy is active.');
  }
  async getLiveWeatherData(): Promise<never> {
    throw new Error('PremiumWeatherProvider is dormant. Zero-billing policy is active.');
  }
}

// Global singleton instance for single authoritative weather data path
export const freeWeatherProvider = new FreeWeatherProvider();

export function getActiveWeatherService(): IWeatherService {
  if (APP_FEATURES.PREMIUM_WEATHER_ENABLED) {
    return new PremiumWeatherProvider();
  }
  return freeWeatherProvider;
}
