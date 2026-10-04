/**
 * AI Service Provider Abstraction
 * 
 * Free Provider: Uses Google AI Studio Free Tier (15 RPM, 1500 RPD) via secure server endpoint.
 * Paid Provider: Strictly dormant adapter for future optional activation.
 */

import { APP_FEATURES } from '../../config/features';
import { quotaManager } from '../quotaManager';

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  time?: string;
  sourceLabel?: 'REAL DATA' | 'CACHED DATA' | 'CALCULATED DATA' | 'AI-GENERATED ADVICE';
}

export interface IAIService {
  sendMessage(
    query: string, 
    context?: {
      language?: string;
      farmerProfile?: any;
      uid?: string;
      previousChat?: any[];
    }
  ): Promise<{ text: string; sourceLabel: string; isFallback: boolean }>;
}

export class GeminiFreeProvider implements IAIService {
  async sendMessage(
    query: string,
    context: {
      language?: string;
      farmerProfile?: any;
      uid?: string;
      previousChat?: any[];
    } = {}
  ): Promise<{ text: string; sourceLabel: string; isFallback: boolean }> {
    const check = quotaManager.canExecute('gemini_ai_free', 15);
    if (!check.allowed) {
      quotaManager.recordCacheHit('gemini_ai_free');
      return {
        text: `[CACHED ADVICE / OFFLINE FALLBACK] Free request limit reached for this minute. Showing verified agricultural guidance. Please retry shortly.`,
        sourceLabel: 'CACHED DATA',
        isFallback: true
      };
    }

    quotaManager.recordRequest('gemini_ai_free');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          language: context.language || 'en',
          farmerProfile: context.farmerProfile,
          uid: context.uid,
          previousChat: context.previousChat
        })
      });

      if (!response.ok) {
        throw new Error(`Server status ${response.status}`);
      }

      const data = await response.json();
      return {
        text: data.text,
        sourceLabel: data.sourceLabel || (data.isFallback ? 'CACHED DATA' : 'AI-GENERATED ADVICE'),
        isFallback: Boolean(data.isFallback)
      };
    } catch (err: any) {
      quotaManager.recordError('gemini_ai_free', err);
      return {
        text: `[LOCAL KNOWLEDGE FALLBACK] Unable to reach cloud agent (${err?.message || 'offline'}). Farmer data and local agricultural rules remain active.`,
        sourceLabel: 'CACHED DATA',
        isFallback: true
      };
    }
  }
}

export class GeminiPaidProvider implements IAIService {
  async sendMessage(): Promise<never> {
    throw new Error(
      'GeminiPaidProvider is strictly dormant. Zero-billing policy prohibits paid AI invocations.'
    );
  }
}

// Active Service Factory
export function getActiveAIService(): IAIService {
  if (APP_FEATURES.AI_PAID_ENABLED) {
    return new GeminiPaidProvider();
  }
  return new GeminiFreeProvider();
}
