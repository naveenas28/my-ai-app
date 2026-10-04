/**
 * Weather Data Provider
 * 
 * Clean abstraction for real-time agricultural weather forecasts and agro-meteorological alerts.
 * Grounded in Open-Meteo High Resolution Weather API (free, open, no API key required).
 */

export {
  FreeWeatherProvider
} from './weatherProvider';
export type {
  WeatherReport,
  IWeatherService
} from './weatherProvider';
