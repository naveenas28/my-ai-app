import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Globe,
  Sprout,
  Droplets,
  Layers,
  Camera,
  Check,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  X,
  Lock,
  ArrowLeft,
  Search,
  ChevronDown,
  CheckCircle2,
  Plus,
  Save,
  Loader2,
  RefreshCw,
  Upload,
  Video
} from 'lucide-react';
import { LanguageCode } from '../types';
import { UserProfileDoc, saveFarmerProfile, getUserProfile, uploadProfilePhoto } from '../services/userService';
import { MASTER_CROPS_LIST } from '../data/indiaData';
import {
  GLOBAL_COUNTRIES,
  getCountryAdminTerms,
  getCountryInfo,
  searchGlobalLocations
} from '../data/globalLocationData';
import {
  fetchAllCountries,
  fetchStatesForCountry,
  fetchDistrictsForState,
  fetchSubDistrictsForDistrict,
  getDynamicAdminTerms,
  ApiCountry,
  ApiState,
  ApiDistrict,
  ApiSubDistrict
} from '../services/locationService';
import { auth } from '../firebase';
import { useI18n } from '../context/I18nContext';

export interface FarmerProfileFormProps {
  uid: string;
  mobileNumber: string;
  initialProfile?: UserProfileDoc | null;
  currentLang?: LanguageCode;
  onSaveSuccess: (updatedProfile: UserProfileDoc) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

const SOIL_TYPES = [
  'Red Loam',
  'Black Cotton (Regur)',
  'Alluvial Soil',
  'Clay Soil',
  'Sandy Loam',
  'Laterite Soil',
  'Silty Soil',
  'Saline & Alkaline Soil'
];

const WATER_SOURCES = [
  'Borewell',
  'Canal Irrigation',
  'Rainfed Agriculture',
  'Drip / Micro Irrigation',
  'Open Well',
  'River / Pond / Lake'
];

const LANGUAGES: { code: LanguageCode; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'mr', label: 'Marathi', native: 'ಮರಾಠಿ' }
];

