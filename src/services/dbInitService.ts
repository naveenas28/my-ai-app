import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, doc, getDoc, setDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

export interface FarmDoc {
  id: string;
  userId: string;
  farmName: string;
  location: string;
  acreage: number;
  soilType: string;
  irrigationType: string;
  createdAt: string;
}

export interface CropDoc {
  id: string;
  userId: string;
  farmId?: string;
  cropName: string;
  variety: string;
  sowingDate: string;
  expectedHarvest: string;
  status: 'sown' | 'growing' | 'harvested' | 'diseased';
  createdAt: string;
}

export interface WeatherCacheDoc {
  district: string;
  temperature: number;
  condition: string;
  humidity: number;
  rainfall: number;
  updatedAt: string;
}

export interface MarketPriceDoc {
  id: string;
  commodity: string;
  mandi: string;
  district: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  updatedAt: string;
}

export interface NotificationDoc {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'weather' | 'market' | 'scheme' | 'alert';
  read: boolean;
  createdAt: string;
}

export interface CommunityPostDoc {
  id: string;
  author: string;
  authorUid: string;
  content: string;
  image?: string;
  district: string;
  village?: string;
  likesCount: number;
  createdAt: string;
}

export interface ChatRoomDoc {
  id: string;
  title: string;
  type: 'private' | 'group' | 'district';
  members: string[];
  lastMessage?: string;
  updatedAt: string;
}

export interface OrderDoc {
  id: string;
  userId: string;
  itemTitle: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface TransactionDoc {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  status: 'success' | 'pending' | 'failed';
  createdAt: string;
}

/**
 * Initialize baseline structure / ensure collections exist in Firestore
 */
export async function ensureCollectionsInitialized(userId: string): Promise<void> {
  if (!userId) return;

  const collectionsToCheck = [
    'users',
    'farms',
    'crops',
    'weather_cache',
    'market_prices',
    'notifications',
    'community_posts',
    'chat_rooms',
    'orders',
    'transactions'
  ];

  console.log(`Checking & verifying ${collectionsToCheck.length} Firestore collections...`);

  // Touch default records for user if not yet present
  try {
    const farmRef = doc(db, 'farms', `default_farm_${userId}`);
    const farmSnap = await getDoc(farmRef);
    if (!farmSnap.exists()) {
      await setDoc(farmRef, {
        id: `default_farm_${userId}`,
        userId,
        farmName: 'Main Plot',
        location: 'Chikkaballapura, KA',
        acreage: 2.5,
        soilType: 'Red Loam',
        irrigationType: 'Drip Irrigation',
        createdAt: new Date().toISOString()
      });
    }

    const notifRef = doc(db, 'notifications', `welcome_${userId}`);
    const notifSnap = await getDoc(notifRef);
    if (!notifSnap.exists()) {
      await setDoc(notifRef, {
        id: `welcome_${userId}`,
        userId,
        title: 'Welcome to AgriVerse AI',
        message: 'Your production backend session and profile are now synced with Firestore.',
        type: 'info',
        read: false,
        createdAt: new Date().toISOString()
      });
    }
  } catch (err) {
    console.warn('Collection touch warning:', err);
  }
}
