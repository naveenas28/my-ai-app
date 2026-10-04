import rawFpoData from '../data/karnatakaFposData.json';
import { GovernmentFPO, FpoFilterOptions } from '../types/fpo';

/**
 * Validates that an FPO record meets minimal official requirements before being displayed.
 * Required: fpoName, district, registrationNumber, sourceUrl
 */
export function isValidFpoRecord(item: any): boolean {
  if (!item || typeof item !== 'object') return false;
  if (!item.fpoName || typeof item.fpoName !== 'string' || item.fpoName.trim() === '') return false;
  if (!item.district || typeof item.district !== 'string' || item.district.trim() === '') return false;
  if (!item.registrationNumber || typeof item.registrationNumber !== 'string' || item.registrationNumber.trim() === '') return false;
  if (!item.sourceUrl || typeof item.sourceUrl !== 'string' || item.sourceUrl.trim() === '') return false;
  return true;
}

/**
 * Sanitizes and formats an official FPO record.
 * Missing fields will explicitly return undefined or standard fallback strings without inventing data.
 */
function sanitizeFpoRecord(raw: any, index: number): GovernmentFPO {
  const fpoName = (raw.fpoName || 'Not available').trim();
  const district = (raw.district || 'Not available').trim();
  const registrationNumber = (raw.registrationNumber || 'Not available').trim();
  const registrationDate = (raw.registrationDate || 'Not available').trim();
  const address = (raw.address || 'Not available').trim();
  const legalForm = (raw.legalForm || 'Not available').trim();

  // Contact numbers only if published in official records
  const contact = raw.contact && String(raw.contact).trim() !== '' ? String(raw.contact).trim() : undefined;
  // Email only if published in official records
  const email = raw.email && String(raw.email).trim() !== '' ? String(raw.email).trim() : undefined;
  const contactPerson = raw.contactPerson && String(raw.contactPerson).trim() !== '' ? String(raw.contactPerson).trim() : undefined;
  const programme = raw.programme && String(raw.programme).trim() !== '' ? String(raw.programme).trim() : undefined;
  const resourceInstitution = raw.resourceInstitution && String(raw.resourceInstitution).trim() !== '' ? String(raw.resourceInstitution).trim() : undefined;

  const majorCrops: string[] = Array.isArray(raw.majorCrops) && raw.majorCrops.length > 0
    ? raw.majorCrops.map((c: any) => String(c).trim()).filter(Boolean)
    : ['Not available'];

  return {
    id: raw.id || `sfac-ka-${index + 1}`,
    sNo: raw.sNo || index + 1,
    state: raw.state || 'Karnataka',
    district,
    fpoName,
    legalForm,
    registrationNumber,
    registrationDate,
    address,
    contact,
    email,
    contactPerson,
    majorCrops,
    programme,
    resourceInstitution,
    sourceName: raw.sourceName || "Small Farmers' Agri-Business Consortium (SFAC), Dept. of Agriculture & Farmers Welfare, Govt. of India",
    sourceUrl: raw.sourceUrl || 'https://sfacindia.com/PDFs/List-of-FPO%20identified-by-SFAC/List%20of%20FPOs%20in%20the%20State%20of%20Karnataka.pdf',
    portalUrl: raw.portalUrl || 'https://sfacindia.com/FPOS.aspx',
    sourceUpdatedDate: raw.sourceUpdatedDate || 'Official SFAC Published Directory',
    verificationStatus: 'Government Listed',
    onlineStatus: raw.onlineStatus || 'Unknown',
    communityStatus: raw.communityStatus || 'NOT CONNECTED'
  };
}

// In-memory sanitized dataset
let cachedFpos: GovernmentFPO[] | null = null;

export function getAllKarnatakaFpos(): GovernmentFPO[] {
  if (cachedFpos) return cachedFpos;

  if (!Array.isArray(rawFpoData)) {
    console.error('Government FPO data could not be loaded: invalid format');
    return [];
  }

  const validList: GovernmentFPO[] = [];
  rawFpoData.forEach((item, idx) => {
    if (isValidFpoRecord(item)) {
      validList.push(sanitizeFpoRecord(item, idx));
    }
  });

  cachedFpos = validList;
  return cachedFpos;
}