export const FarmerProfileForm: React.FC<FarmerProfileFormProps> = ({
  uid,
  mobileNumber,
  initialProfile,
  currentLang,
  onSaveSuccess,
  onCancel,
  isModal = false
}) => {
  const { language, setLanguage } = useI18n();

  // Single-Page Form States
  // 1. Personal Details
  const [fullName, setFullName] = useState<string>('');
  const [gender, setGender] = useState<string>('Male');
  const [dob, setDob] = useState<string>('');

  // 2. Location & Language
  const [country, setCountry] = useState<string>('India');
  const [state, setState] = useState<string>('Karnataka');
  const [district, setDistrict] = useState<string>('Chikkaballapura');
  const [subDistrict, setSubDistrict] = useState<string>('');
  const [village, setVillage] = useState<string>('');
  const [pincode, setPincode] = useState<string>('');
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(language || currentLang || 'en');

  // 3. Farm & Agriculture Details
  const [farmName, setFarmName] = useState<string>('My Farm');
  const [farmSize, setFarmSize] = useState<string>('2.5');
  const [farmingType, setFarmingType] = useState<string>('Conventional');
  const [primaryCrops, setPrimaryCrops] = useState<string[]>(['Rice (Paddy)', 'Tomato']);
  const [soilType, setSoilType] = useState<string>('Red Loam');
  const [waterSource, setWaterSource] = useState<string>('Borewell');

  // Photo Upload States
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [hasPhotoError, setHasPhotoError] = useState<boolean>(false);

  // Live Camera Capture States
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Status & UI States
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastNotification, setToastNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Search & Dropdown States
  const [countrySearchQuery, setCountrySearchQuery] = useState<string>('');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState<boolean>(false);

  const [stateSearchQuery, setStateSearchQuery] = useState<string>('');
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState<boolean>(false);

  const [districtSearchQuery, setDistrictSearchQuery] = useState<string>('');
  const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState<boolean>(false);

  const [subDistrictSearchQuery, setSubDistrictSearchQuery] = useState<string>('');
  const [isSubDistrictDropdownOpen, setIsSubDistrictDropdownOpen] = useState<boolean>(false);

  const [cropSearchQuery, setCropSearchQuery] = useState<string>('');
  const [isCropDropdownOpen, setIsCropDropdownOpen] = useState<boolean>(false);

  // Dropdown Refs
  const countryRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<HTMLDivElement>(null);
  const districtRef = useRef<HTMLDivElement>(null);
  const subDistrictRef = useRef<HTMLDivElement>(null);
  const cropRef = useRef<HTMLDivElement>(null);

  // Sync active language
  useEffect(() => {
    if (language) {
      setSelectedLang(language);
    }
  }, [language]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
      if (stateRef.current && !stateRef.current.contains(event.target as Node)) {
        setIsStateDropdownOpen(false);
      }
      if (districtRef.current && !districtRef.current.contains(event.target as Node)) {
        setIsDistrictDropdownOpen(false);
      }
      if (subDistrictRef.current && !subDistrictRef.current.contains(event.target as Node)) {
        setIsSubDistrictDropdownOpen(false);
      }
      if (cropRef.current && !cropRef.current.contains(event.target as Node)) {
        setIsCropDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Populate fields helper
  const populateFields = (doc: UserProfileDoc) => {
    if (doc.fullName || doc.name) setFullName(doc.fullName || doc.name || '');
    if (doc.gender) setGender(doc.gender);
    if (doc.dateOfBirth || doc.dob) setDob(doc.dateOfBirth || doc.dob || '');
    if (doc.country) setCountry(doc.country);
    if (doc.state) setState(doc.state);
    if (doc.district) setDistrict(doc.district);
    if (doc.subDistrict) setSubDistrict(doc.subDistrict);
    if (doc.village) setVillage(doc.village);
    if (doc.pincode) setPincode(doc.pincode);
    if (doc.preferredLanguage || doc.language) setSelectedLang((doc.preferredLanguage || doc.language) as LanguageCode);
    if (doc.farmName) setFarmName(doc.farmName);
    if (doc.farmSize !== undefined || doc.farmSizeAcres !== undefined) setFarmSize(String(doc.farmSize ?? doc.farmSizeAcres));
    if (doc.farmingType) setFarmingType(doc.farmingType);
    if (doc.soilType) setSoilType(doc.soilType);
    if (doc.waterSource) setWaterSource(doc.waterSource);
    const photoUrlVal = doc.profilePhotoUrl || doc.photoURL || auth.currentUser?.photoURL || '';
    if (photoUrlVal) {
      setPhotoPreview(photoUrlVal);
      setHasPhotoError(false);
    }

    const cropsList = doc.primaryCrops && doc.primaryCrops.length > 0
      ? doc.primaryCrops
      : (doc.crops && doc.crops.length > 0 ? doc.crops : []);
    if (cropsList.length > 0) {
      setPrimaryCrops(cropsList);
    }
  };

  // Load profile on mount
  useEffect(() => {
    let isSubscribed = true;

    async function loadData() {
      if (initialProfile) {
        populateFields(initialProfile);
        setIsLoadingProfile(false);
        return;
      }

      if (!uid) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        const cloudData = await getUserProfile(uid);
        if (isSubscribed && cloudData) {
          populateFields(cloudData);
        }
      } catch (err) {
        console.warn('Profile fetch warning:', err);
      } finally {
        if (isSubscribed) {
          setIsLoadingProfile(false);
        }
      }
    }

    loadData();
    return () => {
      isSubscribed = false;
    };
  }, [uid, initialProfile]);

  // Stop camera stream tracks cleanly
  const stopLiveCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, []);

  // Start live camera stream
  const startLiveCamera = async (facing: 'environment' | 'user' = cameraFacingMode) => {
    setIsStartingCamera(true);
    setCameraError(null);

    stopLiveCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Live camera stream is not supported by your browser. Please choose a photo file instead.');
      setIsStartingCamera(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      const errStr = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
        ? 'Camera permission denied. Please allow camera access in browser settings or choose a photo file.'
        : `Unable to open camera (${err?.message || 'Camera device busy or unavailable'}). You can upload a photo file instead.`;
      setCameraError(errStr);
    } finally {
      setIsStartingCamera(false);
    }
  };

  // Flip / Switch camera (Rear vs Front)
  const handleSwitchCamera = async () => {
    const nextFacing = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(nextFacing);
    await startLiveCamera(nextFacing);
  };

  // Open camera overlay modal
  const handleOpenCameraModal = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // Direct fallback to file picker
      fileInputRef.current?.click();
      return;
    }
    setShowCameraModal(true);
    setTimeout(() => {
      startLiveCamera('environment');
    }, 100);
  };

  // Close camera overlay modal
  const handleCloseCameraModal = () => {
    stopLiveCamera();
    setShowCameraModal(false);
    setCameraError(null);
  };

  // Capture current video frame to JPEG file and upload
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (cameraFacingMode === 'user') {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);

    // Stop camera immediately
    stopLiveCamera();
    setShowCameraModal(false);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setToastNotification({
          type: 'error',
          message: 'Failed to capture frame from camera stream.'
        });
        return;
      }
      const capturedFile = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      await processAndUploadPhoto(capturedFile);
    }, 'image/jpeg', 0.85);
  };

  // Core Photo Processing & Upload Handler (Camera capture or File selection)
  const processAndUploadPhoto = async (file: File) => {
    if (!file) return;

    if (file.type && !file.type.startsWith('image/')) {
      setToastNotification({
        type: 'error',
        message: 'Please select a valid image file (JPEG, PNG, WEBP).'
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setToastNotification({
        type: 'error',
        message: 'Image size exceeds 10MB limit. Please choose or capture a smaller photo.'
      });
      return;
    }

    setPhotoFile(file);
    setIsUploadingPhoto(true);

    const activeUid = uid || auth.currentUser?.uid;

    try {
      if (!activeUid) {
        throw new Error('User is not authenticated. Please log in first.');
      }

      const url = await uploadProfilePhoto(activeUid, file);
      if (url) {
        setPhotoPreview(url);
        setHasPhotoError(false);

        // Immediately update local cache & notify parent
        const cachedKey = `agri_profile_${activeUid}`;
        const existingRaw = localStorage.getItem(cachedKey) || localStorage.getItem('agri_user_profile');
        let profileObj: any = {};
        if (existingRaw) {
          try { profileObj = JSON.parse(existingRaw); } catch (e) {}
        }
        profileObj.profilePhotoUrl = url;
        profileObj.photoURL = url;
        profileObj.uid = activeUid;

        localStorage.setItem(cachedKey, JSON.stringify(profileObj));
        localStorage.setItem('agri_user_profile', JSON.stringify(profileObj));

        if (onSaveSuccess) {
          onSaveSuccess(profileObj);
        }

        setToastNotification({
          type: 'success',
          message: 'Profile photo updated and saved successfully!'
        });
      }
    } catch (err: any) {
      console.error('Profile photo save error:', err);
      const errMessage = err?.message || String(err);

      setToastNotification({
        type: 'error',
        message: `Profile photo save failed: ${errMessage}`
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Photo file select handler
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processAndUploadPhoto(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  // Global API Countries state
  const [apiCountries, setApiCountries] = useState<ApiCountry[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState<boolean>(false);
  const [apiStates, setApiStates] = useState<ApiState[]>([]);
  const [isLoadingApiStates, setIsLoadingApiStates] = useState<boolean>(false);
  const [apiDistricts, setApiDistricts] = useState<ApiDistrict[]>([]);
  const [isLoadingApiDistricts, setIsLoadingApiDistricts] = useState<boolean>(false);
  const [apiSubDistricts, setApiSubDistricts] = useState<ApiSubDistrict[]>([]);
  const [isLoadingApiSubDistricts, setIsLoadingApiSubDistricts] = useState<boolean>(false);

  // Dynamic admin terminology & country info
  const adminTerms = useMemo(() => getDynamicAdminTerms(country), [country]);
  const currentCountryInfo = useMemo(() => apiCountries.find(c => c.name.toLowerCase() === country.toLowerCase()) || getCountryInfo(country), [apiCountries, country]);

  // Load all global countries from API
  useEffect(() => {
    let isMounted = true;
    setIsLoadingCountries(true);
    fetchAllCountries()
      .then((data) => {
        if (isMounted) {
          setApiCountries(data);
          setIsLoadingCountries(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Profile Country API warning:', err);
          setIsLoadingCountries(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Cascading: Load States for chosen Country
  useEffect(() => {
    if (!country) return;
    let isMounted = true;
    setIsLoadingApiStates(true);
    const countryObj = apiCountries.find(c => c.name.toLowerCase() === country.toLowerCase());
    fetchStatesForCountry(country, countryObj?.code)
      .then((states) => {
        if (isMounted) {
          setApiStates(states);
          setIsLoadingApiStates(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Profile States API error:', err);
          setApiStates([]);
          setIsLoadingApiStates(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [country, apiCountries]);

  // Cascading: Load Districts for chosen State
  useEffect(() => {
    if (!country || !state) return;
    let isMounted = true;
    setIsLoadingApiDistricts(true);
    const countryObj = apiCountries.find(c => c.name.toLowerCase() === country.toLowerCase());
    const stateObj = apiStates.find(s => s.name.toLowerCase() === state.toLowerCase());
    fetchDistrictsForState(country, state, countryObj?.code || stateObj?.countryCode)
      .then((dists) => {
        if (isMounted) {
          setApiDistricts(dists);
          setIsLoadingApiDistricts(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Profile Districts API error:', err);
          setApiDistricts([]);
          setIsLoadingApiDistricts(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [country, state, apiStates, apiCountries]);

  // Cascading: Load SubDistricts for chosen District
  useEffect(() => {
    if (!country || !state || !district) return;
    let isMounted = true;
    setIsLoadingApiSubDistricts(true);
    const countryObj = apiCountries.find(c => c.name.toLowerCase() === country.toLowerCase());
    fetchSubDistrictsForDistrict(country, state, district, countryObj?.code)
      .then((subDists) => {
        if (isMounted) {
          setApiSubDistricts(subDists);
          setIsLoadingApiSubDistricts(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Profile Sub-districts API error:', err);
          setApiSubDistricts([]);
          setIsLoadingApiSubDistricts(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [country, state, district, apiCountries]);

  // Countries list
  const filteredCountries = useMemo(() => {
    const source = apiCountries.length > 0 ? apiCountries : GLOBAL_COUNTRIES;
    if (!countrySearchQuery.trim()) return source;
    const q = countrySearchQuery.toLowerCase();
    return source.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [apiCountries, countrySearchQuery]);

  // States list based on chosen country
  const filteredStates = useMemo(() => {
    const source = apiStates.length > 0 ? apiStates : (getCountryInfo(country)?.states || []);
    if (!stateSearchQuery.trim()) return source;
    const q = stateSearchQuery.toLowerCase();
    return source.filter(s => s.name.toLowerCase().includes(q));
  }, [apiStates, country, stateSearchQuery]);

  // Districts list based on chosen state
  const filteredDistricts = useMemo(() => {
    const source = apiDistricts.length > 0 ? apiDistricts : (getCountryInfo(country)?.states.find(s => s.name.toLowerCase() === state.toLowerCase())?.districts || []);
    if (!districtSearchQuery.trim()) return source;
    const q = districtSearchQuery.toLowerCase();
    return source.filter(d => d.name.toLowerCase().includes(q));
  }, [apiDistricts, country, state, districtSearchQuery]);

  // Sub-districts list based on chosen district
  const filteredSubDistricts = useMemo(() => {
    const source = apiSubDistricts.length > 0 ? apiSubDistricts : (getCountryInfo(country)?.states.find(s => s.name.toLowerCase() === state.toLowerCase())?.districts.find(d => d.name.toLowerCase() === district.toLowerCase())?.subDistricts || []);
    if (!subDistrictSearchQuery.trim()) return source;
    const q = subDistrictSearchQuery.toLowerCase();
    return source.filter(sd => sd.name.toLowerCase().includes(q));
  }, [apiSubDistricts, country, state, district, subDistrictSearchQuery]);

  // Available villages in selected subdistrict
  const availableVillages = useMemo(() => {
    const subObj = apiSubDistricts.find(sd => sd.name.toLowerCase() === subDistrict.toLowerCase());
    if (subObj && subObj.villages && subObj.villages.length > 0) return subObj.villages;
    const staticSub = getCountryInfo(country)?.states.find(s => s.name.toLowerCase() === state.toLowerCase())?.districts.find(d => d.name.toLowerCase() === district.toLowerCase())?.subDistricts.find(sd => sd.name.toLowerCase() === subDistrict.toLowerCase());
    return staticSub?.villages || [];
  }, [apiSubDistricts, country, state, district, subDistrict]);

  const filteredCrops = useMemo(() => {
    if (!cropSearchQuery.trim()) return MASTER_CROPS_LIST;
    return MASTER_CROPS_LIST.filter(c =>
      c.toLowerCase().includes(cropSearchQuery.toLowerCase())
    );
  }, [cropSearchQuery]);

  const addCrop = (cropName: string) => {
    if (!primaryCrops.includes(cropName)) {
      setPrimaryCrops([...primaryCrops, cropName]);
    }
    setIsCropDropdownOpen(false);
    setCropSearchQuery('');
  };

  const removeCrop = (cropName: string) => {
    setPrimaryCrops(primaryCrops.filter(c => c !== cropName));
  };

  // Build profile doc payload
  const getCurrentProfileDoc = (overridePhotoUrl?: string): UserProfileDoc => {
    const parsedFarmSize = parseFloat(farmSize) || 0;
    const now = new Date().toISOString();
    const phoneVal = mobileNumber || initialProfile?.phoneNumber || initialProfile?.mobileNumber || '9999999999';
    const nameVal = fullName.trim() || 'Farmer Partner';
    const photoVal = overridePhotoUrl || photoPreview || initialProfile?.profilePhotoUrl || initialProfile?.photoURL || '';

    const countryObj = apiCountries.find(c => c.name.toLowerCase() === country.toLowerCase()) || getCountryInfo(country);
    const stateObj = apiStates.find(s => s.name.toLowerCase() === state.toLowerCase());
    const distObj = apiDistricts.find(d => d.name.toLowerCase() === district.toLowerCase());
    const subDistObj = apiSubDistricts.find(sd => sd.name.toLowerCase() === subDistrict.toLowerCase());

    return {
      uid,
      phoneNumber: phoneVal,
      mobileNumber: phoneVal,
      fullName: nameVal,
      name: nameVal,
      gender,
      dateOfBirth: dob,
      dob,
      country: country || 'India',
      countryName: countryObj?.name || country || 'India',
      countryCode: countryObj?.code || 'IN',
      state,
      stateName: stateObj?.name || state,
      stateCode: stateObj?.code || '',
      district,
      districtName: distObj?.name || district,
      districtCode: distObj?.code || '',
      subDistrict,
      subDistrictName: subDistObj?.name || subDistrict,
      subDistrictCode: subDistObj?.code || '',
      village,
      villageName: village,
      farmName: farmName || 'My Farm',
      farmSize: parsedFarmSize,
      farmSizeAcres: parsedFarmSize,
      farmingType,
      soilType,
      waterSource,
      primaryCrops,
      crops: primaryCrops,
      preferredLanguage: selectedLang,
      language: selectedLang,
      profilePhotoUrl: photoVal,
      photoURL: photoVal,
      createdAt: initialProfile?.createdAt || now,
      updatedAt: now,
      loginMethod: initialProfile?.loginMethod || 'phone',
      lastLogin: now,
      pincode,
      profileCompleted: true,
      role: initialProfile?.role || 'farmer',
      accountStatus: initialProfile?.accountStatus || 'active',

      // Preserve existing bank & KYC data if available
      bankName: initialProfile?.bankName || '',
      bankAccountNo: initialProfile?.bankAccountNo || '',
      ifscCode: initialProfile?.ifscCode || '',
      bankBranch: initialProfile?.bankBranch || '',
      aadhaarNumber: initialProfile?.aadhaarNumber || '',
      govtSchemesInterest: initialProfile?.govtSchemesInterest || [],
      machineryOwned: initialProfile?.machineryOwned || []
    };
  };

  // Submit Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setToastNotification(null);
    setIsSaving(true);

    try {
      const docToSave = getCurrentProfileDoc();

      // 10-second timeout guarantee
      const timeoutPromise = new Promise<UserProfileDoc & { _savedToCloud?: boolean }>((resolve) => {
        setTimeout(() => {
          console.warn('10-second timeout reached during profile save');
          const now = new Date().toISOString();
          resolve({
            ...docToSave,
            createdAt: initialProfile?.createdAt || now,
            updatedAt: now,
            _savedToCloud: false
          });
        }, 10000);
      });

      const savePromise = saveFarmerProfile(uid, docToSave);
      const savedResult = await Promise.race([savePromise, timeoutPromise]);

      if (savedResult._savedToCloud !== false) {
        setToastNotification({
          type: 'success',
          message: 'Profile saved successfully'
        });
      } else {
        setToastNotification({
          type: 'success',
          message: 'Saved locally. Cloud sync will retry later.'
        });
      }

      // Update global language context
      if (selectedLang) {
        setLanguage(selectedLang);
      }

      // Return updated profile to parent immediately
      if (onSaveSuccess) {
        setTimeout(() => {
          onSaveSuccess(savedResult);
        }, 400);
      }
    } catch (err: any) {
      console.error('Error saving profile in handleSaveProfile:', err);

      const fallbackDoc = getCurrentProfileDoc();
      try {
        localStorage.setItem(`agri_profile_${uid}`, JSON.stringify(fallbackDoc));
        localStorage.setItem('agri_user_profile', JSON.stringify(fallbackDoc));
      } catch (e) {
        console.warn('localStorage write error:', e);
      }

      setToastNotification({
        type: 'success',
        message: 'Saved locally. Cloud sync will retry later.'
      });

      if (onSaveSuccess) {
        setTimeout(() => {
          onSaveSuccess(fallbackDoc);
        }, 400);
      }
    } finally {
      setIsSaving(false);
      setIsUploadingPhoto(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 min-h-[350px]">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-600">Loading profile details...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 animate-fadeIn overflow-hidden">
      {/* Top Header matching Home mobile bar */}
      <div className="bg-emerald-800 text-white p-4 shadow-md flex items-center justify-between sticky top-0 z-20 shrink-0">
        <div className="flex items-center space-x-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 bg-emerald-700/60 hover:bg-emerald-700 rounded-xl transition-all cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          )}
          <div>
            <h2 className="text-base font-black tracking-tight text-white flex items-center space-x-1.5">
              <User className="w-5 h-5 text-yellow-300" />
              <span>Edit Farmer Profile</span>
            </h2>
            <p className="text-[11px] text-emerald-100 font-medium">
              Update personal & agricultural details
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 text-emerald-200 hover:text-white hover:bg-emerald-700 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Single Page Form */}
      <form onSubmit={handleSaveProfile} className="flex-1 p-3 sm:p-5 space-y-4">
        {toastNotification && (
          <div className={`p-3 rounded-2xl text-xs font-bold flex items-center space-x-2 ${
            toastNotification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-red-50 border border-red-200 text-red-900'
          }`}>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastNotification.message}</span>
          </div>
        )}

        {/* Card 1: Profile Photo Header */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col items-center justify-center text-center">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 p-1 shadow-lg shadow-emerald-200/50">
              {photoPreview && !hasPhotoError ? (
                <img
                  src={photoPreview}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover bg-white"
                  onError={() => setHasPhotoError(true)}
                />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <User className="w-10 h-10" />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleOpenCameraModal}
              className="absolute bottom-0 right-0 p-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-90 text-white rounded-full shadow-md cursor-pointer transition-transform"
              title="Take or Upload Profile Photo"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              id="photo-upload-input"
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>
          {isUploadingPhoto && (
            <p className="text-[10px] text-emerald-600 font-bold mt-2 animate-pulse">Compressing & saving photo...</p>
          )}
          <p className="text-[11px] font-bold text-slate-500 mt-2">Tap camera icon for live capture or upload</p>
        </div>

        {/* Live Camera Viewfinder Overlay Modal */}
        {showCameraModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
              {/* Modal Header */}
              <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-white font-bold text-sm">
                  <Camera className="w-5 h-5 text-emerald-400" />
                  <span>Live Camera Capture</span>
                </div>
                <button
                  type="button"
                  onClick={handleCloseCameraModal}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video Viewfinder Container */}
              <div className="relative bg-black w-full aspect-square sm:aspect-[4/3] flex items-center justify-center overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraFacingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />

                {/* Framing Oval/Circle Guide */}
                {!cameraError && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-52 h-52 sm:w-60 sm:h-60 rounded-full border-2 border-dashed border-emerald-400/80 shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                  </div>
                )}

                {/* Camera Opening Indicator */}
                {isStartingCamera && (
                  <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center text-emerald-400 space-y-2 z-10">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-xs font-semibold text-slate-300">Starting Camera...</span>
                  </div>
                )}

                {/* Camera Access Error Message */}
                {cameraError && (
                  <div className="absolute inset-x-4 top-4 p-4 bg-red-950/90 border border-red-800 rounded-2xl text-red-200 text-xs text-center space-y-3 z-10">
                    <div className="flex items-center justify-center space-x-2 text-red-400 font-bold text-sm">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span>Camera Access Issue</span>
                    </div>
                    <p className="leading-relaxed">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseCameraModal();
                        fileInputRef.current?.click();
                      }}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Photo File Instead</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Viewfinder Action Bar */}
              <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-around space-x-2">
                {/* Switch Rear / Front Camera */}
                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  disabled={isStartingCamera || !!cameraError}
                  className="p-3 bg-slate-800 hover:bg-slate-700 active:scale-90 text-slate-200 rounded-2xl transition-all disabled:opacity-40 cursor-pointer flex flex-col items-center text-[10px] space-y-1"
                  title="Switch Camera (Rear / Front)"
                >
                  <RefreshCw className="w-5 h-5 text-emerald-400" />
                  <span>Flip</span>
                </button>

                {/* Capture Photo Button */}
                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  disabled={isStartingCamera || !!cameraError}
                  className="p-4 bg-gradient-to-tr from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 active:scale-90 text-white rounded-full transition-all shadow-lg shadow-emerald-900/50 disabled:opacity-40 cursor-pointer border-4 border-slate-900"
                  title="Capture Photo"
                >
                  <Camera className="w-7 h-7" />
                </button>

                {/* Upload from Gallery / Storage */}
                <button
                  type="button"
                  onClick={() => {
                    handleCloseCameraModal();
                    fileInputRef.current?.click();
                  }}
                  className="p-3 bg-slate-800 hover:bg-slate-700 active:scale-90 text-slate-200 rounded-2xl transition-all cursor-pointer flex flex-col items-center text-[10px] space-y-1"
                  title="Upload from Gallery"
                >
                  <Upload className="w-5 h-5 text-emerald-400" />
                  <span>Gallery</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Card 2: Personal Information */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <User className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-800">Personal Details</h3>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Kumar"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1 flex items-center justify-between">
              <span>Mobile Number</span>
              <span className="text-[10px] text-slate-400 font-semibold flex items-center space-x-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Read Only</span>
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                readOnly
                disabled
                value={mobileNumber}
                className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-2.5 pl-9 pr-3 text-xs font-bold font-mono text-slate-500 cursor-not-allowed"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Gender</label>
              <div className="flex space-x-1.5">
                {['Male', 'Female', 'Other'].map((g) => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => setGender(g)}
                    className={`flex-1 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                      gender === g
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Date of Birth</label>
              <div className="relative">
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-9 pr-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Location & Language */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-800">Location & Language</h3>
          </div>

          {/* 1. Country Selector */}
          <div className="relative" ref={countryRef}>
            <label className="block text-xs font-extrabold text-slate-700 mb-1 flex items-center justify-between">
              <span>Country</span>
              <span className="text-[10px] text-emerald-700 font-semibold">{currentCountryInfo?.flag || '🌍'} {country}</span>
            </label>
            <button
              type="button"
              onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-3.5 text-xs font-bold text-slate-800 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <span className="flex items-center space-x-2">
                <span className="text-sm">{currentCountryInfo?.flag || '🌍'}</span>
                <span>{country}</span>
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {isCountryDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-56 overflow-y-auto p-2 space-y-1">
                <div className="relative mb-1">
                  <input
                    type="text"
                    placeholder="Search country..."
                    value={countrySearchQuery}
                    onChange={(e) => setCountrySearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-8 pr-3 text-xs font-medium focus:outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
                {filteredCountries.map((c) => (
                  <button
                    type="button"
                    key={c.code}
                    onClick={() => {
                      setCountry(c.name);
                      const firstState = c.states[0]?.name || '';
                      const firstDist = c.states[0]?.districts[0]?.name || '';
                      const firstSub = c.states[0]?.districts[0]?.subDistricts[0]?.name || '';
                      setState(firstState);
                      setDistrict(firstDist);
                      setSubDistrict(firstSub);
                      setVillage('');
                      setIsCountryDropdownOpen(false);
                      setCountrySearchQuery('');
                    }}
                    className={`w-full text-left py-2 px-3 rounded-xl text-xs font-bold hover:bg-emerald-50 hover:text-emerald-800 transition-colors flex items-center justify-between ${
                      country === c.name ? 'bg-emerald-100 text-emerald-900' : 'text-slate-700'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <span>{c.flag}</span>
                      <span>{c.name}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{c.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 2. State / Province Searchable Dropdown */}
            <div className="relative" ref={stateRef}>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">{adminTerms.state}</label>
              <button
                type="button"
                onClick={() => setIsStateDropdownOpen(!isStateDropdownOpen)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-3.5 text-xs font-bold text-slate-800 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <span>{state || `Select ${adminTerms.state}`}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {isStateDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-56 overflow-y-auto p-2 space-y-1">
                  <div className="relative mb-1">
                    <input
                      type="text"
                      placeholder={`Search ${adminTerms.state.toLowerCase()}...`}
                      value={stateSearchQuery}
                      onChange={(e) => setStateSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-8 pr-3 text-xs font-medium focus:outline-none"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                  {filteredStates.map((s) => (
                    <button
                      type="button"
                      key={s.name}
                      onClick={() => {
                        setState(s.name);
                        const firstDist = s.districts[0]?.name || '';
                        const firstSub = s.districts[0]?.subDistricts[0]?.name || '';
                        setDistrict(firstDist);
                        setSubDistrict(firstSub);
                        setIsStateDropdownOpen(false);
                        setStateSearchQuery('');
                      }}
                      className={`w-full text-left py-2 px-3 rounded-xl text-xs font-bold hover:bg-emerald-50 hover:text-emerald-800 transition-colors ${
                        state === s.name ? 'bg-emerald-100 text-emerald-900' : 'text-slate-700'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                  {filteredStates.length === 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setState(stateSearchQuery);
                        setIsStateDropdownOpen(false);
                      }}
                      className="w-full text-left py-2 px-3 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50"
                    >
                      + Use &quot;{stateSearchQuery}&quot;
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 3. District / County Searchable Dropdown */}
            <div className="relative" ref={districtRef}>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">{adminTerms.district}</label>
              <button
                type="button"
                onClick={() => setIsDistrictDropdownOpen(!isDistrictDropdownOpen)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-3.5 text-xs font-bold text-slate-800 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <span>{district || `Select ${adminTerms.district}`}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {isDistrictDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-56 overflow-y-auto p-2 space-y-1">
                  <div className="relative mb-1">
                    <input
                      type="text"
                      placeholder={`Search ${adminTerms.district.toLowerCase()}...`}
                      value={districtSearchQuery}
                      onChange={(e) => setDistrictSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-8 pr-3 text-xs font-medium focus:outline-none"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                  {filteredDistricts.map((d) => (
                    <button
                      type="button"
                      key={d.name}
                      onClick={() => {
                        setDistrict(d.name);
                        const firstSub = d.subDistricts[0]?.name || '';
                        setSubDistrict(firstSub);
                        setIsDistrictDropdownOpen(false);
                        setDistrictSearchQuery('');
                      }}
                      className={`w-full text-left py-2 px-3 rounded-xl text-xs font-bold hover:bg-emerald-50 hover:text-emerald-800 transition-colors ${
                        district === d.name ? 'bg-emerald-100 text-emerald-900' : 'text-slate-700'
                      }`}
                    >
                      {d.name}
                    </button>
                  ))}
                  {filteredDistricts.length === 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setDistrict(districtSearchQuery);
                        setIsDistrictDropdownOpen(false);
                      }}
                      className="w-full text-left py-2 px-3 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50"
                    >
                      + Use &quot;{districtSearchQuery}&quot;
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 4. Sub-District / Taluk Searchable Dropdown */}
            <div className="relative" ref={subDistrictRef}>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">{adminTerms.subDistrict}</label>
              <button
                type="button"
                onClick={() => setIsSubDistrictDropdownOpen(!isSubDistrictDropdownOpen)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-3.5 text-xs font-bold text-slate-800 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <span>{subDistrict || `Select or type ${adminTerms.subDistrict}`}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {isSubDistrictDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-56 overflow-y-auto p-2 space-y-1">
                  <div className="relative mb-1">
                    <input
                      type="text"
                      placeholder={`Search or type ${adminTerms.subDistrict.toLowerCase()}...`}
                      value={subDistrictSearchQuery}
                      onChange={(e) => setSubDistrictSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-8 pr-3 text-xs font-medium focus:outline-none"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                  {filteredSubDistricts.map((sd) => (
                    <button
                      type="button"
                      key={sd.name}
                      onClick={() => {
                        setSubDistrict(sd.name);
                        setIsSubDistrictDropdownOpen(false);
                        setSubDistrictSearchQuery('');
                      }}
                      className={`w-full text-left py-2 px-3 rounded-xl text-xs font-bold hover:bg-emerald-50 hover:text-emerald-800 transition-colors ${
                        subDistrict === sd.name ? 'bg-emerald-100 text-emerald-900' : 'text-slate-700'
                      }`}
                    >
                      {sd.name}
                    </button>
                  ))}
                  {subDistrictSearchQuery.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setSubDistrict(subDistrictSearchQuery.trim());
                        setIsSubDistrictDropdownOpen(false);
                      }}
                      className="w-full text-left py-2 px-3 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50"
                    >
                      + Use &quot;{subDistrictSearchQuery}&quot;
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 5. Village / City / Locality Input with Quick Suggestions */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">{adminTerms.village}</label>
              <input
                type="text"
                placeholder={`e.g. ${availableVillages[0] || 'Local town or village'}`}
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
              {availableVillages.length > 0 && !village && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {availableVillages.slice(0, 3).map((v) => (
                    <button
                      type="button"
                      key={v}
                      onClick={() => setVillage(v)}
                      className="text-[10px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 px-2 py-0.5 rounded-lg font-medium transition-colors"
                    >
                      + {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">{adminTerms.postalCode || 'Postal / PIN Code'}</label>
            <input
              type="text"
              maxLength={10}
              placeholder="e.g. 562101 or 90210"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-3.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          {/* Preferred Language */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center space-x-1">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>App Language</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {LANGUAGES.map((lang) => (
                <button
                  type="button"
                  key={lang.code}
                  onClick={() => {
                    setSelectedLang(lang.code);
                    setLanguage(lang.code);
                  }}
                  className={`py-2 px-1 rounded-xl text-center border transition-all cursor-pointer ${
                    selectedLang === lang.code
                      ? 'bg-emerald-600 text-white border-emerald-600 font-black shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 font-bold'
                  }`}
                >
                  <p className="text-[11px] leading-tight">{lang.native}</p>
                  <span className={`text-[8px] block opacity-70 ${selectedLang === lang.code ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {lang.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Card 4: Farm & Agriculture Details */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Sprout className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-800">Farm & Agriculture Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Farm Name
              </label>
              <input
                type="text"
                placeholder="e.g. Green Valley Farm"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Farm Size (Acres)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="500"
                placeholder="e.g. 2.5"
                value={farmSize}
                onChange={(e) => setFarmSize(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-3.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Farming Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Conventional', 'Organic', 'Mixed'].map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setFarmingType(type)}
                  className={`py-2 px-2 rounded-xl text-xs font-extrabold border text-center transition-all ${
                    farmingType === type
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Crops Multi-select */}
          <div className="relative" ref={cropRef}>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Primary Crops Grown
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {primaryCrops.map((crop) => (
                <span
                  key={crop}
                  className="bg-emerald-100 text-emerald-900 font-black text-[11px] px-2.5 py-1 rounded-xl flex items-center space-x-1 shadow-2xs"
                >
                  <span>{crop}</span>
                  <button
                    type="button"
                    onClick={() => removeCrop(crop)}
                    className="text-emerald-700 hover:text-red-600 transition-colors ml-1 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => setIsCropDropdownOpen(!isCropDropdownOpen)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>Add Crop</span>
              </button>
            </div>

            {isCropDropdownOpen && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-30 max-h-56 overflow-y-auto space-y-1">
                <div className="relative mb-1">
                  <input
                    type="text"
                    placeholder="Search crops..."
                    value={cropSearchQuery}
                    onChange={(e) => setCropSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-8 pr-3 text-xs font-medium focus:outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
                {filteredCrops.map((cropName) => (
                  <button
                    type="button"
                    key={cropName}
                    onClick={() => addCrop(cropName)}
                    className="w-full text-left py-2 px-3 rounded-xl text-xs font-bold hover:bg-emerald-50 hover:text-emerald-800 transition-colors flex justify-between items-center cursor-pointer"
                  >
                    <span>{cropName}</span>
                    {primaryCrops.includes(cropName) && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Soil Type */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Soil Type</label>
            <div className="grid grid-cols-2 gap-1.5">
              {SOIL_TYPES.slice(0, 6).map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setSoilType(st)}
                  className={`py-2 px-2.5 rounded-xl text-[11px] font-extrabold text-left border transition-all cursor-pointer ${
                    soilType === st
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Water Source */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Water Source</label>
            <div className="grid grid-cols-2 gap-1.5">
              {WATER_SOURCES.map((ws) => (
                <button
                  type="button"
                  key={ws}
                  onClick={() => setWaterSource(ws)}
                  className={`py-2 px-2.5 rounded-xl text-[11px] font-extrabold text-left border transition-all cursor-pointer ${
                    waterSource === ws
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {ws}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Space for fixed bottom bar */}
        <div className="h-16" />
      </form>

      {/* Fixed Sticky Bottom Bar - Requirement 6 */}
      <div className="bg-white/95 backdrop-blur-md p-4 border-t border-slate-200/80 shadow-lg sticky bottom-0 z-20 shrink-0 flex items-center space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="py-3 px-5 border border-slate-200 text-slate-600 font-extrabold text-xs rounded-2xl hover:bg-slate-50 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
        )}

        <button
          type="button"
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="flex-1 py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Saving Profile...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-yellow-300" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
