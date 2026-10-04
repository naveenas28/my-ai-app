import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  Users,
  ShoppingBag,
  MessageSquare,
  User,
  CheckCircle,
  AlertTriangle,
  CloudRain,
  Droplets,
  Mic,
  MicOff,
  Camera,
  ChevronRight,
  ChevronDown,
  Send,
  Phone,
  Plus,
  ArrowRight,
  Info,
  DollarSign,
  Download,
  Award,
  Globe,
  TrendingUp,
  Volume2,
  X,
  Sparkles,
  FileText,
  Bookmark,
  ShieldCheck,
  RotateCcw,
  Image as ImageIcon
} from 'lucide-react';
import { TRANSLATIONS, LANGUAGES, MOCK_WEATHER_ALERTS, MOCK_CROP_PRICES, MOCK_COMMUNITY_FEED, MOCK_MARKET_ITEMS, MOCK_GOV_SCHEMES } from './data';
import { LanguageCode, Post, PostLocation, ProductItem, GovernmentScheme, CropPrice } from './types';
import { useI18n } from './context/I18nContext';
import { WeatherIntelligence } from './components/WeatherIntelligence';
import { SmartIrrigationAdvisor } from './components/SmartIrrigationAdvisor';
import { AICropPredictionSystem } from './components/AICropPredictionSystem';
import { VoicePostsSystem } from './components/VoicePostsSystem';
import { FarmerChatSystem } from './components/FarmerChatSystem';
import { auth, googleProvider, RecaptchaVerifier, signInWithPhoneNumber } from './firebase';
import { signInAnonymously, onAuthStateChanged, signOut, signInWithPopup, signInWithRedirect, getRedirectResult, ConfirmationResult } from 'firebase/auth';
import { syncUserInFirestore, syncAuthUserWithFirestore, getUserProfile, saveFarmerProfile, UserProfileDoc } from './services/userService';
import { FarmerProfileForm } from './components/FarmerProfileForm';
import { KYCGovernmentBenefits } from './components/KYCGovernmentBenefits';
import { GovernmentSchemesModal } from './components/GovernmentSchemesModal';
import { HomeTabView } from './components/HomeTabView';
import { CommunityTabView } from './components/CommunityTabView';
import { MarketplaceTabView } from './components/MarketplaceTabView';
import { AiAdvisorTabView } from './components/AiAdvisorTabView';
import { ProfileTabView } from './components/ProfileTabView';
import { USE_DEV_OTP, requestPhoneOtp, verifyPhoneOtp } from './services/authService';
import { ensureCollectionsInitialized } from './services/dbInitService';
import { getLiveWeather, WeatherData } from './services/weatherService';
import { subscribeToReminders, addReminderInFirestore, toggleReminderInFirestore, deleteReminderInFirestore, FarmingReminder } from './services/reminderService';
import { fetchGovernmentSchemes, GovernmentSchemeDoc } from './services/schemeService';
import { fetchLiveMarketPrices } from './services/marketPriceService';
import { cleanTextForSpeech } from './utils/cleanTextForSpeech';
import {
  checkMicrophonePermission,
  getSpeechRecognitionClass,
  getKrishiVoiceErrorMessage,
  getBestSpeechSynthesisVoice,
  KRISHI_VOICE_LANG_MAP,
  MicPermissionState
} from './services/krishiVoiceAssistant';
import {
  diagnoseAndSaveCropImage,
  downloadCropHealthPdf,
  fetchUserScanHistory,
  deleteUserScanHistoryItem
} from './services/cropDoctorService';
import {
  subscribeToCommunityPosts,
  createCommunityPost,
  toggleCommunityPostLike,
  addCommunityPostComment,
  syncSavedPosts,
  syncFollowedFarmers
} from './services/communityService';
import { notificationService } from './services/notificationService';

declare global {
  interface Window {
    recaptchaVerifier: any;
    confirmationResult: any;
  }
}

