import React, { useState, useEffect } from 'react';
import { 
  Droplet, 
  Droplets, 
  Calendar, 
  Save, 
  BookOpen, 
  Volume2, 
  VolumeX, 
  Plus, 
  Trash2, 
  Sliders, 
  X, 
  Check, 
  CheckCircle, 
  AlertTriangle, 
  Activity,
  Award,
  Clock,
  ArrowRight,
  Info,
  CloudRain,
  Sun,
  Wind
} from 'lucide-react';
import { LanguageCode } from '../types';
import { useI18n } from '../context/I18nContext';
import { freeWeatherProvider } from '../services/providers/weatherProvider';

interface SmartIrrigationAdvisorProps {
  currentLang?: LanguageCode;
  onClose: () => void;
  triggerToast: (msg: string) => void;
  uid?: string;
}

interface IrrigationLog {
  id: string;
  crop: string;
  date: string;
  liters: number;
  method: string;
  duration: number;
  status: string;
  notes: string;
}

interface CropIrrigationMetadata {
  name: { en: string; kn: string; hi: string };
  bestMethod: string;
  idealMoistureRange: string;
  dailyWaterRequirement: string;
  soilDrynessThreshold: number;
  frequency: string;
  waterSavingTips: string;
}

const CROP_METADATA_MAP: Record<string, CropIrrigationMetadata> = {
  rice: {
    name: { en: 'Sona Masuri Rice (ಭತ್ತ)', kn: 'ಭತ್ತ (Rice)', hi: 'धान (Rice)' },
    bestMethod: 'Controlled Flood Basin',
    idealMoistureRange: '70% - 90%',
    dailyWaterRequirement: '15 - 20 mm / day',
    soilDrynessThreshold: 60,
    frequency: 'Keep 3-5 cm standing water layer during vegetative phase',
    waterSavingTips: 'Perform Alternate Wetting and Drying (AWD) to conserve water without reducing yield.'
  },
  tomato: {
    name: { en: 'Hybrid Tomato (ಟೊಮೆಟೊ)', kn: 'ಟೊಮೆಟೊ (Tomato)', hi: 'टमाटर (Tomato)' },
    bestMethod: 'Sub-surface Drip Irrigation',
    idealMoistureRange: '50% - 65%',
    dailyWaterRequirement: '5 - 7 mm / day',
    soilDrynessThreshold: 45,
    frequency: 'Once every 2 days (Prefer twilight/evening hours)',
    waterSavingTips: 'Use drip laterals targeted strictly at the root zone. Mulching reduces soil evaporation by up to 40%.'
  },
  onion: {
    name: { en: 'Bellary Onion (ಈರುಳ್ಳಿ)', kn: 'ಈರುಳ್ಳಿ (Onion)', hi: 'प्याज (Onion)' },
    bestMethod: 'Micro-Drip Lateral Lines',
    idealMoistureRange: '45% - 60%',
    dailyWaterRequirement: '3 - 5 mm / day',
    soilDrynessThreshold: 40,
    frequency: 'Once every 3 days',
    waterSavingTips: 'Onions have shallow fibrous roots. Frequent short irrigations prevent water percolation below the root zone.'
  },
  sugarcane: {
    name: { en: 'Coimbatore Sugarcane (ಕಬ್ಬು)', kn: 'ಕಬ್ಬು (Sugarcane)', hi: 'गन्ना (Sugarcane)' },
    bestMethod: 'Inter-row Furrow Drip',
    idealMoistureRange: '60% - 75%',
    dailyWaterRequirement: '12 - 16 mm / day',
    soilDrynessThreshold: 50,
    frequency: 'Every 4 to 6 days depending on canopy cover',
    waterSavingTips: 'Use trash mulching between cane rows. Restricting water 3-4 weeks before harvest enhances cane sucrose content.'
  },
  millet: {
    name: { en: 'Organic Ragi/Millet (ರಾಗಿ)', kn: 'ರಾಗಿ/ಸಜ್ಜೆ (Millet)', hi: 'बाजरा/रागी (Millet)' },
    bestMethod: 'Rain-port Sprinklers',
    idealMoistureRange: '30% - 45%',
    dailyWaterRequirement: '2 - 3 mm / day',
    soilDrynessThreshold: 30,
    frequency: 'Once in 7 to 10 days (Highly drought-resilient)',
    waterSavingTips: 'Millet is exceptionally hardy. Supplemental irrigation is only needed during critical tillering and grain-filling stages if rains fail.'
  },
  cotton: {
    name: { en: 'Bt Cotton (ಹತ್ತಿ)', kn: 'ಹತ್ತಿ (Cotton)', hi: 'कपास (Cotton)' },
    bestMethod: 'Alternate Furrow Irrigation',
    idealMoistureRange: '40% - 55%',
    dailyWaterRequirement: '6 - 8 mm / day',
    soilDrynessThreshold: 35,
    frequency: 'Every 5 days during peak squaring and boll formation',
    waterSavingTips: 'Adopt alternate furrow irrigation to save significant water. Avoid irrigation during boll opening stage.'
  }
};

