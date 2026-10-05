import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { User, updateProfile } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';

export interface UserProfileDoc {
  uid: string;
  phoneNumber: string;
  mobileNumber: string;
  fullName: string;
  name: string;
  gender: string;
  dateOfBirth: string;
  dob: string;
  village: string;
  villageName?: string;
  subDistrict?: string;
  subDistrictName?: string;
  subDistrictCode?: string;
  district: string;
  districtName?: string;
  districtCode?: string;
  state: string;
  stateName?: string;
  stateCode?: string;
  country: string;
  countryName?: string;
  countryCode?: string;
  farmName: string;
  farmSize: number;
  farmSizeAcres: number;
  farmingType: string;
  soilType: string;
  waterSource: string;
  primaryCrops: string[];
  crops?: string[];
  preferredLanguage: string;
  language: string;
  profilePhotoUrl: string;
  photoURL: string;
  createdAt: string;
  updatedAt: string;
  profileCompleted: boolean;
  role: string;
  accountStatus: string;
  loginMethod?: string;
  lastLogin?: string;
  pincode?: string;
  machineryOwned?: string[];
  bankName?: string;
  bankAccountNo?: string;
  ifscCode?: string;
  bankBranch?: string;
  aadhaarNumber?: string;
  govtSchemesInterest?: string[];
  smsAlertsEnabled?: boolean;
  farmerType?: string;
}

/**
 * Client-side image compression using HTML5 Canvas.
 * Resizes the image to 300x300 max dimensions and compresses to JPEG data URL (~15-30KB).
 */
export async function compressImage(
  file: File,
  maxWidth = 300,
  maxHeight = 300,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read selected image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse selected image file.'));
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas 2D context non-available for compression.'));
            return;
          }

          // Fill white background in case source is transparent PNG
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses photo on client-side and stores the lightweight Data URL in Firestore under `users/{uid}`.
 * Works strictly on Firebase Free (Spark $0) plan without requiring Cloud Storage billing.
 */
export async function uploadProfilePhoto(uid: string, file: File): Promise<string> {
  const currentUid = auth.currentUser?.uid || uid || localStorage.getItem('agri_user_uid');
  if (!currentUid) {
    throw new Error('User session not found. Please log in.');
  }
  if (!file) return '';

  // Validate image file type
  if (file.type && !file.type.startsWith('image/')) {
    throw new Error('Invalid file type. Please select an image file (JPEG, PNG, WEBP).');
  }

  // Validate raw size limit before compression (10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image file is too large. Please select a photo under 10MB.');
  }

  console.log('Profile photo client compression started for UID:', currentUid);

  try {
    // Compress image to ~15-30KB JPEG Data URL using HTML5 canvas
    const dataUrl = await compressImage(file, 300, 300, 0.75);

    // Verify compressed size fits well within Firestore's 1MB document limit
    if (dataUrl.length > 500000) {
      throw new Error('Compressed image is still too large for document storage. Please choose a smaller image.');
    }

    console.log(`Image compressed successfully. Data URL length: ${dataUrl.length} chars`);

    // 1. Save to local device storage / cache immediately (Zero-cost, instant offline-ready)
    localStorage.setItem(`profile_photo_${currentUid}`, dataUrl);
    localStorage.setItem('agri_profile_photo', dataUrl);

    try {
      const localData = localStorage.getItem(`agri_profile_${currentUid}`) || localStorage.getItem('agri_user_profile');
      if (localData) {
        const parsed = JSON.parse(localData);
        parsed.profilePhotoUrl = dataUrl;
        parsed.photoURL = dataUrl;
        parsed.updatedAt = new Date().toISOString();
        localStorage.setItem(`agri_profile_${currentUid}`, JSON.stringify(parsed));
        localStorage.setItem('agri_user_profile', JSON.stringify(parsed));
      }
    } catch (cacheErr) {
      console.warn('Cache profile update warning:', cacheErr);
    }

    // 2. If authenticated user exists, sync metadata and photo Data URL to Firestore users/{uid}
    if (auth.currentUser && auth.currentUser.uid === currentUid) {
      try {
        const userRef = doc(db, 'users', currentUid);
        await setDoc(userRef, {
          profilePhotoUrl: dataUrl,
          photoURL: dataUrl,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log('Firestore profilePhotoUrl updated successfully under users/' + currentUid);
      } catch (firestoreErr: any) {
        console.warn('Firestore profile photo sync notice (local device storage preserved):', firestoreErr?.message || firestoreErr);
      }

      if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
        try {
          await updateProfile(auth.currentUser, { photoURL: dataUrl });
          console.log('Firebase Auth user photoURL updated');
        } catch (authErr) {
          console.warn('Could not update Firebase Auth user profile photoURL:', authErr);
        }
      }
    }

    return dataUrl;
  } catch (error: any) {
    console.error('Failed to compress or save profile photo:', error);
    const fallbackPhoto = localStorage.getItem(`profile_photo_${currentUid}`) || localStorage.getItem('agri_profile_photo');
    if (fallbackPhoto) {
      return fallbackPhoto;
    }
    throw error;
  }
}

