import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { CropPrice } from '../types';

export const INITIAL_CROP_PRICES: CropPrice[] = [
  {
    id: 'cp1',
    name: 'Tomato (Hybrid Red)',
    mandi: 'Kolar & Chikkaballapura APMC',
    price: '₹2,450 / Quintal',
    priceChange: '+₹180 (7.9%) Today',
    isPositive: true,
    predictedDemand: 'HIGH',
    aiAdvice: 'Festival demand surges in Bangalore & Chennai mandis. Recommended harvest target window: Next 3 days.',
    trend: 'up',
    change: '+7.9%',
    demand: 'HIGH',
    profit: 'HIGH',
    risk: 'LOW',
    nextSeasonPredicted: '₹2,700 / Qtl'
  },
  {
    id: 'cp2',
    name: 'Basmati Paddy (PR 126)',
    mandi: 'Amritsar & Karnal Grain Mandi',
    price: '₹3,890 / Quintal',
    priceChange: '+₹90 (2.3%) Today',
    isPositive: true,
    predictedDemand: 'HIGH',
    aiAdvice: 'Export demand steady. Moisture content below 14% guarantees peak miller payout.',
    trend: 'up',
    change: '+2.3%',
    demand: 'HIGH',
    profit: 'HIGH',
    risk: 'LOW',
    nextSeasonPredicted: '₹4,100 / Qtl'
  },
  {
    id: 'cp3',
    name: 'Red Onion (Nasik High Quality)',
    mandi: 'Lasalgaon APMC',
    price: '₹1,950 / Quintal',
    priceChange: '-₹45 (-2.2%) Today',
    isPositive: false,
    predictedDemand: 'MEDIUM',
    aiAdvice: 'Fresh harvest arrival increasing. Hold dry storage stock for 2 weeks to capture price bounce.',
    trend: 'down',
    change: '-2.2%',
    demand: 'MEDIUM',
    profit: 'MEDIUM',
    risk: 'MEDIUM',
    nextSeasonPredicted: '₹2,200 / Qtl'
  },
  {
    id: 'cp4',
    name: 'Green Chili (Guntur Teja)',
    mandi: 'Guntur & Ramanagara APMC',
    price: '₹7,200 / Quintal',
    priceChange: '+₹420 (6.1%) Today',
    isPositive: true,
    predictedDemand: 'HIGH',
    aiAdvice: 'High spice processing demand. High market liquidity expected across state borders.',
    trend: 'up',
    change: '+6.1%',
    demand: 'HIGH',
    profit: 'HIGH',
    risk: 'LOW',
    nextSeasonPredicted: '₹7,800 / Qtl'
  }
];

/**
 * Fetch live mandi prices from Firestore with auto-seeding capability
 */
export async function fetchLiveMarketPrices(): Promise<CropPrice[]> {
  try {
    const colRef = collection(db, 'crop_prices');
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      const seeded: CropPrice[] = [];
      for (const item of INITIAL_CROP_PRICES) {
        try {
          const docRef = await addDoc(colRef, {
            ...item,
            createdAt: serverTimestamp()
          });
          seeded.push({ ...item, id: docRef.id });
        } catch (e) {
          console.warn('Market price seed error:', e);
        }
      }
      return seeded.length ? seeded : INITIAL_CROP_PRICES;
    } else {
      return snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || '',
          mandi: data.mandi || '',
          price: data.price || '',
          priceChange: data.priceChange || data.change || '',
          isPositive: data.isPositive !== undefined ? data.isPositive : true,
          predictedDemand: data.predictedDemand || 'HIGH',
          aiAdvice: data.aiAdvice || '',
          trend: data.trend || 'up',
          change: data.change || data.priceChange || '+0%',
          demand: data.demand || 'HIGH',
          profit: data.profit || 'HIGH',
          risk: data.risk || 'LOW',
          nextSeasonPredicted: data.nextSeasonPredicted || data.price
        };
      });
    }
  } catch (error) {
    console.warn('Failed to fetch market prices from Firestore, returning initial set:', error);
    return INITIAL_CROP_PRICES;
  }
}
