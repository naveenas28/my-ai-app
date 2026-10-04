# AgriVerse AI — Provider Architecture & Future Paid Upgrade Guide

This document defines the **Zero-Billing Architecture** currently running in AgriVerse AI, along with the **Future Paid Provider Upgrade Path** allowing optional paid services to be activated without rewriting the codebase.

---

## 1. Zero-Billing Active Mode (Current Implementation)

All active features in AgriVerse AI run exclusively on free tiers, device-native APIs, and government open data. **No credit cards, no Blaze billing, and no pay-as-you-go APIs are used.**

| Domain | Active Free Provider | Cost | Quota / Rate Limit | Fallback on Quota Exhaustion |
|---|---|---|---|---|
| **AI Intelligence** | `GeminiFreeProvider` (Google AI Studio Free Tier) | $0.00 | 15 RPM / 1,500 RPD | Built-in autonomous rule-based Krishi Agent runs local tools and returns verified guidance |
| **Speech Recognition** | `DeviceSpeechProvider` (Browser Web Speech API) | $0.00 | Unlimited (On-device) | Native voice input across 9 Indian languages; manual text fallback |
| **Speech Synthesis (TTS)** | `DeviceSpeechProvider` (`window.speechSynthesis`) | $0.00 | Unlimited (On-device) | Audio playback for semi-literate accessibility |
| **Storage / Images** | `LocalThumbnailStorageProvider` (HTML5 Canvas Compression) | $0.00 | Stored as ~15KB JPEG in Firestore Spark (1GB limit = 65,000+ scans) | Local browser IndexedDB/localStorage |
| **Weather** | `FreeWeatherProvider` (Open-Meteo Live API) | $0.00 | 10,000+ calls/day (No key required) | In-memory 15-minute cache + regional climate rules |
| **Market Mandi Prices** | `data.gov.in / Agmarknet` Government Open Data | $0.00 | Public domain / Open Data | Cached daily APMC modal prices |
| **Government Schemes** | `OfficialFreeProvider` (GoI & State Ag Portals) | $0.00 | Grounded Knowledge Base | Transparent unverified notification (No hallucination) |
| **Maps & Geocoding** | `OpenStreetMapProvider` (Nominatim & OSM Tiles) | $0.00 | Free community usage | Static district coordinates |
| **Backend Database** | Firebase Spark ($0 plan) | $0.00 | 50k reads / 20k writes per day | In-memory & local JSON mirror caching |

---

## 2. Central Feature Flags (`src/config/features.ts`)

All paid features are strictly disabled by default:

```typescript
export const APP_FEATURES: FeatureFlags = {
  AI_FREE_ENABLED: true,
  AI_PAID_ENABLED: false,             // <-- Strictly FALSE (No billing)

  VOICE_FREE_ENABLED: true,
  VOICE_PAID_ENABLED: false,          // <-- Strictly FALSE

  LOCAL_STORAGE_ENABLED: true,
  CLOUD_STORAGE_PAID_ENABLED: false,  // <-- Strictly FALSE (No Blaze)

  MAPS_FREE_ENABLED: true,
  MAPS_PAID_ENABLED: false,           // <-- Strictly FALSE

  FREE_SEARCH_ENABLED: true,
  PREMIUM_SEARCH_ENABLED: false,      // <-- Strictly FALSE

  FREE_WEATHER_ENABLED: true,
  PREMIUM_WEATHER_ENABLED: false,     // <-- Strictly FALSE

  OFFICIAL_GOV_FREE_ENABLED: true,
  PREMIUM_GOV_DATA_ENABLED: false,    // <-- Strictly FALSE

  OFFLINE_CACHE_ENABLED: true,
  STRICT_SAFETY_DISCLAIMERS: true,
  FREE_TIER_RATE_LIMITING: true,
};
```

---

## 3. Future Paid Upgrade Procedures (When Desired)

When you decide in the future to upgrade to paid services, follow these exact steps:

### A. Upgrading to Google Cloud / Paid Gemini (`GeminiPaidProvider`)
1. In Google Cloud Console or AI Studio, link a billing account.
2. In `.env`, insert your paid Gemini API key:
   ```env
   GEMINI_API_KEY="AIzaSy..."
   ```
3. In `src/config/features.ts`, toggle:
   ```typescript
   AI_PAID_ENABLED: true
   ```
4. Rebuild and deploy. No UI or routing rewrite needed.

### B. Upgrading to Firebase Blaze & Cloud Storage (`CloudStorageProvider`)
1. In Firebase Console, upgrade the project from **Spark** to **Blaze**.
2. Set budget alert to $5/month to prevent runaway spending.
3. In `src/config/features.ts`, toggle:
   ```typescript
   CLOUD_STORAGE_PAID_ENABLED: true
   ```

### C. Upgrading to Google Maps Platform (`GoogleMapsProvider`)
1. In Google Cloud Console, enable Maps JavaScript API and Geocoding API.
2. In `.env`, add:
   ```env
   GOOGLE_MAPS_API_KEY="AIzaSy..."
   ```
3. In `src/config/features.ts`, toggle:
   ```typescript
   MAPS_PAID_ENABLED: true
   ```

---

## 4. Source Transparency & Grounding Standards

Every output containing external or derived agricultural data is tagged:
- `[REAL DATA]` : Directly retrieved from live Open-Meteo, Agmarknet, or Government of India scheme portals.
- `[CACHED DATA]` : Sourced from the local sliding-window cache to protect API quotas.
- `[CALCULATED DATA]` : Mathematical fertilizer requirement (ICAR RDF), logistics freight, or cost-of-cultivation estimates.
- `[AI-GENERATED ADVICE]` : Synthesized agronomic guidance appended with the mandatory ICAR/KVK Agricultural Advisory Safety Notice.