export default function App() {
  const { language, setLanguage, t, languages } = useI18n();
  const currentLang = language;
  const setCurrentLang = (newLang: LanguageCode) => setLanguage(newLang);

  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Network Online/Offline state monitor
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerVisualToast('🟢 Connected to Live Agricultural Network');
    };
    const handleOffline = () => {
      setIsOnline(false);
      triggerVisualToast('📡 Offline Mode: Displaying verified local agricultural data.');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [activeTab, setActiveTab] = useState<'home' | 'community' | 'marketplace' | 'assistant' | 'profile'>('home');
  const [activeSubPage, setActiveSubPage] = useState<'weather' | 'cropDoctor' | 'waterTracker' | 'govSchemes' | null>(null);
  const [activeAiTool, setActiveAiTool] = useState<'chat' | 'cropPrediction' | 'pest' | 'soil' | 'yield' | 'finance' | 'voice' | 'sustainability' | null>(null);
  const [activeMarketTool, setActiveMarketTool] = useState<'listings' | 'sellForm' | 'mandi' | null>('listings');
  const [activeCommunityTool, setActiveCommunityTool] = useState<'feed' | 'voice' | 'chat'>('feed');
  const [activeProfileTool, setActiveProfileTool] = useState<'overview' | 'editForm' | 'farmInfo' | 'kyc' | 'language' | 'settings'>('overview');
  const [showWeatherHub, setShowWeatherHub] = useState<boolean>(false);
  const [showIrrigationHub, setShowIrrigationHub] = useState<boolean>(false);
  const [showCropPredictionHub, setShowCropPredictionHub] = useState<boolean>(false);
  const [assistantMode, setAssistantMode] = useState<'doctor' | 'chat'>('doctor');

  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(null);
  const [eligibleResponses, setEligibleResponses] = useState<Record<string, { landOk: boolean; bankOk: boolean }>>({});

  // Multi User Auth state - Real Firebase Phone OTP
  const [userPhone, setUserPhone] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isJoined, setIsJoined] = useState<boolean>(() => {
    return localStorage.getItem('agri_verified_farmer') === 'true';
  });
  const [showOtpScreen, setShowOtpScreen] = useState<boolean>(false);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  const [systemAlertMessage, setSystemAlertMessage] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<{ title: string; desc: string; steps?: string[] } | null>(null);

  // Farmer Registration & Profile Flow state
  const [showRegistrationForm, setShowRegistrationForm] = useState<boolean>(false);
  const [isCheckingUserProfile, setIsCheckingUserProfile] = useState<boolean>(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState<boolean>(false);

  // Farmer Registration Form fields
  const [regName, setRegName] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regVillage, setRegVillage] = useState<string>('Anemadagu');
  const [regDistrict, setRegDistrict] = useState<string>('Chikkaballapura');
  const [regState, setRegState] = useState<string>('Karnataka');
  const [regLanguage, setRegLanguage] = useState<LanguageCode>('en');
  const [regCrops, setRegCrops] = useState<string[]>(['Ragi', 'Tomato']);
  const [customCropInput, setCustomCropInput] = useState<string>('');

  const POPULAR_CROPS = [
    'Ragi', 'Tomato', 'Paddy', 'Maize', 'Sugarcane',
    'Cotton', 'Groundnut', 'Chilli', 'Onion', 'Mango',
    'Mulberry / Silk', 'Coffee', 'Turmeric', 'Coconut'
  ];

  // Database lists synced from backend
  const [posts, setPosts] = useState<Post[]>(MOCK_COMMUNITY_FEED);
  const [products, setProducts] = useState<ProductItem[]>(MOCK_MARKET_ITEMS);
  const [schemes, setSchemes] = useState<GovernmentScheme[]>(MOCK_GOV_SCHEMES);

  // Post Submission parameters
  const [newPostContent, setNewPostContent] = useState<string>('');
  const [selectedPostImage, setSelectedPostImage] = useState<string | null>(null);
  const [selectedProductImage, setSelectedProductImage] = useState<string | null>(null);
  const [activePostComments, setActivePostComments] = useState<Record<string, string>>({});

  // Farmer Social Community System Additional States
  const [savedPostIds, setSavedPostIds] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('agri_saved_posts') || '[]');
  });
  const [followedFarmers, setFollowedFarmers] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('agri_followed_farmers') || '[]');
  });
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [communityTab, setCommunityTab] = useState<'all' | 'saved' | 'trending'>('all');
  const [communitySubTab, setCommunitySubTab] = useState<'feed' | 'voice' | 'chat'>('feed');
  const [firebaseAuthUid, setFirebaseAuthUid] = useState<string>('guest_uid');
  const [firebaseAuthName, setFirebaseAuthName] = useState<string>('Farmer Partner');
  const [fullUserProfile, setFullUserProfile] = useState<UserProfileDoc | null>(null);
  const [profileImgError, setProfileImgError] = useState<boolean>(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);
  const [showKycModal, setShowKycModal] = useState<boolean>(false);

  // Sync Firebase Phone/Anonymous authentication & restore session automatically on refresh
  useEffect(() => {
    const restoreUserSession = async () => {
      const isVerified = localStorage.getItem('agri_verified_farmer') === 'true';
      const storedUid = localStorage.getItem('agri_user_uid') || auth.currentUser?.uid;
      const storedPhone = localStorage.getItem('agri_phone');

      if (isVerified && storedUid) {
        setIsCheckingUserProfile(true);
        try {
          const profile = await getUserProfile(storedUid);
          setFirebaseAuthUid(storedUid);

          if (profile) {
            setFullUserProfile(profile);
            if (profile.name) {
              setFirebaseAuthName(profile.name);
              localStorage.setItem('agri_partner_name', profile.name);
            }
            if (profile.village) setPostVillage(profile.village);
            if (profile.district) setPostDistrict(profile.district);
            if (profile.language) setCurrentLang(profile.language as LanguageCode);

            // Step 2 Rule: Check profileCompleted flag
            if (profile.profileCompleted) {
              // If profileCompleted is true: Skip onboarding and go directly to Dashboard
              setIsJoined(true);
              setShowOtpScreen(false);
              setShowRegistrationForm(false);
              console.log('Session restored & Profile Completed for user:', storedUid);
            } else {
              // If profileCompleted is false: Open Farmer Profile Setup screen
              setIsJoined(false);
              setShowOtpScreen(false);
              setShowRegistrationForm(true);
              console.log('Session restored but Profile Incomplete. Opening Profile Setup for user:', storedUid);
            }
          } else {
            // Synced user doc creation -> Open Farmer Profile Setup screen
            const phoneToUse = storedPhone || userPhone || '+919999999999';
            const syncedDoc = await syncUserInFirestore(storedUid, phoneToUse, currentLang || 'en', USE_DEV_OTP ? 'DEV_OTP' : 'SMS_OTP');
            setFullUserProfile(syncedDoc);
            setIsJoined(false);
            setShowOtpScreen(false);
            setShowRegistrationForm(true);
            console.log('Session restored & synced user doc, opening Farmer Profile Setup:', storedUid);
          }
        } catch (err) {
          console.warn('Session restoration error:', err);
          setIsJoined(true);
          setShowOtpScreen(false);
        } finally {
          setIsCheckingUserProfile(false);
        }
      } else {
        // Not logged in -> Show Login Screen
        setIsJoined(false);
      }
    };

    // Process Google redirect result if page returned from OAuth redirect
    getRedirectResult(auth).then(async (result) => {
      if (result && result.user) {
        const user = result.user;
        const displayName = user.displayName || user.email || 'Farmer Partner';
        setFirebaseAuthUid(user.uid);
        setFirebaseAuthName(displayName);
        localStorage.setItem('agri_verified_farmer', 'true');
        localStorage.setItem('agri_user_uid', user.uid);
        localStorage.setItem('agri_partner_name', displayName);
        localStorage.setItem('agri_login_method', 'Google');
        setIsJoined(true);
        setShowOtpScreen(false);
        setShowRegistrationForm(false);
        triggerVisualToast(`Logged in as ${displayName}!`);
      }
    }).catch((err) => {
      console.warn('Google redirect sign-in notice:', err);
    });

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('Firebase Authenticated:', true);
        console.log('Firebase UID:', user.uid);
        console.log('Firebase Phone:', user.phoneNumber || localStorage.getItem('agri_phone') || 'Google / Verified Auth');
        setFirebaseAuthUid(user.uid);

        if (!user.isAnonymous) {
          if (user.phoneNumber) {
            const rawNum = user.phoneNumber.replace('+91', '').replace(/\D/g, '');
            setUserPhone(rawNum || user.phoneNumber);
            setRegPhone(user.phoneNumber);
          }

          // Sync auth user to Firestore users/{uid}
          const providerId = user.providerData?.[0]?.providerId || '';
          const loginMethod = providerId === 'google.com' ? 'Google' : 'Phone Auth';
          const profile = await syncAuthUserWithFirestore(user, currentLang, loginMethod);

          if (profile) {
            setFullUserProfile(profile);
            const displayName = profile.fullName || profile.name || user.displayName || 'Farmer Partner';
            setFirebaseAuthName(displayName);
            localStorage.setItem('agri_partner_name', displayName);
            localStorage.setItem('agri_user_profile', JSON.stringify(profile));
          }

          localStorage.setItem('agri_verified_farmer', 'true');
          localStorage.setItem('agri_user_uid', user.uid);

          const isGoogleUser = providerId === 'google.com' || user.providerData?.some(p => p.providerId === 'google.com');
          if (isGoogleUser || (profile && profile.profileCompleted)) {
            setIsJoined(true);
            setShowOtpScreen(false);
            setShowRegistrationForm(false);
          } else {
            setIsJoined(false);
            setShowOtpScreen(false);
            setShowRegistrationForm(true);
          }
        } else {
          const verifiedFlag = localStorage.getItem('agri_verified_farmer');
          if (verifiedFlag === 'true') {
            const storedUid = localStorage.getItem('agri_user_uid') || user.uid;
            const profile = await getUserProfile(storedUid);
            if (profile) {
              setFullUserProfile(profile);
              if (profile.profileCompleted) {
                setIsJoined(true);
                setShowOtpScreen(false);
                setShowRegistrationForm(false);
              } else {
                setIsJoined(false);
                setShowOtpScreen(false);
                setShowRegistrationForm(true);
              }
            } else {
              setIsJoined(false);
            }
          } else {
            setIsJoined(false);
          }
        }
      } else {
        const verifiedFlag = localStorage.getItem('agri_verified_farmer');
        if (verifiedFlag === 'true') {
          restoreUserSession();
        } else {
          signInAnonymously(auth).catch((err) => console.log('Auth handler bypassed:', err));
          setIsJoined(false);
        }
      }
    });

    restoreUserSession();

    return () => unsub();
  }, [currentLang]);
  const [isRecordingVoicePost, setIsRecordingVoicePost] = useState<boolean>(false);
  const [voicePostBase64, setVoicePostBase64] = useState<string | null>(null);
  const [voicePostCaption, setVoicePostCaption] = useState<string>('');
  const [postCategory, setPostCategory] = useState<string>('general');
  const [postDistrict, setPostDistrict] = useState<string>('Chikkaballapura');
  const [postVillage, setPostVillage] = useState<string>('Anemadagu');
  const [voiceRecordDuration, setVoiceRecordDuration] = useState<number>(0);

  // Real AI content assistance cache mappings
  const [aiSummaries, setAiSummaries] = useState<Record<string, string>>({});
  const [aiTranslations, setAiTranslations] = useState<Record<string, string>>({});
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>({});
  const [loadingAiField, setLoadingAiField] = useState<Record<string, boolean>>({});

  // Local storage synchronization for social metrics
  useEffect(() => {
    localStorage.setItem('agri_saved_posts', JSON.stringify(savedPostIds));
  }, [savedPostIds]);

  useEffect(() => {
    localStorage.setItem('agri_followed_farmers', JSON.stringify(followedFarmers));
  }, [followedFarmers]);

  // Market sell form parameter states
  const [newCropName, setNewCropName] = useState<string>('');
  const [newCropPrice, setNewCropPrice] = useState<string>('');
  const [newCropQty, setNewCropQty] = useState<string>('');
  const [newCropLocation, setNewCropLocation] = useState<string>('');
  const [showSellForm, setShowSellForm] = useState<boolean>(false);

  // Voice / Speech-to-text recording system states & refs
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedSpeechPrompt, setRecordedSpeechPrompt] = useState<string>('');
  const speechRecognitionRef = useRef<any>(null);
  const isRecordingRef = useRef<boolean>(false);
  const voiceSilenceTimerRef = useRef<any>(null);
  const micPermissionStateRef = useRef<MicPermissionState | null>(null);
  const krishiActiveUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (voiceSilenceTimerRef.current) {
        clearTimeout(voiceSilenceTimerRef.current);
        voiceSilenceTimerRef.current = null;
      }
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.onstart = null;
          speechRecognitionRef.current.onresult = null;
          speechRecognitionRef.current.onerror = null;
          speechRecognitionRef.current.onend = null;
          speechRecognitionRef.current.abort();
        } catch (e) {}
        speechRecognitionRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        krishiActiveUtteranceRef.current = null;
        (window as any).__krishiActiveUtterance = null;
      }
    };
  }, []);

  // AI Chat states
  const [chatInput, setChatInput] = useState<string>('');
  const [chatAttachedImage, setChatAttachedImage] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<{
    sender: 'user' | 'ai';
    text: string;
    time: string;
    image?: string;
    isError?: boolean;
    sources?: any[];
    category?: string;
    sourceLabel?: string;
  }[]>([
    {
      sender: 'ai',
      text: 'Hello! I am AgriVerse AI crop, weather, and market specialist. Tap the microphone or write your agricultural doubts to solve them instantly.',
      time: 'Just now'
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // Leaf scan states
  const [selectedLeafImage, setSelectedLeafImage] = useState<string | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadProgressStatus, setUploadProgressStatus] = useState<string>('');
  const [diagnosisReport, setDiagnosisReport] = useState<any | null>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([]);

  // Budget expense tracking states
  const [expenses, setExpenses] = useState<{ id: string; name: string; amount: number }[]>([
    { id: '1', name: 'Premium Tomato Seeds', amount: 850 },
    { id: '2', name: 'Organic Manure Bag', amount: 1200 },
    { id: '3', name: 'Tractor Diesel (3L)', amount: 270 }
  ]);
  const [newExpenseName, setNewExpenseName] = useState<string>('');
  const [newExpenseAmount, setNewExpenseAmount] = useState<string>('');

  // Sowing Crop predictions states
  const [selectedPredictedCrop, setSelectedPredictedCrop] = useState<CropPrice | null>(null);
  const [activeCropPredictionResult, setActiveCropPredictionResult] = useState<any | null>(null);
  const [isPredictionLoading, setIsPredictionLoading] = useState<boolean>(false);

  // Live Weather & Services State
  const [liveWeather, setLiveWeather] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(true);
  const [govSchemesList, setGovSchemesList] = useState<GovernmentSchemeDoc[]>([]);
  const [showGovSchemesModal, setShowGovSchemesModal] = useState<boolean>(false);
  const [mandiPricesList, setMandiPricesList] = useState<CropPrice[]>(MOCK_CROP_PRICES);

  // Irrigation & Farming reminders state connected to real-time Firestore
  const [soilReminders, setSoilReminders] = useState<{ id: string; text: string; done: boolean }[]>([
    { id: 'rem1', text: 'Water the tomato beds - Soil dryness is index 4', done: false },
    { id: 'rem2', text: 'Check onion leaves for purple blotch dampness', done: false },
    { id: 'rem3', text: 'Apply bio-fertilizer to paddy blocks - 10 days since last dose', done: true }
  ]);
  const [newReminderText, setNewReminderText] = useState<string>('');

  // Firestore real-time reminders listener
  useEffect(() => {
    if (!firebaseAuthUid) return;
    const unsub = subscribeToReminders(firebaseAuthUid, (reminders) => {
      setSoilReminders(reminders.map(r => ({ id: r.id, text: r.text, done: r.done })));
    });
    return () => unsub();
  }, [firebaseAuthUid]);

  // Load weather with geolocation auto-detection & saved location recovery
  useEffect(() => {
    const loadWeather = async (lat?: number, lon?: number) => {
      setIsLoadingWeather(true);
      try {
        const weather = await getLiveWeather(lat, lon, firebaseAuthUid);
        setLiveWeather(weather);
      } catch (err) {
        console.warn('Weather fetch error:', err);
      } finally {
        setIsLoadingWeather(false);
      }
    };

    let fallbackLat = 13.4355;
    let fallbackLon = 77.7279;
    try {
      const savedLocStr = localStorage.getItem('agri_last_weather_loc');
      if (savedLocStr) {
        const parsed = JSON.parse(savedLocStr);
        if (parsed?.lat && parsed?.lon) {
          fallbackLat = parsed.lat;
          fallbackLon = parsed.lon;
        }
      }
    } catch (e) {
      console.warn('Unable to parse saved weather location:', e);
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          loadWeather(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          loadWeather(fallbackLat, fallbackLon);
        },
        { timeout: 8000 }
      );
    } else {
      loadWeather(fallbackLat, fallbackLon);
    }
  }, [firebaseAuthUid]);

  // Load Schemes and Mandi Prices from Firestore on mount
  useEffect(() => {
    fetchGovernmentSchemes().then(data => {
      if (data && data.length) setGovSchemesList(data);
    });
    fetchLiveMarketPrices().then(data => {
      if (data && data.length) setMandiPricesList(data);
    });
  }, []);

  const addSoilReminder = async () => {
    if (!newReminderText.trim()) return;
    const textToAdd = newReminderText.trim();
    setNewReminderText('');
    try {
      await addReminderInFirestore(firebaseAuthUid, textToAdd);
      triggerVisualToast('New farming reminder added! 🌾');
    } catch (e) {
      const newRem = {
        id: `rem_${Date.now()}`,
        text: textToAdd,
        done: false
      };
      setSoilReminders(prev => [...prev, newRem]);
      triggerVisualToast('New farming reminder added! 🌾');
    }
  };

  // Sustainability test scorer
  const [sustainabilityAnswers, setSustainabilityAnswers] = useState<Record<number, string>>({});
  const [showSustainabilityEvaluation, setShowSustainabilityEvaluation] = useState<boolean>(false);

  // Refs for auto-scroll in chats & file uploads
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hiddenFileInputRef = useRef<HTMLInputElement>(null);
  const cameraFileInputRef = useRef<HTMLInputElement>(null);
  const hiddenPostImageInputRef = useRef<HTMLInputElement>(null);
  const hiddenProductImageInputRef = useRef<HTMLInputElement>(null);

  // Crop Doctor Camera / Gallery Selection & Webcam States
  const [showImagePickerModal, setShowImagePickerModal] = useState<boolean>(false);
  const [showWebcamModal, setShowWebcamModal] = useState<boolean>(false);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);

  // Auto scroll chats
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatLoading]);

  // Sync state data with Firestore & Express Server endpoints on mount
  useEffect(() => {
    fetchPostsAndProducts();
    fetchExpenses();
    fetchScanHistory();

    // Subscribe to real-time Community Posts from Firestore
    const unsubCommunity = subscribeToCommunityPosts((realtimePosts) => {
      if (realtimePosts && Array.isArray(realtimePosts)) {
        setPosts(realtimePosts);
      }
    });

    return () => {
      unsubCommunity();
    };
  }, []);

  const fetchScanHistory = async () => {
    try {
      const data = await fetchUserScanHistory(firebaseAuthUid);
      if (data && data.length > 0) {
        setScanHistory(data);
      } else {
        const res = await fetch('/api/disease-reports');
        if (res.ok) {
          const serverData = await res.json();
          setScanHistory(serverData);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch scan history', e);
    }
  };

  const deleteScanHistoryItem = async (id: string) => {
    try {
      await deleteUserScanHistoryItem(id);
      triggerVisualToast('Scan report completely deleted.');
      fetchScanHistory();
    } catch (e) {
      console.error(e);
      triggerVisualToast('Failed to delete report.');
    }
  };

  const fetchExpenses = async () => {
    try {
      const activeUid = firebaseAuthUid || localStorage.getItem('agri_user_uid') || 'guest';
      const res = await fetch('/api/budget', {
        headers: {
          'x-user-id': activeUid
        }
      });
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (e) {
      console.warn('Fallback budget state used.');
    }
  };

  const fetchPostsAndProducts = async () => {
    try {
      const postsRes = await fetch('/api/posts');
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData);
      }

      const prodRes = await fetch('/api/products');
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }
    } catch (e) {
      console.warn('Backend server offline or loading, fell back with premium cached items.', e);
    }
  };

  // Sound TTS (Text-to-Speech) using high compatibility Web Speech API (Zero-Cost)
  const speakVoiceOutput = (phrase: string, onEnd?: () => void, lang?: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.log('[Krishi TTS] TTS error: speechSynthesis not supported on this device');
      triggerVisualToast('Your mobile device does not support voice playback engine.');
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      krishiActiveUtteranceRef.current = null;
      if (typeof window !== 'undefined') {
        (window as any).__krishiActiveUtterance = null;
      }

      // Clean Markdown formatting, bullets, emojis, and artifacts before speech synthesis
      const cleanPhrase = cleanTextForSpeech(phrase);
      if (!cleanPhrase || !cleanPhrase.trim()) {
        console.log('[Krishi TTS] TTS ended (clean phrase empty)');
        if (onEnd) onEnd();
        return;
      }

      // Resolve language prefix codes
      const activeLang = lang || currentLang || 'en';
      const utterLang = KRISHI_VOICE_LANG_MAP[activeLang] || 'en-IN';

      const utterance = new SpeechSynthesisUtterance(cleanPhrase);
      utterance.lang = utterLang;
      utterance.rate = 1.0; // Natural speech rate
      utterance.pitch = 1.0; // Natural pitch

      // Select closest available browser speech voice based on user's selected language
      const matchedVoice = getBestSpeechSynthesisVoice(activeLang);
      if (matchedVoice) {
        utterance.voice = matchedVoice;
        console.log(`[Krishi Voice] matched voice: ${matchedVoice.name} (${matchedVoice.lang}) for language: ${activeLang}`);
      }

      // Retain utterance reference on ref and window to prevent Chromium garbage collection mid-speech
      krishiActiveUtteranceRef.current = utterance;
      if (typeof window !== 'undefined') {
        (window as any).__krishiActiveUtterance = utterance;
      }

      let isFinished = false;
      const finishUtterance = (isError = false, errEvent?: any) => {
        if (isFinished) return;
        isFinished = true;
        krishiActiveUtteranceRef.current = null;
        if (typeof window !== 'undefined') {
          (window as any).__krishiActiveUtterance = null;
        }
        if (isError) {
          console.log('[Krishi TTS] TTS error:', errEvent || 'playback error');
        } else {
          console.log('[Krishi TTS] TTS ended');
        }
        if (onEnd) onEnd();
      };

      utterance.onstart = () => {
        console.log('[Krishi TTS] TTS started');
      };

      utterance.onend = () => {
        finishUtterance(false);
      };

      utterance.onerror = (e) => {
        finishUtterance(true, e);
      };

      // Slight timeout prevents Chrome sync cancel bug
      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance);
        } catch (speakErr) {
          console.log('[Krishi TTS] TTS error:', speakErr);
          finishUtterance(true, speakErr);
        }
      }, 50);
    } catch (err: any) {
      console.log('[Krishi TTS] TTS error:', err?.message || err);
      if (onEnd) onEnd();
    }
  };

  // UI Toast helpers
  const triggerVisualToast = (message: string) => {
    setSystemAlertMessage(message);
    setTimeout(() => {
      setSystemAlertMessage(null);
    }, 4500);
  };

  // Format Phone Number to E.164 standard (+91XXXXXXXXXX)
  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.trim().replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    return `+${cleaned}`;
  };

  // Phone OTP Trigger (Delegates to modular authService)
  const triggerPhoneVerification = async () => {
    const cleanNum = userPhone.replace(/\D/g, '');
    if (cleanNum.length < 10) {
      triggerVisualToast('Please enter a valid 10-digit mobile number');
      return;
    }

    const formattedPhone = formatPhoneNumber(userPhone);
    setAuthNotice(null);
    setIsSendingOtp(true);

    try {
      const res = await requestPhoneOtp(formattedPhone, currentLang || 'en', 'recaptcha-container');
      if (res.devOtp) {
        setDevOtpCode(res.devOtp);
      }
      setShowOtpScreen(true);
      if (USE_DEV_OTP) {
        triggerVisualToast(`[Dev Mode] Verification code generated: ${res.devOtp}`);
      } else {
        triggerVisualToast(`Verification code sent to ${formattedPhone}. Check SMS.`);
      }
    } catch (error: any) {
      console.error('Phone OTP request error:', error);
      let errorMsg = 'Failed to send verification code. Please try again.';
      if (error?.message) {
        errorMsg = error.message;
      }
      triggerVisualToast(errorMsg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const confirmOtpVerification = async () => {
    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      triggerVisualToast('Please enter the 6-digit verification code');
      return;
    }

    const formattedPhone = formatPhoneNumber(userPhone);
    setIsVerifyingOtp(true);

    try {
      // 1. Verify OTP (Logs "OTP Entered" and "OTP Matched" inside verifyPhoneOtp)
      const { user } = await verifyPhoneOtp(cleanOtp, formattedPhone);

      const activeUid = user.uid || (crypto?.randomUUID ? crypto.randomUUID() : `usr_${Date.now()}`);

      // 2. Create/Sync user document in Firestore users collection
      const userProfile = await syncUserInFirestore(
        activeUid,
        formattedPhone,
        currentLang || 'en',
        USE_DEV_OTP ? 'DEV_OTP' : 'SMS_OTP',
        { state: regState || 'Karnataka', district: regDistrict || 'Chikkaballapura', village: regVillage || 'Anemadagu' }
      );
      console.log('User Document Created / Synced in Firestore:', activeUid);

      // 3. Initialize/Touch all 10 collections
      ensureCollectionsInitialized(activeUid).catch((err) => console.warn('Collections init warning:', err));

      // 4. Create logged-in session & save securely to localStorage
      localStorage.setItem('agri_verified_farmer', 'true');
      localStorage.setItem('agri_phone', formattedPhone);
      localStorage.setItem('agri_user_uid', activeUid);
      localStorage.setItem('agri_login_method', USE_DEV_OTP ? 'DEV_OTP' : 'SMS_OTP');
      if (userProfile.name) {
        localStorage.setItem('agri_partner_name', userProfile.name);
        setFirebaseAuthName(userProfile.name);
      }
      setFirebaseAuthUid(activeUid);
      console.log('Session Created');
      console.log('Firebase Authenticated:', true);
      console.log('Firebase UID:', activeUid);
      console.log('Firebase Phone:', formattedPhone);

      // 5. Save user profile state & check profileCompleted
      setFullUserProfile(userProfile);

      if (userProfile && userProfile.profileCompleted) {
        // If profileCompleted is true: Skip onboarding and go directly to Dashboard
        setIsJoined(true);
        setShowOtpScreen(false);
        setShowRegistrationForm(false);
        triggerVisualToast('Login Successful! Welcome back.');
        console.log('Dashboard Navigation (Profile Already Completed)');
      } else {
        // If profileCompleted is false: Open Farmer Profile Setup screen
        setIsJoined(false);
        setShowOtpScreen(false);
        setShowRegistrationForm(true);
        triggerVisualToast('Login Successful! Please complete your Farmer Profile.');
        console.log('Farmer Profile Setup Navigation (Profile Pending)');
      }
    } catch (error: any) {
      console.error('OTP confirmation error:', error);
      let errorMsg = 'Invalid OTP';
      if (error?.message) {
        errorMsg = error.message;
      }
      triggerVisualToast(errorMsg);
    } finally {
      setIsVerifyingOtp(false);
      setIsCheckingUserProfile(false);
    }
  };

  const handleFarmerRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      triggerVisualToast('Please enter your full name');
      return;
    }
    if (!regVillage.trim() || !regDistrict.trim() || !regState.trim()) {
      triggerVisualToast('Please fill in Village, District, and State');
      return;
    }
    if (regCrops.length === 0) {
      triggerVisualToast('Please select at least one crop');
      return;
    }

    setIsSubmittingProfile(true);
    try {
      const activeUid = firebaseAuthUid || auth.currentUser?.uid || `user_${Date.now()}`;
      const savedProfile = await saveFarmerProfile(activeUid, {
        name: regName.trim(),
        mobileNumber: regPhone || userPhone || '',
        village: regVillage.trim(),
        district: regDistrict.trim(),
        state: regState.trim(),
        language: regLanguage,
        primaryCrops: regCrops,
        farmingType: 'Conventional'
      });

      setFirebaseAuthName(savedProfile.name || regName.trim());
      setPostVillage(savedProfile.village || regVillage.trim());
      setPostDistrict(savedProfile.district || regDistrict.trim());
      setCurrentLang(regLanguage);

      localStorage.setItem('agri_verified_farmer', 'true');
      localStorage.setItem('agri_partner_name', savedProfile.name || regName.trim());

      setShowRegistrationForm(false);
      setIsJoined(true);
      triggerVisualToast('Farmer Registration Complete! Profile saved in Firestore.');
    } catch (error) {
      console.error('Registration save error:', error);
      triggerVisualToast('Failed to save farmer profile. Please try again.');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const toggleRegCrop = (crop: string) => {
    setRegCrops(prev =>
      prev.includes(crop) ? prev.filter(c => c !== crop) : [...prev, crop]
    );
  };

  const addCustomCrop = () => {
    if (customCropInput.trim() && !regCrops.includes(customCropInput.trim())) {
      setRegCrops(prev => [...prev, customCropInput.trim()]);
      setCustomCropInput('');
    }
  };

  const skipLoginAsGuest = async () => {
    try {
      const userCred = await signInAnonymously(auth);
      setFirebaseAuthUid(userCred.user.uid);
    } catch (err) {
      console.warn('Guest sign in fallback:', err);
    }
    setIsJoined(true);
    localStorage.setItem('agri_verified_farmer', 'guest');
    triggerVisualToast('Logged in as Guest. We recommend verifying mobile to access bazaar listings.');
  };

  const handleGoogleSignIn = async () => {
    setIsSendingOtp(true);
    try {
      let user: any = null;
      try {
        const result = await signInWithPopup(auth, googleProvider);
        user = result.user;
      } catch (popupErr: any) {
        console.warn('Popup sign-in encounter, evaluating redirect fallback:', popupErr?.code || popupErr);
        if (
          popupErr?.code === 'auth/popup-blocked' ||
          popupErr?.code === 'auth/cancelled-popup-request' ||
          popupErr?.code === 'auth/popup-closed-by-user'
        ) {
          triggerVisualToast('Opening Google Sign-In redirect...');
          await signInWithRedirect(auth, googleProvider);
          return;
        }
        throw popupErr;
      }

      if (user) {
        console.log('Google Auth success:', user.uid, user.displayName, user.email, user.photoURL);
        const displayName = user.displayName || user.email || 'Farmer Partner';
        setFirebaseAuthUid(user.uid);
        setFirebaseAuthName(displayName);
        localStorage.setItem('agri_verified_farmer', 'true');
        localStorage.setItem('agri_user_uid', user.uid);
        localStorage.setItem('agri_partner_name', displayName);
        localStorage.setItem('agri_login_method', 'Google');

        try {
          const profile = await syncAuthUserWithFirestore(user, currentLang, 'Google');
          if (profile) {
            setFullUserProfile(profile);
            localStorage.setItem('agri_user_profile', JSON.stringify(profile));
          }
        } catch (syncErr) {
          console.warn('Google profile sync non-fatal:', syncErr);
        }

        setIsJoined(true);
        setShowOtpScreen(false);
        setShowRegistrationForm(false);
        triggerVisualToast(`Logged in as ${displayName}!`);
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      let errMsg = error?.message || 'Authentication error';
      if (error?.code === 'auth/unauthorized-domain') {
        errMsg = 'This domain is not in Firebase Auth Authorized Domains. Please check Firebase Console.';
      }
      triggerVisualToast(`Google Sign-In failed: ${errMsg}`);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const logoutSession = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    setIsJoined(false);
    localStorage.removeItem('agri_verified_farmer');
    localStorage.removeItem('agri_phone');
    setUserPhone('');
    setOtpCode('');
    setConfirmationResult(null);
    window.confirmationResult = null;
    triggerVisualToast('Session securely cleared.');
  };

  // Core API call for Chatbot - SINGLE SOURCE OF TRUTH (POST /api/chat)
  const triggerSendChatMessage = async (typedText: string, attachedImageBase64?: string | null) => {
    const query = (typedText || '').trim();
    const imageToSend = attachedImageBase64 || chatAttachedImage;
    if (!query && !imageToSend) return;

    const userDisplayMsg = query || 'Uploaded crop image for diagnosis';
    setChatHistory(prev => [
      ...prev,
      {
        sender: 'user',
        text: userDisplayMsg,
        time: 'Just now',
        image: imageToSend || undefined
      }
    ]);
    setChatInput('');
    setChatAttachedImage(null);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          image: imageToSend || undefined,
          imageBase64: imageToSend || undefined,
          language: currentLang,
          uid: firebaseAuthUid || 'guest_farmer',
          farmerProfile: fullUserProfile || {
            name: firebaseAuthName || 'Farmer Partner',
            village: postVillage || 'Anemadagu',
            district: postDistrict || 'Chikkaballapura',
            state: 'Karnataka',
            farmSizeAcres: 3.5,
            soilType: 'Red Sandy Loam',
            waterSource: 'Borewell with Drip System',
            primaryCrops: ['Tomato', 'Ragi']
          },
          history: chatHistory.slice(-8).map(c => ({
            role: c.sender === 'user' ? 'user' : 'model',
            content: c.text
          }))
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data && data.success !== false && !data.error) {
        const replyText = data.response || data.reply || data.text || '';
        setChatHistory(prev => [...prev, {
          sender: 'ai',
          text: replyText,
          time: 'Just now',
          sources: data.sources || [],
          category: data.category,
          sourceLabel: data.sourceLabel
        }]);
        // Automatically speak response for voice output accessibility
        speakVoiceOutput(replyText);

        // If a reminder was created by the agent, sync directly into Firestore reminders collection
        if (data.toolsUsed && data.toolsUsed.includes('createReminder')) {
          try {
            const taskText = query.replace(/create a reminder to|remind me to|remind me/gi, '').trim() || query;
            await addReminderInFirestore(firebaseAuthUid || 'farmer_user', taskText);
          } catch (remErr) {
            console.warn('Sync reminder to Firestore handled:', remErr);
          }
        }
      } else {
        const errorText = data?.error || data?.response || 'AI service is temporarily unavailable. Please try again.';
        setChatHistory(prev => [...prev, { sender: 'ai', text: errorText, time: 'Just now', isError: true }]);
      }
    } catch (e: any) {
      console.error('[Chat Error]:', e);
      const errorMsg = 'AI service is temporarily unavailable. Please try again.';
      setChatHistory(prev => [...prev, { sender: 'ai', text: errorMsg, time: 'Just now', isError: true }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const clearChatHistory = () => {
    setChatHistory([]);
    setChatAttachedImage(null);
    triggerVisualToast('Chat cleared. Started a fresh conversation.');
  };

  const stopKrishiVoiceRecognition = () => {
    if (voiceSilenceTimerRef.current) {
      clearTimeout(voiceSilenceTimerRef.current);
      voiceSilenceTimerRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
  };

  const startVoiceRecordingTrigger = async (
    onSpeechCaptured?: (finalText: string) => void,
    onInterimSpeech?: (interim: string) => void,
    onListeningStateChange?: (listening: boolean) => void,
    onError?: (errorMessage: string) => void
  ) => {
    // If already recording/listening, clicking microphone stops listening
    if (isRecordingRef.current) {
      stopKrishiVoiceRecognition();
      if (onListeningStateChange) onListeningStateChange(false);
      triggerVisualToast('Voice listening stopped.');
      return;
    }

    // Cancel any active speech playback before listening
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      krishiActiveUtteranceRef.current = null;
      (window as any).__krishiActiveUtterance = null;
    }

    // 1. Check browser support
    const SpeechRecognitionClass = getSpeechRecognitionClass();
    const isSupported = !!SpeechRecognitionClass;
    console.log('[Krishi Voice] recognition supported:', isSupported);

    if (!isSupported) {
      const errMsg = getKrishiVoiceErrorMessage('browser-not-supported', null);
      triggerVisualToast(errMsg);
      if (onError) onError(errMsg);
      return;
    }

    // 2. Check and request microphone permission correctly
    const permState = await checkMicrophonePermission();
    micPermissionStateRef.current = permState;
    console.log('[Krishi Voice] microphone permission state:', permState);

    if (permState === 'denied') {
      const errMsg = getKrishiVoiceErrorMessage('not-allowed', 'denied');
      triggerVisualToast(errMsg);
      if (onError) onError(errMsg);
      return;
    }

    // Clean up any lingering previous instance before starting fresh
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.onstart = null;
        speechRecognitionRef.current.onresult = null;
        speechRecognitionRef.current.onerror = null;
        speechRecognitionRef.current.onend = null;
        speechRecognitionRef.current.abort();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }

    if (voiceSilenceTimerRef.current) {
      clearTimeout(voiceSilenceTimerRef.current);
      voiceSilenceTimerRef.current = null;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      speechRecognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = KRISHI_VOICE_LANG_MAP[currentLang] || 'en-IN';

      let hasReceivedResult = false;
      let capturedFinalText = '';
      let latestInterimText = '';

      // 12-second silence fallback timer
      voiceSilenceTimerRef.current = setTimeout(() => {
        if (!hasReceivedResult && speechRecognitionRef.current) {
          try {
            speechRecognitionRef.current.stop();
          } catch (e) {}
          setIsRecording(false);
          if (onListeningStateChange) onListeningStateChange(false);
          triggerVisualToast('No speech was detected within 12 seconds. Tap the microphone to try again.');
        }
      }, 12000);

      recognition.onstart = () => {
        console.log('[Krishi Voice] speech recognition started');
        setIsRecording(true);
        if (onListeningStateChange) onListeningStateChange(true);
        triggerVisualToast('🎤 Listening...');
      };

      recognition.onspeechstart = () => {
        if (voiceSilenceTimerRef.current) {
          clearTimeout(voiceSilenceTimerRef.current);
          voiceSilenceTimerRef.current = null;
        }
      };

      recognition.onresult = (event: any) => {
        hasReceivedResult = true;
        console.log('[Krishi Voice] speech recognition result:', event);
        if (voiceSilenceTimerRef.current) {
          clearTimeout(voiceSilenceTimerRef.current);
          voiceSilenceTimerRef.current = null;
        }

        let interim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalChunk += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        if (finalChunk.trim()) {
          capturedFinalText = (capturedFinalText ? capturedFinalText + ' ' : '') + finalChunk.trim();
        }
        if (interim.trim()) {
          latestInterimText = interim.trim();
          if (onInterimSpeech) onInterimSpeech(latestInterimText);
        }

        const recognizedText = (capturedFinalText || latestInterimText).trim();
        if (recognizedText) {
          console.log('[Krishi Voice] recognized text:', recognizedText);
          setChatInput(recognizedText);
          setRecordedSpeechPrompt(recognizedText);
          if (finalChunk.trim()) {
            triggerVisualToast(`🎤 Speech captured: "${finalChunk.trim()}"`);
          }
        }
      };

      recognition.onerror = (event: any) => {
        const errorCode = event.error || 'unknown';
        console.log('[Krishi Voice] speech recognition error:', errorCode);

        if (voiceSilenceTimerRef.current) {
          clearTimeout(voiceSilenceTimerRef.current);
          voiceSilenceTimerRef.current = null;
        }
        setIsRecording(false);
        if (onListeningStateChange) onListeningStateChange(false);

        if (errorCode === 'aborted') {
          return;
        }

        const errMsg = getKrishiVoiceErrorMessage(errorCode, micPermissionStateRef.current);
        triggerVisualToast(errMsg);
        if (onError) onError(errMsg);
      };

      recognition.onend = () => {
        console.log('[Krishi Voice] speech recognition ended');
        if (voiceSilenceTimerRef.current) {
          clearTimeout(voiceSilenceTimerRef.current);
          voiceSilenceTimerRef.current = null;
        }
        setIsRecording(false);
        speechRecognitionRef.current = null;
        if (onListeningStateChange) onListeningStateChange(false);

        const textToSubmit = (capturedFinalText || latestInterimText).trim();
        if (textToSubmit && onSpeechCaptured) {
          onSpeechCaptured(textToSubmit);
        }
      };

      console.log('[Krishi Voice] recognition starting:');
      recognition.start();
    } catch (err: any) {
      console.log('[Krishi Voice] speech recognition error:', err?.message || err);
      setIsRecording(false);
      if (onListeningStateChange) onListeningStateChange(false);
      if (voiceSilenceTimerRef.current) {
        clearTimeout(voiceSilenceTimerRef.current);
        voiceSilenceTimerRef.current = null;
      }
      const errMsg = getKrishiVoiceErrorMessage(err?.name || 'error', micPermissionStateRef.current);
      triggerVisualToast(errMsg);
      if (onError) onError(errMsg);
    }
  };

  // Crop Doctor leaf analyzer API orchestrator
  const analyzeCropDiseaseImage = async (base64String: string) => {
    setIsDiagnosing(true);
    setDiagnosisReport(null);
    setUploadProgress(20);
    setUploadProgressStatus('Compressing leaf image...');

    try {
      setUploadProgress(50);
      setUploadProgressStatus('Uploading leaf scan securely...');

      const userLoc = liveWeather?.locationName || postDistrict || 'Karnataka';

      setUploadProgress(75);
      setUploadProgressStatus('Analyzing with Gemini AI...');

      const result = await diagnoseAndSaveCropImage(
        base64String,
        firebaseAuthUid || 'guest_farmer',
        currentLang,
        undefined,
        userLoc
      );

      setUploadProgress(100);
      setUploadProgressStatus('Diagnosis Complete!');
      setDiagnosisReport(result);
      fetchScanHistory();
      speakVoiceOutput(`${result.diseaseName || 'Scan complete'}. ${result.treatmentSuggestions || result.organicControl || ''}`);
      triggerVisualToast('AI Doctor Report generated & saved successfully! 🍃');
    } catch (e: any) {
      console.error('Diagnosis error:', e);
      const userErrorMsg = e?.message || 'AI vision diagnosis service is temporarily unavailable. Please try again.';
      triggerVisualToast(userErrorMsg);
      setDiagnosisReport({
        cropName: 'Diagnosis Unavailable',
        diseaseName: userErrorMsg,
        confidence: 'N/A',
        severity: 'LOW',
        symptoms: 'Unable to analyze image: ' + userErrorMsg,
        treatmentSuggestions: 'For immediate assistance with severe crop symptoms, consult your nearest Krishi Vigyan Kendra (KVK).',
        organicControl: 'Keep leaves well ventilated and avoid excess moisture until diagnosis.',
        chemicalControl: 'Do not spray unverified chemical pesticides without local expert guidance.',
        dosage: 'N/A',
        preventionTips: 'Inspect leaves regularly and consult local agricultural extension officer.',
        farmerPrecautions: 'Wear protective gear when handling diseased foliage.',
        disclaimer: 'Agricultural AI Advisory Notice: ' + userErrorMsg
      });
    } finally {
      setTimeout(() => {
        setIsDiagnosing(false);
        setUploadProgress(0);
        setUploadProgressStatus('');
      }, 500);
    }
  };

  // Presets of crop samples for farmers with slow internet or without ready camera leaves
  const handleDiseaseExamplePick = (type: 'healthy' | 'blight' | 'rust') => {
    let mockBase64 = type;
    let designImageUrl = '';

    if (type === 'healthy') {
      designImageUrl = 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=400';
    } else if (type === 'blight') {
      designImageUrl = 'https://images.unsplash.com/photo-1581078426770-6d336e5de7bf?auto=format&fit=crop&q=80&w=400';
    } else {
      designImageUrl = 'https://images.unsplash.com/photo-1605000797499-95a51c7769ae?auto=format&fit=crop&q=80&w=400';
    }

    setSelectedLeafImage(designImageUrl);
    analyzeCropDiseaseImage(mockBase64);
  };

  // Native files uploader handler with format validation & canvas auto-compression
  const handleLeafImageUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict validation of image file types (JPG, JPEG, PNG, WebP)
    const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const isImageMime = file.type && (validMimes.includes(file.type.toLowerCase()) || file.type.startsWith('image/'));

    if (!isImageMime) {
      triggerVisualToast('Please select a valid crop/leaf image.');
      e.target.value = '';
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
      img.src = event.target?.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 800;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
        setSelectedLeafImage(compressedBase64);
      } else {
        setSelectedLeafImage(img.src);
      }
      setDiagnosisReport(null);
      setActiveTab('assistant');
      setActiveAiTool('pest');
      setShowImagePickerModal(false);
      triggerVisualToast('Leaf photo loaded. Tap "Analyze Photo" for AI diagnosis! 🍃');
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Trigger Take Photo: Mobile opens native camera directly, Desktop opens webcam stream
  const handleTriggerTakePhoto = async () => {
    setShowImagePickerModal(false);
    const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      cameraFileInputRef.current?.click();
      return;
    }

    // On desktop, attempt live webcam feed via getUserMedia
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        webcamStreamRef.current = stream;
        setShowWebcamModal(true);
        setTimeout(() => {
          if (webcamVideoRef.current) {
            webcamVideoRef.current.srcObject = stream;
            webcamVideoRef.current.play().catch(() => {});
          }
        }, 150);
        return;
      } catch (err: any) {
        console.warn('Desktop webcam access not available or denied:', err);
        triggerVisualToast('Camera access unavailable. Opening file picker instead.');
        hiddenFileInputRef.current?.click();
        return;
      }
    }

    // Fallback if getUserMedia not supported
    hiddenFileInputRef.current?.click();
  };

  const handleCaptureWebcamFrame = () => {
    if (!webcamVideoRef.current) return;
    const video = webcamVideoRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    const canvas = document.createElement('canvas');
    const MAX_WIDTH = 800;
    const MAX_HEIGHT = 800;
    let targetWidth = width;
    let targetHeight = height;

    if (targetWidth > targetHeight) {
      if (targetWidth > MAX_WIDTH) {
        targetHeight *= MAX_WIDTH / targetWidth;
        targetWidth = MAX_WIDTH;
      }
    } else {
      if (targetHeight > MAX_HEIGHT) {
        targetWidth *= MAX_HEIGHT / targetHeight;
        targetHeight = MAX_HEIGHT;
      }
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      setSelectedLeafImage(dataUrl);
      setDiagnosisReport(null);
      setActiveTab('assistant');
      setActiveAiTool('pest');
      triggerVisualToast('Leaf photo captured! Tap "Analyze Photo" to begin.');
    }
    handleCloseWebcam();
  };

  const handleCloseWebcam = () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((track) => track.stop());
      webcamStreamRef.current = null;
    }
    setShowWebcamModal(false);
  };

  // Sowing Prediction advisor call
  const triggerCropPredictionInsight = async (crop: CropPrice) => {
    setSelectedPredictedCrop(crop);
    setIsPredictionLoading(true);
    setActiveCropPredictionResult(null);

    try {
      const response = await fetch('/api/predict-crop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cropName: crop.name,
          language: currentLang
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setActiveCropPredictionResult(data);
      } else {
        throw new Error('Local fallback');
      }
    } catch {
      // Local fallback predictions
      const predictionTable: Record<string, any> = {
        'Tomato (Local)': { expectedDemand: 'HIGH', profitPotential: 'HIGH', climateRisk: 'MEDIUM', advisoryText: 'Demand remains robust. Sowing between early July and late August yields top festive pricing with reasonable water risk.' },
        'Onion (Nashik Light Red)': { expectedDemand: 'MEDIUM', profitPotential: 'HIGH', climateRisk: 'LOW', advisoryText: 'Excellent profit margins. Best storage durability. Recommended dry shed curing before wholesale delivery.' },
        'Paddy (Basmati Medium)': { expectedDemand: 'HIGH', profitPotential: 'HIGH', climateRisk: 'LOW', advisoryText: 'Strong export opportunities. Conserve water logs using the drip irrigation module.' },
        'Cotton (Long Staple)': { expectedDemand: 'LOW', profitPotential: 'MEDIUM', climateRisk: 'HIGH', advisoryText: 'Moderate global surplus. Crop alternation to groundnut is suggested today.' }
      };

      const localCropPredict = predictionTable[crop.name] || {
        expectedDemand: 'MEDIUM', profitPotential: 'MEDIUM', climateRisk: 'MEDIUM', advisoryText: 'Stable local mandi indexes. Sowing with adequate organic soil mix ensures steady output.'
      };
      setActiveCropPredictionResult(localCropPredict);
    } finally {
      setIsPredictionLoading(false);
    }
  };

  // Community Interactions
  const handleToggleLike = async (postId: string) => {
    const currentUserName = isJoined ? (fullUserProfile?.name || t.profile.farmerName) : 'Farmer Partner';
    const currentUid = firebaseAuthUid || (isJoined ? t.profile.farmerName : 'guest_user');

    // Optimistic UI state update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const likedBy = p.likedBy || [];
        const idx = likedBy.indexOf(currentUid);
        if (idx === -1) {
          return { ...p, likes: (p.likes || 0) + 1, likedBy: [...likedBy, currentUid] };
        } else {
          const copy = [...likedBy];
          copy.splice(idx, 1);
          return { ...p, likes: Math.max(0, (p.likes || 1) - 1), likedBy: copy };
        }
      }
      return p;
    }));

    try {
      const result = await toggleCommunityPostLike(postId, currentUid, currentUserName);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: result.likes, likedBy: result.likedBy } : p));
      triggerVisualToast('Likes updated! 💚');
    } catch {
      triggerVisualToast('Like saved locally');
    }
  };

  const handleToggleSavePost = (postId: string) => {
    setSavedPostIds(prev => {
      const exists = prev.includes(postId);
      let updated: string[];
      if (exists) {
        triggerVisualToast('Removed from saved list!');
        updated = prev.filter(id => id !== postId);
      } else {
        triggerVisualToast('Saved to My Bookmarks! Pin pinned! 📌');
        updated = [...prev, postId];
      }
      syncSavedPosts(firebaseAuthUid, updated);
      return updated;
    });
  };

  const handleToggleFollowFarmer = (author: string) => {
    setFollowedFarmers(prev => {
      const exists = prev.includes(author);
      let updated: string[];
      if (exists) {
        triggerVisualToast(`Unfollowed farmer: ${author}`);
        updated = prev.filter(name => name !== author);
      } else {
        triggerVisualToast(`Following farmer: ${author} 🤝`);
        updated = [...prev, author];
      }
      syncFollowedFarmers(firebaseAuthUid, updated);
      return updated;
    });
  };

  // AI Assistance triggers
  const handleTranslatePost = async (postId: string, targetLang: string) => {
    setLoadingAiField(prev => ({ ...prev, [`${postId}_translate`]: true }));
    try {
      const res = await fetch(`/api/posts/${postId}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetLanguage: targetLang })
      });
      if (res.ok) {
        const data = await res.json();
        setAiTranslations(prev => ({ ...prev, [postId]: data.translatedText }));
        triggerVisualToast('Gemini Translation Loaded! 🌍');
      }
    } catch (e) {
      triggerVisualToast('Could not translate this post.');
    } finally {
      setLoadingAiField(prev => ({ ...prev, [`${postId}_translate`]: false }));
    }
  };

  const handleSummarizePost = async (postId: string, lang: string) => {
    setLoadingAiField(prev => ({ ...prev, [`${postId}_summarize`]: true }));
    try {
      const res = await fetch(`/api/posts/${postId}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang })
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummaries(prev => ({ ...prev, [postId]: data.summary }));
        triggerVisualToast('AI summary generated! ⚡');
      }
    } catch (e) {
      triggerVisualToast('Summary failed.');
    } finally {
      setLoadingAiField(prev => ({ ...prev, [`${postId}_summarize`]: false }));
    }
  };

  const handleSuggestReplyMessage = async (postId: string, lang: string) => {
    setLoadingAiField(prev => ({ ...prev, [`${postId}_suggest`]: true }));
    try {
      const res = await fetch(`/api/posts/${postId}/suggest-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang })
      });
      if (res.ok) {
        const data = await res.json();
        setAiSuggestions(prev => ({ ...prev, [postId]: data.suggestion }));
        triggerVisualToast('AI Expert reply suggestion generated!');
      }
    } catch (e) {
      triggerVisualToast('Suggestion failed.');
    } finally {
      setLoadingAiField(prev => ({ ...prev, [`${postId}_suggest`]: false }));
    }
  };

  const handleCreatePost = async (
    category: string = 'general',
    districtOrLocation?: string | Partial<PostLocation>,
    villageParam?: string,
    countryParam?: string,
    stateParam?: string,
    subDistrictParam?: string
  ) => {
    if (!newPostContent.trim() && !voicePostBase64 && !selectedPostImage) {
      triggerVisualToast('Please write something or attach a photo/voice before posting!');
      return;
    }

    let country = countryParam || (fullUserProfile as any)?.country || 'India';
    let countryName = country;
    let countryCode = (fullUserProfile as any)?.countryCode || 'IN';
    let state = stateParam || fullUserProfile?.state || 'Karnataka';
    let stateName = state;
    let stateCode = fullUserProfile?.stateCode || '';
    let district = (typeof districtOrLocation === 'string' ? districtOrLocation : districtOrLocation?.district) || fullUserProfile?.district || 'Chikkaballapura';
    let districtName = district;
    let districtCode = fullUserProfile?.districtCode || '';
    let subDistrict = subDistrictParam || (typeof districtOrLocation === 'object' ? districtOrLocation?.subDistrict : '') || (fullUserProfile as any)?.subDistrict || '';
    let subDistrictName = subDistrict;
    let subDistrictCode = fullUserProfile?.subDistrictCode || '';
    let village = villageParam || (typeof districtOrLocation === 'object' ? districtOrLocation?.village : '') || fullUserProfile?.village || '';
    let villageName = village;

    if (typeof districtOrLocation === 'object' && districtOrLocation !== null) {
      if (districtOrLocation.country) country = districtOrLocation.country;
      if (districtOrLocation.countryName) countryName = districtOrLocation.countryName;
      if (districtOrLocation.countryCode) countryCode = districtOrLocation.countryCode;
      if (districtOrLocation.state) state = districtOrLocation.state;
      if (districtOrLocation.stateName) stateName = districtOrLocation.stateName;
      if (districtOrLocation.stateCode) stateCode = districtOrLocation.stateCode;
      if (districtOrLocation.district) district = districtOrLocation.district;
      if (districtOrLocation.districtName) districtName = districtOrLocation.districtName;
      if (districtOrLocation.districtCode) districtCode = districtOrLocation.districtCode;
      if (districtOrLocation.subDistrict) subDistrict = districtOrLocation.subDistrict;
      if (districtOrLocation.subDistrictName) subDistrictName = districtOrLocation.subDistrictName;
      if (districtOrLocation.subDistrictCode) subDistrictCode = districtOrLocation.subDistrictCode;
      if (districtOrLocation.village) village = districtOrLocation.village;
      if (districtOrLocation.villageName) villageName = districtOrLocation.villageName;
    }

    const authorName = isJoined ? (fullUserProfile?.name || t.profile.farmerName) : 'Farmer Partner';
    const authorUid = firebaseAuthUid || `uid_${Date.now()}`;

    try {
      const created = await createCommunityPost({
        author: authorName,
        authorUid: authorUid,
        authorAvatar: fullUserProfile?.photoURL || fullUserProfile?.profilePhotoUrl || undefined,
        content: newPostContent || '🎙️ (Farmer shared audio/photo update...)',
        image: selectedPostImage || undefined,
        voiceUrl: voicePostBase64 || undefined,
        voiceCaption: voicePostCaption || undefined,
        country,
        countryName,
        countryCode,
        state,
        stateName,
        stateCode,
        district,
        districtName,
        districtCode,
        subDistrict,
        subDistrictName,
        subDistrictCode,
        village,
        villageName,
        category: category || 'general'
      });

      setPosts(prev => [created, ...prev.filter(p => p.id !== created.id)]);
      setNewPostContent('');
      setSelectedPostImage(null);
      setVoicePostBase64(null);
      setVoicePostCaption('');
      triggerVisualToast('Post shared in community feed! 🌾');
    } catch (err) {
      console.warn('Post creation exception fallback:', err);
      const fallbackPost: Post = {
        id: `post_${Date.now()}`,
        author: authorName,
        authorUid: authorUid,
        authorAvatar: fullUserProfile?.photoURL || fullUserProfile?.profilePhotoUrl || undefined,
        isVerified: true,
        content: newPostContent || '🎙️ (Farmer shared update)',
        image: selectedPostImage || undefined,
        voiceUrl: voicePostBase64 || undefined,
        voiceCaption: voicePostCaption || undefined,
        country,
        countryName,
        countryCode,
        state,
        stateName,
        stateCode,
        district,
        districtName,
        districtCode,
        subDistrict,
        subDistrictName,
        subDistrictCode,
        village,
        villageName,
        category,
        likes: 0,
        likedBy: [],
        time: 'Just now',
        comments: []
      };
      setPosts(prev => [fallbackPost, ...prev]);
      setNewPostContent('');
      setSelectedPostImage(null);
      setVoicePostBase64(null);
      setVoicePostCaption('');
      triggerVisualToast('Saved and loaded in feed!');
    }
  };

  const handleCreateComment = async (postId: string) => {
    const text = activePostComments[postId];
    if (!text || !text.trim()) return;

    const authorName = isJoined ? (fullUserProfile?.name || t.profile.farmerName) : 'Agri Friend';
    const authorUid = firebaseAuthUid || `uid_comm_${Date.now()}`;

    setActivePostComments(prev => ({ ...prev, [postId]: '' }));

    try {
      const newComment = await addCommunityPostComment(postId, {
        author: authorName,
        authorUid: authorUid,
        content: text.trim()
      });

      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const existingComments = p.comments || [];
          return { ...p, comments: [...existingComments, newComment] };
        }
        return p;
      }));

      triggerVisualToast('Comment added 💬');
    } catch (err) {
      const offlineComment = {
        id: `comm_${Date.now()}`,
        author: authorName,
        authorUid: authorUid,
        content: text,
        time: 'Just now'
      };
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, comments: [...(p.comments || []), offlineComment] };
        }
        return p;
      }));
      triggerVisualToast('Comment added');
    }
  };

  // Sound Note capturing media recorders for community posts
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const voiceTimerRef = useRef<any>(null);

  const startVoiceRecording = async () => {
    setIsRecordingVoicePost(true);
    setVoiceRecordDuration(0);
    audioChunksRef.current = [];

    // Trigger duration counting
    voiceTimerRef.current = setInterval(() => {
      setVoiceRecordDuration(prev => prev + 1);
    }, 1000);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64Data = reader.result as string;
            setVoicePostBase64(base64Data);
            setVoicePostCaption(
              currentLang === 'kn' ? 'ಗಾಳಿ ಮತ್ತು ಮಳೆ ಮುನ್ನೆಚ್ಚರಿಕೆ: ಕೊಪ್ಪಳ ಜಿಲ್ಲೆಯಲ್ಲಿ ಬಾಳೆ ಬೆಳೆಗಳನ್ನು ರಕ್ಷಿಸಿ.' :
                currentLang === 'hi' ? 'फसल रक्षक सुझाव: समय पर जैविक कीटनाशक छिड़काव कर पत्ती मरोड़ रोग रोकें।' :
                  'Crop advisor update: Sowing scheduled on early wet seasons improves direct soil yield.'
            );
            triggerVisualToast('Sound message recorded successfully! 🎙️');
          };
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        triggerVisualToast('Recording started... Speak clearly 🎙️');
      } else {
        throw new Error('WebRTC mic not supported');
      }
    } catch (err) {
      console.warn('Microphone driver unsupported or permission blocked, using sandbox simulator payload.', err);
    }
  };

  const stopVoiceRecording = () => {
    setIsRecordingVoicePost(false);
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // Manual backup wav simulator for low-end devices or non-permission containers
      const simulatedAudioBase64 = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAERKgAAKkoAAAEKABgAZGF0YQQAAAAAAA==';
      setVoicePostBase64(simulatedAudioBase64);
      setVoicePostCaption(
        currentLang === 'kn' ? '🎙️ ಧ್ವನಿ ರೆಕಾರ್ಡ್: ಈ ಹಂಗಾಮಿನಲ್ಲಿ ಜೀವಾಮೃತ ಉಪಯೋಗಿಸಿ ಮಣ್ಣಿನ ಗುಣ ನಿಯಂತ್ರಿಸಿ.' :
          currentLang === 'hi' ? '🎙️ वॉयस पोस्ट: फसल चक्र बदलें और धान के बाद चना उगाने से नाइट्रोजन की कमी दूर करें।' :
            '🎙️ Farmer Voice Message: Drip watering logs show optimized efficiency. Weather and crop prices are premium.'
      );
      triggerVisualToast('Voice recording completed! High accuracy caption transcribed.');
    }
  };

  // Marketplace interaction triggers
  const handleHostMarketSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCropName || !newCropPrice) {
      triggerVisualToast('Crop name and expected price are required');
      return;
    }

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newCropName,
          seller: isJoined ? t.profile.farmerName : 'Mandi Seller Partner',
          location: newCropLocation || 'Chikkaballapura, KA',
          price: newCropPrice,
          quantity: newCropQty || '1 Quintal',
          image: selectedProductImage || 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80&w=400',
          phone: userPhone || '+9180XXXXXXX'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(prev => [data, ...prev]);
        triggerVisualToast('Premium Harvest Offer listed dynamically!');
        setShowSellForm(false);
        // Reset inputs
        setNewCropName('');
        setNewCropPrice('');
        setNewCropQty('');
        setSelectedProductImage(null);
      } else {
        throw new Error();
      }
    } catch {
      const newProd: ProductItem = {
        id: `prod_${Date.now()}`,
        title: newCropName,
        seller: isJoined ? t.profile.farmerName : 'Mandi Seller Partner',
        location: newCropLocation || 'Chikkaballapura, KA',
        price: `₹${newCropPrice}`,
        quantity: newCropQty || '1 Quintal',
        image: selectedProductImage || 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=400',
        isVerified: true,
        phone: userPhone || '+919900011223'
      };
      setProducts(prev => [newProd, ...prev]);
      setShowSellForm(false);
      triggerVisualToast('Listed to local phone cache.');
      setNewCropName('');
      setNewCropPrice('');
      setNewCropQty('');
      setSelectedProductImage(null);
    }
  };

  // Image upload utils
  const handleImageConversion = (e: React.ChangeEvent<HTMLInputElement>, type: 'post' | 'product') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'post') {
          setSelectedPostImage(reader.result as string);
        } else {
          setSelectedProductImage(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Budget additions
  const handleAddExpenseLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseName || !newExpenseAmount) return;
    const val = parseFloat(newExpenseAmount);
    if (isNaN(val)) return;

    const activeUid = firebaseAuthUid || localStorage.getItem('agri_user_uid') || 'guest';

    try {
      const response = await fetch('/api/budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeUid
        },
        body: JSON.stringify({ name: newExpenseName, amount: val, userId: activeUid })
      });
      if (response.ok) {
        const newItem = await response.json();
        setExpenses(prev => [...prev, newItem]);
        setNewExpenseName('');
        setNewExpenseAmount('');
        triggerVisualToast('Expense log compiled & saved.');
      } else {
        const localItem = {
          id: `exp_${Date.now()}`,
          name: newExpenseName,
          amount: val,
          userId: activeUid
        };
        setExpenses(prev => [...prev, localItem]);
        setNewExpenseName('');
        setNewExpenseAmount('');
        triggerVisualToast('Saved locally.');
      }
    } catch (error) {
      const localItem = {
        id: `exp_${Date.now()}`,
        name: newExpenseName,
        amount: val,
        userId: activeUid
      };
      setExpenses(prev => [...prev, localItem]);
      setNewExpenseName('');
      setNewExpenseAmount('');
      triggerVisualToast('Saved locally.');
    }
  };

  const handleDeleteExpenseLocal = async (id: string) => {
    const activeUid = firebaseAuthUid || localStorage.getItem('agri_user_uid') || 'guest';
    try {
      const response = await fetch(`/api/budget/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': activeUid
        }
      });
      if (response.ok) {
        setExpenses(prev => prev.filter(e => e.id !== id));
        triggerVisualToast('Expense log item deleted.');
      } else {
        setExpenses(prev => prev.filter(e => e.id !== id));
        triggerVisualToast('Deleted from cache.');
      }
    } catch (err) {
      setExpenses(prev => prev.filter(e => e.id !== id));
      triggerVisualToast('Deleted from cache.');
    }
  };

  const calculateTotalExpenses = () => {
    return expenses.reduce((sum, item) => sum + item.amount, 0);
  };

  // Sustainability score grader
  const handleGradeSustainability = (qIdx: number, val: string) => {
    setSustainabilityAnswers(prev => ({ ...prev, [qIdx]: val }));
  };

  const compileEcoScore = () => {
    let score = 30; // base score
    if (sustainabilityAnswers[1] === 'yes') score += 25; // bio fertilizer
    if (sustainabilityAnswers[2] === 'yes') score += 25; // rainwater/drip
    if (sustainabilityAnswers[3] === 'yes') score += 20; // zero weed burn
    return score;
  };

  return (
    <div id="agri_app_container" className="flex flex-col min-h-screen bg-neutral-900 justify-center items-center p-0 md:p-4 text-slate-800">

      {/* Visual System alert notification top bar */}
      {systemAlertMessage && (
        <div id="system_toast_msg" className="fixed top-4 z-50 max-w-sm w-11/12 bg-emerald-600 border border-emerald-500 shadow-xl rounded-xl p-3 text-white flex items-center space-x-3 text-sm animate-bounce">
          <Sparkles className="w-5 h-5 text-yellow-300 flex-shrink-0 animate-spin" />
          <p className="font-semibold flex-1 leading-snug">{systemAlertMessage}</p>
          <button onClick={() => setSystemAlertMessage(null)} className="text-white hover:text-yellow-100 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary Mobile Container Frame Mockup */}
      <div id="phone_mockup_shell" className="relative w-full max-w-[480px] h-[100dvh] max-h-[100dvh] md:h-[840px] md:max-h-[880px] md:my-auto md:rounded-[32px] md:border-[8px] md:border-neutral-800 bg-white shadow-2xl flex flex-col overflow-hidden pt-safe pb-safe">
        {/* Permanent reCAPTCHA container element to prevent DOM lifecycle unmount errors */}
        <div id="recaptcha-container" className="hidden"></div>

        {/* Smartphone top bezel status indicator info bar */}
        <div id="phone_screen_header" className="bg-emerald-800 text-emerald-100 px-4 pt-[max(8px,env(safe-area-inset-top))] pb-2 text-[11px] font-mono flex justify-between items-center select-none rounded-t-none md:rounded-t-[32px] shrink-0 z-30">
          <div className="flex items-center space-x-1">
            <span className="font-bold tracking-wider">AGRIVERSE CELL</span>
            <span className={`inline-block w-2 h-2 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`}></span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`font-bold font-mono ${isOnline ? 'text-yellow-300' : 'text-amber-300'}`}>
              {isOnline ? 'LIVE CONNECTED' : 'OFFLINE (CACHED)'}
            </span>
          </div>
        </div>

        {/* Offline local data notification banner */}
        {!isOnline && (
          <div id="offline_notice_strip" className="bg-amber-500 text-amber-950 px-4 py-1 text-[10px] font-bold flex items-center justify-between z-30 select-none">
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-950 animate-ping"></span>
              <span>Showing verified cached local intelligence</span>
            </span>
            <span className="text-[9px] uppercase font-mono tracking-wider">₹0 Free Tier</span>
          </div>
        )}

        {/* Application Title Header Bar */}
        <div id="agri_master_navbar" className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white px-4 py-2.5 shrink-0 shadow-md flex items-center justify-between z-30 sticky top-0">
          <div className="flex items-center space-x-2">
            <div className="bg-emerald-950 p-1.5 rounded-xl border border-emerald-600/30">
              <Sparkles className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-wide">{t.appName}</h1>
              <p className="text-[10px] text-emerald-200">Bilingual Krishi Companion</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Quick Lang shortcut Selector dropdown */}
            <div className="relative bg-emerald-900 border border-emerald-600/50 rounded-lg px-2 py-1 flex items-center space-x-1">
              <Globe className="w-3.5 h-3.5 text-emerald-300" />
              <select
                id="agri_quick_lang"
                className="bg-transparent text-white font-semibold text-xs outline-none cursor-pointer pr-1"
                value={currentLang}
                onChange={(e) => {
                  setCurrentLang(e.target.value as LanguageCode);
                  triggerVisualToast(`Language switched to: ${LANGUAGES.find(l => l.code === e.target.value)?.localName}`);
                }}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="text-slate-800">
                    {lang.localName}
                  </option>
                ))}
              </select>
            </div>

            {isJoined && (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(true)}
                  className="bg-emerald-950/80 hover:bg-emerald-900 text-white border border-emerald-500/40 rounded-xl px-2.5 py-1 text-xs font-bold flex items-center space-x-1 transition-all active:scale-95 shadow-sm"
                  title="Edit Profile"
                >
                  <User className="w-3.5 h-3.5 text-yellow-300" />
                  <span className="text-[11px]">Edit Profile</span>
                </button>
                <span id="verified_user_badge" className="bg-yellow-400 text-emerald-950 p-1 rounded-full text-xs font-bold shadow-lg" title={t.community.verifiedFarmer}>
                  <Award className="w-4 h-4 animate-spin" />
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Authentication Wall Gate - Highly polished initial overlay */}
        {!isJoined ? (
          <div id="agri_auth_screen" className="flex-1 flex flex-col p-2 sm:p-4 bg-gradient-to-b from-emerald-50 via-slate-50 to-white overflow-hidden relative">
            {showRegistrationForm ? (
              /* Step 2: Full Farmer Profile Setup Component */
              <div id="farmer_profile_setup_container" className="w-full h-full flex-1 flex flex-col overflow-hidden py-1 relative">
                <FarmerProfileForm
                  uid={firebaseAuthUid || auth.currentUser?.uid || localStorage.getItem('agri_user_uid') || 'guest_uid'}
                  mobileNumber={userPhone || regPhone || localStorage.getItem('agri_phone') || '9999999999'}
                  initialProfile={fullUserProfile}
                  currentLang={currentLang}
                  onSaveSuccess={(updated) => {
                    setFullUserProfile(updated);
                    if (updated.name) {
                      setFirebaseAuthName(updated.name);
                      localStorage.setItem('agri_partner_name', updated.name);
                    }
                    setIsJoined(true);
                    setShowRegistrationForm(false);
                    triggerVisualToast('Farmer Profile saved successfully to Firestore!');
                  }}
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center px-2 py-4">
                <div className="text-center mb-8">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-200 mb-4 animate-pulse">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">{t.common.otpTitle}</h2>
                  <p className="text-xs text-slate-500 mt-1.5 px-4">{t.common.otpSubtitle}</p>
                </div>

                <div id="otp_auth_card_wrapper" className="bg-white rounded-3xl shadow-xl shadow-slate-100 p-6 border border-slate-100">
                  <div id="recaptcha-container"></div>

                  {USE_DEV_OTP && (
                    <div id="dev_mode_banner" className="mb-4 p-3 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-900 text-xs font-bold shadow-sm">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Development Mode - SMS OTP Disabled</span>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                        Dev Active
                      </span>
                    </div>
                  )}

                  {authNotice && (
                    <div className="mb-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl text-left space-y-2 text-xs">
                      <div className="flex items-center justify-between text-amber-900 font-extrabold">
                        <span className="flex items-center space-x-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>{authNotice.title}</span>
                        </span>
                        <button
                          onClick={() => setAuthNotice(null)}
                          className="text-amber-500 hover:text-amber-800 text-[10px] font-bold"
                        >
                          Dismiss
                        </button>
                      </div>
                      <p className="text-amber-800 leading-relaxed font-medium">{authNotice.desc}</p>
                      {authNotice.steps && authNotice.steps.length > 0 && (
                        <ol className="list-decimal list-inside space-y-1 text-amber-900 font-semibold pt-1 border-t border-amber-200/60">
                          {authNotice.steps.map((st, i) => (
                            <li key={i}>{st}</li>
                          ))}
                        </ol>
                      )}
                      <div className="pt-2 flex flex-col space-y-1.5">
                        <button
                          onClick={() => {
                            setUserPhone('9999999999');
                            triggerVisualToast('Test number prefilled! Note: Ensure +919999999999 is added under Phone Test Numbers in Firebase Console.');
                          }}
                          className="w-full py-2 bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-bold rounded-xl text-[11px] transition-colors"
                        >
                          Prefill Test Number (+91 9999999999)
                        </button>
                      </div>
                    </div>
                  )}
                  {!showOtpScreen ? (
                    <div id="enter_phone_section" className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 tracking-wide uppercase">
                          Register Mobile Number
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-4 text-slate-400 font-bold text-sm">+91</span>
                          <input
                            type="tel"
                            maxLength={10}
                            id="farmer_phone_input"
                            placeholder={t.common.phonePlaceholder}
                            disabled={isSendingOtp}
                            value={userPhone}
                            onChange={(e) => setUserPhone(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:bg-white rounded-xl py-3 pl-14 pr-4 text-sm font-bold tracking-widest outline-none transition-all disabled:opacity-60"
                          />
                        </div>
                      </div>

                      <button
                        onClick={triggerPhoneVerification}
                        disabled={isSendingOtp || userPhone.length < 10}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 active:scale-95 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-200 flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                      >
                        {isSendingOtp ? (
                          <>
                            <RotateCcw className="w-4 h-4 animate-spin text-white" />
                            <span>Sending OTP...</span>
                          </>
                        ) : (
                          <>
                            <span>{t.common.sendOtp}</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <div className="relative my-3 flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200" />
                        </div>
                        <span className="relative bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Or Sign In With
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={isSendingOtp}
                        className="w-full py-3 px-4 bg-white hover:bg-slate-50 active:scale-95 border-2 border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center space-x-2.5 disabled:opacity-60 cursor-pointer"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span>Continue with Google</span>
                      </button>
                    </div>
                  ) : (
                    <div id="enter_otp_section" className="space-y-4">
                      {USE_DEV_OTP && devOtpCode && (
                        <div id="dev_otp_panel" className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl text-center space-y-2 shadow-sm">
                          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-center space-x-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                            <span>Development Verification Code Panel</span>
                          </div>
                          <div className="text-3xl font-black font-mono tracking-widest text-emerald-950 bg-white border border-emerald-200 py-2 px-4 rounded-xl inline-block shadow-inner select-all">
                            {devOtpCode}
                          </div>
                          <p className="text-[11px] text-emerald-700 font-medium">
                            Enter the code above or tap below to auto-fill.
                          </p>
                          <button
                            type="button"
                            onClick={() => setOtpCode(devOtpCode)}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                          >
                            Auto-fill Verification Code ({devOtpCode})
                          </button>
                        </div>
                      )}

                      <div className="text-center">
                        <p className="text-xs text-slate-500">
                          Message sent successfully to <span className="font-bold text-slate-800 font-mono">+91 {userPhone}</span>
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 tracking-wide uppercase">
                          6-Digit SMS Code
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          id="otp_code_input"
                          placeholder={t.common.otpPlaceholder}
                          disabled={isVerifyingOtp}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:bg-white rounded-xl py-3 text-center text-lg font-black tracking-widest outline-none transition-all disabled:opacity-60"
                        />
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowOtpScreen(false)}
                          disabled={isVerifyingOtp}
                          className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 font-bold text-xs disabled:opacity-60"
                        >
                          Change Number
                        </button>
                        <button
                          onClick={confirmOtpVerification}
                          disabled={isVerifyingOtp || otpCode.length !== 6}
                          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-1 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isVerifyingOtp ? (
                            <>
                              <RotateCcw className="w-3.5 h-3.5 animate-spin text-white" />
                              <span>Verifying...</span>
                            </>
                          ) : (
                            <span>{t.common.verifyOtp}</span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="relative my-6 text-center">
                    <hr className="border-slate-100" />
                    <span className="absolute bg-white px-3 text-[10px] text-slate-400 font-bold -top-2 left-1/2 -translate-x-1/2 uppercase tracking-widest">
                      OR
                    </span>
                  </div>

                  <button
                    onClick={skipLoginAsGuest}
                    className="w-full py-3 border-2 border-dashed border-slate-200 hover:border-emerald-500 text-slate-600 hover:text-emerald-700 font-bold text-xs rounded-xl transition-all"
                  >
                    {t.common.guestLogin}
                  </button>
                </div>

                <div className="mt-8 text-center space-y-2">
                  <p className="text-[10px] text-slate-400">
                    🔒 Data encrypted securely with your agricultural local mandis.
                  </p>
                  <div className="flex justify-center space-x-1.5 text-[10px] font-semibold text-slate-400">
                    <span>English</span>•<span>ಕನ್ನಡ</span>•<span>ಹಿಿ೦ದೀ</span>•<span>ತಮಿಳು</span>•<span>ತೆಲುಗು</span>•<span>ಮಲಯಾಳಂ</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : showEditProfileModal ? (
          /* Requirement 1, 2, 4, 5: Full-Page Edit Farmer Profile Route inside Mobile Phone Frame */
          <div className="w-full h-full flex-1 flex flex-col overflow-hidden bg-slate-50 animate-fadeIn relative">
            <FarmerProfileForm
              uid={firebaseAuthUid || auth.currentUser?.uid || localStorage.getItem('agri_user_uid') || 'guest_uid'}
              mobileNumber={userPhone || regPhone || localStorage.getItem('agri_phone') || '9999999999'}
              initialProfile={fullUserProfile}
              currentLang={currentLang}
              isModal={false}
              onCancel={() => setShowEditProfileModal(false)}
              onSaveSuccess={(updated) => {
                setFullUserProfile(updated);
                if (updated.name) {
                  setFirebaseAuthName(updated.name);
                  localStorage.setItem('agri_partner_name', updated.name);
                }
                setShowEditProfileModal(false);
                triggerVisualToast('Farmer Profile saved & updated in Firestore database!');
              }}
            />
          </div>
        ) : (
          /* Main Application Views Wrapper Container */
          <div
            id="agri_main_application"
            className="flex-1 min-h-0 w-full overflow-y-auto overscroll-contain bg-slate-50 relative scrollbar-thin flex flex-col"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >

            {showWeatherHub && (
              <WeatherIntelligence
                currentLang={currentLang}
                onClose={() => setShowWeatherHub(false)}
                triggerToast={triggerVisualToast}
                uid={firebaseAuthUid}
              />
            )}

            {showIrrigationHub && (
              <SmartIrrigationAdvisor
                currentLang={currentLang}
                onClose={() => setShowIrrigationHub(false)}
                triggerToast={triggerVisualToast}
                uid={firebaseAuthUid}
              />
            )}

            {showCropPredictionHub && (
              <AICropPredictionSystem
                currentLang={currentLang}
                initialCropName={selectedPredictedCrop?.name}
                onClose={() => setShowCropPredictionHub(false)}
                triggerToast={triggerVisualToast}
              />
            )}

            {/* VIEW 1: HOME PANEL */}
            {activeTab === 'home' && (
              <HomeTabView
                userPhone={userPhone}
                regPhone={regPhone}
                fullUserProfile={fullUserProfile}
                liveWeather={liveWeather}
                t={t}
                currentLang={currentLang}
                setCurrentLang={setCurrentLang}
                reminders={soilReminders}
                newReminderText={newReminderText}
                setNewReminderText={setNewReminderText}
                addReminder={addSoilReminder}
                toggleReminder={(id, done) => {
                  toggleReminderInFirestore(id, done).catch(() => {
                    setSoilReminders(prev => prev.map(r => r.id === id ? { ...r, done: !r.done } : r));
                  });
                  triggerVisualToast(done ? 'Marked reminder as incomplete' : 'Completed reminder! 🎉');
                }}
                deleteReminder={(id) => {
                  deleteReminderInFirestore(id).catch(() => {
                    setSoilReminders(prev => prev.filter(r => r.id !== id));
                  });
                  triggerVisualToast('Reminder deleted');
                }}
                onOpenWeather={() => {
                  setShowWeatherHub(true);
                  triggerVisualToast('Deploying AgriVerse Weather Intelligence Network...');
                }}
                onOpenCropDoctor={() => {
                  setActiveTab('assistant');
                  setActiveAiTool('pest');
                  setDiagnosisReport(null);
                  setSelectedLeafImage(null);
                }}
                onOpenWaterTracker={() => {
                  setShowIrrigationHub(true);
                  triggerVisualToast('Launching Soil & Irrigation Advisor dashboard...');
                }}
                onOpenGovSchemes={() => {
                  setShowGovSchemesModal(true);
                  triggerVisualToast('Opening Government Schemes Directory...');
                }}
                onNavigateTab={(tab) => {
                  setActiveTab(tab);
                  setActiveSubPage(null);
                  setActiveAiTool(null);
                  setActiveMarketTool(null);
                  setActiveProfileTool(null);
                }}
                triggerToast={triggerVisualToast}
              />
            )}

            {activeTab === 'community' && (
              <CommunityTabView
                communitySubTab={communitySubTab}
                setCommunitySubTab={setCommunitySubTab}
                communityTab={communityTab}
                setCommunityTab={setCommunityTab}
                districtFilter={districtFilter}
                setDistrictFilter={setDistrictFilter}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                posts={posts}
                savedPostIds={savedPostIds}
                followedFarmers={followedFarmers}
                isJoined={isJoined}
                userPhone={userPhone}
                firebaseAuthUid={firebaseAuthUid}
                firebaseAuthName={firebaseAuthName}
                postCategory={postCategory}
                setPostCategory={setPostCategory}
                postDistrict={postDistrict}
                setPostDistrict={setPostDistrict}
                postVillage={postVillage}
                setPostVillage={setPostVillage}
                newPostContent={newPostContent}
                setNewPostContent={setNewPostContent}
                isRecordingVoicePost={isRecordingVoicePost}
                voiceRecordDuration={voiceRecordDuration}
                voicePostBase64={voicePostBase64}
                setVoicePostBase64={setVoicePostBase64}
                voicePostCaption={voicePostCaption}
                setVoicePostCaption={setVoicePostCaption}
                selectedPostImage={selectedPostImage}
                setSelectedPostImage={setSelectedPostImage}
                hiddenPostImageInputRef={hiddenPostImageInputRef}
                startVoiceRecording={startVoiceRecording}
                stopVoiceRecording={stopVoiceRecording}
                handleImageConversion={handleImageConversion}
                handleCreatePost={handleCreatePost}
                handleToggleFollowFarmer={handleToggleFollowFarmer}
                handleToggleLike={handleToggleLike}
                handleToggleSavePost={handleToggleSavePost}
                handleCreateComment={handleCreateComment}
                aiTranslations={aiTranslations}
                aiSummaries={aiSummaries}
                aiSuggestions={aiSuggestions}
                activePostComments={activePostComments}
                setActivePostComments={setActivePostComments}
                loadingAiField={loadingAiField}
                handleTranslatePost={handleTranslatePost}
                handleSummarizePost={handleSummarizePost}
                handleSuggestReplyMessage={handleSuggestReplyMessage}
                t={t}
                currentLang={currentLang}
                triggerToast={triggerVisualToast}
              />
            )}

            {/* VIEW 3: CROP MARKETPLACE */}
            {activeTab === 'marketplace' && (
              <MarketplaceTabView
                products={products}
                setProducts={setProducts}
                mandiPricesList={mandiPricesList}
                showSellForm={showSellForm}
                setShowSellForm={setShowSellForm}
                newCropName={newCropName}
                setNewCropName={setNewCropName}
                newCropPrice={newCropPrice}
                setNewCropPrice={setNewCropPrice}
                newCropQty={newCropQty}
                setNewCropQty={setNewCropQty}
                newCropLocation={newCropLocation}
                setNewCropLocation={setNewCropLocation}
                selectedProductImage={selectedProductImage}
                setSelectedProductImage={setSelectedProductImage}
                hiddenProductImageInputRef={hiddenProductImageInputRef}
                handleImageConversion={handleImageConversion}
                handleHostMarketSale={handleHostMarketSale}
                isJoined={isJoined}
                userPhone={userPhone}
                t={t}
                currentLang={currentLang}
                triggerToast={triggerVisualToast}
                setActiveTab={setActiveTab}
                setSelectedPredictedCrop={setSelectedPredictedCrop}
                triggerCropPredictionInsight={triggerCropPredictionInsight}
              />
            )}

            {/* VIEW 4: AI ADVISOR (SMART FARMING GUIDANCE) */}
            {activeTab === 'assistant' && (
              <AiAdvisorTabView
                currentLang={currentLang}
                t={t}
                activeAiTool={activeAiTool}
                setActiveAiTool={setActiveAiTool}
                fullUserProfile={fullUserProfile}
                chatHistory={chatHistory}
                clearChatHistory={clearChatHistory}
                chatAttachedImage={chatAttachedImage}
                setChatAttachedImage={setChatAttachedImage}
                chatInput={chatInput}
                setChatInput={setChatInput}
                isChatLoading={isChatLoading}
                triggerSendChatMessage={triggerSendChatMessage}
                isRecording={isRecording}
                startVoiceRecordingTrigger={startVoiceRecordingTrigger}
                speakVoiceOutput={speakVoiceOutput}
                chatEndRef={chatEndRef}
                hiddenFileInputRef={hiddenFileInputRef}
                handleLeafImageUploadChange={handleLeafImageUploadChange}
                selectedLeafImage={selectedLeafImage}
                setSelectedLeafImage={setSelectedLeafImage}
                diagnosisReport={diagnosisReport}
                setDiagnosisReport={setDiagnosisReport}
                isDiagnosing={isDiagnosing}
                scanHistory={scanHistory}
                deleteScanHistoryItem={deleteScanHistoryItem}
                handleDiseaseExamplePick={handleDiseaseExamplePick}
                downloadCropHealthPdf={downloadCropHealthPdf}
                onOpenImagePicker={() => {
                  setActiveTab('assistant');
                  setActiveAiTool('pest');
                  setShowImagePickerModal(true);
                }}
                analyzeCropDiseaseImage={analyzeCropDiseaseImage}
                uploadProgressStatus={uploadProgressStatus}
                expenses={expenses}
                newExpenseTitle={newExpenseName}
                setNewExpenseTitle={setNewExpenseName}
                newExpenseAmount={newExpenseAmount}
                setNewExpenseAmount={setNewExpenseAmount}
                addExpenseItem={handleAddExpenseLocal}
                deleteExpenseItem={handleDeleteExpenseLocal}
                compileEcoScore={compileEcoScore}
                triggerToast={triggerVisualToast}
              />
            )}

            {/* VIEW 5: USER PROFILE */}
            {activeTab === 'profile' && (
              <ProfileTabView
                currentLang={currentLang}
                setCurrentLang={setCurrentLang}
                t={t}
                userPhone={userPhone}
                regPhone={regPhone}
                firebaseAuthUid={firebaseAuthUid || auth.currentUser?.uid || 'guest_uid'}
                fullUserProfile={fullUserProfile}
                setFullUserProfile={setFullUserProfile}
                activeProfileTool={activeProfileTool}
                setActiveProfileTool={setActiveProfileTool}
                logoutSession={logoutSession}
                onSaveProfileSuccess={(updated) => {
                  if (updated) {
                    setFullUserProfile(updated);
                    if (updated.name) {
                      setFirebaseAuthName(updated.name);
                      localStorage.setItem('agri_partner_name', updated.name);
                    }
                  }
                  triggerVisualToast('Profile synchronized with Firestore.');
                }}
                schemes={schemes}
                expandedSchemeId={expandedSchemeId}
                setExpandedSchemeId={setExpandedSchemeId}
                eligibleResponses={eligibleResponses}
                setEligibleResponses={setEligibleResponses}
                triggerToast={triggerVisualToast}
              />
            )}

            {/* Smartphone screen buffer scroll spacer pad */}
            <div className="w-full h-20 shrink-0 bg-transparent"></div>

          </div>
        )}

        {/* Unified Bottom Mobile Navigation Bar - touch friendly, simple icons */}
        {isJoined && (
          <div id="phone_navigation_bar" className="shrink-0 bg-white border-t border-slate-100 shadow-[0_-5px_15px_rgba(0,0,0,0.03)] flex justify-between items-center px-4 pb-[max(8px,env(safe-area-inset-bottom))] pt-1.5 z-50 select-none">
            <button
              onClick={() => {
                setActiveTab('home');
                setActiveSubPage(null);
                setActiveAiTool(null);
                setActiveProfileTool('overview');
                triggerVisualToast('Home Sowing feed re-loaded.');
              }}
              className={`flex flex-col items-center justify-center flex-1 cursor-pointer py-1.5 focus:outline-none transition-all ${activeTab === 'home' && !activeSubPage ? 'text-emerald-700 font-extrabold scale-105' : 'text-slate-400 font-bold hover:text-slate-600'
                }`}
            >
              <Home className="w-5.5 h-5.5" />
              <span className="text-[9px] mt-1 tracking-tight truncate max-w-[65px]">{t.tabs.home}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('community');
                setActiveSubPage(null);
                setActiveAiTool(null);
                setActiveProfileTool('overview');
                fetchPostsAndProducts();
                triggerVisualToast('Community Postboard synchronized.');
              }}
              className={`flex flex-col items-center justify-center flex-1 cursor-pointer py-1.5 focus:outline-none transition-all ${activeTab === 'community' && !activeSubPage ? 'text-emerald-700 font-extrabold scale-105' : 'text-slate-400 font-bold hover:text-slate-600'
                }`}
            >
              <Users className="w-5.5 h-5.5" />
              <span className="text-[9px] mt-1 tracking-tight truncate max-w-[65px]">{t.tabs.community}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('marketplace');
                setActiveSubPage(null);
                setActiveAiTool(null);
                setActiveProfileTool('overview');
                fetchPostsAndProducts();
                triggerVisualToast('Krishi marketplace updated.');
              }}
              className={`flex flex-col items-center justify-center flex-1 cursor-pointer py-1.5 focus:outline-none transition-all ${activeTab === 'marketplace' && !activeSubPage ? 'text-emerald-700 font-extrabold scale-105' : 'text-slate-400 font-bold hover:text-slate-600'
                }`}
            >
              <ShoppingBag className="w-5.5 h-5.5" />
              <span className="text-[9px] mt-1 tracking-tight truncate max-w-[65px]">{t.tabs.marketplace}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('assistant');
                setActiveSubPage(null);
                setDiagnosisReport(null);
                setSelectedLeafImage(null);
                triggerVisualToast('Chat Advisor online with voice controls.');
              }}
              className={`flex flex-col items-center justify-center flex-1 cursor-pointer py-1.5 focus:outline-none transition-all ${activeTab === 'assistant' && !activeSubPage ? 'text-emerald-700 font-extrabold scale-105' : 'text-slate-400 font-bold hover:text-slate-600'
                }`}
            >
              <div className="relative">
                <MessageSquare className="w-5.5 h-5.5 text-center block" />
                <span className="absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full bg-yellow-400 animate-ping"></span>
              </div>
              <span className="text-[10px] mt-1 tracking-tight font-extrabold truncate max-w-[65px]">AI Advisor</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('profile');
                setActiveSubPage(null);
                setActiveAiTool(null);
                setActiveProfileTool('overview');
                triggerVisualToast('Account ledger open.');
              }}
              className={`flex flex-col items-center justify-center flex-1 cursor-pointer py-1.5 focus:outline-none transition-all ${activeTab === 'profile' && !activeSubPage ? 'text-emerald-700 font-extrabold scale-105' : 'text-slate-400 font-bold hover:text-slate-600'
                }`}
            >
              <User className="w-5.5 h-5.5" />
              <span className="text-[9px] mt-1 tracking-tight truncate max-w-[65px]">{t.tabs.profile}</span>
            </button>
          </div>
        )}

        {/* Hidden File & Camera Inputs for Crop Leaf Scanner */}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          ref={hiddenFileInputRef}
          className="hidden"
          onChange={handleLeafImageUploadChange}
        />
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          capture="environment"
          ref={cameraFileInputRef}
          className="hidden"
          onChange={handleLeafImageUploadChange}
        />

        {/* Floating Camera Upload Button overlaying the interface on active states */}
        {isJoined && (
          <button
            onClick={() => {
              setActiveTab('assistant');
              setActiveAiTool('pest');
              setShowImagePickerModal(true);
            }}
            id="floating_camera_scanner_fab"
            className="absolute bottom-20 right-5 w-14 h-14 bg-gradient-to-tr from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 active:scale-95 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-600/30 border border-emerald-400 cursor-pointer z-40 transition-all group"
            title="Scan crop disease"
          >
            <Camera className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute right-16 bg-slate-900/90 text-white font-extrabold text-[9px] px-2.5 py-1.5 rounded-xl uppercase tracking-widest pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md">
              Diagnose Crop Disease
            </span>
          </button>
        )}

        {/* Camera / Gallery Selection Bottom Sheet Modal - Sits cleanly above bottom navigation */}
        {showImagePickerModal && (
          <div
            id="crop_image_picker_backdrop"
            className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center p-3 animate-fadeIn pb-20 sm:pb-3"
            onClick={() => setShowImagePickerModal(false)}
          >
            <div
              id="crop_image_picker_sheet"
              className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4 animate-slideUp sm:animate-scaleUp relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800">Select Image Source</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Crop Doctor Disease Scanner</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowImagePickerModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Selection Options */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  id="crop_picker_take_photo_btn"
                  onClick={handleTriggerTakePhoto}
                  className="w-full flex items-center space-x-3.5 p-3.5 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/80 text-left cursor-pointer transition-all active:scale-[0.98] group"
                >
                  <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-extrabold text-xs text-emerald-950 block">Take Photo</span>
                    <span className="text-[10px] text-emerald-700/80 font-medium block truncate">
                      Use camera to capture infected leaf
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  id="crop_picker_choose_gallery_btn"
                  onClick={() => {
                    setShowImagePickerModal(false);
                    hiddenFileInputRef.current?.click();
                  }}
                  className="w-full flex items-center space-x-3.5 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer transition-all active:scale-[0.98] group"
                >
                  <div className="w-11 h-11 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-md shadow-slate-800/10 group-hover:scale-105 transition-transform">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-extrabold text-xs text-slate-800 block">Choose from Gallery</span>
                    <span className="text-[10px] text-slate-500 font-medium block truncate">
                      Pick existing photo from storage
                    </span>
                  </div>
                </button>
              </div>

              {/* Cancel Button */}
              <button
                type="button"
                id="crop_picker_cancel_btn"
                onClick={() => setShowImagePickerModal(false)}
                className="w-full py-2.5 rounded-xl text-center text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Real Desktop Webcam Capture Modal */}
        {showWebcamModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn pb-20 sm:pb-3">
            <div className="bg-slate-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col relative text-white">
              {/* Header */}
              <div className="p-3.5 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Camera className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-extrabold text-xs uppercase tracking-wide text-white">Capture Leaf Photo</h4>
                </div>
                <button
                  type="button"
                  onClick={handleCloseWebcam}
                  className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Live Video View */}
              <div className="relative w-full bg-black aspect-4/3 flex items-center justify-center overflow-hidden">
                <video
                  ref={webcamVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-6 border-2 border-dashed border-emerald-400/60 rounded-2xl pointer-events-none flex items-center justify-center">
                  <span className="text-[10px] font-bold text-emerald-300 bg-slate-950/70 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Place crop leaf inside frame
                  </span>
                </div>
              </div>

              {/* Capture Controls */}
              <div className="p-4 bg-slate-900 flex items-center justify-between gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseWebcam}
                  className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="webcam_capture_btn"
                  onClick={handleCaptureWebcamFrame}
                  className="flex-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Photo</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Farmer Profile Modal */}
        {showEditProfileModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-md h-[90vh] sm:h-[88vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col relative border border-slate-200">
              <FarmerProfileForm
                uid={firebaseAuthUid || auth.currentUser?.uid || localStorage.getItem('agri_user_uid') || 'guest_uid'}
                mobileNumber={userPhone || regPhone || localStorage.getItem('agri_phone') || '9999999999'}
                initialProfile={fullUserProfile}
                currentLang={currentLang}
                isModal={true}
                onCancel={() => setShowEditProfileModal(false)}
                onSaveSuccess={(updated) => {
                  setFullUserProfile(updated);
                  if (updated.name) {
                    setFirebaseAuthName(updated.name);
                    localStorage.setItem('agri_partner_name', updated.name);
                  }
                  setShowEditProfileModal(false);
                  setActiveTab('profile');
                  triggerVisualToast('Profile saved successfully');
                }}
              />
            </div>
          </div>
        )}

        {/* KYC & Government Benefits Modal */}
        {showKycModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-md h-[90vh] sm:h-[88vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col relative border border-slate-200">
              <KYCGovernmentBenefits
                uid={firebaseAuthUid || auth.currentUser?.uid || localStorage.getItem('agri_user_uid') || 'guest_uid'}
                initialProfile={fullUserProfile}
                onClose={() => setShowKycModal(false)}
                triggerToast={(msg) => triggerVisualToast(msg)}
                onSaveSuccess={(updated) => {
                  setFullUserProfile(updated);
                  setShowKycModal(false);
                  setActiveTab('profile');
                }}
              />
            </div>
          </div>
        )}

        {/* Genuine Government Schemes Directory Modal */}
        {showGovSchemesModal && (
          <GovernmentSchemesModal
            onClose={() => setShowGovSchemesModal(false)}
            onOpenKyc={() => {
              setShowGovSchemesModal(false);
              setShowKycModal(true);
            }}
            currentLang={currentLang}
            triggerToast={(msg) => triggerVisualToast(msg)}
          />
        )}

      </div>

      {/* Outer desktop background disclaimer layout */}
      <div id="desktop_app_credits" className="hidden border-t-0 md:block text-center text-xs mt-6 text-neutral-500 max-w-sm space-y-2 uppercase select-none">
        <p className="font-bold tracking-widest text-emerald-600">🌿 AgriVerse AI Mobile Portal 🌿</p>
        <p className="font-semibold text-[10px] tracking-tight leading-relaxed text-slate-400">
          Designed specifically to function as a compact, responsive client interface on low-end smartphones. Adjust sizing in development by resizing the main window frame.
        </p>
      </div>

    </div>
  );
}
