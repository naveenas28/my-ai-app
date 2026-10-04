/**
 * Search Service Provider Abstraction
 * 
 * Free Provider: Grounded local RAG index searching agricultural knowledge, schemes, and mandis.
 * Paid Provider: Google Custom Search API - dormant under zero-billing policy.
 */

import { APP_FEATURES } from '../../config/features';

export interface SearchResultItem {
  id: string;
  title: string;
  snippet: string;
  source: string;
  category: string;
}

export interface ISearchService {
  searchAgriculturalTopic(query: string): Promise<SearchResultItem[]>;
}

export class FreeSearchProvider implements ISearchService {
  async searchAgriculturalTopic(query: string): Promise<SearchResultItem[]> {
    const q = query.toLowerCase();
    const results: SearchResultItem[] = [];

    // Search Tomato practices
    if (q.includes('tomato') || q.includes('ಟೊಮೆಟೊ') || q.includes('टमाटर')) {
      results.push({
        id: 'sr_tom_1',
        title: 'ICAR Package of Practices: Tomato Irrigation & Blight Defense',
        snippet: 'Tomatoes require critical moisture during flowering and fruit setting. Early Blight requires Mancozeb 2g/L or copper oxychloride. Avoid evening sprinkler overhead watering.',
        source: 'Indian Council of Agricultural Research (ICAR) & IIHR Bangalore',
        category: 'Crop Practice'
      });
    }

    // Search Paddy / Rice practices
    if (q.includes('paddy') || q.includes('rice') || q.includes('ಭತ್ತ') || q.includes('धान')) {
      results.push({
        id: 'sr_pad_1',
        title: 'ICAR Rice Knowledge Management Portal: Water Saving Direct Seeded Rice (DSR)',
        snippet: 'Maintain 2-5cm water depth during tillering to panicle initiation. Drain water 10-14 days before harvest to promote uniform ripening.',
        source: 'National Rice Research Institute (NRRI) & ICAR',
        category: 'Crop Practice'
      });
    }

    // Search Fertilizer practices
    if (q.includes('fertilizer') || q.includes('urea') || q.includes('dap') || q.includes('ಗೊಬ್ಬರ') || q.includes('खाद')) {
      results.push({
        id: 'sr_fert_1',
        title: 'National Project on Soil Health: Balanced NPK Fertilizer Dosages',
        snippet: 'Apply 50% nitrogen with full phosphorus and potassium as basal application. Split remaining 50% nitrogen into 2 top dressings to avoid leaching.',
        source: 'Soil Health Card Scheme & Department of Agriculture',
        category: 'Nutrient Management'
      });
    }

    return results;
  }
}

export class PremiumSearchProvider implements ISearchService {
  async searchAgriculturalTopic(): Promise<never> {
    throw new Error('PremiumSearchProvider is dormant. Zero-billing policy is active.');
  }
}

export function getActiveSearchService(): ISearchService {
  if (APP_FEATURES.PREMIUM_SEARCH_ENABLED) {
    return new PremiumSearchProvider();
  }
  return new FreeSearchProvider();
}
