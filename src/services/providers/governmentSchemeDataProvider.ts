/**
 * Government Scheme Data Provider
 * 
 * Clean abstraction for official Government of India (GoI) and State Government
 * agriculture welfare schemes, subsidies, crop insurance (PMFBY), and concessional credit (KCC).
 */

export {
  VERIFIED_GOVERNMENT_SCHEMES
} from './governmentDataProvider';
export type { OfficialGovernmentScheme } from './governmentDataProvider';

import { VERIFIED_GOVERNMENT_SCHEMES, type OfficialGovernmentScheme } from './governmentDataProvider';

/**
 * Find official scheme by keyword or scheme id
 */
export function findOfficialScheme(query: string): OfficialGovernmentScheme | null {
  const q = query.toLowerCase().trim();
  for (const scheme of VERIFIED_GOVERNMENT_SCHEMES) {
    if (
      scheme.id.toLowerCase().includes(q) ||
      scheme.title.toLowerCase().includes(q) ||
      scheme.category.toLowerCase().includes(q)
    ) {
      return scheme;
    }
  }
  return null;
}
