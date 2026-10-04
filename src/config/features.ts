/**
 * AgriVerse AI - Central Production Feature Configuration
 * 
 * STRICT ZERO-BILLING POLICY:
 * All paid services MUST default to false.
 * Paid providers are architected as dormant adapters and will NOT make API calls
 * unless an administrator explicitly activates them in the future.
 */

export interface FeatureFlags {
  // AI Service
  AI_FREE_ENABLED: boolean;
  AI_PAID_ENABLED: boolean;

  // Speech & Voice
  VOICE_FREE_ENABLED: boolean;
  VOICE_PAID_ENABLED: boolean;

  // Cloud & Local Storage
  LOCAL_STORAGE_ENABLED: boolean;
  CLOUD_STORAGE_PAID_ENABLED: boolean;

  // Maps & Geospatial
  MAPS_FREE_ENABLED: boolean;
  MAPS_PAID_ENABLED: boolean;

  // Search
  FREE_SEARCH_ENABLED: boolean;
  PREMIUM_SEARCH_ENABLED: boolean;

  // Weather Intelligence
  FREE_WEATHER_ENABLED: boolean;
  PREMIUM_WEATHER_ENABLED: boolean;

  // Government Open Data
  OFFICIAL_GOV_FREE_ENABLED: boolean;
  PREMIUM_GOV_DATA_ENABLED: boolean;

  // Offline First Mode
  OFFLINE_CACHE_ENABLED: boolean;

  // Rate Limiting & Safety
  STRICT_SAFETY_DISCLAIMERS: boolean;
  FREE_TIER_RATE_LIMITING: boolean;
}

export const APP_FEATURES: FeatureFlags = {
  // AI Free Tier (Google AI Studio Free Tier: 15 RPM, 1500 RPD, zero credit card)
  AI_FREE_ENABLED: true,
  AI_PAID_ENABLED: false, // NEVER enable without explicit developer payment action

  // Device-Native Web Speech APIs (Browser SpeechRecognition & SpeechSynthesis)
  VOICE_FREE_ENABLED: true,
  VOICE_PAID_ENABLED: false, // Cloud Speech-to-Text / ElevenLabs (Disabled)

  // Client-side HTML5 Canvas compression + Firestore Spark metadata (~15KB)
  LOCAL_STORAGE_ENABLED: true,
  CLOUD_STORAGE_PAID_ENABLED: false, // Firebase Cloud Storage Blaze billing (Disabled)

  // Free OpenStreetMap / Leaflet tile layers
  MAPS_FREE_ENABLED: true,
  MAPS_PAID_ENABLED: false, // Google Maps Platform paid billing (Disabled)

  // Free Government Open Data / Agmarknet / In-memory RAG
  FREE_SEARCH_ENABLED: true,
  PREMIUM_SEARCH_ENABLED: false, // Custom Google Search Engine paid API (Disabled)

  // Open-Meteo High Accuracy Free Weather API (No API key, zero cost)
  FREE_WEATHER_ENABLED: true,
  PREMIUM_WEATHER_ENABLED: false, // Paid weather providers (Disabled)

  // Official Indian Agriculture Portals & data.gov.in
  OFFICIAL_GOV_FREE_ENABLED: true,
  PREMIUM_GOV_DATA_ENABLED: false, // Paid ag-intelligence feeds (Disabled)

  // Local browser offline caching
  OFFLINE_CACHE_ENABLED: true,

  // Strict Agricultural Safety & Disclaimers
  STRICT_SAFETY_DISCLAIMERS: true,
  FREE_TIER_RATE_LIMITING: true,
};

// Safe runtime check ensuring no accidental billing activation
export function validateZeroBillingIntegrity(): { safe: boolean; violations: string[] } {
  const violations: string[] = [];
  if (APP_FEATURES.AI_PAID_ENABLED) violations.push('AI_PAID_ENABLED is active');
  if (APP_FEATURES.VOICE_PAID_ENABLED) violations.push('VOICE_PAID_ENABLED is active');
  if (APP_FEATURES.CLOUD_STORAGE_PAID_ENABLED) violations.push('CLOUD_STORAGE_PAID_ENABLED is active');
  if (APP_FEATURES.MAPS_PAID_ENABLED) violations.push('MAPS_PAID_ENABLED is active');
  if (APP_FEATURES.PREMIUM_SEARCH_ENABLED) violations.push('PREMIUM_SEARCH_ENABLED is active');
  if (APP_FEATURES.PREMIUM_WEATHER_ENABLED) violations.push('PREMIUM_WEATHER_ENABLED is active');
  if (APP_FEATURES.PREMIUM_GOV_DATA_ENABLED) violations.push('PREMIUM_GOV_DATA_ENABLED is active');

  return {
    safe: violations.length === 0,
    violations
  };
}
