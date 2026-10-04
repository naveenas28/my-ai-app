import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CloudRain,
  MapPin,
  AlertTriangle,
  Wind,
  Droplets,
  Sun,
  Volume2,
  VolumeX,
  CheckCircle,
  RefreshCw,
  Compass,
  ShieldAlert,
  Search,
  Eye,
  Thermometer,
  Gauge,
  Sunrise,
  Sunset,
  ArrowUp,
  ArrowDown,
  Info,
  Calendar,
  Clock,
  Navigation,
  WifiOff,
  ChevronLeft,
  ChevronRight,
  Star,
  Trash2,
  X
} from 'lucide-react';
import { LanguageCode } from '../types';
import { useI18n } from '../context/I18nContext';
import {
  LiveWeatherData,
  LocationCoords,
  SevereWeatherAlert,
  FarmingRecommendation,
  getWMOWeatherInfo
} from '../types/weather';
import {
  searchLocations,
  reverseGeocode,
  saveRecentSearch,
  getRecentSearches,
  clearRecentSearches,
  getSavedLocations,
  toggleSavedLocation,
  isLocationSaved,
  removeSavedLocation,
  formatTime12h
} from '../services/weatherService';
import {
  getWeatherForLocation,
  saveUserWeatherLocationInFirestore,
  getUserWeatherLocationFromFirestore,
  saveWeatherSnapshotToFirestore
} from '../services/weatherRepository';
import { auth } from '../firebase';

function getRelativeTime(timestampMs?: number): string {
  if (!timestampMs) return 'recently';
  const diffMinutes = Math.max(0, Math.floor((Date.now() - timestampMs) / 60000));
  if (diffMinutes === 0) return 'just now';
  if (diffMinutes === 1) return '1 min ago';
  return `${diffMinutes} min ago`;
}

interface WeatherIntelligenceProps {
  currentLang?: LanguageCode;
  onClose: () => void;
  triggerToast: (msg: string) => void;
  uid?: string;
}

