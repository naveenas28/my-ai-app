import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../firebase';
import { signInAnonymously, ConfirmationResult, User } from 'firebase/auth';

/**
 * Modular Authentication Configuration
 * Toggle USE_DEV_OTP to switch between Development OTP and Production Firebase SMS OTP.
 */
export const USE_DEV_OTP = true;

export interface DevOtpSession {
  phoneNumber: string;
  otpCode: string;
  generatedAt: number;
}

// In-memory Dev OTP session store
let currentDevSession: DevOtpSession | null = null;
let activeConfirmationResult: ConfirmationResult | null = null;

/**
 * Generate a random 6-digit OTP string
 */
export function generateRandomOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Get the active Dev OTP code (for development UI panel display)
 */
export function getActiveDevOtp(): string | null {
  return currentDevSession?.otpCode || null;
}

/**
 * Sends OTP code (Dev Mode or Real Firebase Phone Auth)
 */
export async function requestPhoneOtp(
  phoneNumber: string,
  langCode: string = 'en',
  recaptchaContainerId: string = 'recaptcha-container'
): Promise<{ success: boolean; devOtp?: string; message?: string }> {
  auth.languageCode = langCode;

  if (USE_DEV_OTP) {
    // Development OTP Mode
    const devOtp = generateRandomOtp();
    currentDevSession = {
      phoneNumber,
      otpCode: devOtp,
      generatedAt: Date.now()
    };
    console.log('OTP Generated:', devOtp);
    
    // Ensure Firebase auth session exists via anonymous sign-in if not signed in
    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.warn('Anonymous auth init error in dev mode:', err);
      }
    }

    return {
      success: true,
      devOtp,
      message: `[Development Mode] OTP generated: ${devOtp}`
    };
  }

  // Real Firebase Phone Auth Mode
  try {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.warn('Error clearing recaptcha:', e);
      }
      window.recaptchaVerifier = null;
    }

    const recaptchaElement = document.getElementById(recaptchaContainerId);
    if (recaptchaElement) {
      recaptchaElement.innerHTML = '';
    }

    window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => {
        if (window.recaptchaVerifier) {
          try { window.recaptchaVerifier.clear(); } catch (e) {}
          window.recaptchaVerifier = null;
        }
      }
    });

    const confirmation = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
    activeConfirmationResult = confirmation;
    window.confirmationResult = confirmation;

    return {
      success: true,
      message: `SMS code sent to ${phoneNumber}`
    };
  } catch (error: any) {
    console.error('Firebase Phone Auth Error:', error);
    if (window.recaptchaVerifier) {
      try { window.recaptchaVerifier.clear(); } catch (e) {}
      window.recaptchaVerifier = null;
    }
    throw error;
  }
}

/**
 * Verifies OTP code
 */
export async function verifyPhoneOtp(
  inputOtp: string,
  phoneNumber: string
): Promise<{ user: User | { uid: string; phoneNumber: string } }> {
  const cleanOtp = inputOtp.trim();
  console.log('OTP Entered:', cleanOtp);

  if (USE_DEV_OTP) {
    if (!currentDevSession || currentDevSession.otpCode !== cleanOtp) {
      console.warn('OTP Mismatch: Entered', cleanOtp, 'Expected', currentDevSession?.otpCode);
      throw new Error('Invalid OTP');
    }

    console.log('OTP Matched');

    // Ensure user session exists in Firebase Auth
    let user = auth.currentUser;
    if (!user) {
      try {
        const anonRes = await signInAnonymously(auth);
        user = anonRes.user;
      } catch (err) {
        console.warn('Anonymous sign in error:', err);
      }
    }

    const fallbackUid = user?.uid || `dev_user_${Date.now()}`;

    return {
      user: {
        uid: fallbackUid,
        phoneNumber: phoneNumber
      }
    };
  }

  // Real Firebase Phone Auth Verification
  const confirmation = activeConfirmationResult || window.confirmationResult;
  if (!confirmation) {
    throw new Error('Session expired. Please request a new verification code.');
  }

  const result = await confirmation.confirm(cleanOtp);
  console.log('OTP Matched');
  console.log('Firebase Authenticated:', true);
  console.log('Firebase UID:', result.user.uid);
  console.log('Firebase Phone:', result.user.phoneNumber || phoneNumber);
  return { user: result.user };
}
