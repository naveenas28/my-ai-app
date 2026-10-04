/**
 * Speech Service Provider Abstraction
 * 
 * Free Provider: Uses device-native Web Speech Recognition & SpeechSynthesis.
 * Paid Provider: Strictly dormant adapter for future optional activation.
 */

import { APP_FEATURES } from '../../config/features';
import { cleanTextForSpeech } from '../../utils/cleanTextForSpeech';

export interface ISpeechService {
  startRecognition(
    lang: string, 
    onResult: (text: string) => void, 
    onError: (err: any) => void
  ): { stop: () => void };
  
  speakText(
    text: string, 
    lang: string, 
    onEnd?: () => void
  ): void;

  cancelSpeech(): void;
}

export class DeviceSpeechProvider implements ISpeechService {
  private recognitionInstance: any = null;

  startRecognition(
    lang: string,
    onResult: (text: string) => void,
    onError: (err: any) => void
  ): { stop: () => void } {
    if (typeof window === 'undefined') {
      onError('Device speech unavailable on server runtime');
      return { stop: () => {} };
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      onError('Browser does not support native speech recognition. Please type your query.');
      return { stop: () => {} };
    }

    try {
      const recognition = new SpeechRec();
      this.recognitionInstance = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;

      // Map language codes to regional BCP-47 speech tags
      const langMap: Record<string, string> = {
        en: 'en-IN',
        kn: 'kn-IN',
        hi: 'hi-IN',
        te: 'te-IN',
        ta: 'ta-IN',
        ml: 'ml-IN',
        mr: 'mr-IN',
        bn: 'bn-IN',
        pa: 'pa-IN'
      };
      recognition.lang = langMap[lang] || 'en-IN';

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          onResult(transcript);
        }
      };

      recognition.onerror = (e: any) => {
        onError(e?.error || 'Speech input interrupted');
      };

      recognition.start();
      return {
        stop: () => {
          try {
            recognition.stop();
          } catch {}
        }
      };
    } catch (e: any) {
      onError(e?.message || 'Failed to initialize speech input');
      return { stop: () => {} };
    }
  }

  speakText(text: string, lang: string, onEnd?: () => void): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel();

      // Clean markdown tags for natural speech synthesis
      const cleanText = cleanTextForSpeech(text);

      if (!cleanText) {
        if (onEnd) onEnd();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);

      const langMap: Record<string, string> = {
        en: 'en-IN',
        kn: 'kn-IN',
        hi: 'hi-IN',
        te: 'te-IN',
        ta: 'ta-IN',
        ml: 'ml-IN',
        mr: 'mr-IN',
        bn: 'bn-IN',
        pa: 'pa-IN'
      };
      utterance.lang = langMap[lang] || 'en-IN';
      utterance.rate = 0.95; // Slightly slower for rural accessibility

      if (onEnd) {
        utterance.onend = () => onEnd();
        utterance.onerror = () => onEnd();
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Native speech synthesis error:', err);
      if (onEnd) onEnd();
    }
  }

  cancelSpeech(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.stop();
      } catch {}
      this.recognitionInstance = null;
    }
  }
}

export class PremiumSpeechProvider implements ISpeechService {
  startRecognition(): never {
    throw new Error('PremiumSpeechProvider is dormant. Zero-billing policy is active.');
  }

  speakText(): never {
    throw new Error('PremiumSpeechProvider is dormant. Zero-billing policy is active.');
  }

  cancelSpeech(): void {}
}

export function getActiveSpeechService(): ISpeechService {
  if (APP_FEATURES.VOICE_PAID_ENABLED) {
    return new PremiumSpeechProvider();
  }
  return new DeviceSpeechProvider();
}
