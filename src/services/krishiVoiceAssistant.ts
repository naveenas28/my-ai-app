/**
 * Krishi AI Voice Assistant Service
 * 
 * Provides robust Web Speech API integration for Microsoft Edge and Google Chrome.
 * - Accurate microphone permission verification (granted, denied, prompt)
 * - Safe SpeechRecognition lifecycle management (avoids duplicate instances & premature GC)
 * - Granular error handling (not-allowed, service-not-allowed, no-speech, audio-capture, network, aborted)
 * - Detailed debugging telemetry
 */

export type MicPermissionState = 'granted' | 'denied' | 'prompt';

export const KRISHI_VOICE_LANG_MAP: Record<string, string> = {
  en: 'en-IN',
  kn: 'kn-IN',
  ta: 'ta-IN',
  hi: 'hi-IN',
  te: 'te-IN',
  ml: 'ml-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  pa: 'pa-IN'
};

/**
 * Returns the browser's native SpeechRecognition constructor if available.
 */
export function getSpeechRecognitionClass(): any {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

/**
 * Checks and requests microphone permissions correctly, distinguishing between
 * 'granted', 'denied', and 'prompt' states.
 */
export async function checkMicrophonePermission(): Promise<MicPermissionState> {
  let state: MicPermissionState = 'prompt';

  // 1. Query browser permissions API if supported
  if (typeof navigator !== 'undefined' && navigator.permissions && typeof navigator.permissions.query === 'function') {
    try {
      const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (status && (status.state === 'granted' || status.state === 'denied' || status.state === 'prompt')) {
        state = status.state;
      }
    } catch {
      // Some browsers (e.g. older Edge or Safari) throw when querying 'microphone'.
      // Fallback to getUserMedia below.
    }
  }

  // 2. If prompt, query getUserMedia to allow the user to grant or confirm
  if (state === 'prompt') {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        state = 'granted';
        // Immediately release stream tracks so SpeechRecognition has dedicated device access
        stream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {}
        });
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          state = 'denied';
        } else {
          console.warn('[Krishi Voice] getUserMedia non-permission notice:', err?.name);
        }
      }
    }
  }

  return state;
}

/**
 * Maps SpeechRecognition error codes to specific, helpful user guidance.
 * When permission is already granted, it shows the real reason instead of
 * falsely claiming microphone permission is missing.
 */
export function getKrishiVoiceErrorMessage(
  error: string,
  permissionState: MicPermissionState | null
): string {
  switch (error) {
    case 'not-allowed':
    case 'permission-denied':
      if (permissionState === 'denied') {
        return 'Microphone permission is denied. Please allow microphone access in your browser settings.';
      }
      if (permissionState === 'granted') {
        return 'Speech recognition service was not allowed by the browser/system (error: not-allowed). Please check browser or Windows speech service settings, or type your question.';
      }
      return 'Microphone access was not allowed. Please verify browser microphone permissions.';

    case 'service-not-allowed':
      return 'Speech recognition service is not allowed or is disabled on this device or network.';

    case 'no-speech':
      return 'No speech was detected. Tap the microphone and speak clearly.';

    case 'audio-capture':
      return 'No microphone was detected or audio capture failed. Check your microphone hardware.';

    case 'network':
      return 'Network error occurred during speech recognition. Please check your internet connection.';

    case 'aborted':
      return 'Speech input was stopped.';

    case 'browser-not-supported':
      return 'Speech recognition is not supported in this browser. Please use Microsoft Edge or Google Chrome.';

    default:
      return `Speech recognition notice: ${error || 'Speech interrupted'}. Tap to retry or type your question.`;
  }
}

export const KRISHI_LANG_KEYWORDS: Record<string, string[]> = {
  kn: ['kannada', 'kn-in', 'kn_in', 'kn'],
  hi: ['hindi', 'hi-in', 'hi_in', 'hi'],
  te: ['telugu', 'te-in', 'te_in', 'te'],
  ta: ['tamil', 'ta-in', 'ta_in', 'ta'],
  ml: ['malayalam', 'ml-in', 'ml_in', 'ml'],
  bn: ['bengali', 'bangla', 'bn-in', 'bn_in', 'bn'],
  mr: ['marathi', 'mr-in', 'mr_in', 'mr'],
  pa: ['punjabi', 'pa-in', 'pa_in', 'pa'],
  en: ['english', 'en-in', 'en_in', 'en-us', 'en-gb', 'en']
};

/**
 * Finds the closest available browser speech synthesis voice based on user's language selection.
 * Handles exact BCP-47 match, prefix match, voice name inspection (e.g. "Google हिन्दी"),
 * with graceful Indian-English and default voice fallback.
 */
export function getBestSpeechSynthesisVoice(lang: string): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  let voices: SpeechSynthesisVoice[] = [];
  try {
    voices = window.speechSynthesis.getVoices() || [];
  } catch {
    return null;
  }

  if (!voices || voices.length === 0) return null;

  const targetTag = (KRISHI_VOICE_LANG_MAP[lang] || 'en-IN').toLowerCase();
  const prefix = targetTag.split('-')[0].toLowerCase();
  const keywords = KRISHI_LANG_KEYWORDS[lang] || [prefix];

  // 1. Exact BCP-47 match (e.g. 'kn-IN', 'hi-IN')
  const exact = voices.find(v => v.lang && v.lang.toLowerCase() === targetTag);
  if (exact) return exact;

  // 2. Prefix match on voice.lang (e.g. 'kn', 'hi', 'te')
  const prefixMatch = voices.find(v => {
    if (!v.lang) return false;
    const l = v.lang.toLowerCase();
    return l.startsWith(prefix + '-') || l.startsWith(prefix + '_') || l === prefix;
  });
  if (prefixMatch) return prefixMatch;

  // 3. Name keywords match on voice.name (e.g. 'Google ಕನ್ನಡ', 'Microsoft Heera - Hindi (India)')
  const nameMatch = voices.find(v => {
    const vName = (v.name || '').toLowerCase();
    return keywords.some(kw => vName.includes(kw));
  });
  if (nameMatch) return nameMatch;

  // 4. Indian English fallback if regional Indian language was selected
  if (prefix !== 'en') {
    const indianEnglish = voices.find(v => {
      const l = (v.lang || '').toLowerCase();
      const n = (v.name || '').toLowerCase();
      return l === 'en-in' || l === 'en_in' || n.includes('india');
    });
    if (indianEnglish) return indianEnglish;
  }

  // 5. Any English voice fallback
  const anyEnglish = voices.find(v => (v.lang || '').toLowerCase().startsWith('en'));
  if (anyEnglish) return anyEnglish;

  // 6. Default or first available voice
  const defaultVoice = voices.find(v => v.default);
  return defaultVoice || voices[0] || null;
}
