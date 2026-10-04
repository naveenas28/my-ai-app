/**
 * Government Data & RAG Knowledge Provider Abstraction
 * 
 * Free Provider: Grounded repository of official Government of India & State Agriculture schemes.
 * Grounded in official portals (pmkisan.gov.in, pmfby.gov.in, pmksy.gov.in, agricoop.gov.in).
 * Paid Provider: Commercial ag intelligence feed - dormant under zero-billing policy.
 */

import { APP_FEATURES } from '../../config/features';

export interface OfficialGovernmentScheme {
  id: string;
  title: string;
  category: 'Income Support' | 'Crop Insurance' | 'Irrigation' | 'Soil Care' | 'Credit' | 'Machinery' | 'Organic';
  benefit: string;
  eligibility: string;
  documentsNeeded: string[];
  applicationProcess: string;
  officialUrl: string;
  lastUpdated: string;
  subsidyPercentage?: string;
  sourceAuthority: string;
}

export const VERIFIED_GOVERNMENT_SCHEMES: OfficialGovernmentScheme[] = [
  {
    id: 'pm-kisan',
    title: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    category: 'Income Support',
    benefit: '₹6,000 per year provided in three equal 4-monthly instalments of ₹2,000 directly into Aadhaar-seeded bank accounts.',
    eligibility: 'All landholding farmer families who own cultivable land in their names (subject to exclusion criteria such as institutional landholders, income tax payers).',
    documentsNeeded: [
      'Aadhaar Card linked with active mobile number',
      'Proof of citizenship',
      'Landholding ownership papers (Pahani / RTC / Khasra / Khatauni)',
      'Aadhaar-seeded bank account details'
    ],
    applicationProcess: 'Farmers can self-register online at pmkisan.gov.in under Farmer Corner, through the PMKISAN Mobile App, or visit the nearest Common Service Centre (CSC) / Village Agriculture Office.',
    officialUrl: 'https://pmkisan.gov.in/',
    lastUpdated: 'September 2026',
    subsidyPercentage: '100% Direct Cash Transfer',
    sourceAuthority: 'Ministry of Agriculture and Farmers Welfare, Govt of India'
  },
  {
    id: 'pmfby',
    title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    category: 'Crop Insurance',
    benefit: 'Comprehensive crop insurance coverage against non-preventable natural risks (drought, flood, unseasonal rain, pest/disease attack, post-harvest losses within 14 days).',
    eligibility: 'All farmers including sharecroppers and tenant farmers growing notified crops in notified insurance units.',
    documentsNeeded: [
      'Aadhaar Card',
      'Land Record (ROR / RTC / Land Possession Certificate)',
      'Sowing Certificate issued by Patwari/Village Accountant/Gram Panchayat',
      'Bank passbook photocopy showing IFSC'
    ],
    applicationProcess: 'Apply online at pmfby.gov.in or through bank branches, Primary Agricultural Credit Societies (PACS), or CSC centers before the cut-off date (July 31 for Kharif, Dec 31 for Rabi). Premium share for farmer is only 2% for Kharif, 1.5% for Rabi, and 5% for annual commercial/horticultural crops.',
    officialUrl: 'https://pmfby.gov.in/',
    lastUpdated: 'September 2026',
    subsidyPercentage: 'Up to 90% premium subsidy borne by Central & State Govts',
    sourceAuthority: 'Ministry of Agriculture and Farmers Welfare, Govt of India'
  },
  {
    id: 'pmksy',
    title: 'Pradhan Mantri Krishi Sinchayee Yojana (PMKSY - Per Drop More Crop)',
    category: 'Irrigation',
    benefit: 'Subsidies on drip and micro-sprinkler irrigation systems to maximize water use efficiency and fertilizer distribution.',
    eligibility: 'All farmers possessing cultivable land. Small and marginal farmers receive top-tier subsidy preference.',
    documentsNeeded: [
      'Aadhaar Card',
      'Land ownership documents (RTC / Patta)',
      'Water source availability certificate / Electricity bill of pump',
      'Bank Account details'
    ],
    applicationProcess: 'Apply through the State Department of Agriculture / Horticulture web portal (e.g. Raitha Siri in Karnataka, e-Krishi, or pmksy.gov.in) or visit the Assistant Director of Horticulture at the Taluk/Block level.',
    officialUrl: 'https://pmksy.gov.in/',
    lastUpdated: 'September 2026',
    subsidyPercentage: 'Up to 55% for Small/Marginal farmers, 45% for other farmers (with state top-ups reaching 80%-90%)',
    sourceAuthority: 'Department of Agriculture, Cooperation & Farmers Welfare, GoI'
  },
  {
    id: 'soil-health-card',
    title: 'Soil Health Card Scheme',
    category: 'Soil Care',
    benefit: 'Free soil sample testing providing status of 12 nutrients (N, P, K, S, Zn, Fe, Cu, Mn, Bo, pH, EC, OC) and customized crop-specific fertilizer recommendations.',
    eligibility: 'All farmers across India who have farm holdings.',
    documentsNeeded: [
      'Aadhaar Card',
      'Farm survey number / Plot details',
      'Contact number'
    ],
    applicationProcess: 'State agriculture department field staff collect soil samples from GPS grid points. Farmers can view and download their Soil Health Card by entering their State, District, Sub-district, and Village at soilhealth.dac.gov.in.',
    officialUrl: 'https://soilhealth.dac.gov.in/',
    lastUpdated: 'September 2026',
    subsidyPercentage: '100% Free Service funded by Govt of India',
    sourceAuthority: 'Ministry of Agriculture and Farmers Welfare, Govt of India'
  },
  {
    id: 'kcc',
    title: 'Kisan Credit Card (KCC) Scheme',
    category: 'Credit',
    benefit: 'Short-term credit for crop cultivation, post-harvest expenses, and farm maintenance at an effective interest rate of 4% per annum (with prompt repayment incentive of 3%).',
    eligibility: 'Individual/joint borrowers who are owner cultivators, tenant farmers, oral lessees, sharecroppers, and SHGs/JLGs of farmers including dairy and fisheries.',
    documentsNeeded: [
      'Application Form',
      'Aadhaar Card / Voter ID for KYC',
      'Land Record / Cultivation rights agreement',
      'Two passport size photographs'
    ],
    applicationProcess: 'Apply at any commercial bank, Regional Rural Bank (RRB), Cooperative Bank, or online via the unified portal / Bank portals. Simplified 1-page form available.',
    officialUrl: 'https://agricoop.gov.in/',
    lastUpdated: 'September 2026',
    subsidyPercentage: 'Interest subvention of 2% + 3% prompt repayment incentive',
    sourceAuthority: 'Reserve Bank of India & Ministry of Agriculture'
  },
  {
    id: 'smam',
    title: 'Sub-Mission on Agricultural Mechanization (SMAM)',
    category: 'Machinery',
    benefit: 'Financial assistance for procurement of farm tractors, power tillers, rotavators, seed drills, harvesters, and establishment of Custom Hiring Centres (CHC).',
    eligibility: 'Individual farmers, farmer groups, FPOs, and village youth.',
    documentsNeeded: [
      'Aadhaar Card',
      'Land records (RTC / Pahani)',
      'Bank passbook copy',
      'Caste certificate (for SC/ST quota enhancements)'
    ],
    applicationProcess: 'Apply online on the SMAM portal (agrimachinery.nic.in) under Registration > Farmer Registration. Select desired equipment and registered manufacturer/dealer.',
    officialUrl: 'https://agrimachinery.nic.in/',
    lastUpdated: 'September 2026',
    subsidyPercentage: '40% to 50% for individual farmers; up to 80% for Custom Hiring Centres',
    sourceAuthority: 'Ministry of Agriculture & Farmers Welfare'
  },
  {
    id: 'pkvy',
    title: 'Paramparagat Krishi Vikas Yojana (PKVY - Organic Farming)',
    category: 'Organic',
    benefit: 'Financial assistance of ₹50,000 per hectare over 3 years for organic conversion, Participatory Guarantee System (PGS) certification, bio-fertilizers, and organic manure.',
    eligibility: 'All farmers adopting organic farming clusters (minimum 20 hectares or 50 farmers per cluster), individual progressive organic growers.',
    documentsNeeded: [
      'Aadhaar Card',
      'Land records (RTC / Pahani / Khasra)',
      'Bank passbook details',
      'Farmer Group / Cluster enrollment form'
    ],
    applicationProcess: 'Enroll via the State Department of Agriculture / Horticulture Organic Mission nodal officer or register online at the PGS-India portal (pgsindia-ncof.gov.in).',
    officialUrl: 'https://pgsindia-ncof.gov.in/',
    lastUpdated: 'September 2026',
    subsidyPercentage: '₹50,000 / ha (Direct grant for seeds, bio-inputs, packaging & certification)',
    sourceAuthority: 'National Centre for Organic and Natural Farming (NCONF) & MoA&FW'
  }
];