/**
 * Retrieves the authenticated user's profile document from Firestore (`users/{uid}`).
 * Falls back to local storage cache if network fails or user is offline.
 */
export async function getUserProfile(uid: string): Promise<UserProfileDoc | null> {
  if (!uid) return null;

  // 1. Try local cache for immediate UI rendering or offline mode
  let cachedProfile: UserProfileDoc | null = null;
  const localData = localStorage.getItem(`agri_profile_${uid}`) || localStorage.getItem('agri_user_profile');
  if (localData) {
    try {
      cachedProfile = JSON.parse(localData);
    } catch (e) {
      console.warn('Error parsing cached local profile:', e);
    }
  }

  // 2. Fetch fresh profile directly from Firestore `users/{uid}`
  try {
    const userRef = doc(db, 'users', uid);
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));
    const docSnap = await Promise.race([getDoc(userRef), timeoutPromise]) as any;

    if (docSnap && typeof docSnap.exists === 'function' && docSnap.exists()) {
      const remoteData = docSnap.data() as UserProfileDoc;
      
      // Ensure all standardized field mappings exist
      const normalizedData: UserProfileDoc = {
        ...remoteData,
        uid,
        phoneNumber: remoteData.phoneNumber || remoteData.mobileNumber || '',
        mobileNumber: remoteData.mobileNumber || remoteData.phoneNumber || '',
        fullName: remoteData.fullName || remoteData.name || 'Farmer Partner',
        name: remoteData.name || remoteData.fullName || 'Farmer Partner',
        gender: remoteData.gender || 'Male',
        dateOfBirth: remoteData.dateOfBirth || remoteData.dob || '',
        dob: remoteData.dob || remoteData.dateOfBirth || '',
        village: remoteData.village || '',
        subDistrict: remoteData.subDistrict || '',
        district: remoteData.district || '',
        state: remoteData.state || 'Karnataka',
        stateCode: remoteData.stateCode || '',
        country: remoteData.country || 'India',
        countryCode: remoteData.countryCode || 'IN',
        farmName: remoteData.farmName || 'My Farm',
        farmSize: Number(remoteData.farmSize ?? remoteData.farmSizeAcres ?? 1),
        farmSizeAcres: Number(remoteData.farmSizeAcres ?? remoteData.farmSize ?? 1),
        farmingType: remoteData.farmingType || 'Conventional',
        soilType: remoteData.soilType || 'Red Loam',
        waterSource: remoteData.waterSource || 'Borewell',
        primaryCrops: remoteData.primaryCrops || remoteData.crops || ['Ragi', 'Tomato'],
        crops: remoteData.crops || remoteData.primaryCrops || ['Ragi', 'Tomato'],
        preferredLanguage: remoteData.preferredLanguage || remoteData.language || 'en',
        language: remoteData.language || remoteData.preferredLanguage || 'en',
        profilePhotoUrl: remoteData.profilePhotoUrl || remoteData.photoURL || '',
        photoURL: remoteData.photoURL || remoteData.profilePhotoUrl || '',
        createdAt: remoteData.createdAt || new Date().toISOString(),
        updatedAt: remoteData.updatedAt || new Date().toISOString(),
        profileCompleted: remoteData.profileCompleted ?? true,
        role: remoteData.role || 'farmer',
        accountStatus: remoteData.accountStatus || 'active',
      };

      // Save fresh remote profile to local storage cache
      localStorage.setItem(`agri_profile_${uid}`, JSON.stringify(normalizedData));
      localStorage.setItem('agri_user_profile', JSON.stringify(normalizedData));
      return normalizedData;
    }

    return cachedProfile;
  } catch (error) {
    console.error(`Firestore getUserProfile error for users/${uid}:`, error);
    try {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    } catch (e) {
      // Logged via handleFirestoreError
    }
    return cachedProfile;
  }
}

