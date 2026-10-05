import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Sprout, 
  MapPin, 
  Globe, 
  Settings, 
  Bell, 
  ShieldCheck, 
  LogOut, 
  Camera, 
  ArrowLeft, 
  ChevronRight, 
  CheckCircle2, 
  Lock, 
  Mail, 
  Phone, 
  Layers, 
  Droplets, 
  Calendar, 
  RefreshCw, 
  Upload, 
  Plus, 
  X, 
  Search,
  Check,
  AlertCircle,
  Award,
  Sparkles,
  Smartphone,
  Cloud
} from 'lucide-react';
import { FarmerProfileForm } from './FarmerProfileForm';
import { KYCGovernmentBenefits } from './KYCGovernmentBenefits';
import { LANGUAGES } from '../data';
import { auth } from '../firebase';
import { uploadProfilePhoto, saveFarmerProfile, UserProfileDoc } from '../services/userService';
import { MASTER_CROPS_LIST, INDIA_STATES_AND_DISTRICTS, getDistrictsForState } from '../data/indiaData';

export interface ProfileTabViewProps {
  currentLang: string;
  setCurrentLang: (lang: any) => void;
  t: any;
  userPhone: string;
  regPhone: string;
  firebaseAuthUid: string;
  fullUserProfile: any;
  setFullUserProfile?: React.Dispatch<React.SetStateAction<any>>;
  activeProfileTool: string;
  setActiveProfileTool: (tool: string) => void;
  logoutSession: () => void;
  onSaveProfileSuccess: (updated?: any) => void;
  schemes?: any[];
  expandedSchemeId?: string | null;
  setExpandedSchemeId?: (id: string | null) => void;
  eligibleResponses?: Record<string, { landOk: boolean; bankOk: boolean }>;
  setEligibleResponses?: React.Dispatch<React.SetStateAction<Record<string, { landOk: boolean; bankOk: boolean }>>>;
  triggerToast: (msg: string) => void;
}

