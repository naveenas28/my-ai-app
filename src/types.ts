export type LanguageCode = 'kn' | 'ta' | 'hi' | 'te' | 'ml' | 'bn' | 'mr' | 'pa' | 'en';

export interface TranslationSet {
  appName: string;
  tabs: {
    home: string;
    community: string;
    marketplace: string;
    assistant: string;
    profile: string;
  };
  home: {
    greeting: string;
    offlineMode: string;
    assistantShortcut: string;
    voiceSearchPlaceholder: string;
    quickActions: string;
    cropDoctor: string;
    irrigation: string;
    schemes: string;
    rental: string;
    weatherCard: string;
    currentWeather: string;
    humidity: string;
    rainfallChance: string;
    alertTitle: string;
    forecast: string;
    cropPrices: string;
    currentMarketPrice: string;
    predictedPrice: string;
    predictionTitle: string;
    demandLevel: string;
    profitPotential: string;
    climateRisk: string;
    growReminders: string;
    waterReminder: string;
    pestReminder: string;
    fertilizerReminder: string;
    governmentSchemes: string;
    applyNow: string;
  };
  community: {
    title: string;
    createPost: string;
    postPlaceholder: string;
    postButton: string;
    comments: string;
    addCommentPlaceholder: string;
    voicePostBtn: string;
    shareImageBtn: string;
    verifiedFarmer: string;
    forumsFeed?: string;
    voiceHub?: string;
    farmersChat?: string;
    districtHub?: string;
  };
  marketplace: {
    title: string;
    sellTitle: string;
    sellDescription: string;
    cropName: string;
    quantity: string;
    price: string;
    imageUpload: string;
    submitOffer: string;
    buyNow: string;
    negotiate: string;
    verifiedSeller: string;
    searchPlaceholder: string;
  };
  assistant: {
    title: string;
    welcomeMessage: string;
    voiceRecording: string;
    speakInstruction: string;
    cropDoctorTitle: string;
    cropDoctorDesc: string;
    uploadLeaf: string;
    diagnoseBtn: string;
    diagnosisResult: string;
    suggestion: string;
    backBtn: string;
    askPlaceholder: string;
    sendBtn: string;
  };
  profile: {
    title: string;
    farmerName: string;
    farmLocation: string;
    languageSettings: string;
    notificationTitle: string;
    notificationDesc: string;
    reportsTitle: string;
    reportsDesc: string;
    eligibilityTitle: string;
    eligibilityDesc: string;
    financeTitle: string;
    financeDesc: string;
    sustainabilityScore: string;
    editProfileBtn?: string;
    logoutBtn?: string;
  };
  common: {
    loading: string;
    success: string;
    error: string;
    retry: string;
    otpTitle: string;
    otpSubtitle: string;
    phonePlaceholder: string;
    sendOtp: string;
    verifyOtp: string;
    otpPlaceholder: string;
    guestLogin: string;
    save?: string;
    cancel?: string;
    close?: string;
    back?: string;
    next?: string;
    submit?: string;
    edit?: string;
    delete?: string;
  };
  login?: Record<string, string>;
  onboarding?: Record<string, string>;
  editProfile?: Record<string, string>;
  weather?: Record<string, string>;
  irrigation?: Record<string, string>;
  cropPrediction?: Record<string, string>;
  cooperative?: Record<string, string>;
}

export interface WeatherAlert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'danger';
  message: string;
  time: string;
}

export interface CropPrice {
  id: string;
  name: string;
  price: string;
  trend?: 'up' | 'down' | 'stable';
  change?: string;
  demand?: 'HIGH' | 'MEDIUM' | 'LOW';
  profit?: 'HIGH' | 'MEDIUM' | 'LOW';
  risk?: 'HIGH' | 'MEDIUM' | 'LOW';
  nextSeasonPredicted?: string;
  mandi?: string;
  priceChange?: string;
  isPositive?: boolean;
  predictedDemand?: string;
  aiAdvice?: string;
}

export interface CountryAdminTerms {
  country: string;
  countryCode: string;
  flag: string;
  level1Label: string; // e.g. State, Province, Region, Department
  level2Label: string; // e.g. District, County, Prefecture, Municipality
  level3Label: string; // e.g. Taluk/Tehsil, Sub-county, LGA, Township, Ward
  level4Label: string; // e.g. Village, Town, Locality, Barangay, City
}

export interface PostLocation {
  country?: string;
  countryName?: string;
  countryCode?: string;
  state?: string;
  stateName?: string;
  stateCode?: string;
  district?: string;
  districtName?: string;
  districtCode?: string;
  subDistrict?: string;
  subDistrictName?: string;
  subDistrictCode?: string;
  village?: string;
  villageName?: string;
}

export interface Post {
  id: string;
  author: string;
  authorUid?: string;
  authorAvatar?: string;
  isVerified: boolean;
  content: string;
  image?: string;
  voiceUrl?: string;
  voiceCaption?: string;
  voiceTranslation?: string;
  voiceSummary?: string;
  voiceLang?: string;
  likes: number;
  likedBy?: string[];
  country?: string;
  countryName?: string;
  countryCode?: string;
  state?: string;
  stateName?: string;
  stateCode?: string;
  district?: string;
  districtName?: string;
  districtCode?: string;
  subDistrict?: string;
  subDistrictName?: string;
  subDistrictCode?: string;
  village?: string;
  villageName?: string;
  category?: string;
  comments: Comment[];
  time: string;
  createdAt?: string;
}

export interface Comment {
  id: string;
  author: string;
  authorUid?: string;
  content: string;
  time: string;
  createdAt?: string;
}

export interface ProductItem {
  id: string;
  title: string;
  seller: string;
  location: string;
  price: string;
  quantity: string;
  image: string;
  isVerified: boolean;
  phone: string;
}

export interface GovernmentScheme {
  id: string;
  title: string;
  benefit: string;
  eligible: string;
  status: 'eligible' | 'not_eligible' | 'checking';
}

export interface DiseaseReport {
  id: string;
  timestamp: string;
  imageUrl: string;
  diseaseName: string;
  confidence: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  symptoms: string;
  treatmentSuggestions: string;
  organicControl: string; // organic treatment
  chemicalControl: string; // chemical treatment
  preventionTips: string;
  language: string;
}

declare global {
  interface Window {
    recaptchaVerifier: any;
    confirmationResult: any;
  }
}


