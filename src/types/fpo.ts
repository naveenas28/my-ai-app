export interface GovernmentFPO {
  id: string;
  sNo?: number;
  state: string;
  district: string;
  fpoName: string;
  legalForm: string;
  registrationNumber: string;
  registrationDate: string;
  address: string;
  contact?: string;
  email?: string;
  contactPerson?: string;
  majorCrops: string[];
  programme?: string;
  resourceInstitution?: string;
  sourceName: string;
  sourceUrl: string;
  portalUrl?: string;
  sourceUpdatedDate?: string;
  verificationStatus: "Government Listed";
  onlineStatus?: "Online" | "Offline" | "Unknown";
  communityStatus?: "NOT CONNECTED" | "VERIFIED / CONNECTED";
}

export interface FpoFilterOptions {
  searchQuery?: string;
  district?: string;
  crop?: string;
  legalForm?: string;
  userDistrict?: string;
}