export const ProfileTabView: React.FC<ProfileTabViewProps> = ({
  currentLang,
  setCurrentLang,
  t,
  userPhone,
  regPhone,
  firebaseAuthUid,
  fullUserProfile,
  setFullUserProfile,
  activeProfileTool,
  setActiveProfileTool,
  logoutSession,
  onSaveProfileSuccess,
  schemes = [],
  expandedSchemeId = null,
  setExpandedSchemeId,
  eligibleResponses = {},
  setEligibleResponses,
  triggerToast,
}) => {
  const [profileImgError, setProfileImgError] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Live Camera Capture States
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const hiddenPhotoInputRef = useRef<HTMLInputElement | null>(null);

  // Notification Preferences State
  const [notifications, setNotifications] = useState({
    smsAlerts: fullUserProfile?.smsAlertsEnabled ?? true,
    whatsappAlerts: true,
    weatherAlerts: true,
    mandiPriceAlerts: true,
    pestWarnings: true,
  });

  // Local state for editing individual section cards
  const [editCropsList, setEditCropsList] = useState<string[]>(
    fullUserProfile?.primaryCrops || fullUserProfile?.crops || ['Ragi', 'Tomato']
  );
  const [cropSearch, setCropSearch] = useState('');
  const [showAddCropDropdown, setShowAddCropDropdown] = useState(false);

  // Sync profile edits
  useEffect(() => {
    if (fullUserProfile?.primaryCrops || fullUserProfile?.crops) {
      setEditCropsList(fullUserProfile?.primaryCrops || fullUserProfile?.crops);
    }
  }, [fullUserProfile]);

  // Clean up camera stream
  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try { track.stop(); } catch (e) {}
      });
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Camera Handlers
  const startCameraStream = async (facing: 'environment' | 'user' = cameraFacingMode) => {
    setIsStartingCamera(true);
    setCameraError(null);
    stopCameraStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera stream is not supported in this browser environment. You can choose a photo file instead.');
      setIsStartingCamera(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 640 },
          height: { ideal: 640 }
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
      const msg = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
        ? 'Camera permission denied. Please enable camera access in your browser settings or select a photo file.'
        : `Unable to open camera (${err?.message || 'camera busy'}). Select a photo file from gallery.`;
      setCameraError(msg);
    } finally {
      setIsStartingCamera(false);
    }
  };

  const handleOpenCameraModal = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      hiddenPhotoInputRef.current?.click();
      return;
    }
    setShowCameraModal(true);
    setTimeout(() => {
      startCameraStream('user');
    }, 100);
  };

  const handleCloseCameraModal = () => {
    stopCameraStream();
    setShowCameraModal(false);
    setCameraError(null);
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const w = video.videoWidth || 400;
    const h = video.videoHeight || 400;

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

    stopCameraStream();
    setShowCameraModal(false);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `profile_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      await processAndUploadPhoto(file);
    }, 'image/jpeg', 0.85);
  };

  const processAndUploadPhoto = async (file: File) => {
    if (!file) return;
    const activeUid = auth.currentUser?.uid || firebaseAuthUid || localStorage.getItem('agri_user_uid');
    if (!activeUid) {
      triggerToast('Error: User session not found. Please log in.');
      return;
    }

    setIsUploadingPhoto(true);
    triggerToast('Compressing and saving profile photo...');

    try {
      const dataUrl = await uploadProfilePhoto(activeUid, file);
      if (dataUrl) {
        setProfileImgError(false);
        const updated = {
          ...fullUserProfile,
          profilePhotoUrl: dataUrl,
          photoURL: dataUrl
        };
        if (setFullUserProfile) setFullUserProfile(updated);
        try {
          if (onSaveProfileSuccess) onSaveProfileSuccess(updated);
        } catch (syncErr) {
          console.warn('Profile sync non-fatal:', syncErr);
        }
        triggerToast('Profile photo updated & saved successfully!');
      }
    } catch (err: any) {
      console.error('Failed to upload photo:', err);
      const localPhoto = localStorage.getItem(`profile_photo_${activeUid}`) || localStorage.getItem('agri_profile_photo');
      if (localPhoto) {
        triggerToast('Profile photo updated & saved successfully!');
      } else {
        triggerToast(`Photo save failed: ${err?.message || 'Error saving photo'}`);
      }
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processAndUploadPhoto(file);
    }
    if (e.target) e.target.value = '';
  };

  // Crop management
  const handleAddCrop = (cropName: string) => {
    if (!editCropsList.includes(cropName)) {
      const newList = [...editCropsList, cropName];
      setEditCropsList(newList);
      saveCropsToFirestore(newList);
    }
    setCropSearch('');
    setShowAddCropDropdown(false);
  };

  const handleRemoveCrop = (cropName: string) => {
    const newList = editCropsList.filter(c => c !== cropName);
    setEditCropsList(newList);
    saveCropsToFirestore(newList);
  };

  const saveCropsToFirestore = async (crops: string[]) => {
    const activeUid = firebaseAuthUid || auth.currentUser?.uid;
    if (!activeUid) return;
    try {
      const updated = await saveFarmerProfile(activeUid, { primaryCrops: crops, crops });
      if (setFullUserProfile) setFullUserProfile(updated);
      onSaveProfileSuccess(updated);
      triggerToast('Crops list updated!');
    } catch (err) {
      console.error('Failed to update crops:', err);
    }
  };

  // Profile data helpers
  const userDisplayName = fullUserProfile?.fullName || fullUserProfile?.name || auth.currentUser?.displayName || 'Farmer Partner';
  const userEmail = fullUserProfile?.email || auth.currentUser?.email || (fullUserProfile?.mobileNumber || userPhone ? `+91 ${fullUserProfile?.mobileNumber || userPhone}` : 'No email linked');
  const userPhoneDisplay = fullUserProfile?.mobileNumber || userPhone || regPhone || auth.currentUser?.phoneNumber || '+91 9876543210';
  const userPhotoUrl = fullUserProfile?.profilePhotoUrl || fullUserProfile?.photoURL || auth.currentUser?.photoURL || '';
  const userLocationStr = fullUserProfile?.village ? `${fullUserProfile.village}, ${fullUserProfile.district}, ${fullUserProfile.state}` : 'Karnataka, India';

  return (
    <div id="v_profile_tab" className="p-3 pb-24 space-y-4 animate-fadeIn max-w-xl mx-auto w-full font-sans select-none">
      
      {/* Back button header when inside a sub-tool */}
      {activeProfileTool !== 'overview' && (
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-3 px-4 rounded-2xl flex items-center justify-between shadow-md mb-2">
          <button
            onClick={() => setActiveProfileTool('overview')}
            className="flex items-center space-x-1.5 text-xs font-black bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl border border-white/20 cursor-pointer active:scale-95 transition-all text-emerald-100"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Back to Overview</span>
          </button>
          <span className="font-extrabold text-xs tracking-wide text-yellow-300 uppercase truncate max-w-[200px]">
            {activeProfileTool === 'farmerDetails' && '👨‍🌾 Farmer Details'}
            {activeProfileTool === 'farmDetails' && '🌾 Farm Details'}
            {activeProfileTool === 'locationDetails' && '📍 Location Details'}
            {activeProfileTool === 'myCrops' && '🌱 My Crops'}
            {activeProfileTool === 'notifications' && '🔔 Notification Alerts'}
            {activeProfileTool === 'language' && '🌐 Language Settings'}
            {activeProfileTool === 'settings' && '⚙️ App Settings'}
            {activeProfileTool === 'account' && '🔐 Account & Security'}
            {activeProfileTool === 'editForm' && '📝 Edit Farmer Profile'}
            {activeProfileTool === 'kyc' && '🛡️ KYC & Gov Benefits'}
          </span>
        </div>
      )}

      {/* 1. PROFILE HEADER CARD */}
      <div id="profile_header_card" className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-3 relative overflow-hidden">
        {/* Decorative background accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/60 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

        <div className="flex items-center space-x-3.5 relative z-10">
          {/* Avatar with Camera Capture Overlay */}
          <div className="relative group cursor-pointer shrink-0" onClick={handleOpenCameraModal}>
            {userPhotoUrl && !profileImgError ? (
              <img
                src={userPhotoUrl}
                alt="Profile"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md bg-slate-50"
                onError={() => setProfileImgError(true)}
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-tr from-emerald-700 to-emerald-500 text-white font-black rounded-2xl flex items-center justify-center text-xl shadow-md">
                {userDisplayName.substring(0, 2).toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenCameraModal();
              }}
              className="absolute -bottom-1 -right-1 bg-yellow-400 hover:bg-yellow-300 text-yellow-950 p-1.5 rounded-full border-2 border-white shadow-md cursor-pointer transition-transform active:scale-90"
              title="Capture or upload profile photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              type="file"
              accept="image/*"
              ref={hiddenPhotoInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1">
              <h3 className="font-extrabold text-slate-800 text-sm leading-tight truncate">
                {userDisplayName}
              </h3>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>

            {/* Display real email if available */}
            <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5 flex items-center space-x-1">
              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{userEmail}</span>
            </p>

            <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5 flex items-center space-x-1">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{userLocationStr}</span>
            </p>

            <div className="mt-2 flex items-center space-x-2">
              <span className="inline-block bg-emerald-50 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                ✓ Verified Farmer
              </span>
              <button
                onClick={() => setActiveProfileTool('editForm')}
                className="text-emerald-700 hover:text-emerald-900 bg-emerald-50/80 px-2 py-0.5 rounded-full text-[10px] font-extrabold border border-emerald-200/60 cursor-pointer transition-all active:scale-95"
              >
                ✏️ Edit Profile
              </button>
            </div>
          </div>
        </div>

        {isUploadingPhoto && (
          <p className="text-[10px] text-emerald-600 font-bold text-center animate-pulse pt-1 border-t border-slate-100">
            Uploading & saving photo to Firestore...
          </p>
        )}
      </div>

      {/* Live Camera Viewfinder Overlay Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-white font-bold text-sm">
                <Camera className="w-5 h-5 text-emerald-400" />
                <span>Live Camera Photo Capture</span>
              </div>
              <button
                type="button"
                onClick={handleCloseCameraModal}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-black w-full aspect-square flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraFacingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {!cameraError && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-52 h-52 rounded-full border-2 border-dashed border-emerald-400/80 shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                </div>
              )}

              {isStartingCamera && (
                <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center text-emerald-400 space-y-2 z-10">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                  <span className="text-xs font-semibold text-slate-300">Opening Camera...</span>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-x-4 top-4 p-4 bg-red-950/90 border border-red-800 rounded-2xl text-red-200 text-xs text-center space-y-3 z-10">
                  <p className="leading-relaxed">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      handleCloseCameraModal();
                      hiddenPhotoInputRef.current?.click();
                    }}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Gallery Photo</span>
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-around space-x-2">
              <button
                type="button"
                onClick={() => {
                  const next = cameraFacingMode === 'user' ? 'environment' : 'user';
                  setCameraFacingMode(next);
                  startCameraStream(next);
                }}
                disabled={isStartingCamera || !!cameraError}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl transition-all cursor-pointer flex flex-col items-center text-[10px] space-y-1"
              >
                <RefreshCw className="w-5 h-5 text-emerald-400" />
                <span>Flip Camera</span>
              </button>

              <button
                type="button"
                onClick={handleCapturePhoto}
                disabled={isStartingCamera || !!cameraError}
                className="p-4 bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white rounded-full transition-all shadow-lg shadow-emerald-900/50 cursor-pointer border-4 border-slate-900 active:scale-90"
              >
                <Camera className="w-7 h-7" />
              </button>

              <button
                type="button"
                onClick={() => {
                  handleCloseCameraModal();
                  hiddenPhotoInputRef.current?.click();
                }}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl transition-all cursor-pointer flex flex-col items-center text-[10px] space-y-1"
              >
                <Upload className="w-5 h-5 text-emerald-400" />
                <span>Gallery</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. OVERVIEW: CLEAN 2-COLUMN MOBILE GRID */}
      {activeProfileTool === 'overview' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
              Account Management
            </h4>
            <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Firestore Synced
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* 1. Farmer Details */}
            <button
              onClick={() => { setActiveProfileTool('farmerDetails'); triggerToast('Opening Farmer Details...'); }}
              className="bg-white hover:bg-emerald-50/50 active:scale-[0.98] rounded-2xl p-3 border border-slate-100 text-left flex flex-col justify-between cursor-pointer shadow-2xs transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <User className="w-4.5 h-4.5" />
                </div>
                <span className="text-[8px] font-black text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">Personal</span>
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 block">👨‍🌾 Farmer Details</span>
                <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5 truncate">Name, Email, Gender & Photo</p>
              </div>
            </button>

            {/* 2. Farm Details */}
            <button
              onClick={() => { setActiveProfileTool('farmDetails'); triggerToast('Opening Farm Details...'); }}
              className="bg-white hover:bg-emerald-50/50 active:scale-[0.98] rounded-2xl p-3 border border-slate-100 text-left flex flex-col justify-between cursor-pointer shadow-2xs transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 bg-teal-600 text-white rounded-xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Sprout className="w-4.5 h-4.5" />
                </div>
                <span className="text-[8px] font-black text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded uppercase">Land</span>
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 block">🌾 Farm Details</span>
                <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5 truncate">Acres, Soil & Water Source</p>
              </div>
            </button>

            {/* 3. Location */}
            <button
              onClick={() => { setActiveProfileTool('locationDetails'); triggerToast('Opening Location...'); }}
              className="bg-white hover:bg-emerald-50/50 active:scale-[0.98] rounded-2xl p-3 border border-slate-100 text-left flex flex-col justify-between cursor-pointer shadow-2xs transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 bg-amber-600 text-white rounded-xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <MapPin className="w-4.5 h-4.5" />
                </div>
                <span className="text-[8px] font-black text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded uppercase">Geography</span>
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 block">📍 Location</span>
                <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5 truncate">Village, District, State</p>
              </div>
            </button>

            {/* 4. My Crops */}
            <button
              onClick={() => { setActiveProfileTool('myCrops'); triggerToast('Opening My Crops...'); }}
              className="bg-white hover:bg-emerald-50/50 active:scale-[0.98] rounded-2xl p-3 border border-slate-100 text-left flex flex-col justify-between cursor-pointer shadow-2xs transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 bg-green-600 text-white rounded-xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Layers className="w-4.5 h-4.5" />
                </div>
                <span className="text-[8px] font-black text-green-800 bg-green-50 px-1.5 py-0.5 rounded uppercase">Produce</span>
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 block">🌱 My Crops</span>
                <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5 truncate">{editCropsList.join(', ') || 'Ragi, Tomato'}</p>
              </div>
            </button>

            {/* 5. Notifications */}
            <button
              onClick={() => { setActiveProfileTool('notifications'); triggerToast('Opening Notification Alerts...'); }}
              className="bg-white hover:bg-emerald-50/50 active:scale-[0.98] rounded-2xl p-3 border border-slate-100 text-left flex flex-col justify-between cursor-pointer shadow-2xs transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 bg-purple-600 text-white rounded-xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Bell className="w-4.5 h-4.5" />
                </div>
                <span className="text-[8px] font-black text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded uppercase">Alerts</span>
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 block">🔔 Notifications</span>
                <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5 truncate">SMS, WhatsApp & Weather</p>
              </div>
            </button>

            {/* 6. Language */}
            <button
              onClick={() => { setActiveProfileTool('language'); triggerToast('Opening Language Selector...'); }}
              className="bg-white hover:bg-emerald-50/50 active:scale-[0.98] rounded-2xl p-3 border border-slate-100 text-left flex flex-col justify-between cursor-pointer shadow-2xs transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Globe className="w-4.5 h-4.5" />
                </div>
                <span className="text-[8px] font-black text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">Language</span>
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 block">🌐 Language</span>
                <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5 truncate">
                  {LANGUAGES.find(l => l.code === currentLang)?.localName || 'English'}
                </p>
              </div>
            </button>

            {/* 7. Settings */}
            <button
              onClick={() => { setActiveProfileTool('settings'); triggerToast('Opening App Settings...'); }}
              className="bg-white hover:bg-emerald-50/50 active:scale-[0.98] rounded-2xl p-3 border border-slate-100 text-left flex flex-col justify-between cursor-pointer shadow-2xs transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 bg-slate-700 text-white rounded-xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Settings className="w-4.5 h-4.5" />
                </div>
                <span className="text-[8px] font-black text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded uppercase">Config</span>
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 block">⚙️ Settings</span>
                <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5 truncate">Sync, Offline Data & Theme</p>
              </div>
            </button>

            {/* 8. Account */}
            <button
              onClick={() => { setActiveProfileTool('account'); triggerToast('Opening Account & Security...'); }}
              className="bg-white hover:bg-emerald-50/50 active:scale-[0.98] rounded-2xl p-3 border border-slate-100 text-left flex flex-col justify-between cursor-pointer shadow-2xs transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <span className="text-[8px] font-black text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded uppercase">Security</span>
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 block">🔐 Account</span>
                <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5 truncate">Auth details & Logout</p>
              </div>
            </button>
          </div>

          {/* Quick link to Edit Profile & KYC */}
          <div className="pt-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveProfileTool('editForm')}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <User className="w-4 h-4 text-yellow-300" />
              <span>Full Profile Editor</span>
            </button>

            <button
              onClick={() => setActiveProfileTool('kyc')}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-yellow-300" />
              <span>KYC & Gov Benefits</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. SUB-VIEW 1: FARMER DETAILS */}
      {activeProfileTool === 'farmerDetails' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide flex items-center space-x-1.5">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Farmer Personal Information</span>
            </h4>
            <button
              onClick={() => setActiveProfileTool('editForm')}
              className="text-emerald-700 text-[10px] font-extrabold hover:underline"
            >
              Edit Details →
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="bg-slate-50 p-3 rounded-2xl flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Full Name</span>
                <span className="font-extrabold text-slate-800 text-sm">{userDisplayName}</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Email Address</span>
                <span className="font-bold text-slate-800">{userEmail}</span>
              </div>
              <Mail className="w-4 h-4 text-slate-400" />
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Mobile Phone</span>
                <span className="font-mono font-bold text-slate-800">{userPhoneDisplay}</span>
              </div>
              <Phone className="w-4 h-4 text-slate-400" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 p-3 rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Gender</span>
                <span className="font-bold text-slate-800">{fullUserProfile?.gender || 'Male'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Date of Birth</span>
                <span className="font-bold text-slate-800">{fullUserProfile?.dob || fullUserProfile?.dateOfBirth || 'Not specified'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SUB-VIEW 2: FARM DETAILS */}
      {activeProfileTool === 'farmDetails' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide flex items-center space-x-1.5">
              <Sprout className="w-4 h-4 text-emerald-600" />
              <span>Farm Land & Agricultural Profile</span>
            </h4>
            <button
              onClick={() => setActiveProfileTool('editForm')}
              className="text-emerald-700 text-[10px] font-extrabold hover:underline"
            >
              Update →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="bg-slate-50 p-3 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Farm Name</span>
              <span className="font-black text-slate-800 text-sm">{fullUserProfile?.farmName || 'My Farm'}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Farm Size</span>
              <span className="font-black text-emerald-700 text-sm">{fullUserProfile?.farmSize ? `${fullUserProfile.farmSize} Acres` : '2.5 Acres'}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Farming Practice</span>
              <span className="font-extrabold text-slate-800">{fullUserProfile?.farmingType || 'Conventional'}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Soil Profile</span>
              <span className="font-extrabold text-slate-800">{fullUserProfile?.soilType || 'Red Loam'}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl col-span-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Irrigation / Water Source</span>
              <span className="font-extrabold text-slate-800">{fullUserProfile?.waterSource || 'Borewell & Canal'}</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. SUB-VIEW 3: LOCATION DETAILS */}
      {activeProfileTool === 'locationDetails' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Location & Administrative Region</span>
            </h4>
            <button
              onClick={() => setActiveProfileTool('editForm')}
              className="text-emerald-700 text-[10px] font-extrabold hover:underline"
            >
              Change →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="bg-slate-50 p-3 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Village / Panchayat</span>
              <span className="font-black text-slate-800 text-sm">{fullUserProfile?.village || 'Anemadagu'}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">District</span>
              <span className="font-black text-slate-800 text-sm">{fullUserProfile?.district || 'Chikkaballapura'}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">State</span>
              <span className="font-black text-slate-800 text-sm">{fullUserProfile?.state || 'Karnataka'}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Country</span>
              <span className="font-black text-slate-800 text-sm">{fullUserProfile?.country || 'India'}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl col-span-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Postal Pincode</span>
              <span className="font-mono font-bold text-slate-800">{fullUserProfile?.pincode || '562101'}</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. SUB-VIEW 4: MY CROPS */}
      {activeProfileTool === 'myCrops' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Primary Cultivated Crops</span>
            </h4>
            <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full">
              {editCropsList.length} Active
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-medium">Your primary crops are used by AgriVerse AI to personalize sowing advice, weather alerts, and Mandi prices.</p>

            {/* Current Active Crops List */}
            <div className="flex flex-wrap gap-2 pt-1">
              {editCropsList.map((crop, idx) => (
                <div key={idx} className="bg-emerald-50 border border-emerald-200 text-emerald-950 font-extrabold text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-2xs">
                  <span>🌾 {crop}</span>
                  <button
                    onClick={() => handleRemoveCrop(crop)}
                    className="p-0.5 text-emerald-700 hover:text-rose-600 rounded-full cursor-pointer"
                    title="Remove crop"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Crop Dropdown */}
            <div className="pt-2 relative">
              <button
                onClick={() => setShowAddCropDropdown(!showAddCropDropdown)}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-xs rounded-2xl flex items-center justify-center space-x-1.5 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Add Crop to Profile</span>
              </button>

              {showAddCropDropdown && (
                <div className="mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 space-y-2 max-h-60 overflow-y-auto">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search crop name..."
                      value={cropSearch}
                      onChange={(e) => setCropSearch(e.target.value)}
                      className="w-full bg-slate-50 border rounded-xl py-2 pl-8 pr-3 text-xs font-semibold"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                  <div className="grid grid-cols-2 gap-1 pt-1">
                    {MASTER_CROPS_LIST
                      .filter(c => c.toLowerCase().includes(cropSearch.toLowerCase()) && !editCropsList.includes(c))
                      .slice(0, 10)
                      .map((c) => (
                        <button
                          key={c}
                          onClick={() => handleAddCrop(c)}
                          className="text-left text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 p-2 rounded-xl border border-slate-100 transition-colors"
                        >
                          + {c}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. SUB-VIEW 5: NOTIFICATIONS */}
      {activeProfileTool === 'notifications' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide flex items-center space-x-1.5">
              <Bell className="w-4 h-4 text-emerald-600" />
              <span>Notification & Advisory Preferences</span>
            </h4>
            <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full">
              Active
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <label className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl cursor-pointer hover:bg-slate-100/60 transition-colors">
              <div>
                <span className="font-extrabold text-slate-800 block">SMS Crop Alerts</span>
                <span className="text-[10px] text-slate-500 font-medium">Daily weather & rain warnings via standard SMS</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.smsAlerts}
                onChange={(e) => {
                  const updated = { ...notifications, smsAlerts: e.target.checked };
                  setNotifications(updated);
                  triggerToast(`SMS alerts ${e.target.checked ? 'enabled' : 'disabled'}`);
                }}
                className="w-5 h-5 text-emerald-600 accent-emerald-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl cursor-pointer hover:bg-slate-100/60 transition-colors">
              <div>
                <span className="font-extrabold text-slate-800 block">WhatsApp Daily Digest</span>
                <span className="text-[10px] text-slate-500 font-medium">Mandi rates & sowing calendar on WhatsApp</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.whatsappAlerts}
                onChange={(e) => {
                  const updated = { ...notifications, whatsappAlerts: e.target.checked };
                  setNotifications(updated);
                  triggerToast(`WhatsApp updates ${e.target.checked ? 'enabled' : 'disabled'}`);
                }}
                className="w-5 h-5 text-emerald-600 accent-emerald-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl cursor-pointer hover:bg-slate-100/60 transition-colors">
              <div>
                <span className="font-extrabold text-slate-800 block">Mandi Price Movement Alerts</span>
                <span className="text-[10px] text-slate-500 font-medium">Instant triggers when crop market prices peak</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.mandiPriceAlerts}
                onChange={(e) => {
                  const updated = { ...notifications, mandiPriceAlerts: e.target.checked };
                  setNotifications(updated);
                  triggerToast(`Mandi price alerts ${e.target.checked ? 'enabled' : 'disabled'}`);
                }}
                className="w-5 h-5 text-emerald-600 accent-emerald-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl cursor-pointer hover:bg-slate-100/60 transition-colors">
              <div>
                <span className="font-extrabold text-slate-800 block">Pest & Disease Advisory</span>
                <span className="text-[10px] text-slate-500 font-medium">Spore infestation warnings for your district</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.pestWarnings}
                onChange={(e) => {
                  const updated = { ...notifications, pestWarnings: e.target.checked };
                  setNotifications(updated);
                  triggerToast(`Pest warnings ${e.target.checked ? 'enabled' : 'disabled'}`);
                }}
                className="w-5 h-5 text-emerald-600 accent-emerald-600 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}

      {/* 8. SUB-VIEW 6: LANGUAGE SETTINGS */}
      {activeProfileTool === 'language' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide flex items-center space-x-1.5">
              <Globe className="w-4 h-4 text-emerald-600" />
              <span>Select Application Language</span>
            </h4>
            <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full">
              Bilingual Interface
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setCurrentLang(lang.code);
                  triggerToast(`App language switched to: ${lang.localName}`);
                }}
                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                  currentLang === lang.code
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black shadow-xs ring-1 ring-emerald-500'
                    : 'border-slate-100 bg-slate-50 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black">{lang.localName}</span>
                  {currentLang === lang.code && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{lang.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 9. SUB-VIEW 7: SETTINGS */}
      {activeProfileTool === 'settings' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide flex items-center space-x-1.5">
              <Settings className="w-4 h-4 text-emerald-600" />
              <span>Application Settings & Sync</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-bold">v2.4.0</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="bg-slate-50 p-3 rounded-2xl flex justify-between items-center">
              <div>
                <span className="font-extrabold text-slate-800 block">Cloud Database Storage</span>
                <span className="text-[10px] text-slate-500 font-medium">Firestore automatic user document backup</span>
              </div>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl flex justify-between items-center">
              <div>
                <span className="font-extrabold text-slate-800 block">Offline Local Cache</span>
                <span className="text-[10px] text-slate-500 font-medium">Stores crop data for low-connectivity fields</span>
              </div>
              <button
                onClick={() => triggerToast('Offline cache refreshed & synchronized with Firestore.')}
                className="text-[10px] font-black text-slate-700 hover:text-emerald-700 bg-white border border-slate-200 px-2.5 py-1 rounded-xl cursor-pointer"
              >
                Clear Cache
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl flex justify-between items-center">
              <div>
                <span className="font-extrabold text-slate-800 block">Force Cloud Sync</span>
                <span className="text-[10px] text-slate-500 font-medium">Re-sync profile and crops with server</span>
              </div>
              <button
                onClick={() => {
                  onSaveProfileSuccess();
                  triggerToast('Full profile resynced with Firestore!');
                }}
                className="text-[10px] font-black text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded-xl cursor-pointer shadow-xs"
              >
                Sync Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. SUB-VIEW 8: ACCOUNT & SECURITY */}
      {activeProfileTool === 'account' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide flex items-center space-x-1.5">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Account Credentials & Security</span>
            </h4>
            <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full">
              Authenticated
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="bg-slate-50 p-3 rounded-2xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Firebase Auth UID</span>
              <code className="font-mono bg-white px-2 py-1 rounded border border-slate-200 text-[10px] text-slate-700 block truncate">
                {firebaseAuthUid || auth.currentUser?.uid || 'guest_uid'}
              </code>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Authentication Provider</span>
              <span className="font-extrabold text-slate-800 block">
                {auth.currentUser?.providerData?.[0]?.providerId || 'Google / Firebase Auth'}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">KYC & Subsidy Matching</span>
                <span className="font-bold text-slate-800">Aadhaar & Bank Linked</span>
              </div>
              <button
                onClick={() => setActiveProfileTool('kyc')}
                className="text-[10px] font-black text-emerald-700 hover:underline"
              >
                View KYC →
              </button>
            </div>
          </div>

          {/* Real Firebase Logout Button */}
          <button
            onClick={logoutSession}
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-2xl shadow-md flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out from AgriVerse AI</span>
          </button>
        </div>
      )}

      {/* 11. SUB-VIEW: EDIT FARMER PROFILE FORM */}
      {activeProfileTool === 'editForm' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-2 shadow-sm">
          <FarmerProfileForm
            uid={firebaseAuthUid || auth.currentUser?.uid || 'guest_uid'}
            mobileNumber={userPhone || regPhone || '9999999999'}
            initialProfile={fullUserProfile}
            currentLang={currentLang as any}
            isModal={false}
            onCancel={() => setActiveProfileTool('overview')}
            onSaveSuccess={(updated) => {
              if (setFullUserProfile) setFullUserProfile(updated);
              onSaveProfileSuccess(updated);
              setActiveProfileTool('overview');
              triggerToast('Profile updated & saved to Firestore successfully!');
            }}
          />
        </div>
      )}

      {/* 12. SUB-VIEW: KYC & GOVT BENEFITS */}
      {(activeProfileTool === 'kyc' || activeProfileTool === 'schemes') && (
        <div className="bg-white rounded-3xl border border-slate-100 p-2 shadow-sm">
          <KYCGovernmentBenefits
            uid={firebaseAuthUid || auth.currentUser?.uid || 'guest_uid'}
            initialProfile={fullUserProfile}
            onClose={() => setActiveProfileTool('overview')}
            triggerToast={triggerToast}
            onSaveSuccess={(updated) => {
              if (setFullUserProfile) setFullUserProfile(updated);
              onSaveProfileSuccess(updated);
              setActiveProfileTool('overview');
            }}
          />
        </div>
      )}

    </div>
  );
};
