import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface GovernmentSchemeDoc {
  id: string;
  title: string;
  benefit: string;
  eligibility: string;
  category: string;
  officialUrl: string;
  subsidyPercentage: string;
}

export const INITIAL_GOV_SCHEMES: GovernmentSchemeDoc[] = [
  {
    id: 'sch1',
    title: 'PM-KISAN Samman Nidhi Yojana',
    benefit: '₹6,000 / year direct bank transfer in 3 instalments',
    eligibility: 'All landholding farmer families with arable land',
    category: 'Income Support',
    officialUrl: 'https://pmkisan.gov.in/',
    subsidyPercentage: '100% Direct Cash Transfer'
  },
  {
    id: 'sch2',
    title: 'PM Fasal Bima Yojana (Crop Insurance)',
    benefit: 'Comprehensive crop loss cover against flood, drought, blight',
    eligibility: 'All farmers growing notified crops in notified areas',
    category: 'Risk Mitigation',
    officialUrl: 'https://pmfby.gov.in/',
    subsidyPercentage: 'Up to 90% Premium Subsidized'
  },
  {
    id: 'sch3',
    title: 'Pradhan Mantri Krishi Sinchayee Yojana (Micro-Irrigation)',
    benefit: '50% to 80% subsidy on Drip & Micro-Sprinkler Systems',
    eligibility: 'Small & marginal farmers up to 5 acres',
    category: 'Irrigation',
    officialUrl: 'https://pmksy.gov.in/',
    subsidyPercentage: '80% Subsidy'
  },
  {
    id: 'sch4',
    title: 'Soil Health Card Scheme',
    benefit: 'Free soil testing & customized NPK fertilizer recommendation',
    eligibility: 'All active agricultural land owners in India',
    category: 'Soil Care',
    officialUrl: 'https://soilhealth.dac.gov.in/',
    subsidyPercentage: '100% Free Service'
  }
];

/**
 * Loads government schemes from Firestore, auto-seeding if empty
 */
export async function fetchGovernmentSchemes(): Promise<GovernmentSchemeDoc[]> {
  try {
    const schemesCol = collection(db, 'government_schemes');
    const snapshot = await getDocs(schemesCol);

    if (snapshot.empty) {
      // Seed default schemes into Firestore
      const seeded: GovernmentSchemeDoc[] = [];
      for (const scheme of INITIAL_GOV_SCHEMES) {
        try {
          const docRef = await addDoc(schemesCol, {
            ...scheme,
            createdAt: serverTimestamp()
          });
          seeded.push({ ...scheme, id: docRef.id });
        } catch (e) {
          console.warn('Scheme seed error:', e);
        }
      }
      return seeded.length ? seeded : INITIAL_GOV_SCHEMES;
    } else {
      return snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title || '',
          benefit: data.benefit || '',
          eligibility: data.eligibility || '',
          category: data.category || 'General',
          officialUrl: data.officialUrl || 'https://agricoop.gov.in/',
          subsidyPercentage: data.subsidyPercentage || 'Subsidized'
        };
      });
    }
  } catch (error) {
    console.warn('Failed to fetch schemes from Firestore, using initial dataset:', error);
    return INITIAL_GOV_SCHEMES;
  }
}