export interface IGovernmentDataService {
  getSchemes(category?: string, query?: string): Promise<OfficialGovernmentScheme[]>;
  searchDocuments(query: string): Promise<{ results: OfficialGovernmentScheme[]; verificationState: string }>;
}

export class OfficialFreeProvider implements IGovernmentDataService {
  async getSchemes(category?: string, query?: string): Promise<OfficialGovernmentScheme[]> {
    let list = [...VERIFIED_GOVERNMENT_SCHEMES];

    if (category && category !== 'all') {
      const catLower = category.toLowerCase();
      list = list.filter(s => s.category.toLowerCase().includes(catLower));
    }

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(s => 
        s.title.toLowerCase().includes(q) ||
        s.benefit.toLowerCase().includes(q) ||
        s.eligibility.toLowerCase().includes(q)
      );
    }

    return list;
  }

  async searchDocuments(query: string): Promise<{ results: OfficialGovernmentScheme[]; verificationState: string }> {
    const q = query.toLowerCase();
    const matches = VERIFIED_GOVERNMENT_SCHEMES.filter(s => 
      s.title.toLowerCase().includes(q) ||
      s.benefit.toLowerCase().includes(q) ||
      s.eligibility.toLowerCase().includes(q) ||
      s.documentsNeeded.some(d => d.toLowerCase().includes(q))
    );

    if (matches.length > 0) {
      return {
        results: matches,
        verificationState: 'VERIFIED_OFFICIAL'
      };
    }

    return {
      results: [],
      verificationState: 'NO_OFFICIAL_RECORD_FOUND'
    };
  }
}

export class PremiumDataProvider implements IGovernmentDataService {
  async getSchemes(): Promise<never> {
    throw new Error('PremiumDataProvider is dormant. Zero-billing policy is active.');
  }

  async searchDocuments(): Promise<never> {
    throw new Error('PremiumDataProvider is dormant. Zero-billing policy is active.');
  }
}

export function getActiveGovernmentDataService(): IGovernmentDataService {
  if (APP_FEATURES.PREMIUM_GOV_DATA_ENABLED) {
    return new PremiumDataProvider();
  }
  return new OfficialFreeProvider();
}