/**
 * Saves or updates the authenticated farmer profile in Firestore under `users/{uid}`.
 * Persists locally to localStorage as well so profile data is never lost offline.
 */
export async function saveFarmerProfile(
  uid: string,
  data: Partial<UserProfileDoc>
): Promise<UserProfileDoc & { _savedToCloud?: boolean }> {
  if (!uid) {
    throw new Error('User UID is required to save profile.');
  }

  const userRef = doc(db, 'users', uid);
  const now = new Date().toISOString();

  // Retrieve existing local profile if available to preserve created timestamps and other fields
  let existingData: Partial<UserProfileDoc> = {};
  const localData = localStorage.getItem(`agri_profile_${uid}`) || localStorage.getItem('agri_user_profile');
  if (localData) {
    try {
      existingData = JSON.parse(localData);
    } catch (e) {
      console.warn('Could not parse local profile cache:', e);
    }
  }

  const rawPhone = data.phoneNumber || data.mobileNumber || existingData.phoneNumber || existingData.mobileNumber || auth.currentUser?.phoneNumber || '';
  const rawName = data.fullName || data.name || existingData.fullName || existingData.name || 'Farmer Partner';
  const rawDob = data.dateOfBirth || data.dob || existingData.dateOfBirth || existingData.dob || '';
  const rawLang = data.preferredLanguage || data.language || existingData.preferredLanguage || existingData.language || 'en';
  const rawPhoto = data.profilePhotoUrl || data.photoURL || existingData.profilePhotoUrl || existingData.photoURL || '';
  const rawFarmSize = Number(data.farmSize ?? data.farmSizeAcres ?? existingData.farmSize ?? existingData.farmSizeAcres ?? 1);
  const rawCrops = data.primaryCrops && data.primaryCrops.length > 0
    ? data.primaryCrops
    : (existingData.primaryCrops || ['Ragi', 'Tomato']);

  const profileData: UserProfileDoc = {
    uid,
    phoneNumber: rawPhone,
    mobileNumber: rawPhone,
    fullName: rawName,
    name: rawName,
    gender: data.gender || existingData.gender || 'Male',
    dateOfBirth: rawDob,
    dob: rawDob,
    village: data.village !== undefined ? data.village : (existingData.village || ''),
    subDistrict: data.subDistrict !== undefined ? data.subDistrict : (existingData.subDistrict || ''),
    district: data.district || existingData.district || 'Chikkaballapura',
    state: data.state || existingData.state || 'Karnataka',
    stateCode: data.stateCode || existingData.stateCode || '',
    country: data.country || existingData.country || 'India',
    countryCode: data.countryCode || existingData.countryCode || 'IN',
    farmName: data.farmName || existingData.farmName || 'My Farm',
    farmSize: rawFarmSize,
    farmSizeAcres: rawFarmSize,
    farmingType: data.farmingType || existingData.farmingType || 'Conventional',
    soilType: data.soilType || existingData.soilType || 'Red Loam',
    waterSource: data.waterSource || existingData.waterSource || 'Borewell',
    primaryCrops: rawCrops,
    crops: rawCrops,
    preferredLanguage: rawLang,
    language: rawLang,
    profilePhotoUrl: rawPhoto,
    photoURL: rawPhoto,
    createdAt: existingData.createdAt || now,
    updatedAt: now,
    profileCompleted: true,
    role: existingData.role || 'farmer',
    accountStatus: existingData.accountStatus || 'active',
    loginMethod: existingData.loginMethod || 'Phone OTP',
    lastLogin: now,
    pincode: data.pincode !== undefined ? data.pincode : (existingData.pincode || ''),
    machineryOwned: data.machineryOwned !== undefined ? data.machineryOwned : (existingData.machineryOwned || []),
    bankName: data.bankName !== undefined ? data.bankName : (existingData.bankName || ''),
    bankAccountNo: data.bankAccountNo !== undefined ? data.bankAccountNo : (existingData.bankAccountNo || ''),
    ifscCode: data.ifscCode !== undefined ? data.ifscCode : (existingData.ifscCode || ''),
    bankBranch: data.bankBranch !== undefined ? data.bankBranch : (existingData.bankBranch || ''),
    aadhaarNumber: data.aadhaarNumber !== undefined ? data.aadhaarNumber : (existingData.aadhaarNumber || ''),
    govtSchemesInterest: data.govtSchemesInterest !== undefined ? data.govtSchemesInterest : (existingData.govtSchemesInterest || []),
    smsAlertsEnabled: data.smsAlertsEnabled !== undefined ? data.smsAlertsEnabled : (existingData.smsAlertsEnabled ?? true),
    farmerType: data.farmerType || existingData.farmerType || 'Registered Farmer',
  };

  // Save to local storage cache immediately
  try {
    localStorage.setItem(`agri_profile_${uid}`, JSON.stringify(profileData));
    localStorage.setItem('agri_user_profile', JSON.stringify(profileData));
    localStorage.setItem('agri_user_uid', uid);
    localStorage.setItem('agri_verified_farmer', 'true');
    if (profileData.name) {
      localStorage.setItem('agri_partner_name', profileData.name);
    }
  } catch (e) {
    console.warn('localStorage write error:', e);
  }

  // Update Firestore document at users/{uid}
  let firestoreSaved = false;
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore write timed out after 8 seconds')), 8000)
    );
    await Promise.race([
      setDoc(userRef, profileData, { merge: true }),
      timeoutPromise
    ]);
    firestoreSaved = true;
    console.log(`Farmer profile successfully saved to Firestore at users/${uid}`);
  } catch (error) {
    console.error(`Firebase error saving profile to users/${uid}:`, error);
    try {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    } catch (e) {
      // Handled error
    }
  }

  return {
    ...profileData,
    _savedToCloud: firestoreSaved
  };
}