/**
 * Filter FPOs by query, district, crop, and legal form.
 * Applies district priority if userDistrict is specified.
 */
export function filterKarnatakaFpos(options: FpoFilterOptions): GovernmentFPO[] {
  const all = getAllKarnatakaFpos();
  const queryStr = (options.searchQuery || '').trim().toLowerCase();
  const districtFilter = (options.district || '').trim().toLowerCase();
  const cropFilter = (options.crop || '').trim().toLowerCase();
  const legalFormFilter = (options.legalForm || '').trim().toLowerCase();
  const userDistrict = (options.userDistrict || '').trim().toLowerCase();

  const filtered = all.filter((fpo) => {
    // 1. Text search across name, district, address/taluk, major crops, legal form, registration number
    if (queryStr) {
      const matchName = fpo.fpoName.toLowerCase().includes(queryStr);
      const matchDistrict = fpo.district.toLowerCase().includes(queryStr);
      const matchAddress = fpo.address.toLowerCase().includes(queryStr);
      const matchReg = fpo.registrationNumber.toLowerCase().includes(queryStr);
      const matchLegal = fpo.legalForm.toLowerCase().includes(queryStr);
      const matchCrops = fpo.majorCrops.some((c) => c.toLowerCase().includes(queryStr));
      const matchContact = (fpo.contact && fpo.contact.includes(queryStr)) || false;
      const matchPerson = (fpo.contactPerson && fpo.contactPerson.toLowerCase().includes(queryStr)) || false;

      if (!matchName && !matchDistrict && !matchAddress && !matchReg && !matchLegal && !matchCrops && !matchContact && !matchPerson) {
        return false;
      }
    }

    // 2. Specific District filter
    if (districtFilter && districtFilter !== 'all') {
      if (fpo.district.toLowerCase() !== districtFilter) {
        return false;
      }
    }

    // 3. Crop filter
    if (cropFilter && cropFilter !== 'all') {
      const hasCrop = fpo.majorCrops.some((c) => c.toLowerCase() === cropFilter || c.toLowerCase().includes(cropFilter));
      if (!hasCrop) return false;
    }

    // 4. Legal form filter
    if (legalFormFilter && legalFormFilter !== 'all') {
      if (!fpo.legalForm.toLowerCase().includes(legalFormFilter)) {
        return false;
      }
    }

    return true;
  });

  // District Priority sorting:
  // If userDistrict is configured and user is browsing without a restrictive single district filter,
  // place FPOs matching the user's home district at the top, followed by the rest.
  if (userDistrict && (!districtFilter || districtFilter === 'all')) {
    return [...filtered].sort((a, b) => {
      const aIsUserDistrict = a.district.toLowerCase() === userDistrict;
      const bIsUserDistrict = b.district.toLowerCase() === userDistrict;
      if (aIsUserDistrict && !bIsUserDistrict) return -1;
      if (!aIsUserDistrict && bIsUserDistrict) return 1;
      return (a.sNo || 0) - (b.sNo || 0);
    });
  }

  return filtered;
}

/**
 * Extract sorted unique list of districts present in the official data.
 */
export function getUniqueDistricts(): string[] {
  const all = getAllKarnatakaFpos();
  const set = new Set<string>();
  all.forEach((f) => {
    if (f.district && f.district !== 'Not available') {
      set.add(f.district);
    }
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/**
 * Extract sorted unique list of major crops present in the official data.
 */
export function getUniqueMajorCrops(): string[] {
  const all = getAllKarnatakaFpos();
  const set = new Set<string>();
  all.forEach((f) => {
    f.majorCrops.forEach((c) => {
      if (c && c !== 'Not available') {
        set.add(c);
      }
    });
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/**
 * Extract sorted unique list of legal forms (e.g. Producer Company, Cooperative Society).
 */
export function getUniqueLegalForms(): string[] {
  const all = getAllKarnatakaFpos();
  const set = new Set<string>();
  all.forEach((f) => {
    if (f.legalForm && f.legalForm !== 'Not available') {
      set.add(f.legalForm);
    }
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/**
 * Retrieve a specific FPO by ID.
 */
export function getFpoById(id: string): GovernmentFPO | undefined {
  const all = getAllKarnatakaFpos();
  return all.find((f) => f.id === id);
}
