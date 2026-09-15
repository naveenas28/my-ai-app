import { LanguageCode } from '../types';

export interface LocationCoords {
  lat: number;
  lon: number;
  name: string;
  state?: string;
  country?: string;
  district?: string;
  village?: string;
}

export interface HourlyForecastItem {
  time: string; // e.g. "14:00"
  temp: number;
  feelsLike: number;
  rainProb: number;
  precipitationMm: number;
  weatherCode: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
}

export interface DailyForecastItem {
  date: string; // e.g. "2026-08-07"
  dayName: string; // e.g. "Fri" or "Today"
  tempMax: number;
  tempMin: number;
  rainProb: number;
  precipitationMm: number;
  weatherCode: number;
  condition: string;
  uvIndexMax: number;
  windSpeedMax: number;
  sunrise: string; // e.g. "06:12 AM"
  sunset: string; // e.g. "06:45 PM"
}

export type AlertType = 'rain' | 'heat' | 'frost' | 'wind' | 'thunderstorm' | 'flood' | 'drought';
export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface SevereWeatherAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  recommendedAction: string;
  timestamp: string;
}

export interface FarmingRecommendation {
  id: string;
  category: 'Spraying' | 'Irrigation' | 'Harvesting' | 'Pest Control' | 'Protection' | 'Soil Care';
  title: string;
  advice: string;
  urgency: 'high' | 'medium' | 'low';
  icon: string;
}

export interface LiveWeatherData {
  location: LocationCoords;
  temperature: number;
  feelsLike: number;
  condition: string;
  weatherCode: number;
  humidity: number;
  rainfallChance: number;
  precipitationMm: number;
  windSpeed: number;
  windDirection: number; // in degrees 0-360
  windDirectionText: string; // e.g. "NE", "SW"
  uvIndex: number;
  pressure: number; // hPa
  sunrise: string;
  sunset: string;
  visibilityKm: number;
  hourlyForecast: HourlyForecastItem[];
  dailyForecast: DailyForecastItem[];
  alerts: SevereWeatherAlert[];
  recommendations: FarmingRecommendation[];
  lastUpdated: string; // ISO string
  isOfflineData?: boolean;
}

/**
 * WMO Weather Interpretation Codes (WW)
 * https://open-meteo.com/en/docs
 */
export interface WMOWeatherInfo {
  label: string;
  iconType: 'sun' | 'cloud' | 'rain' | 'drizzle' | 'thunderstorm' | 'snow' | 'fog' | 'wind';
  isSevere: boolean;
}

export function getWMOWeatherInfo(code: number): WMOWeatherInfo {
  if (code === 0) return { label: 'Clear Sky', iconType: 'sun', isSevere: false };
  if (code === 1) return { label: 'Mainly Clear', iconType: 'sun', isSevere: false };
  if (code === 2) return { label: 'Partly Cloudy', iconType: 'cloud', isSevere: false };
  if (code === 3) return { label: 'Overcast', iconType: 'cloud', isSevere: false };
  if (code >= 45 && code <= 48) return { label: 'Dense Fog', iconType: 'fog', isSevere: false };
  if (code >= 51 && code <= 55) return { label: 'Light Drizzle', iconType: 'drizzle', isSevere: false };
  if (code >= 56 && code <= 57) return { label: 'Freezing Drizzle', iconType: 'drizzle', isSevere: true };
  if (code >= 61 && code <= 63) return { label: 'Moderate Rain', iconType: 'rain', isSevere: false };
  if (code >= 64 && code <= 65) return { label: 'Heavy Downpour', iconType: 'rain', isSevere: true };
  if (code >= 66 && code <= 67) return { label: 'Freezing Rain', iconType: 'rain', isSevere: true };
  if (code >= 71 && code <= 77) return { label: 'Snowfall', iconType: 'snow', isSevere: false };
  if (code >= 80 && code <= 82) return { label: 'Rain Showers', iconType: 'rain', isSevere: false };
  if (code >= 85 && code <= 86) return { label: 'Snow Showers', iconType: 'snow', isSevere: true };
  if (code === 95) return { label: 'Thunderstorm', iconType: 'thunderstorm', isSevere: true };
  if (code >= 96 && code <= 99) return { label: 'Thunderstorm with Hail', iconType: 'thunderstorm', isSevere: true };
  
  return { label: 'Fair Conditions', iconType: 'sun', isSevere: false };
}