/**
 * Syncs authenticated Firebase User (Google Sign-In or Phone Auth) with Firestore at `users/{uid}`.
 */
export async function syncAuthUserWithFirestore(
  authUser: User,
  language: string = 'en',
  loginMethod: string = 'Google'
): Promise<UserProfileDoc> {
  const uid = authUser.uid;
  const userRef = doc(db, 'users', uid);
  const now = new Date().toISOString();

  const phoneStr = authUser.phoneNumber ? authUser.phoneNumber.replace('+91', '').replace(/\D/g, '') : '';
  const displayNameStr = authUser.displayName || 'Farmer Partner';
  const photoStr = authUser.photoURL || '';

  try {
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      const newUser: UserProfileDoc = {
        uid,
        phoneNumber: authUser.phoneNumber || phoneStr || '',
        mobileNumber: phoneStr || authUser.phoneNumber || '',
        fullName: displayNameStr,
        name: displayNameStr,
        gender: 'Male',
        dateOfBirth: '',
        dob: '',
        state: 'Karnataka',
        district: 'Chikkaballapura',
        village: 'Anemadagu',
        country: 'India',
        farmName: 'My Farm',
        farmSize: 1,
        farmSizeAcres: 1,
        farmingType: 'Conventional',
        soilType: 'Red Loam',
        waterSource: 'Borewell',
        primaryCrops: ['Ragi', 'Tomato'],
        crops: ['Ragi', 'Tomato'],
        preferredLanguage: language || 'en',
        language: language || 'en',
        profilePhotoUrl: photoStr,
        photoURL: photoStr,
        createdAt: now,
        updatedAt: now,
        lastLogin: now,
        loginMethod,
        profileCompleted: loginMethod === 'Google' || Boolean(authUser.displayName),
        role: 'farmer',
        accountStatus: 'active',
        farmerType: 'Registered Farmer'
      };
      await setDoc(userRef, newUser);
      console.log('Created user document in Firestore for auth user:', uid);
      return newUser;
    } else {
      const existingData = docSnap.data() as UserProfileDoc;
      const updatePayload: Partial<UserProfileDoc> = {
        lastLogin: now,
        updatedAt: now,
        language: language || existingData.language || 'en',
        preferredLanguage: language || existingData.preferredLanguage || 'en',
      };
      if (displayNameStr && (!existingData.fullName || existingData.fullName === 'Farmer Partner')) {
        updatePayload.fullName = displayNameStr;
        updatePayload.name = displayNameStr;
      }
      if (photoStr && !existingData.profilePhotoUrl && !existingData.photoURL) {
        updatePayload.profilePhotoUrl = photoStr;
        updatePayload.photoURL = photoStr;
      }
      if (phoneStr && !existingData.mobileNumber) {
        updatePayload.mobileNumber = phoneStr;
        updatePayload.phoneNumber = authUser.phoneNumber || phoneStr;
      }

      await updateDoc(userRef, updatePayload);
      console.log('Updated user document in Firestore for auth user:', uid);
      return {
        ...existingData,
        ...updatePayload
      };
    }
  } catch (error) {
    console.error('Error in syncAuthUserWithFirestore for users/', uid, error);
    try {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    } catch (e) {}

    return {
      uid,
      phoneNumber: authUser.phoneNumber || '',
      mobileNumber: phoneStr || '',
      fullName: displayNameStr,
      name: displayNameStr,
      gender: 'Male',
      dateOfBirth: '',
      dob: '',
      village: 'Anemadagu',
      district: 'Chikkaballapura',
      state: 'Karnataka',
      country: 'India',
      farmName: 'My Farm',
      farmSize: 1,
      farmSizeAcres: 1,
      farmingType: 'Conventional',
      soilType: 'Red Loam',
      waterSource: 'Borewell',
      primaryCrops: ['Ragi', 'Tomato'],
      crops: ['Ragi', 'Tomato'],
      preferredLanguage: language || 'en',
      language: language || 'en',
      profilePhotoUrl: photoStr,
      photoURL: photoStr,
      createdAt: now,
      updatedAt: now,
      profileCompleted: false,
      role: 'farmer',
      accountStatus: 'active'
    };
  }
}
export async function syncUserInFirestore(
  uid: string,
  mobileNumber: string,
  language: string = 'en',
  loginMethod: string = 'DEV_OTP',
  locationDefaults?: { state?: string; district?: string; village?: string }
): Promise<UserProfileDoc> {
  const userRef = doc(db, 'users', uid);
  const now = new Date().toISOString();

  try {
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      const newUser: UserProfileDoc = {
        uid,
        phoneNumber: mobileNumber || '',
        mobileNumber: mobileNumber || '',
        fullName: 'Farmer Partner',
        name: 'Farmer Partner',
        gender: 'Male',
        dateOfBirth: '',
        dob: '',
        state: locationDefaults?.state || 'Karnataka',
        district: locationDefaults?.district || 'Chikkaballapura',
        village: locationDefaults?.village || 'Anemadagu',
        country: 'India',
        farmName: 'My Farm',
        farmSize: 1,
        farmSizeAcres: 1,
        farmingType: 'Conventional',
        soilType: 'Red Loam',
        waterSource: 'Borewell',
        primaryCrops: ['Ragi', 'Tomato'],
        crops: ['Ragi', 'Tomato'],
        preferredLanguage: language || 'en',
        language: language || 'en',
        profilePhotoUrl: '',
        photoURL: '',
        createdAt: now,
        updatedAt: now,
        lastLogin: now,
        loginMethod,
        profileCompleted: false,
        role: 'farmer',
        accountStatus: 'active',
        farmerType: 'Registered Farmer'
      };
      await setDoc(userRef, newUser);
      console.log('User document created in Firestore at users/', uid);
      return newUser;
    } else {
      const existingData = docSnap.data() as UserProfileDoc;
      const updatePayload = {
        lastLogin: now,
        updatedAt: now,
        language: language || existingData.language || 'en',
        preferredLanguage: language || existingData.preferredLanguage || 'en',
      };
      await updateDoc(userRef, updatePayload);
      console.log('User document updated in Firestore at users/', uid);
      return {
        ...existingData,
        ...updatePayload
      };
    }
  } catch (error) {
    console.error('Error syncing user profile in Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    } catch (e) {
      // Ignored
    }
    return {
      uid,
      phoneNumber: mobileNumber,
      mobileNumber,
      fullName: 'Farmer Partner',
      name: 'Farmer Partner',
      gender: 'Male',
      dateOfBirth: '',
      dob: '',
      village: locationDefaults?.village || 'Anemadagu',
      district: locationDefaults?.district || 'Chikkaballapura',
      state: locationDefaults?.state || 'Karnataka',
      country: 'India',
      farmName: 'My Farm',
      farmSize: 1,
      farmSizeAcres: 1,
      farmingType: 'Conventional',
      soilType: 'Red Loam',
      waterSource: 'Borewell',
      primaryCrops: ['Ragi', 'Tomato'],
      crops: ['Ragi', 'Tomato'],
      preferredLanguage: language || 'en',
      language: language || 'en',
      profilePhotoUrl: '',
      photoURL: '',
      createdAt: now,
      updatedAt: now,
      profileCompleted: false,
      role: 'farmer',
      accountStatus: 'active'
    };
  }
}