const MULTILINGUAL_TRANSLATIONS: Record<string, any> = {
  en: {
    advisorTitle: 'Krishi Smart Irrigation Advisor',
    closeBtn: 'Close Dashboard',
    moistureSection: 'AI Soil Moisture Estimate',
    moistureLabel: 'Estimated Field Soil Moisture',
    thresholdLabel: 'Underwatering Alert Threshold',
    statusCritical: 'Dryness Risk — Irrigation Recommended',
    statusOptimal: 'Optimal Moisture — Growth Stable',
    statusSaturated: 'High Moisture — Postpone Irrigation',
    wateringLogTab: 'Watering Ledger',
    addLogTitle: 'Record Watering Session',
    logHistoryTitle: 'Recorded Watering Sessions',
    cropLabel: 'Select Crop Category',
    waterMethodLabel: 'Preferred Irrigation Method',
    litersLabel: 'Water Volume (Liters)',
    durationLabel: 'Duration (Minutes)',
    notesLabel: 'Special Notes / Observations',
    notesPlaceholder: 'e.g. Twilight drip cycle, compost mulching...',
    submitBtn: 'Log Session to Database',
    savingTitle: 'Estimated Water Saved',
    dripOptimizedText: 'Efficient drip methods reduce water evaporation and minimize fertilizer leaching.',
    voiceInstructionTitle: 'Bilingual Audio Guide',
    voiceInstructBtn: 'Narrate Irrigation Report',
    voiceStopBtn: 'Mute Audio Guide',
    addLogSuccess: 'Watering session recorded successfully.',
    deleteLogSuccess: 'Irrigation record deleted.',
    preferencesSaved: 'Irrigation preferences saved successfully.',
    weatherContextTitle: 'Local Weather & Rain Outlook',
    rainAlertTitle: 'Rain-Aware Advisory'
  },
  kn: {
    advisorTitle: 'ಕೃಷಿ ಸ್ಮಾರ್ಟ್ ನೀರಾವರಿ ಸಲಹೆಗಾರ',
    closeBtn: 'ಮುಚ್ಚಿ',
    moistureSection: 'ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ಮಣ್ಣಿನ ತೇವಾಂಶ ಅಂದಾಜು',
    moistureLabel: 'ಅಂದಾಜು ಮಣ್ಣಿನ ತೇವಾಂಶ',
    thresholdLabel: 'ಕಡಿಮೆ ತೇವಾಂಶ ಎಚ್ಚರಿಕೆ ಮಟ್ಟ',
    statusCritical: 'ಒಣಗುವ ಅಪಾಯ — ನೀರಾವರಿ ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ',
    statusOptimal: 'ಉತ್ತಮ ತೇವಾಂಶ — ಬೆಳೆ ಬೆಳವಣಿಗೆ ಸ್ಥಿರ',
    statusSaturated: 'ಹೆಚ್ಚು ತೇವಾಂಶ — ನೀರನ್ನು ಮುಂದೂಡಿ',
    wateringLogTab: 'ನೀರಾವರಿ ದಿನಚರಿ',
    addLogTitle: 'ನೀರು ಉಣಿಸುವಿಕೆ ದಾಖಲಿಸಿ',
    logHistoryTitle: 'ದಾಖಲಾದ ನೀರಾವರಿ ವಿವರಗಳು',
    cropLabel: 'ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ',
    waterMethodLabel: 'ನೀರಾವರಿ ವಿಧಾನ',
    litersLabel: 'ನೀರಿನ ಪ್ರಮಾಣ (ಲೀಟರ್ಗಳಲ್ಲಿ)',
    durationLabel: 'ಸಮಯ (ನಿಮಿಷಗಳಲ್ಲಿ)',
    notesLabel: 'ಟಿಪ್ಪಣಿಗಳು / ಅವಲೋಕನ',
    notesPlaceholder: 'ಉದಾ: ಸಾಯಂಕಾಲದ ಹನಿ ನೀರಾವರಿ...',
    submitBtn: 'ನೀರಾವರಿ ದಾಖಲೆಯನ್ನು ದಾಖಲಿಸಿ',
    savingTitle: 'ಅಂದಾಜು ಉಳಿತಾಯವಾದ ನೀರು',
    dripOptimizedText: 'ಹನಿ ನೀರಾವರಿ ಪದ್ಧತಿಯು ಆವಿಯಾಗುವಿಕೆಯನ್ನು ತಡೆದು ನೀರಿನ ಬಳಕೆಯನ್ನು ಕಡಿಮೆ ಮಾಡುತ್ತದೆ.',
    voiceInstructionTitle: 'ದ್ವಿಭಾಷಾ ಧ್ವನಿ ಮಾರ್ಗದರ್ಶಿ',
    voiceInstructBtn: 'ನೀರಾವರಿ ವರದಿ ಆಲಿಸಿ',
    voiceStopBtn: 'ಧ್ವನಿ ನಿಲ್ಲಿಸಿ',
    addLogSuccess: 'ನೀರಾವರಿ ದಾಖಲೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ.',
    deleteLogSuccess: 'ನೀರಾವರಿ ದಾಖಲೆ ಅಳಿಸಲಾಗಿದೆ.',
    preferencesSaved: 'ರೈತರ ನೀರಾವರಿ ಸಂರಚನೆ ಉಳಿಸಲಾಗಿದೆ.',
    weatherContextTitle: 'ಸ್ಥಳೀಯ ಹವಾಮಾನ ಮತ್ತು ಮಳೆ ಮುನ್ಸೂಚನೆ',
    rainAlertTitle: 'ಮಳೆ ಆಧಾರಿತ ಸಲಹೆ'
  },
  hi: {
    advisorTitle: 'कृषि स्मार्ट सिंचाई सलाहकार',
    closeBtn: 'बंद करें',
    moistureSection: 'AI मिट्टी नमी अनुमान',
    moistureLabel: 'अनुमानित मिट्टी की नमी',
    thresholdLabel: 'कम नमी चेतावनी सीमा',
    statusCritical: 'शुष्कता जोखिम — सिंचाई की सलाह',
    statusOptimal: 'अनुकूल नमी — फसल विकास सामान्य',
    statusSaturated: 'अधिक नमी — सिंचाई स्थगित करें',
    wateringLogTab: 'सिंचाई खाता एवं रिकॉर्ड',
    addLogTitle: 'सिंचाई का नया विवरण भरें',
    logHistoryTitle: 'दर्ज किए गए सिंचाई सत्र',
    cropLabel: 'फसल का चयन करें',
    waterMethodLabel: 'सिंचाई पद्धति',
    litersLabel: 'पानी की मात्रा (लीटर में)',
    durationLabel: 'सिंचाई अवधि (मिनट)',
    notesLabel: 'टिप्पणी / अवलोकन',
    notesPlaceholder: 'जैसे: सांध्य कालीन ड्रिप सिंचाई...',
    submitBtn: 'सिंचाई विवरण सहेजें',
    savingTitle: 'अनुमानित पानी की बचत',
    dripOptimizedText: 'ड्रिप सिंचाई से वाष्पीकरण कम होता है और पानी की बर्बादी घटती है।',
    voiceInstructionTitle: 'द्विभाषी आवाज गाइड',
    voiceInstructBtn: 'सिंचाई सलाह आवाज में सुनें',
    voiceStopBtn: 'आवाज बंद करें',
    addLogSuccess: 'सिंचाई विवरण सुरक्षित हो गया है।',
    deleteLogSuccess: 'सिंचाई विवरण हटा दिया गया।',
    preferencesSaved: 'सिंचाई प्राथमिकताएं सफलतापूर्वक सहेजी गईं।',
    weatherContextTitle: 'स्थानीय मौसम एवं वर्षा पूर्वानुमान',
    rainAlertTitle: 'वर्षा-संवेदी सलाह'
  }
};

