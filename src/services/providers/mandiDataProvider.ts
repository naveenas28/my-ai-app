/**
 * Official Government e-NAM & APMC Mandi Directory Provider
 * 
 * Authoritative integration with:
 * - e-NAM (National Agriculture Market, enam.gov.in) - 1,522 Regulated APMC Markets
 * - AGMARKNET (Agricultural Marketing Information Network, agmarknet.gov.in)
 * - Directorate of Marketing & Inspection (DMI), Ministry of Agriculture & Farmers Welfare, GoI
 */

import enamMandisRaw from '../../data/enamMandisData.json';

export interface MandiCommodityPrice {
  commodity: string;
  variety?: string;
  minPrice?: number | null; // in ₹ / Quintal
  maxPrice?: number | null; // in ₹ / Quintal
  modalPrice?: number | null; // in ₹ / Quintal
  unit?: string;
  arrivalQuantity?: string | null;
  date?: string;
  trend?: 'up' | 'down' | 'stable';
  changePercent?: string;
}

export interface OfficialMandiRecord {
  id: string;
  market: string;
  state: string;
  district: string;
  location: string;
  address: string;
  coordinates?: { lat: number; lng: number };
  commodities: MandiCommodityPrice[];
  primaryCommodity: string;
  hasLivePrice: boolean;
  latestPrice: string | null;
  modalPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  arrivalQuantity: string | null;
  dataDate: string;
  phone: string | null; // Official market office phone (landline/desk)
  mobile: string | null; // Official secretary/nodal mobile
  email: string | null; // Official government email
  whatsapp: string | null; // ONLY if specifically verified official WhatsApp
  officialUrl: string; // Official government portal page
  source: string;
  isEnamRegulated: boolean;
}

export interface MandiFilterQuery {
  state?: string;
  district?: string;
  commodity?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'modalPriceAsc' | 'modalPriceDesc' | 'marketName' | 'arrival';
}

export interface MandiQueryResult {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  states: string[];
  districts: string[];
  commodities: string[];
  mandis: OfficialMandiRecord[];
  source: string;
  error?: string;
}

// Helper to obtain today's date formatted ISO (YYYY-MM-DD)
export const getTodayDateStr = () => new Date().toISOString().split('T')[0];

/**
 * Authoritative e-NAM Connected 1,522 APMC Market Directory
 */
export const OFFICIAL_APMC_MANDI_DATA: OfficialMandiRecord[] = enamMandisRaw as OfficialMandiRecord[];

/**
 * Filter and query Mandi records with multi-dimensional criteria
 */
export function queryOfficialMandis(query: MandiFilterQuery): MandiQueryResult {
  const {
    state,
    district,
    commodity,
    search,
    page = 1,
    limit = 12,
    sortBy = 'modalPriceDesc'
  } = query;

  let filtered = [...OFFICIAL_APMC_MANDI_DATA];

  // 1. State filter
  if (state && state.trim() !== '' && state !== 'all') {
    const sLower = state.trim().toLowerCase();
    filtered = filtered.filter(m => m.state.toLowerCase() === sLower);
  }

  // 2. District filter
  if (district && district.trim() !== '' && district !== 'all') {
    const dLower = district.trim().toLowerCase();
    filtered = filtered.filter(m => m.district.toLowerCase() === dLower);
  }

  // 3. Commodity filter
  if (commodity && commodity.trim() !== '' && commodity !== 'all') {
    const cLower = commodity.trim().toLowerCase();
    filtered = filtered.filter(m =>
      (m.primaryCommodity && m.primaryCommodity.toLowerCase().includes(cLower)) ||
      (m.commodities && m.commodities.some(c => (typeof c === 'string' ? c : c.commodity).toLowerCase().includes(cLower)))
    );
  }

  // 4. Free text search
  if (search && search.trim() !== '') {
    const terms = search.trim().toLowerCase().split(/\s+/);
    filtered = filtered.filter(m => {
      const commStr = (m.commodities || []).map(c => typeof c === 'string' ? c : c.commodity).join(' ');
      const haystack = `${m.market} ${m.district} ${m.state} ${m.location || ''} ${m.primaryCommodity || ''} ${commStr}`.toLowerCase();
      return terms.every(term => haystack.includes(term));
    });
  }

  // 5. Sorting
  if (sortBy === 'modalPriceDesc') {
    filtered.sort((a, b) => {
      if (a.modalPrice === null && b.modalPrice === null) return 0;
      if (a.modalPrice === null) return 1;
      if (b.modalPrice === null) return -1;
      return b.modalPrice - a.modalPrice;
    });
  } else if (sortBy === 'modalPriceAsc') {
    filtered.sort((a, b) => {
      if (a.modalPrice === null && b.modalPrice === null) return 0;
      if (a.modalPrice === null) return 1;
      if (b.modalPrice === null) return -1;
      return a.modalPrice - b.modalPrice;
    });
  } else if (sortBy === 'marketName') {
    filtered.sort((a, b) => a.market.localeCompare(b.market));
  } else if (sortBy === 'arrival') {
    filtered.sort((a, b) => {
      const qA = a.arrivalQuantity ? parseInt(a.arrivalQuantity.replace(/[^0-9]/g, '') || '0', 10) : 0;
      const qB = b.arrivalQuantity ? parseInt(b.arrivalQuantity.replace(/[^0-9]/g, '') || '0', 10) : 0;
      return qB - qA;
    });
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedMandis = filtered.slice(startIndex, startIndex + limit);

  // Extract unique filter options available from the dataset
  const states = Array.from(new Set(OFFICIAL_APMC_MANDI_DATA.map(m => m.state))).sort();
  
  // Extract districts (if state is selected, return districts in that state)
  const baseForDistricts = (state && state !== 'all')
    ? OFFICIAL_APMC_MANDI_DATA.filter(m => m.state.toLowerCase() === state.toLowerCase())
    : OFFICIAL_APMC_MANDI_DATA;
  const districts = Array.from(new Set(baseForDistricts.map(m => m.district))).sort();

  // Extract unique commodities
  const allCommoditiesSet = new Set<string>();
  OFFICIAL_APMC_MANDI_DATA.forEach(m => {
    if (m.primaryCommodity) {
      allCommoditiesSet.add(m.primaryCommodity.split(' ')[0]);
    }
    if (m.commodities) {
      m.commodities.forEach(c => {
        const name = typeof c === 'string' ? c : c.commodity;
        if (name) allCommoditiesSet.add(name.split(' ')[0]);
      });
    }
  });
  const commodities = Array.from(allCommoditiesSet).sort();

  return {
    success: true,
    total,
    page,
    limit,
    totalPages,
    states,
    districts,
    commodities,
    mandis: paginatedMandis,
    source: 'e-NAM (National Agriculture Market) / AGMARKNET Directory'
  };
}

/**
 * Fetch a single Mandi record by ID
 */
export function getMandiById(id: string): OfficialMandiRecord | undefined {
  return OFFICIAL_APMC_MANDI_DATA.find(m => m.id === id);
}