export const WeatherIntelligence: React.FC<WeatherIntelligenceProps> = ({
  currentLang,
  onClose,
  triggerToast,
  uid
}) => {
  const activeUid = uid || auth.currentUser?.uid || localStorage.getItem('agri_user_uid') || 'guest';
  const { language } = useI18n();
  const activeLang = language || currentLang || 'en';

  // State management
  const [weatherData, setWeatherData] = useState<LiveWeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Location state
  const [currentLocation, setCurrentLocation] = useState<LocationCoords>({
    lat: 13.4355,
    lon: 77.7279,
    name: 'Chikkaballapura, Karnataka, India'
  });

  // Location search, saved favorites & recent searches states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<LocationCoords[]>([]);
  const [recentSearches, setRecentSearches] = useState<LocationCoords[]>([]);
  const [savedLocations, setSavedLocations] = useState<LocationCoords[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

  // GPS & Permission states
  const [isGpsDetecting, setIsGpsDetecting] = useState<boolean>(false);
  const [isGpsSuccess, setIsGpsSuccess] = useState<boolean>(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState<boolean>(false);
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false);
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);

  // Text to Speech states
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Tab selections inside weather hub
  const [activeTab, setActiveTab] = useState<'overview' | 'hourly' | 'daily' | 'alerts' | 'advisory'>('overview');

  // Horizontal scroll refs for 24H Micro Forecast and Mandi Hubs carousels
  const hourlyScrollRef = useRef<HTMLDivElement>(null);
  const mandiScrollRef = useRef<HTMLDivElement>(null);

  const scrollHourly = (direction: 'left' | 'right') => {
    if (hourlyScrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      hourlyScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollMandi = (direction: 'left' | 'right') => {
    if (mandiScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      mandiScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Load weather data for a specific location
  const loadWeather = useCallback(async (
    lat: number,
    lon: number,
    customName?: string,
    forceRefresh: boolean = false
  ) => {
    setIsRefreshing(true);
    if (!weatherData) setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await getWeatherForLocation(lat, lon, customName, forceRefresh);
      setWeatherData(data);
      setCurrentLocation(data.location);

      // Save to localStorage for instant recovery across app reopens
      try {
        localStorage.setItem('agri_last_weather_loc', JSON.stringify(data.location));
      } catch (e) {
        console.warn('Unable to save location to localStorage:', e);
      }

      // Persist in Firestore for logged in user
      saveUserWeatherLocationInFirestore(activeUid, data.location);
      saveWeatherSnapshotToFirestore(activeUid, data);

      if (data.isOfflineData) {
        triggerToast('Using offline cached weather data. Connect to internet for live updates.');
      }
    } catch (err: any) {
      console.error('Weather load error:', err);
      setErrorMessage(err?.message || 'Failed to connect to live weather server.');
      triggerToast('Unable to fetch live weather. Please check your internet connection.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeUid, triggerToast, weatherData]);

  // Request location permission & handle GPS detection with fallback
  const handleDetectGps = useCallback((forceAskPermission: boolean = false) => {
    setGpsErrorMsg(null);
    if (!navigator.geolocation) {
      const msg = 'GPS Geolocation is not supported by your mobile browser or device.';
      setGpsErrorMsg(msg);
      setLocationPermissionDenied(true);
      triggerToast(msg);
      return;
    }

    setIsGpsDetecting(true);
    triggerToast('Acquiring sat-link GPS coordinates...');

    const isIframePreview = typeof window !== 'undefined' && (
      window.self !== window.top ||
      window.location.hostname.includes('ais-dev') ||
      window.location.hostname.includes('ais-pre') ||
      window.location.hostname.includes('ai.studio')
    );

    const onGpsSuccess = async (pos: GeolocationPosition) => {
      try {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        localStorage.setItem('agri_location_perm_asked', 'granted');
        setLocationPermissionDenied(false);
        setShowPermissionModal(false);
        setGpsErrorMsg(null);

        // Reverse geocode lat/lon into Village, Taluk, District, State, Country
        const geoName = await reverseGeocode(lat, lon);
        await loadWeather(lat, lon, geoName, true);
        setIsGpsSuccess(true);
        triggerToast(`Location detected: ${geoName}`);
        setTimeout(() => {
          setIsGpsSuccess(false);
        }, 3500);
      } catch (err: any) {
        console.error('Error handling GPS position:', err);
        triggerToast('Error processing GPS coordinates.');
      } finally {
        setIsGpsDetecting(false);
      }
    };

    const handleGpsFailure = (err: GeolocationPositionError) => {
      console.warn('GPS location error:', err);
      setIsGpsDetecting(false);
      localStorage.setItem('agri_location_perm_asked', 'denied');
      setLocationPermissionDenied(true);

      if (isIframePreview && (err.code === err.PERMISSION_DENIED || err.code === err.POSITION_UNAVAILABLE)) {
        const previewMsg = "GPS is unavailable in preview mode. Please test in the deployed app or use manual search.";
        setGpsErrorMsg(previewMsg);
        triggerToast(previewMsg);
      } else {
        let userMsg = 'Location permission denied or GPS unavailable.';
        if (err.code === err.PERMISSION_DENIED) {
          userMsg = 'Location permission denied. Please allow location access in browser/app settings.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          userMsg = 'GPS location unavailable. Please ensure device location services are turned on.';
        } else if (err.code === err.TIMEOUT) {
          userMsg = 'GPS location request timed out. Please retry or search your village manually.';
        }
        setGpsErrorMsg(userMsg);
        triggerToast(userMsg);
      }
    };

    // Primary attempt with high accuracy
    navigator.geolocation.getCurrentPosition(
      onGpsSuccess,
      (err) => {
        // Fallback retry with enableHighAccuracy: false if high accuracy timed out or failed
        if (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE) {
          navigator.geolocation.getCurrentPosition(
            onGpsSuccess,
            handleGpsFailure,
            { timeout: 15000, enableHighAccuracy: false, maximumAge: 60000 }
          );
        } else {
          handleGpsFailure(err);
        }
      },
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 0 }
    );
  }, [loadWeather, triggerToast]);

  // Initial load effect: Restore location from Firestore / localStorage or check permission
  useEffect(() => {
    let isMounted = true;

    const initializeWeatherLocation = async () => {
      // 1. Try loading user's saved location from Firestore
      const savedLoc = await getUserWeatherLocationFromFirestore(activeUid);
      if (isMounted && savedLoc) {
        setCurrentLocation(savedLoc);
        await loadWeather(savedLoc.lat, savedLoc.lon, savedLoc.name);
        return;
      }

      // 2. Try loading last saved location from localStorage
      try {
        const localLocStr = localStorage.getItem('agri_last_weather_loc');
        if (localLocStr) {
          const localLoc = JSON.parse(localLocStr);
          if (localLoc?.lat && localLoc?.lon && isMounted) {
            setCurrentLocation(localLoc);
            await loadWeather(localLoc.lat, localLoc.lon, localLoc.name);
            return;
          }
        }
      } catch (e) {
        console.warn('Error reading local location cache:', e);
      }

      // Load cached recent searches and saved favorite locations
      const savedRecents = getRecentSearches();
      setRecentSearches(savedRecents);
      const savedFavs = getSavedLocations();
      setSavedLocations(savedFavs);

      // 3. Check permission status -> Show permission modal or auto-detect
      const permStatus = localStorage.getItem('agri_location_perm_asked');
      if (!permStatus) {
        setShowPermissionModal(true);
        // Default initial weather fetch
        await loadWeather(13.4355, 77.7279, 'Chikkaballapura, Karnataka, India');
      } else if (permStatus === 'granted') {
        handleDetectGps(false);
      } else {
        // Permission was denied -> load default location
        await loadWeather(13.4355, 77.7279, 'Chikkaballapura, Karnataka, India');
      }
    };

    initializeWeatherLocation();

    return () => {
      isMounted = false;
    };
  }, [activeUid]);

  // Auto-refresh interval (every 30 minutes) & Window focus listener
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (currentLocation) {
        loadWeather(currentLocation.lat, currentLocation.lon, currentLocation.name, true);
      }
    }, 30 * 60 * 1000); // 30 minutes

    const handleWindowFocus = () => {
      if (currentLocation) {
        loadWeather(currentLocation.lat, currentLocation.lon, currentLocation.name, false);
      }
    };

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [currentLocation, loadWeather]);

  // Handle worldwide location search debounced
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchLocations(searchQuery, currentLocation);
      setSearchResults(results);
      setIsSearching(false);
      setShowSearchResults(true);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Select location from search or recent list
  const handleSelectLocation = async (loc: LocationCoords) => {
    setSearchQuery('');
    setShowSearchResults(false);
    saveRecentSearch(loc);
    setRecentSearches(getRecentSearches());
    setCurrentLocation(loc);
    setGpsErrorMsg(null);
    setLocationPermissionDenied(false);
    triggerToast(`Location updated: ${loc.name.split(',')[0]}`);
    await loadWeather(loc.lat, loc.lon, loc.name, true);
  };

  // Toggle saving/favoriting a location
  const handleToggleSaveLocation = (loc: LocationCoords, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isSaved = toggleSavedLocation(loc);
    const updated = getSavedLocations();
    setSavedLocations(updated);
    if (isSaved) {
      triggerToast(`⭐ Saved location: ${loc.name.split(',')[0]}`);
    } else {
      triggerToast(`Removed from saved locations`);
    }
  };

  // Delete an individual saved location
  const handleDeleteSavedLocation = (loc: LocationCoords, e: React.MouseEvent) => {
    e.stopPropagation();
    removeSavedLocation(loc);
    const updated = getSavedLocations();
    setSavedLocations(updated);
    triggerToast(`Deleted saved location`);
  };

  // Clear all recent search history
  const handleClearRecentSearches = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    clearRecentSearches();
    setRecentSearches([]);
    triggerToast(`Recent search history cleared`);
  };

  // Voice Narration handler using Web Speech Synthesis API
  const handleVoiceNarration = useCallback(() => {
    if (!('speechSynthesis' in window)) {
      triggerToast('Audio Voice Synthesizer not supported on this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!weatherData) return;

    // Generate language-specific speech text
    let speakText = '';
    let utterLang = 'en-IN';

    if (activeLang === 'kn') {
      utterLang = 'kn-IN';
      speakText = `ಅಗ್ರಿವರ್ಸ್ ಹವಾಮಾನ ವರದಿ: ${weatherData.location.name}. ಪ್ರಸ್ತುತ ತಾಪಮಾನ ${weatherData.temperature} ಡಿಗ್ರಿ ಸೆಲ್ಸಿಯಸ್, ಅನುಭವವಾಗುವ ತಾಪಮಾನ ${weatherData.feelsLike} ಡಿಗ್ರಿ. ಹವಾಮಾನ ಪರಿಸ್ಥಿತಿ: ${weatherData.condition}. ಗಾಳಿಯ ಆರ್ದ್ರತೆ ${weatherData.humidity} ಶೇಕಡಾ. ಮಳೆಯ ಸಾಧ್ಯತೆ ${weatherData.rainfallChance} ಶೇಕಡಾ. ಗಾಳಿಯ ವೇಗ ಗಂಟೆಗೆ ${weatherData.windSpeed} ಕಿಲೋಮೀಟರ್.`;
    } else if (activeLang === 'hi') {
      utterLang = 'hi-IN';
      speakText = `एग्रीवर्स मौसम रिपोर्ट: ${weatherData.location.name}। वर्तमान तापमान ${weatherData.temperature} डिग्री सेल्सियस है, महसूस होने वाला तापमान ${weatherData.feelsLike} डिग्री है। स्थिति: ${weatherData.condition}। हवा में आर्द्रता ${weatherData.humidity} प्रतिशत है। बारिश की संभावना ${weatherData.rainfallChance} प्रतिशत है। हवा की गति ${weatherData.windSpeed} किलोमीटर प्रति घंटा है।`;
    } else if (activeLang === 'ta') {
      utterLang = 'ta-IN';
      speakText = `அக்ரிவெர்ஸ் வானிலை அறிக்கை: ${weatherData.location.name}. தற்போதைய வெப்பநிலை ${weatherData.temperature} டிகிரி செல்சியஸ். வானிலை நிலை: ${weatherData.condition}. ஈரப்பதம் ${weatherData.humidity} சதவீதம். மழை வாய்ப்பு ${weatherData.rainfallChance} சதவீதம். காற்றின் வேகம் மணிக்கு ${weatherData.windSpeed} கிலோமீட்டர்.`;
    } else if (activeLang === 'te') {
      utterLang = 'te-IN';
      speakText = `అగ్రివర్స్ వాతావరణ నివేదిక: ${weatherData.location.name}. ప్రస్తుత ఉష్ణోగ్రత ${weatherData.temperature} డిగ్రీల సెల్సియస్. వాతావరణ పరిస్థితి: ${weatherData.condition}. తేమ ${weatherData.humidity} శాతం. వర్షం సంభావ్యత ${weatherData.rainfallChance} శాతం. గాలి వేగం గంటకు ${weatherData.windSpeed} కిలోమీటర్లు.`;
    } else if (activeLang === 'ml') {
      utterLang = 'ml-IN';
      speakText = `അഗ്രിവേഴ്സ് കാലാവസ്ഥാ റിപ്പോർട്ട്: ${weatherData.location.name}. നിലവിലെ താപനില ${weatherData.temperature} ഡിഗ്രി സെൽഷ്യസ്. മഴ സാധ്യത ${weatherData.rainfallChance} ശതമാനം.`;
    } else {
      utterLang = 'en-IN';
      const topRec = weatherData.recommendations[0]?.advice || '';
      speakText = `AgriVerse Weather Report for ${weatherData.location.name}. Current temperature is ${weatherData.temperature} degrees Celsius, feels like ${weatherData.feelsLike} degrees. Weather condition is ${weatherData.condition}. Relative humidity is ${weatherData.humidity} percent, wind speed is ${weatherData.windSpeed} kilometers per hour. Rainfall probability is ${weatherData.rainfallChance} percent. Primary farming advice: ${topRec}`;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(speakText);

    // Pick localized voice if available
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang === utterLang || v.lang.startsWith(activeLang));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.lang = utterLang;
    utterance.rate = 0.92;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [activeLang, weatherData, isSpeaking, triggerToast]);

  // Switch TTS language automatically when active language changes
  useEffect(() => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setTimeout(() => {
        handleVoiceNarration();
      }, 300);
    }
  }, [activeLang]);

  // Component unmount safeguards to avoid speech leakage
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Helper to render weather icon dynamically
  const renderWeatherIcon = (code: number, sizeClass: string = 'w-6 h-6') => {
    const info = getWMOWeatherInfo(code);
    switch (info.iconType) {
      case 'sun':
        return <Sun className={`${sizeClass} text-amber-500 animate-spin-slow`} />;
      case 'cloud':
        return <CloudRain className={`${sizeClass} text-slate-400`} />;
      case 'rain':
      case 'drizzle':
        return <CloudRain className={`${sizeClass} text-blue-500 animate-bounce`} />;
      case 'thunderstorm':
        return <AlertTriangle className={`${sizeClass} text-amber-600 animate-pulse`} />;
      case 'fog':
        return <Eye className={`${sizeClass} text-slate-400`} />;
      case 'wind':
        return <Wind className={`${sizeClass} text-teal-500`} />;
      default:
        return <Sun className={`${sizeClass} text-amber-500`} />;
    }
  };

  return (
    <div className="relative w-full flex-1 flex flex-col bg-slate-50 animate-slideUp max-w-full">
      
      {/* Location Permission Modal (Asked once) */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl border border-slate-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Navigation className="w-8 h-8 animate-bounce" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Enable Precise Farm Weather</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1.5">
                AgriVerse uses your device GPS to fetch exact hyper-local weather, micro-climate rainfall alerts, and crop spraying guidelines for your specific agricultural field.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setShowPermissionModal(false);
                  handleDetectGps(true);
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-extrabold uppercase tracking-wider rounded-2xl shadow-md transition-all cursor-pointer"
              >
                Allow GPS Location Access
              </button>
              <button
                onClick={() => {
                  setShowPermissionModal(false);
                  localStorage.setItem('agri_location_perm_asked', 'denied');
                  setLocationPermissionDenied(true);
                  triggerToast('Location permission skipped. You can manually select any district or city.');
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-2xl cursor-pointer"
              >
                Enter Location Manually
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header bar */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-indigo-900 text-white px-4 py-3 sticky top-0 z-30 flex justify-between items-center shadow-md select-none w-full shrink-0">
        <div className="flex items-center space-x-2.5 min-w-0 flex-1 mr-2">
          <div className="bg-white/10 p-2 rounded-2xl border border-white/20 shrink-0">
            <CloudRain className="w-5 h-5 text-blue-300 animate-bounce" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1.5 flex-wrap">
              <span className="text-[9px] font-black tracking-widest text-emerald-300 uppercase">Live Weather System</span>
              {weatherData?.isOfflineData && (
                <span className="bg-amber-500/30 text-amber-300 text-[8px] font-extrabold px-2 py-0.5 rounded-full flex items-center space-x-1 border border-amber-400/40">
                  <WifiOff className="w-2.5 h-2.5" />
                  <span>Cached</span>
                </span>
              )}
            </div>
            <h1 className="text-sm sm:text-base font-black tracking-tight leading-snug text-white break-words line-clamp-2">
              {currentLocation.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Save / Favorite Active Location Button */}
          <button
            onClick={(e) => handleToggleSaveLocation(currentLocation, e)}
            className={`px-3 py-1.5 rounded-2xl text-[11px] font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer border active:scale-95 ${
              savedLocations.some(item => Math.abs(item.lat - currentLocation.lat) < 0.001 && Math.abs(item.lon - currentLocation.lon) < 0.001)
                ? 'bg-amber-400 text-amber-950 border-amber-300 shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
            }`}
            title={
              savedLocations.some(item => Math.abs(item.lat - currentLocation.lat) < 0.001 && Math.abs(item.lon - currentLocation.lon) < 0.001)
                ? 'Remove from saved favorite locations'
                : 'Save location to favorites'
            }
          >
            <Star className={`w-3.5 h-3.5 ${
              savedLocations.some(item => Math.abs(item.lat - currentLocation.lat) < 0.001 && Math.abs(item.lon - currentLocation.lon) < 0.001)
                ? 'fill-amber-950 text-amber-950'
                : 'text-white'
            }`} />
            <span className="hidden sm:inline">
              {savedLocations.some(item => Math.abs(item.lat - currentLocation.lat) < 0.001 && Math.abs(item.lon - currentLocation.lon) < 0.001)
                ? 'Saved ⭐'
                : 'Save Location'}
            </span>
          </button>

          {/* TTS Voice Narration Button */}
          <button
            onClick={handleVoiceNarration}
            className={`p-2 rounded-2xl border transition-all cursor-pointer ${
              isSpeaking
                ? 'bg-amber-400 text-amber-950 border-amber-300 animate-pulse'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
            }`}
            title={isSpeaking ? 'Mute voice advisor' : 'Listen voice weather report'}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-black uppercase tracking-wider py-2 px-3 rounded-2xl border border-white/20 cursor-pointer text-white"
          >
            Close
          </button>
        </div>
      </div>

      {/* Main Container - Centered layout with 16px padding on all devices */}
      <div className="w-full max-w-md sm:max-w-lg mx-auto px-4 py-4 space-y-4 pb-28 box-border">

        {/* Worldwide Search & Location Console */}
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xl shadow-slate-100/50 space-y-3 relative w-full box-border">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-emerald-600 animate-ping shrink-0" />
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Field Location Scope</span>
            </div>

            <button
              type="button"
              onClick={() => handleDetectGps(true)}
              disabled={isGpsDetecting}
              className={`py-1.5 px-3 rounded-full text-[10px] font-extrabold flex items-center space-x-1.5 border cursor-pointer disabled:opacity-60 transition-all shrink-0 active:scale-95 ${
                isGpsSuccess
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : isGpsDetecting
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200/80'
              }`}
            >
              {isGpsDetecting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-700" />
                  <span>Detecting location...</span>
                </>
              ) : isGpsSuccess ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                  <span>Location detected</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Auto GPS Location</span>
                </>
              )}
            </button>
          </div>

          {/* GPS Error or Preview Notice Banner */}
          {gpsErrorMsg && (
            <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3 text-xs text-amber-950 flex items-start space-x-2 shadow-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-amber-950">{gpsErrorMsg}</p>
                <p className="text-[10px] text-amber-800 font-medium mt-0.5">
                  Manual search is available below. Search by village, district, or PIN code.
                </p>
              </div>
            </div>
          )}

          {/* Location Search Bar */}
          <div className="relative w-full">
            <div className="relative flex items-center w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowSearchResults(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                placeholder="Search village, Panchayat, Hobli, PIN, or lat,lon..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-9 pr-8 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-emerald-500 transition-all placeholder:text-[11px] placeholder:text-slate-400"
              />
              {isSearching && (
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin absolute right-3" />
              )}
            </div>

            {/* Live Global Geocoding Search Results / Recent & Saved Dropdown */}
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100">
                {/* 1. Searching indicator */}
                {isSearching && (
                  <div className="p-3 text-center text-xs text-slate-500 font-medium flex items-center justify-center space-x-2">
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                    <span>Searching live global geocoding index...</span>
                  </div>
                )}

                {/* 2. Live search results */}
                {!isSearching && searchQuery.trim().length >= 2 && searchResults.length > 0 && (
                  <>
                    <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider flex justify-between items-center">
                      <span>Global Geocoding Results ({searchResults.length})</span>
                      <span className="text-[9px] text-emerald-600 font-extrabold">OpenStreetMap</span>
                    </div>
                    {searchResults.map((res, idx) => {
                      const isItemSaved = savedLocations.some(s => Math.abs(s.lat - res.lat) < 0.001 && Math.abs(s.lon - res.lon) < 0.001);
                      return (
                        <div
                          key={idx}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectLocation(res);
                          }}
                          className="p-3 hover:bg-emerald-50/80 cursor-pointer transition-colors text-xs text-slate-800 flex justify-between items-center gap-2 group"
                        >
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <p className="font-extrabold text-slate-900 group-hover:text-emerald-900 break-words leading-tight">
                              {res.name}
                            </p>
                            <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                              <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-mono font-bold">
                                {res.lat.toFixed(3)}°, {res.lon.toFixed(3)}°
                              </span>
                              {res.state && <span>{res.state}</span>}
                              {res.country && <span>{res.country}</span>}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1.5 shrink-0">
                            <button
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleToggleSaveLocation(res, e);
                              }}
                              className={`p-1.5 rounded-full border transition-all ${
                                isItemSaved
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-slate-100 hover:bg-amber-50 text-slate-400 hover:text-amber-600 border-slate-200'
                              }`}
                              title={isItemSaved ? 'Saved in favorites' : 'Save location'}
                            >
                              <Star className={`w-3.5 h-3.5 ${isItemSaved ? 'fill-amber-600 text-amber-600' : ''}`} />
                            </button>
                            <span className="text-[9px] bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-600 px-2.5 py-1 rounded-full font-extrabold transition-colors">
                              Select
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* 3. No results state */}
                {!isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                  <div className="p-4 text-center space-y-1 text-xs text-slate-600">
                    <p className="font-bold text-slate-800">No matching place found for "{searchQuery}"</p>
                    <p className="text-[11px] text-slate-500">
                      Try typing a village, Gram Panchayat, Hobli, PIN code, or exact coordinates (e.g. <span className="font-mono text-emerald-700 font-bold">13.4355, 77.7279</span>).
                    </p>
                  </div>
                )}

                {/* 4. Saved Favorite Locations (when query is empty) */}
                {searchQuery.trim().length < 2 && (
                  <>
                    <div className="px-3 py-1.5 bg-amber-50/80 text-[10px] font-black uppercase text-amber-900 tracking-wider flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-amber-600 fill-amber-500" />
                        <span>Saved Favorite Locations ({savedLocations.length})</span>
                      </div>
                      <span className="text-[9px] text-amber-700 font-semibold">Explicitly Favorited</span>
                    </div>

                    {savedLocations.length > 0 ? (
                      savedLocations.map((res, idx) => (
                        <div
                          key={`fav-${idx}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectLocation(res);
                          }}
                          className="p-3 hover:bg-amber-50/60 cursor-pointer transition-colors text-xs text-slate-800 flex justify-between items-center gap-2 group"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-extrabold text-slate-900 group-hover:text-amber-900 truncate">
                              ⭐ {res.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {res.lat.toFixed(3)}°, {res.lon.toFixed(3)}°
                            </p>
                          </div>
                          <div className="flex items-center space-x-1 shrink-0">
                            <span className="text-[9px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                              Switch
                            </span>
                            <button
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleDeleteSavedLocation(res, e);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete saved location"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-[11px] text-slate-400">
                        No saved locations yet. Tap <span className="font-bold text-amber-700">"⭐ Save Location"</span> on any active field to bookmark it!
                      </div>
                    )}

                    {/* 5. Recent Search History (when query is empty) */}
                    <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Recent Search History ({recentSearches.length}/10)</span>
                      </div>
                      {recentSearches.length > 0 && (
                        <button
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleClearRecentSearches(e);
                          }}
                          className="text-[9px] text-rose-600 hover:text-rose-800 font-bold px-1.5 py-0.5 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          Clear History
                        </button>
                      )}
                    </div>

                    {recentSearches.length > 0 ? (
                      recentSearches.map((res, idx) => (
                        <div
                          key={`rec-${idx}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectLocation(res);
                          }}
                          className="p-3 hover:bg-emerald-50/80 cursor-pointer transition-colors text-xs text-slate-800 flex justify-between items-center gap-2 group"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900 group-hover:text-emerald-900 truncate">
                              {res.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {res.lat.toFixed(3)}°, {res.lon.toFixed(3)}°
                            </p>
                          </div>
                          <span className="text-[9px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-bold shrink-0">
                            Switch
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-[11px] text-slate-400">
                        No recent searches history.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* GPS Error & Preview Status Banner */}
          {gpsErrorMsg && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 flex items-start space-x-2.5 text-amber-900 text-xs animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-bold leading-relaxed">{gpsErrorMsg}</p>
                <div className="flex items-center space-x-2 mt-2 flex-wrap gap-2">
                  <button
                    onClick={() => handleDetectGps(true)}
                    className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white px-3 py-1 rounded-xl font-extrabold text-[11px] flex items-center space-x-1 cursor-pointer transition-all shadow-sm shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry Auto GPS</span>
                  </button>
                  <span className="text-[10px] text-amber-700 font-semibold">or search your village above</span>
                </div>
              </div>
            </div>
          )}

          {/* Saved Favorite Locations Chips Row */}
          {savedLocations.length > 0 && (
            <div className="w-full min-w-0 space-y-1.5 pt-1">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center space-x-1 text-amber-800">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-600" />
                  <span className="block text-[9px] font-black uppercase tracking-widest min-w-0 truncate">
                    Saved Favorites ({savedLocations.length})
                  </span>
                </div>
              </div>

              <div className="flex space-x-2 overflow-x-auto pb-1 pt-0.5 px-0.5 touch-pan-x scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-full max-w-full">
                {savedLocations.map((loc, idx) => {
                  const displayName = loc.name.split(',')[0] || loc.name;
                  const isSelected = currentLocation.name === loc.name || Math.abs(currentLocation.lat - loc.lat) < 0.001;
                  return (
                    <div
                      key={`chip-fav-${loc.lat}-${loc.lon}-${idx}`}
                      onClick={() => handleSelectLocation(loc)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border shrink-0 cursor-pointer active:scale-95 flex items-center space-x-1.5 ${
                        isSelected
                          ? 'bg-amber-500 text-amber-950 border-amber-500 shadow-sm'
                          : 'bg-amber-50/60 text-amber-900 border-amber-200/80 hover:bg-amber-100'
                      }`}
                    >
                      <span>⭐ {displayName}</span>
                      <button
                        onClick={(e) => handleDeleteSavedLocation(loc, e)}
                        className="p-0.5 hover:bg-amber-200/80 rounded-full text-amber-900 transition-colors"
                        title="Delete saved location"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Search History Chips Carousel */}
          <div className="w-full min-w-0 space-y-1.5 pt-1 border-t border-slate-100">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center space-x-1 text-slate-500">
                <Clock className="w-3 h-3 text-slate-400" />
                <span className="block text-[9px] font-black uppercase tracking-widest min-w-0 truncate">
                  Recent Searches ({recentSearches.length}/10)
                </span>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0">
                {recentSearches.length > 0 && (
                  <button
                    onClick={handleClearRecentSearches}
                    className="text-[9px] font-extrabold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                  >
                    Clear History
                  </button>
                )}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => scrollMandi('left')}
                    className="p-1 rounded-lg bg-slate-100 hover:bg-emerald-100 active:scale-95 text-slate-700 hover:text-emerald-800 transition-all border border-slate-200/80 cursor-pointer"
                    title="Scroll left"
                    aria-label="Previous location"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => scrollMandi('right')}
                    className="p-1 rounded-lg bg-slate-100 hover:bg-emerald-100 active:scale-95 text-slate-700 hover:text-emerald-800 transition-all border border-slate-200/80 cursor-pointer"
                    title="Scroll right"
                    aria-label="Next location"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div
              ref={mandiScrollRef}
              className="flex space-x-2 overflow-x-auto pb-1 pt-0.5 px-0.5 snap-x snap-mandatory scroll-smooth touch-pan-x overscroll-x-contain scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-full max-w-full"
            >
              {(recentSearches.length > 0 ? recentSearches : [currentLocation]).map((loc, idx) => {
                const displayName = loc.name.split(',')[0] || loc.name;
                const isSelected = currentLocation.name === loc.name || Math.abs(currentLocation.lat - loc.lat) < 0.001;
                return (
                  <button
                    key={`chip-rec-${loc.lat}-${loc.lon}-${idx}`}
                    onClick={() => handleSelectLocation(loc)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border shrink-0 snap-start cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-emerald-300'
                    }`}
                  >
                    📍 {displayName}
                  </button>
                );
              })}
              {/* End spacer to ensure last item is never cut off */}
              <div className="w-6 shrink-0 h-1" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Loading State / Skeleton */}
        {isLoading && !weatherData ? (
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg space-y-4 animate-pulse w-full">
            <div className="h-6 bg-slate-200 rounded-xl w-1/2"></div>
            <div className="h-16 bg-slate-200 rounded-2xl w-full"></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-20 bg-slate-100 rounded-2xl"></div>
              <div className="h-20 bg-slate-100 rounded-2xl"></div>
            </div>
          </div>
        ) : weatherData ? (
          <>
            {/* Primary Live Weather Display Card */}
            <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden border border-emerald-800/40 w-full box-border">
              <div className="relative z-10 space-y-3.5">

                {/* 3-Tier Status Banner (LIVE WEATHER DATA / CACHED WEATHER DATA / OFFLINE FALLBACK) */}
                {weatherData.dataSourceStatus === 'REAL DATA' ? (
                  <div className="bg-emerald-950/70 border border-emerald-500/40 rounded-2xl p-2.5 flex items-center justify-between gap-2 text-xs backdrop-blur-md">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                      <span className="font-black text-emerald-300 tracking-wider uppercase text-[11px]">
                        🟢 LIVE WEATHER DATA
                      </span>
                    </div>
                    <div className="text-[10px] text-emerald-200 font-bold">
                      Source: Open-Meteo • Live • Updated {formatTime12h(weatherData.lastUpdated)}
                    </div>
                  </div>
                ) : weatherData.dataSourceStatus === 'CACHED DATA' ? (
                  <div className="bg-amber-950/70 border border-amber-500/40 rounded-2xl p-2.5 flex items-center justify-between gap-2 text-xs backdrop-blur-md">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
                      <span className="font-black text-amber-300 tracking-wider uppercase text-[11px]">
                        🟡 CACHED WEATHER DATA
                      </span>
                    </div>
                    <div className="text-[10px] text-amber-200 font-bold">
                      Source: Open-Meteo cache • Cached • Updated {getRelativeTime(weatherData.cachedAt)}
                    </div>
                  </div>
                ) : (
                  <div className="bg-orange-950/80 border border-orange-500/50 rounded-2xl p-2.5 flex items-center justify-between gap-2 text-xs backdrop-blur-md">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shrink-0"></span>
                      <span className="font-black text-orange-300 tracking-wider uppercase text-[11px]">
                        🟠 OFFLINE FALLBACK
                      </span>
                    </div>
                    <div className="text-[10px] text-orange-200 font-bold">
                      Live weather unavailable • Using fallback values
                    </div>
                  </div>
                )}

                {/* Top status bar */}
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        weatherData.dataSourceStatus === 'REAL DATA' ? 'bg-emerald-400 animate-ping' :
                        weatherData.dataSourceStatus === 'CACHED DATA' ? 'bg-amber-400' : 'bg-orange-400'
                      }`}></span>
                      <span className="text-[10px] font-black tracking-widest text-emerald-300 uppercase">
                        {weatherData.dataSourceStatus === 'REAL DATA' ? 'LIVE WEATHER DATA' :
                         weatherData.dataSourceStatus === 'CACHED DATA' ? 'CACHED WEATHER DATA' : 'OFFLINE FALLBACK'}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black tracking-tight text-white mt-1 break-words leading-snug">
                      {weatherData.location.name}
                    </h2>
                  </div>

                  <button
                    onClick={() => loadWeather(currentLocation.lat, currentLocation.lon, currentLocation.name, true)}
                    disabled={isRefreshing}
                    className="p-2 bg-white/10 hover:bg-white/20 active:scale-95 rounded-2xl border border-white/20 text-white cursor-pointer transition-all shrink-0 flex items-center gap-1.5"
                    title="Force refresh live weather from Open-Meteo"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span className="text-[10px] font-bold hidden sm:inline">Refresh</span>
                  </button>
                </div>

                {/* Main Temperature & Condition layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-stretch pt-1">
                  <div className="flex flex-col justify-center bg-white/5 p-3 rounded-2xl border border-white/10">
                    <div className="flex items-baseline space-x-1">
                      <span className="text-4xl sm:text-5xl font-black tracking-tight font-mono">{weatherData.temperature}°</span>
                      <span className="text-xl font-bold text-emerald-300">C</span>
                    </div>
                    <p className="text-xs text-emerald-200 font-bold mt-1">
                      Feels like {weatherData.feelsLike}°C
                    </p>
                    <p className="text-sm font-extrabold text-white mt-0.5 break-words">{weatherData.condition}</p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 space-y-1.5 text-xs font-semibold text-emerald-100 flex flex-col justify-center">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[10px] text-slate-300 uppercase font-bold shrink-0">Current Rain Prob:</span>
                      <span className="text-amber-300 font-extrabold font-mono text-sm">{weatherData.currentHourlyRainProb ?? weatherData.rainfallChance}%</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[10px] text-slate-300 uppercase font-bold shrink-0">Daily Max Rain:</span>
                      <span className="text-amber-200 font-bold font-mono text-xs">{weatherData.dailyMaxRainProb ?? weatherData.dailyForecast?.[0]?.rainProb ?? 0}%</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[10px] text-slate-300 uppercase font-bold shrink-0">Humidity:</span>
                      <span className="text-emerald-300 font-extrabold font-mono">{weatherData.humidity}%</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[10px] text-slate-300 uppercase font-bold shrink-0">Wind:</span>
                      <span className="text-white font-extrabold font-mono text-[11px] truncate">{weatherData.windSpeed} km/h ({weatherData.windDirectionText})</span>
                    </div>
                  </div>
                </div>

                {/* Footer timestamp */}
                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[9px] text-emerald-300 font-bold flex-wrap gap-1">
                  <span>
                    {weatherData.dataSourceStatus === 'REAL DATA'
                      ? `Live • Updated ${formatTime12h(weatherData.lastUpdated)}`
                      : weatherData.dataSourceStatus === 'CACHED DATA'
                      ? `Cached • Updated ${getRelativeTime(weatherData.cachedAt)}`
                      : 'Offline • Live weather unavailable'}
                  </span>
                  <span>Data Source: Open-Meteo</span>
                </div>
              </div>
            </div>

            {/* Sub-tab Switcher Bar - Horizontally scrollable without squishing labels */}
            <div className="flex bg-slate-200/80 p-1.5 rounded-2xl gap-1.5 overflow-x-auto scrollbar-none [scrollbar-width:none] touch-pan-x select-none w-full box-border">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3.5 py-2 text-[11px] font-black rounded-xl transition-all shrink-0 cursor-pointer ${
                  activeTab === 'overview' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 bg-transparent'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('hourly')}
                className={`px-3.5 py-2 text-[11px] font-black rounded-xl transition-all shrink-0 cursor-pointer ${
                  activeTab === 'hourly' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 bg-transparent'
                }`}
              >
                24H Hourly
              </button>
              <button
                onClick={() => setActiveTab('daily')}
                className={`px-3.5 py-2 text-[11px] font-black rounded-xl transition-all shrink-0 cursor-pointer ${
                  activeTab === 'daily' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 bg-transparent'
                }`}
              >
                7-Day Forecast
              </button>
              <button
                onClick={() => setActiveTab('advisory')}
                className={`px-3.5 py-2 text-[11px] font-black rounded-xl transition-all shrink-0 cursor-pointer ${
                  activeTab === 'advisory' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 bg-transparent'
                }`}
              >
                AI Advisory
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                className={`px-3.5 py-2 text-[11px] font-black rounded-xl transition-all shrink-0 cursor-pointer relative ${
                  activeTab === 'alerts' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 bg-transparent'
                }`}
              >
                <span>Alerts</span>
                {weatherData.alerts.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 bg-red-500 text-white text-[9px] font-black rounded-full inline-flex items-center justify-center animate-pulse">
                    {weatherData.alerts.length}
                  </span>
                )}
              </button>
            </div>

            {/* TAB 1: METRICS GRID */}
            {(activeTab === 'overview' || activeTab === 'advisory') && (
              <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xl shadow-slate-100/50 space-y-3 w-full box-border">
                <div className="flex justify-between items-center flex-wrap gap-1.5">
                  <h3 className="font-black text-xs text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
                    <Gauge className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Micro-Climate Parameters</span>
                  </h3>
                  <span className="text-[9px] bg-emerald-50 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-100 shrink-0">
                    Live Weather Data
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 min-w-0">
                    <div className="flex items-center space-x-1 text-slate-400 text-[9px] font-extrabold uppercase truncate">
                      <Droplets className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>Humidity</span>
                    </div>
                    <p className="text-base sm:text-lg font-black text-slate-800 font-mono">{weatherData.humidity}%</p>
                    <p className="text-[9px] text-slate-400 font-semibold truncate">{weatherData.humidity > 75 ? 'High Dampness' : 'Balanced'}</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 min-w-0">
                    <div className="flex items-center space-x-1 text-slate-400 text-[9px] font-extrabold uppercase truncate">
                      <CloudRain className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Rain Probability</span>
                    </div>
                    <p className="text-base sm:text-lg font-black text-slate-800 font-mono">{weatherData.currentHourlyRainProb ?? weatherData.rainfallChance}%</p>
                    <div className="text-[9px] text-slate-500 font-semibold space-y-0.5">
                      <p className="truncate">Hourly: <span className="font-bold text-slate-700">{weatherData.currentHourlyRainProb ?? weatherData.rainfallChance}%</span></p>
                      <p className="truncate">Daily Max: <span className="font-bold text-slate-700">{weatherData.dailyMaxRainProb ?? weatherData.dailyForecast?.[0]?.rainProb ?? 0}%</span></p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 min-w-0">
                    <div className="flex items-center space-x-1 text-slate-400 text-[9px] font-extrabold uppercase truncate">
                      <Wind className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>Wind Speed</span>
                    </div>
                    <p className="text-base sm:text-lg font-black text-slate-800 font-mono">{weatherData.windSpeed} <span className="text-[10px] font-normal">km/h</span></p>
                    <p className="text-[9px] text-slate-400 font-semibold truncate">{weatherData.windDirectionText}</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 min-w-0">
                    <div className="flex items-center space-x-1 text-slate-400 text-[9px] font-extrabold uppercase truncate">
                      <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>UV Index</span>
                    </div>
                    <p className="text-base sm:text-lg font-black text-slate-800 font-mono">{weatherData.uvIndex} <span className="text-[10px] font-normal">/11</span></p>
                    <p className="text-[9px] text-slate-400 font-semibold truncate">{weatherData.uvIndex >= 7 ? 'High Solar' : 'Moderate'}</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 min-w-0">
                    <div className="flex items-center space-x-1 text-slate-400 text-[9px] font-extrabold uppercase truncate">
                      <Gauge className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>Pressure</span>
                    </div>
                    <p className="text-base sm:text-lg font-black text-slate-800 font-mono">{weatherData.pressure} <span className="text-[10px] font-normal">hPa</span></p>
                    <p className="text-[9px] text-slate-400 font-semibold truncate">Barometric</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 min-w-0">
                    <div className="flex items-center space-x-1 text-slate-400 text-[9px] font-extrabold uppercase truncate">
                      <Eye className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Visibility</span>
                    </div>
                    <p className="text-base sm:text-lg font-black text-slate-800 font-mono">{weatherData.visibilityKm} <span className="text-[10px] font-normal">km</span></p>
                    <p className="text-[9px] text-slate-400 font-semibold truncate">Clear Field</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 min-w-0">
                    <div className="flex items-center space-x-1 text-slate-400 text-[9px] font-extrabold uppercase truncate">
                      <Sunrise className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Sunrise</span>
                    </div>
                    <p className="text-xs font-black text-slate-800 font-mono mt-1">{weatherData.sunrise}</p>
                    <p className="text-[9px] text-slate-400 font-semibold truncate">Dawn</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 min-w-0">
                    <div className="flex items-center space-x-1 text-slate-400 text-[9px] font-extrabold uppercase truncate">
                      <Sunset className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span>Sunset</span>
                    </div>
                    <p className="text-xs font-black text-slate-800 font-mono mt-1">{weatherData.sunset}</p>
                    <p className="text-[9px] text-slate-400 font-semibold truncate">Dusk</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: HOURLY 24H FORECAST */}
            {(activeTab === 'overview' || activeTab === 'hourly') && (
              <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xl shadow-slate-100/50 space-y-3 w-full box-border overflow-hidden">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <h3 className="font-black text-xs text-slate-800 uppercase tracking-wide flex items-center space-x-1.5 min-w-0">
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">24-Hour Micro-Forecast</span>
                  </h3>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => scrollHourly('left')}
                      className="p-1 rounded-lg bg-slate-100 hover:bg-emerald-100 active:scale-95 text-slate-700 hover:text-emerald-800 transition-all border border-slate-200/80 cursor-pointer"
                      title="Scroll left"
                      aria-label="Previous hourly forecast"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => scrollHourly('right')}
                      className="p-1 rounded-lg bg-slate-100 hover:bg-emerald-100 active:scale-95 text-slate-700 hover:text-emerald-800 transition-all border border-slate-200/80 cursor-pointer"
                      title="Scroll right"
                      aria-label="Next hourly forecast"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[9px] text-emerald-700 font-extrabold uppercase bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/80 ml-0.5">
                      {weatherData.hourlyForecast.length} Hrs
                    </span>
                  </div>
                </div>

                {/* Horizontal Swipe Carousel Container */}
                <div
                  ref={hourlyScrollRef}
                  className="flex space-x-2 overflow-x-auto pb-2.5 pt-1 px-0.5 snap-x snap-mandatory scroll-smooth touch-pan-x overscroll-x-contain scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-full max-w-full"
                >
                  {weatherData.hourlyForecast.map((item, idx) => (
                    <div
                      key={idx}
                      className="w-[68px] sm:w-[74px] shrink-0 snap-start bg-slate-50 hover:bg-emerald-50/50 border border-slate-100 hover:border-emerald-300 p-2.5 rounded-2xl text-center space-y-1.5 transition-all shadow-2xs select-none"
                    >
                      <p className="text-[10px] font-black text-slate-600 font-mono truncate">{item.time}</p>
                      <div className="flex justify-center py-1">
                        {renderWeatherIcon(item.weatherCode, 'w-6 h-6 shrink-0')}
                      </div>
                      <p className="text-sm font-black text-slate-800 font-mono">{item.temp}°</p>
                      <div className="text-[9px] font-extrabold text-blue-700 bg-blue-50/80 border border-blue-100/60 py-0.5 px-1 rounded-md flex items-center justify-center gap-0.5 truncate">
                        <span>💧</span>
                        <span>{item.rainProb}%</span>
                      </div>
                    </div>
                  ))}
                  {/* End padding spacer to ensure last card is never cut off on swipe */}
                  <div className="w-5 shrink-0 h-1" aria-hidden="true" />
                </div>
              </div>
            )}

            {/* TAB 3: DAILY 7-DAY FORECAST */}
            {(activeTab === 'overview' || activeTab === 'daily') && (
              <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xl shadow-slate-100/50 space-y-3 w-full box-border">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-xs text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>7-Day Sowing Risk Forecast</span>
                  </h3>
                  <span className="text-[9px] text-emerald-700 font-bold uppercase">7 Days</span>
                </div>

                <div className="space-y-2">
                  {weatherData.dailyForecast.map((dayItem, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 hover:bg-emerald-50/30 border border-slate-100 hover:border-emerald-200 p-3 rounded-2xl flex items-center justify-between transition-all gap-2"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                        {renderWeatherIcon(dayItem.weatherCode, 'w-6 h-6 shrink-0')}
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-800 truncate">{dayItem.dayName}</p>
                          <p className="text-[10px] text-slate-400 font-semibold truncate">{dayItem.condition}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <div className="text-[10px] font-extrabold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-xl flex items-center space-x-1">
                          <Droplets className="w-3 h-3 text-blue-500 shrink-0" />
                          <span>{dayItem.rainProb}%</span>
                        </div>

                        <div className="text-right font-mono min-w-[45px]">
                          <span className="text-xs font-black text-slate-800">{dayItem.tempMax}°</span>
                          <span className="text-[10px] text-slate-400 font-bold ml-1">{dayItem.tempMin}°</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: AI FARMING RECOMMENDATIONS */}
            {(activeTab === 'overview' || activeTab === 'advisory') && (
              <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xl shadow-slate-100/50 space-y-3 w-full box-border">
                <div className="flex justify-between items-center flex-wrap gap-1">
                  <h3 className="font-black text-xs text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>AI Agricultural Recommendations</span>
                  </h3>
                  <span className="text-[9px] bg-yellow-300 text-yellow-950 font-black px-2.5 py-0.5 rounded-full uppercase">
                    Krishi Advisor
                  </span>
                </div>

                <div className="space-y-2.5">
                  {weatherData.recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        rec.urgency === 'high'
                          ? 'bg-amber-50/80 border-amber-200'
                          : rec.urgency === 'medium'
                          ? 'bg-blue-50/80 border-blue-200'
                          : 'bg-emerald-50/80 border-emerald-200'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          rec.urgency === 'high'
                            ? 'bg-amber-200 text-amber-900'
                            : rec.urgency === 'medium'
                            ? 'bg-blue-200 text-blue-900'
                            : 'bg-emerald-200 text-emerald-900'
                        }`}>
                          {rec.category}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">{rec.urgency} Priority</span>
                      </div>
                      <h4 className="text-xs font-extrabold text-slate-900 mt-1 break-words">{rec.title}</h4>
                      <p className="text-[11px] text-slate-700 font-medium leading-relaxed mt-1 break-words">{rec.advice}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: AGRI WEATHER ADVISORIES */}
            {(activeTab === 'overview' || activeTab === 'alerts') && (
              <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xl shadow-slate-100/50 space-y-3 w-full box-border">
                <div className="flex justify-between items-center flex-wrap gap-1">
                  <div>
                    <h3 className="font-black text-xs text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
                      <ShieldAlert className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>AgriVerse Weather Advisories ({weatherData.alerts.length})</span>
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      AgriVerse Weather Advisory • Based on Open-Meteo weather data • Not an official government warning.
                    </p>
                  </div>
                  <span className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-full uppercase">
                    AgriVerse Rules
                  </span>
                </div>

                {/* Offline Fallback Safety Notice */}
                {weatherData.dataSourceStatus === 'OFFLINE FALLBACK' && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-2xl text-[11px] text-orange-950 font-medium space-y-1">
                    <span className="font-bold flex items-center gap-1.5 text-orange-900">
                      <WifiOff className="w-3.5 h-3.5" />
                      OFFLINE / FALLBACK DATA
                    </span>
                    <p className="text-[10px] text-orange-800">
                      Live Open-Meteo weather server is unreachable. Displaying offline fallback data. Severe weather alerts are deactivated to prevent false alarms.
                    </p>
                  </div>
                )}

                {weatherData.alerts.length === 0 ? (
                  <div className="p-4 bg-emerald-50 rounded-2xl text-center space-y-1 border border-emerald-100">
                    <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto" />
                    <p className="text-xs font-extrabold text-emerald-900">No Active Severe Weather Advisories</p>
                    <p className="text-[10px] text-emerald-700 font-medium">Weather conditions are safe for normal agricultural field operations.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {weatherData.alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all space-y-3 ${
                          alert.severity === 'critical'
                            ? 'bg-red-50/80 border-red-200 text-red-950'
                            : 'bg-amber-50/80 border-amber-200 text-amber-950'
                        }`}
                      >
                        {/* Header: Type, Status Badge, Severity Badge */}
                        <div className="flex justify-between items-start gap-2 flex-wrap">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">
                              AgriVerse Weather Advisory
                            </span>
                            <h4 className="text-sm font-black uppercase tracking-wide flex items-center space-x-1.5 min-w-0">
                              <span className="break-words">{alert.title}</span>
                            </h4>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                            {/* Live / Cached / Offline status badge */}
                            {weatherData.dataSourceStatus === 'REAL DATA' ? (
                              <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[8px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>LIVE ADVISORY</span>
                              </span>
                            ) : weatherData.dataSourceStatus === 'CACHED DATA' ? (
                              <span className="bg-amber-100 text-amber-950 border border-amber-300 text-[8px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                <span>CACHED WEATHER DATA</span>
                              </span>
                            ) : (
                              <span className="bg-orange-100 text-orange-950 border border-orange-300 text-[8px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                <span>OFFLINE / FALLBACK DATA</span>
                              </span>
                            )}

                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase shrink-0 ${
                              alert.severity === 'critical' ? 'bg-red-200 text-red-950' : 'bg-amber-200 text-amber-950'
                            }`}>
                              Severity: {alert.severity === 'critical' ? 'High' : 'Moderate'}
                            </span>
                          </div>
                        </div>

                        {/* Threshold Reason Banner (when useful) */}
                        {alert.ruleInputs?.thresholdReason && (
                          <div className="bg-white/90 px-3 py-1.5 rounded-xl border border-slate-200/90 text-[10px] font-semibold text-slate-800 flex items-center gap-1.5">
                            <span className="font-black text-amber-700 uppercase tracking-wide text-[9px] shrink-0">Condition Met:</span>
                            <span className="text-slate-800 break-words">{alert.ruleInputs.thresholdReason}</span>
                          </div>
                        )}

                        {/* Real Measured / Forecast Values Grid */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-[11px] shadow-2xs space-y-2">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">
                            Measured & Forecast Weather Values:
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-700">
                            <div>
                              <span className="text-slate-500 text-[10px] block">Rain probability:</span>
                              <span className="font-extrabold text-slate-900 text-xs font-mono">{alert.ruleInputs?.rainProbability ?? weatherData.currentHourlyRainProb}%</span>
                            </div>
                            <div>
                              <span className="text-slate-500 text-[10px] block">Expected precipitation:</span>
                              <span className="font-extrabold text-slate-900 text-xs font-mono">{(alert.ruleInputs?.precipitationMm ?? weatherData.precipitationMm).toFixed(1)} mm</span>
                            </div>
                            <div>
                              <span className="text-slate-500 text-[10px] block">Temperature:</span>
                              <span className="font-extrabold text-slate-900 text-xs font-mono">{alert.ruleInputs?.temperature ?? weatherData.temperature}°C</span>
                            </div>
                            <div>
                              <span className="text-slate-500 text-[10px] block">Wind speed:</span>
                              <span className="font-extrabold text-slate-900 text-xs font-mono">{alert.ruleInputs?.windSpeed ?? weatherData.windSpeed} km/h</span>
                            </div>
                            <div className="col-span-2 sm:col-span-2">
                              <span className="text-slate-500 text-[10px] block">Location:</span>
                              <span className="font-extrabold text-slate-900 text-xs truncate block">{weatherData.location.name}</span>
                            </div>
                          </div>

                          <div className="text-[9px] text-slate-500 pt-2 border-t border-slate-100 flex justify-between items-center flex-wrap gap-1 font-semibold">
                            <span>Source: Based on Open-Meteo weather data</span>
                            <span>Updated: {alert.timestamp}</span>
                          </div>
                        </div>

                        {/* Farming Recommendation */}
                        <div className="bg-white p-3 rounded-xl border border-emerald-200/80 shadow-2xs space-y-1">
                          <span className="text-emerald-800 uppercase text-[9px] block font-black tracking-wider">
                            Farming Recommendation:
                          </span>
                          <p className="text-xs font-extrabold text-slate-900 leading-snug break-words">
                            "{alert.recommendedAction}"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : null}

      </div>
    </div>
  );
};
