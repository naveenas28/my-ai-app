import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { LiveWeatherData, LocationCoords } from '../types/weather';
import { fetchLiveWeather } from './weatherService';

const LOCAL_CACHE_KEY = 'agri_live_weather_cache';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL for weather cache

let memoryCache: { data: LiveWeatherData; timestamp: number; key: string } | null = null;

/**
 * Get cache key for coordinates
 */
function getCoordKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)}_${lon.toFixed(2)}`;
}

/**
 * Save user's preferred weather location in Firebase Firestore
 */
export async function saveUserWeatherLocationInFirestore(
  uid: string,
  location: LocationCoords
): Promise<void> {
  if (!uid || uid === 'guest' || uid === 'guest_uid') return;

  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      savedWeatherLocation: {
        lat: location.lat,
        lon: location.lon,
        name: location.name,
        state: location.state || '',
        country: location.country || '',
        updatedAt: new Date().toISOString()
      }
    }, { merge: true });
    console.log('Saved user weather location in Firestore:', location.name);
  } catch (err) {
    console.warn('Failed to save weather location in Firestore:', err);
  }
}

/**
 * Retrieve user's preferred weather location from Firebase Firestore
 */
export async function getUserWeatherLocationFromFirestore(
  uid: string
): Promise<LocationCoords | null> {
  if (!uid || uid === 'guest' || uid === 'guest_uid') return null;

  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists() && snap.data().savedWeatherLocation) {
      const locData = snap.data().savedWeatherLocation;
      return {
        lat: locData.lat,
        lon: locData.lon,
        name: locData.name,
        state: locData.state,
        country: locData.country
      };
    }
  } catch (err) {
    console.warn('Failed to fetch user weather location from Firestore:', err);
  }
  return null;
}

/**
 * High-level repository method to fetch weather with 15-min cache, offline fallback, and Firestore location integration
 */
export async function getWeatherForLocation(
  lat: number,
  lon: number,
  customName?: string,
  forceRefresh: boolean = false
): Promise<LiveWeatherData> {
  const coordKey = getCoordKey(lat, lon);
  const now = Date.now();

  // 1. Check in-memory cache
  if (!forceRefresh && memoryCache && memoryCache.key === coordKey && (now - memoryCache.timestamp) < CACHE_TTL_MS) {
    return memoryCache.data;
  }

  // 2. Try fetching live API if online
  if (navigator.onLine) {
    try {
      const liveData = await fetchLiveWeather(lat, lon, customName);
      
      // Update in-memory cache
      memoryCache = {
        data: liveData,
        timestamp: now,
        key: coordKey
      };

      // Update localStorage cache
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(liveData));

      return liveData;
    } catch (err) {
      console.warn('Network fetch failed in WeatherRepository, checking local offline cache...', err);
    }
  }

  // 3. Fallback to LocalStorage cache
  const offlineRaw = localStorage.getItem(LOCAL_CACHE_KEY);
  if (offlineRaw) {
    try {
      const parsed: LiveWeatherData = JSON.parse(offlineRaw);
      parsed.isOfflineData = true;
      return parsed;
    } catch (e) {
      console.warn('Error parsing offline weather cache:', e);
    }
  }

  // 4. If no cache exists, attempt live fetch regardless
  const fallbackLiveData = await fetchLiveWeather(lat, lon, customName);
  return fallbackLiveData;
}

/**
 * Save last successful weather snapshot to Firestore for persistent cloud access
 */
export async function saveWeatherSnapshotToFirestore(
  uid: string,
  weatherData: LiveWeatherData
): Promise<void> {
  if (!uid || uid === 'guest' || uid === 'guest_uid') return;

  try {
    const snapRef = doc(db, 'weather_snapshots', uid);
    await setDoc(snapRef, {
      ...weatherData,
      savedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore weather snapshot write skipped:', err);
  }
}
