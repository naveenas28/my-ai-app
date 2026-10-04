/**
 * Maps & Geospatial Service Provider Abstraction
 * 
 * Free Provider: OpenStreetMap / Nominatim / Free Geo APIs.
 * Paid Provider: Google Maps Platform - strictly dormant under zero-billing policy.
 */

import { APP_FEATURES } from '../../config/features';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  displayName: string;
}

export interface IMapsService {
  geocodeDistrict(district: string, state: string): Promise<LocationCoordinates>;
  getTileLayerUrl(): string;
}

export class OpenStreetMapProvider implements IMapsService {
  async geocodeDistrict(district: string, state: string): Promise<LocationCoordinates> {
    try {
      const query = encodeURIComponent(`${district}, ${state}, India`);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data[0]) {
          return {
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon),
            displayName: data[0].display_name
          };
        }
      }
    } catch (e) {
      console.warn('Nominatim geocoding fallback triggered:', e);
    }

    // Default regional coordinate fallback (Chikkaballapura, Karnataka)
    return {
      latitude: 13.4355,
      longitude: 77.7279,
      displayName: `${district}, ${state}`
    };
  }

  getTileLayerUrl(): string {
    return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  }
}

export class GoogleMapsProvider implements IMapsService {
  async geocodeDistrict(): Promise<never> {
    throw new Error('GoogleMapsProvider is dormant. Zero-billing policy is active.');
  }

  getTileLayerUrl(): never {
    throw new Error('GoogleMapsProvider is dormant. Zero-billing policy is active.');
  }
}

export function getActiveMapsService(): IMapsService {
  if (APP_FEATURES.MAPS_PAID_ENABLED) {
    return new GoogleMapsProvider();
  }
  return new OpenStreetMapProvider();
}