export const SmartIrrigationAdvisor: React.FC<SmartIrrigationAdvisorProps> = ({
  currentLang,
  onClose,
  triggerToast,
  uid
}) => {
  const { language } = useI18n();
  const activeLang = language || currentLang || 'en';
  const trans = MULTILINGUAL_TRANSLATIONS[activeLang] || MULTILINGUAL_TRANSLATIONS['en'];
  const effectiveUid = uid || localStorage.getItem('agri_user_uid') || 'guest';

  // DB Sync states
  const [history, setHistory] = useState<IrrigationLog[]>([]);
  const [preferences, setPreferences] = useState({
    selectedCrop: 'tomato',
    soilMoistureTrigger: 45,
    irrigationMethod: 'Sub-surface Drip Irrigation'
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Weather state from real Open-Meteo data
  const [weather, setWeather] = useState<{
    temp: number;
    humidity: number;
    rainProb: number;
    precipitationMm: number;
    condition: string;
    locationName: string;
  } | null>(null);

  // Software-based soil moisture estimate (%)
  const [estimatedMoisture, setEstimatedMoisture] = useState<number>(52);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Form input states
  const [addCrop, setAddCrop] = useState<string>('tomato');
  const [addLiters, setAddLiters] = useState<string>('1500');
  const [addMethod, setAddMethod] = useState<string>('Sub-surface Drip Irrigation');
  const [addDuration, setAddDuration] = useState<string>('20');
  const [addNotes, setAddNotes] = useState<string>('');
  const [isAdding, setIsAdding] = useState<boolean>(false);

  // Fetch initial history & settings from DB and load live Open-Meteo weather
  useEffect(() => {
    fetchIrrigationData();
    loadLiveWeather();
  }, [effectiveUid]);

  const loadLiveWeather = async () => {
    try {
      let lat = 13.4355;
      let lon = 77.7279;
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedLoc = localStorage.getItem('agri_user_location');
        if (savedLoc) {
          try {
            const parsed = JSON.parse(savedLoc);
            if (parsed.lat && parsed.lon) {
              lat = parsed.lat;
              lon = parsed.lon;
            }
          } catch {}
        }
      }

      const live = await freeWeatherProvider.getLiveWeatherData(lat, lon, undefined, false);
      if (live) {
        const rainProb = live.currentHourlyRainProb ?? live.rainfallChance ?? 0;
        setWeather({
          temp: live.temperature,
          humidity: live.humidity,
          rainProb,
          precipitationMm: live.precipitationMm,
          condition: live.condition,
          locationName: live.location.name
        });
      }
    } catch (e) {
      console.warn('Could not load live weather for irrigation advisor:', e);
    }
  };

  const fetchIrrigationData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/irrigation', {
        headers: {
          'x-user-id': effectiveUid
        }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
        if (data.preferences) {
          const loadedPrefs = {
            selectedCrop: data.preferences.selectedCrop || 'tomato',
            soilMoistureTrigger: data.preferences.soilMoistureTrigger || 45,
            irrigationMethod: data.preferences.irrigationMethod || 'Sub-surface Drip Irrigation'
          };
          setPreferences(loadedPrefs);
          setAddCrop(loadedPrefs.selectedCrop);
          setAddMethod(loadedPrefs.irrigationMethod);
          recalculateMoisture(loadedPrefs.selectedCrop);
        }
      }
    } catch (err) {
      console.error('Error fetching irrigation state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Recalculate estimated soil moisture purely from software agronomic model
  const recalculateMoisture = (cropType: string) => {
    const cropMeta = CROP_METADATA_MAP[cropType];
    if (!cropMeta) return;

    let base = 52;
    if (cropType === 'rice') {
      base = 78; // Flooded basin
    } else if (cropType === 'millet') {
      base = 34; // Arid dry conditions
    } else if (cropType === 'tomato') {
      base = 52;
    } else if (cropType === 'onion') {
      base = 48;
    } else if (cropType === 'sugarcane') {
      base = 64;
    } else {
      base = 44;
    }

    // Weather adjustments from Open-Meteo data when present
    if (weather) {
      if (weather.precipitationMm >= 10) base += 14;
      else if (weather.precipitationMm >= 2) base += 6;
      else if (weather.rainProb >= 70) base += 4;

      if (weather.temp >= 35) base -= 6;
      if (weather.humidity >= 80) base += 4;
      else if (weather.humidity <= 35) base -= 4;
    }

    setEstimatedMoisture(Math.max(15, Math.min(95, base)));
  };

  const handleSavePreferences = async (newPrefs: typeof preferences) => {
    try {
      const res = await fetch('/api/irrigation/preferences', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': effectiveUid
        },
        body: JSON.stringify({ ...newPrefs, userId: effectiveUid })
      });
      if (res.ok) {
        const updated = await res.json();
        setPreferences({
          selectedCrop: updated.selectedCrop || newPrefs.selectedCrop,
          soilMoistureTrigger: updated.soilMoistureTrigger || newPrefs.soilMoistureTrigger,
          irrigationMethod: updated.irrigationMethod || newPrefs.irrigationMethod
        });
        triggerToast(trans.preferencesSaved);
      }
    } catch (err) {
      console.error('Error saving presets:', err);
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addLiters || isNaN(parseFloat(addLiters))) {
      triggerToast('Please supply a valid numeric volume parameter');
      return;
    }
    try {
      setIsAdding(true);
      const res = await fetch('/api/irrigation/history', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': effectiveUid
        },
        body: JSON.stringify({
          crop: CROP_METADATA_MAP[addCrop]?.name[currentLang || 'en'] || addCrop,
          liters: parseFloat(addLiters),
          method: addMethod,
          duration: parseInt(addDuration) || 15,
          notes: addNotes,
          userId: effectiveUid
        })
      });
      if (res.ok) {
        const created = await res.json();
        setHistory([created, ...history]);
        triggerToast(trans.addLogSuccess);
        setAddNotes('');
        // Increase estimated moisture after user records a watering session
        setEstimatedMoisture(prev => Math.min(95, prev + 16));
      }
    } catch (err) {
      console.error('Error logging irrigation run:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      const res = await fetch(`/api/irrigation/history/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': effectiveUid
        }
      });
      if (res.ok) {
        setHistory(history.filter(log => log.id !== id));
        triggerToast(trans.deleteLogSuccess);
      }
    } catch (err) {
      console.error('Error purging irrigation log:', err);
    }
  };

  // Determine warnings and recommendations dynamically
  const isSoilUnderwatered = estimatedMoisture < preferences.soilMoistureTrigger;
  const isSoilOverwatered = estimatedMoisture > 80;
  const rainExpected = weather && (weather.rainProb >= 60 || weather.precipitationMm >= 5);
  const hotEvaporativeCondition = weather && (weather.temp >= 33 || (weather.temp >= 29 && weather.humidity < 40));

  // Synthesize software-based irrigation recommendation
  const getIrrigationRecommendation = () => {
    const meta = CROP_METADATA_MAP[preferences.selectedCrop] || CROP_METADATA_MAP['tomato'];
    const chosenMethod = preferences.irrigationMethod || meta.bestMethod;

    if (rainExpected) {
      return {
        status: 'Postpone Irrigation',
        statusType: 'postpone' as const,
        badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
        headline: 'Rain Expected — Postpone Irrigation',
        details: `Open-Meteo forecasts ${weather.rainProb}% rain probability and ${weather.precipitationMm.toFixed(1)} mm precipitation in ${weather.locationName || 'your area'}. Natural rainfall will replenish soil moisture.`,
        action: 'Postpone scheduled watering to prevent root waterlogging, fertilizer leaching, and water waste.',
        method: chosenMethod,
        waterAmount: '0 mm (Rain-dependent)',
        timing: 'Re-evaluate after rainfall event'
      };
    }

    if (isSoilUnderwatered) {
      return {
        status: 'Irrigate Now',
        statusType: 'irrigate' as const,
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
        headline: 'Root-Zone Dryness Risk — Irrigate Now',
        details: `Estimated soil moisture (${estimatedMoisture}%) has fallen below your target threshold (${preferences.soilMoistureTrigger}%). ${hotEvaporativeCondition ? `High temperature (${weather?.temp}°C) is increasing crop transpiration.` : ''}`,
        action: `Schedule watering session applying ~${meta.dailyWaterRequirement} using ${chosenMethod}.`,
        method: chosenMethod,
        waterAmount: meta.dailyWaterRequirement,
        timing: hotEvaporativeCondition ? 'Early morning (06:00 - 08:00 AM) or sunset' : 'Morning or evening'
      };
    }

    if (isSoilOverwatered || (weather && weather.humidity >= 85)) {
      return {
        status: 'Reduce Irrigation',
        statusType: 'reduce' as const,
        badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
        headline: 'High Moisture — Reduce Application',
        details: `Field soil moisture is estimated at ${estimatedMoisture}%${weather ? ` with ambient humidity at ${weather.humidity}%` : ''}. Ample moisture is retained in the root zone.`,
        action: 'Reduce water volume or skip today to avoid fungal spore germination and root rot.',
        method: chosenMethod,
        waterAmount: 'Reduce standard volume by 50%',
        timing: 'Next routine inspection'
      };
    }

    return {
      status: 'Growth Stable',
      statusType: 'optimal' as const,
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      headline: 'Optimal Moisture — Growth Stable',
      details: `Estimated soil moisture (${estimatedMoisture}%) is within the ideal range (${meta.idealMoistureRange}) for ${meta.name[activeLang as 'en' | 'kn' | 'hi'] || meta.name.en}.`,
      action: `Maintain normal irrigation cycle: ${meta.frequency}.`,
      method: chosenMethod,
      waterAmount: meta.dailyWaterRequirement,
      timing: 'As per normal schedule'
    };
  };

  const currentRecommendation = getIrrigationRecommendation();

  // Calculate estimated water savings dynamically from user-recorded sessions
  // Drip and micro-sprinkler save ~40-45% compared to traditional flood basin baseline
  const calculatedSavingsLiters = history.reduce((acc, log) => {
    const isEfficientMethod = (log.method || '').toLowerCase().includes('drip') || (log.method || '').toLowerCase().includes('sprinkler');
    if (isEfficientMethod && log.liters > 0) {
      return acc + Math.round(log.liters * 0.45);
    }
    return acc;
  }, 0);

  // Text-To-Speech guidance logic: Strictly explains software recommendation and weather
  const handleTTSVoiceGuide = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      const activeMeta = CROP_METADATA_MAP[preferences.selectedCrop] || CROP_METADATA_MAP['tomato'];
      const cropLocalizedName = activeMeta.name[activeLang as 'en' | 'kn' | 'hi'] || activeMeta.name.en;
      let promptText = '';

      if (activeLang === 'kn') {
        promptText = `${trans.advisorTitle} ವರದಿ. ನಿಮ್ಮ ಆಯ್ಕೆಯ ಬೆಳೆ: ${cropLocalizedName}. ಅಂದಾಜು ಮಣ್ಣಿನ ತೇವಾಂಶ ಶೇಕಡಾ ${estimatedMoisture} ರಷ್ಟಿದೆ. ${currentRecommendation.statusType === 'postpone' ? `ಮಳೆಯಾಗುವ ಸಾಧ್ಯತೆ ಇರುವುದರಿಂದ ನೀರಾವರಿಯನ್ನು ಮುಂದೂಡಲು ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ.` : currentRecommendation.statusType === 'irrigate' ? `ತೇವಾಂಶ ಕಡಿಮೆಯಾಗಿದೆ, ನೀರಾವರಿ ಮಾಡಲು ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ.` : `ಮಣ್ಣಿನ ತೇವಾಂಶ ಸ್ಥಿರವಾಗಿದೆ.`} ಶಿಫಾರಸು ಮಾಡಿದ ವಿಧಾನ: ${preferences.irrigationMethod || activeMeta.bestMethod}, ಅಗತ್ಯ ಪ್ರಮಾಣ: ${activeMeta.dailyWaterRequirement}.`;
      } else if (activeLang === 'hi') {
        promptText = `${trans.advisorTitle} रिपोर्ट। आपकी चयनित फसल: ${cropLocalizedName}। अनुमानित मिट्टी की नमी ${estimatedMoisture} प्रतिशत है। ${currentRecommendation.statusType === 'postpone' ? `वर्षा की संभावना के कारण सिंचाई स्थगित करने की सलाह दी जाती है।` : currentRecommendation.statusType === 'irrigate' ? `नमी कम है, सिंचाई करने की सलाह दी जाती है।` : `मिट्टी की नमी अनुकूल है।`} अनुशंसित पद्धति: ${preferences.irrigationMethod || activeMeta.bestMethod}, जल आवश्यकता: ${activeMeta.dailyWaterRequirement}।`;
      } else {
        promptText = `Welcome to the ${trans.advisorTitle}. Selected crop is ${cropLocalizedName}. Estimated soil moisture is ${estimatedMoisture} percent. ${currentRecommendation.statusType === 'postpone' ? `Rain is expected. Recommendation is to postpone irrigation to prevent waterlogging.` : currentRecommendation.statusType === 'irrigate' ? `Estimated moisture is below your threshold of ${preferences.soilMoistureTrigger} percent. Recommendation is to irrigate now.` : `Moisture level is optimal for crop growth.`} Recommended method is ${preferences.irrigationMethod || activeMeta.bestMethod}, requiring ${activeMeta.dailyWaterRequirement}.`;
      }

      const utterance = new SpeechSynthesisUtterance(promptText);
      if (activeLang === 'kn') utterance.lang = 'kn-IN';
      else if (activeLang === 'hi') utterance.lang = 'hi-IN';
      else utterance.lang = 'en-IN';

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } else {
      triggerToast('Audio narrative voice engine is unavailable inside browser.');
    }
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div 
      className="relative w-full flex-1 bg-slate-900/40 backdrop-blur-md p-3 flex justify-center items-start animate-fade-in"
      onClick={() => {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        setIsSpeaking(false);
        onClose();
      }}
    >
      <div 
        className="bg-white rounded-[28px] w-full max-w-md shadow-2xl border border-blue-100 overflow-hidden my-auto flex flex-col animate-slide-up pb-8 my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sky-Blue Water Visual Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-emerald-800 p-5 text-white flex justify-between items-center relative">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center animate-pulse">
              <Droplets className="w-5.5 h-5.5 text-blue-200" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight uppercase leading-tight">{trans.advisorTitle}</h1>
              <p className="text-[10px] text-blue-100 font-bold opacity-90">Software-Based Irrigation Intelligence</p>
            </div>
          </div>
          <button 
            id="close_irrigation_advisor"
            onClick={() => {
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              setIsSpeaking(false);
              onClose();
            }}
            className="p-1.5 bg-black/20 hover:bg-black/40 rounded-full cursor-pointer transition-all active:scale-90"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Moisture Estimation Dashboard Section */}
        <div className="p-4 bg-blue-50/50 border-b border-blue-50 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-blue-700" />
              <span>{trans.moistureSection}</span>
            </h3>
            <span className="text-[9px] text-blue-900 bg-blue-100 font-black px-2.5 py-0.5 rounded-full uppercase border border-blue-200 flex items-center space-x-1">
              <span>Estimated</span>
            </span>
          </div>

          {/* Indicator for Soil Moisture */}
          <div className="bg-white rounded-2xl p-4 border border-blue-100 flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider leading-none">{trans.moistureLabel}</p>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-3xl font-black text-blue-950 font-mono tracking-tight">{estimatedMoisture}%</span>
                <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">Estimated</span>
              </div>
              <p className={`text-[10px] font-extrabold flex items-center space-x-1 ${
                isSoilUnderwatered ? 'text-amber-700' : isSoilOverwatered ? 'text-purple-700' : 'text-emerald-700'
              }`}>
                {isSoilUnderwatered ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{trans.statusCritical}</span>
                  </>
                ) : isSoilOverwatered ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{trans.statusSaturated}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{trans.statusOptimal}</span>
                  </>
                )}
              </p>
            </div>

            {/* Visual Gauge */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`${isSoilUnderwatered ? 'text-amber-500' : isSoilOverwatered ? 'text-purple-500' : 'text-emerald-600'}`}
                  strokeWidth="3.5"
                  strokeDasharray={`${estimatedMoisture}, 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Droplet className={`w-5 h-5 ${isSoilUnderwatered ? 'text-amber-500 animate-bounce' : 'text-blue-600 animate-pulse'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Central configurations & control settings */}
        <div id="irrigation_presets_card" className="p-4 space-y-3.5">
          {/* ROOT-ZONE DRYNESS RISK ALERT */}
          {isSoilUnderwatered && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex space-x-3 items-start shadow-xs">
              <div className="bg-amber-500 text-white p-2 rounded-xl shrink-0">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <p className="text-xs text-amber-950 font-black uppercase tracking-wider">ROOT-ZONE DRYNESS RISK</p>
                <p className="text-[11px] text-amber-900 font-semibold leading-relaxed">
                  Estimated moisture is below the recommended threshold ({preferences.soilMoistureTrigger}%). Consider scheduling irrigation.
                </p>
              </div>
            </div>
          )}

          {/* Software-Based Recommendation Card */}
          <div className="bg-white rounded-2xl p-3.5 border-2 border-slate-100 shadow-sm space-y-2">
            <div className="flex justify-between items-center flex-wrap gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                Irrigation Recommendation
              </span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase border ${currentRecommendation.badgeColor}`}>
                {currentRecommendation.status}
              </span>
            </div>

            <h4 className="text-xs font-black text-slate-900 leading-snug">
              {currentRecommendation.headline}
            </h4>

            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
              {currentRecommendation.details}
            </p>

            <div className="bg-slate-50 rounded-xl p-2.5 text-[10px] space-y-1 border border-slate-100 text-slate-700">
              <div className="flex justify-between">
                <span className="font-bold text-slate-500">Farming Advice:</span>
                <span className="font-extrabold text-slate-900 text-right">{currentRecommendation.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-500">Recommended Method:</span>
                <span className="font-bold text-blue-900">{currentRecommendation.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-500">Water Need:</span>
                <span className="font-bold text-slate-900">{currentRecommendation.waterAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-500">Best Timing:</span>
                <span className="font-bold text-slate-900">{currentRecommendation.timing}</span>
              </div>
            </div>
          </div>

          {/* Weather Integration & Rain-Aware Advisory */}
          {weather && (
            <div className="bg-blue-50/80 rounded-2xl p-3.5 border border-blue-100 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-blue-900 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-blue-600" />
                  <span>Weather & Rain Outlook</span>
                </span>
                <span className="text-[9px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                  Open-Meteo Data
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="bg-white p-2 rounded-xl border border-blue-50">
                  <span className="text-slate-400 block text-[9px] font-bold">Rain Chance</span>
                  <span className="font-black text-blue-950 text-xs font-mono">{weather.rainProb}%</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-blue-50">
                  <span className="text-slate-400 block text-[9px] font-bold">Expected Rain</span>
                  <span className="font-black text-blue-950 text-xs font-mono">{weather.precipitationMm.toFixed(1)} mm</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-blue-50">
                  <span className="text-slate-400 block text-[9px] font-bold">Temp / Hum</span>
                  <span className="font-black text-blue-950 text-xs font-mono">{weather.temp}°C / {weather.humidity}%</span>
                </div>
              </div>

              {/* Rain-Aware Recommendation */}
              {(weather.rainProb >= 60 || weather.precipitationMm >= 5) ? (
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-950 font-bold flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <span className="block font-black text-emerald-900 text-[10px] uppercase">Rain Expected — Postpone Irrigation:</span>
                    Rain expected: irrigation may be postponed to conserve water and prevent root waterlogging.
                  </div>
                </div>
              ) : weather.temp >= 33 ? (
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-950 font-bold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <span className="block font-black text-amber-900 text-[10px] uppercase">Elevated Evaporation:</span>
                    High temperatures accelerate soil moisture loss. Schedule watering in early morning or evening hours.
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-white rounded-xl border border-blue-100 text-[11px] text-slate-700 font-medium">
                  Moderate weather conditions. Normal irrigation schedule applies based on crop requirement.
                </div>
              )}
            </div>
          )}

          {/* Voice advisor button */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-3 rounded-2xl text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isSpeaking ? (
                <Volume2 className="w-5 h-5 text-emerald-400 animate-ping shrink-0" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-300 shrink-0" />
              )}
              <div>
                <p className="text-[10px] text-slate-200 font-bold leading-none">{trans.voiceInstructionTitle}</p>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Audible weather-aware guide</p>
              </div>
            </div>
            <button
              onClick={handleTTSVoiceGuide}
              className={`text-[9px] font-extrabold uppercase px-3 py-1.5 rounded-xl cursor-pointer transition-all active:scale-95 ${
                isSpeaking ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isSpeaking ? trans.voiceStopBtn : trans.voiceInstructBtn}
            </button>
          </div>

          {/* Crop Config Grid */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-3">
            <div>
              <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wide mb-1">
                {trans.cropLabel}
              </label>
              <select
                value={preferences.selectedCrop}
                onChange={(e) => {
                  const val = e.target.value;
                  const defaultMethod = CROP_METADATA_MAP[val]?.bestMethod || preferences.irrigationMethod;
                  const upd = { ...preferences, selectedCrop: val, irrigationMethod: defaultMethod };
                  setPreferences(upd);
                  setAddCrop(val);
                  setAddMethod(defaultMethod);
                  recalculateMoisture(val);
                  handleSavePreferences(upd);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-black outline-none focus:border-blue-500 text-slate-800"
              >
                <option value="rice">Rice / Paddy / Sona Masuri</option>
                <option value="tomato">Tomato / Hybrid Roma</option>
                <option value="onion">Onion / Red Bellary</option>
                <option value="sugarcane">Sugarcane / High-Sucrose CoM</option>
                <option value="millet">Millet / Organic Ragi / Sajjey</option>
                <option value="cotton">Cotton / BT Long-Staple</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wide mb-1">
                {trans.waterMethodLabel}
              </label>
              <select
                value={preferences.irrigationMethod}
                onChange={(e) => {
                  const val = e.target.value;
                  const upd = { ...preferences, irrigationMethod: val };
                  setPreferences(upd);
                  setAddMethod(val);
                  handleSavePreferences(upd);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-black outline-none focus:border-blue-500 text-slate-800"
              >
                <option value="Sub-surface Drip Irrigation">Sub-surface Drip Irrigation</option>
                <option value="Micro-Drip Lateral Lines">Micro-Drip Lateral Lines</option>
                <option value="Controlled Flood Basin">Controlled Flood Basin</option>
                <option value="Inter-row Furrow Drip">Inter-row Furrow Drip</option>
                <option value="Rain-port Sprinklers">Rain-port Sprinklers</option>
                <option value="Alternate Furrow Irrigation">Alternate Furrow Irrigation</option>
                <option value="Manual Spray">Manual Spray</option>
              </select>
            </div>

            {/* Dynamic crop specific advice cards */}
            {CROP_METADATA_MAP[preferences.selectedCrop] && (
              <div className="bg-white rounded-xl p-3 border border-blue-50 space-y-2">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-50">
                  <span className="text-[9px] text-blue-800 font-bold bg-blue-100/70 px-2 py-0.5 rounded-md uppercase">
                    Recommended: {CROP_METADATA_MAP[preferences.selectedCrop].bestMethod}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono font-bold">
                    Ideal Range: {CROP_METADATA_MAP[preferences.selectedCrop].idealMoistureRange}
                  </span>
                </div>
                
                <div className="flex justify-between text-[11px]">
                  <span className="font-bold text-slate-500">Need / Day:</span>
                  <span className="font-extrabold text-blue-900 font-mono">{CROP_METADATA_MAP[preferences.selectedCrop].dailyWaterRequirement}</span>
                </div>

                <div className="flex justify-between text-[11px]">
                  <span className="font-bold text-slate-500">Frequency:</span>
                  <span className="font-extrabold text-slate-700">{CROP_METADATA_MAP[preferences.selectedCrop].frequency}</span>
                </div>

                <div className="p-2 bg-yellow-50/50 rounded-lg text-[10px] text-slate-600 font-semibold border border-yellow-100 flex items-start space-x-1.5">
                  <Info className="w-3.5 h-3.5 text-yellow-700 shrink-0 mt-0.5" />
                  <span>{CROP_METADATA_MAP[preferences.selectedCrop].waterSavingTips}</span>
                </div>
              </div>
            )}

            {/* Threshold slider: Adjust triggering threshold level */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-slate-600 text-[10px] uppercase">{trans.thresholdLabel}</span>
                <span className="font-mono font-black text-blue-800 text-xs">{preferences.soilMoistureTrigger}% Moisture</span>
              </div>
              <input
                type="range"
                min="20"
                max="80"
                value={preferences.soilMoistureTrigger}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  const upd = { ...preferences, soilMoistureTrigger: val };
                  setPreferences(upd);
                }}
                onMouseUp={() => handleSavePreferences(preferences)}
                onTouchEnd={() => handleSavePreferences(preferences)}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-700"
              />
              <p className="text-[9px] text-slate-400 font-medium">
                The advisor will trigger a dryness alert whenever estimated moisture drops below this value.
              </p>
            </div>
          </div>
        </div>

        {/* WATER SAVINGS IMPACT CARD */}
        <div className="px-4 pb-2">
          <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 p-3 rounded-2xl border border-emerald-500/20 flex space-x-2.5 items-center">
            <div className="bg-emerald-500 text-white p-2 rounded-xl shrink-0">
              <Award className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-emerald-900 font-extrabold uppercase tracking-wide flex items-center space-x-1">
                <span>Estimated Water Saved</span>
              </p>
              {calculatedSavingsLiters > 0 ? (
                <p className="text-[10px] text-emerald-800 font-bold mt-0.5 leading-snug">
                  Estimated water saved: <span className="text-emerald-950 font-black font-mono">{(calculatedSavingsLiters / 1000).toFixed(1)} KL</span> ({calculatedSavingsLiters.toLocaleString()} L) across {history.length} recorded session{history.length > 1 ? 's' : ''} using efficient micro-irrigation vs flood baseline.
                </p>
              ) : (
                <p className="text-[9px] text-emerald-700 font-medium mt-0.5 leading-snug">
                  Log your watering sessions below to track estimated water savings from efficient irrigation methods.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* LOG WATER SESSION MANUALLY */}
        <div className="p-4 space-y-3">
          <div className="border-t border-slate-100 pt-3">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-1 mb-2">
              <Clock className="w-4 h-4 text-emerald-700" />
              <span>{trans.addLogTitle}</span>
            </h4>

            <form onSubmit={handleAddLog} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] uppercase font-black text-slate-400 mb-0.5">Liters Applied</label>
                  <input
                    type="number"
                    value={addLiters}
                    onChange={(e) => setAddLiters(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border text-xs font-bold p-2 rounded-xl outline-none"
                    placeholder="e.g. 1500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[8px] uppercase font-black text-slate-400 mb-0.5">Method Pattern</label>
                  <select
                    value={addMethod}
                    onChange={(e) => setAddMethod(e.target.value)}
                    className="w-full bg-slate-50 transition-all border text-xs font-bold p-2 rounded-xl outline-none"
                  >
                    <option value="Sub-surface Drip Irrigation">Sub-surface Drip</option>
                    <option value="Micro-Drip Lateral Lines">Micro-Drip Laterals</option>
                    <option value="Controlled Flood Basin">Controlled Flood</option>
                    <option value="Inter-row Furrow Drip">Furrow Drip</option>
                    <option value="Micro-Sprinkler">Micro-Sprinkler</option>
                    <option value="Rain-port Sprinklers">Rain-port Sprinklers</option>
                    <option value="Manual Spray">Manual Spray</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] uppercase font-black text-slate-400 mb-0.5">Duration (mins)</label>
                  <input
                    type="number"
                    value={addDuration}
                    onChange={(e) => setAddDuration(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border text-xs font-bold p-2 rounded-xl outline-none"
                    placeholder="e.g. 25"
                  />
                </div>
                <div>
                  <label className="block text-[8px] uppercase font-black text-slate-400 mb-0.5">Special Comment</label>
                  <input
                    type="text"
                    value={addNotes}
                    onChange={(e) => setAddNotes(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border text-xs font-bold p-2 rounded-xl outline-none"
                    placeholder={trans.notesPlaceholder}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isAdding}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black text-[10px] uppercase py-2.5 rounded-xl cursor-pointer shadow-md transition-all active:scale-95 text-center flex items-center justify-center space-x-1"
              >
                <span>{isAdding ? 'Saving...' : trans.submitBtn}</span>
              </button>
            </form>
          </div>

          {/* HISTORIC LOGS LISTING */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="font-extrabold text-slate-600 text-[10px] uppercase tracking-wide">
              {trans.logHistoryTitle}
            </h4>

            {isLoading ? (
              <p className="text-[10px] text-slate-400 font-bold">Loading watering history...</p>
            ) : history.length === 0 ? (
              <p className="text-[10px] text-slate-400 font-bold">No watering sessions recorded yet.</p>
            ) : (
              <div className="space-y-1.5 pr-1">
                {history.map((log) => (
                  <div key={log.id} className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex justify-between items-start text-[10px]">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-black text-slate-800 truncate">{log.crop}</span>
                        <span className="text-[8px] bg-slate-200 text-slate-700 px-1 rounded font-mono">{log.date}</span>
                      </div>
                      <p className="text-slate-500 font-bold">
                        {log.liters.toLocaleString()} Liters • {log.duration} mins • <span className="text-blue-800 font-extrabold">{log.method}</span>
                      </p>
                      {log.notes && (
                        <p className="text-slate-400 italic font-medium leading-none mt-0.5 truncate pr-2">
                          "{log.notes}"
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="text-red-500 hover:text-red-800 p-1 shrink-0 cursor-pointer transition-all hover:bg-red-50 rounded-lg"
                      title="Delete log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
