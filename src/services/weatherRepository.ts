import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { LiveWeatherData, LocationCoords } from '../types/weather';
import { freeWeatherProvider } from './providers/weatherProvider';

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
 * High-level repository method to fetch weather
 * Directly routes through authoritative FreeWeatherProvider (Open-Meteo)
 * with 10-minute cache, force-refresh bypass, transparent status, and safe fallback.
 */
export async function getWeatherForLocation(
  lat: number,
  lon: number,
  customName?: string,
  forceRefresh: boolean = false
): Promise<LiveWeatherData> {
  return await freeWeatherProvider.getLiveWeatherData(lat, lon, customName, forceRefresh);
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
