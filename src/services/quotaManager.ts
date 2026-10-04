/**
 * Central Production Quota & Provider State Manager
 * 
 * Manages rate limits, provider health, cache hits, and ensures
 * zero-billing by preventing cascading calls to paid APIs.
 */

export type ProviderState = 
  | 'ACTIVE'
  | 'TEMPORARILY_UNAVAILABLE'
  | 'QUOTA_EXCEEDED'
  | 'DISABLED'
  | 'ERROR';

export interface ProviderMetrics {
  name: string;
  isPaid: boolean;
  state: ProviderState;
  requestCount: number;
  cacheHits: number;
  errorCount: number;
  lastError?: string;
  lastRequestTime?: number;
  quotaResetTime?: number;
}

class CentralQuotaManager {
  private metrics: Map<string, ProviderMetrics> = new Map();
  private requestTimestamps: Map<string, number[]> = new Map();

  constructor() {
    this.registerProvider('gemini_ai_free', false, 'ACTIVE');
    this.registerProvider('gemini_ai_paid', true, 'DISABLED');
    this.registerProvider('open_meteo_weather', false, 'ACTIVE');
    this.registerProvider('premium_weather', true, 'DISABLED');
    this.registerProvider('device_speech', false, 'ACTIVE');
    this.registerProvider('premium_speech', true, 'DISABLED');
    this.registerProvider('local_storage', false, 'ACTIVE');
    this.registerProvider('cloud_storage_paid', true, 'DISABLED');
    this.registerProvider('gov_open_data', false, 'ACTIVE');
    this.registerProvider('premium_gov_data', true, 'DISABLED');
  }

  public registerProvider(name: string, isPaid: boolean, initialState: ProviderState = 'ACTIVE'): void {
    this.metrics.set(name, {
      name,
      isPaid,
      state: initialState,
      requestCount: 0,
      cacheHits: 0,
      errorCount: 0
    });
    this.requestTimestamps.set(name, []);
  }

  public canExecute(providerName: string, maxRpm: number = 15): { allowed: boolean; reason?: string } {
    const metric = this.metrics.get(providerName);
    if (!metric) {
      return { allowed: false, reason: `Unknown provider: ${providerName}` };
    }

    if (metric.isPaid) {
      return { 
        allowed: false, 
        reason: 'Paid provider is strictly dormant under zero-billing policy.' 
      };
    }

    if (metric.state === 'DISABLED') {
      return { allowed: false, reason: 'Provider is disabled in feature configuration.' };
    }

    if (metric.state === 'QUOTA_EXCEEDED') {
      const now = Date.now();
      if (metric.quotaResetTime && now > metric.quotaResetTime) {
        // Reset state after quota window has elapsed
        metric.state = 'ACTIVE';
      } else {
        return { 
          allowed: false, 
          reason: 'Daily/RPM free quota currently exhausted. Seamless fallback active.' 
        };
      }
    }

    // Rate Limiting (Sliding Window RPM)
    const now = Date.now();
    const timestamps = this.requestTimestamps.get(providerName) || [];
    const validTimestamps = timestamps.filter(t => now - t < 60000);
    this.requestTimestamps.set(providerName, validTimestamps);

    if (validTimestamps.length >= maxRpm) {
      metric.state = 'QUOTA_EXCEEDED';
      metric.quotaResetTime = now + 60000;
      return { 
        allowed: false, 
        reason: `Rate limit of ${maxRpm} RPM reached. Switching to local agricultural intelligence.` 
      };
    }

    return { allowed: true };
  }

  public recordRequest(providerName: string): void {
    const metric = this.metrics.get(providerName);
    if (metric) {
      metric.requestCount++;
      metric.lastRequestTime = Date.now();
      const timestamps = this.requestTimestamps.get(providerName) || [];
      timestamps.push(Date.now());
      this.requestTimestamps.set(providerName, timestamps);
    }
  }

  public recordCacheHit(providerName: string): void {
    const metric = this.metrics.get(providerName);
    if (metric) {
      metric.cacheHits++;
    }
  }

  public recordError(providerName: string, error: any): void {
    const metric = this.metrics.get(providerName);
    if (metric) {
      metric.errorCount++;
      metric.lastError = error?.message || String(error);

      // Detect 429 quota exhaustion
      const errStr = String(error?.message || error).toLowerCase();
      if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('resource_exhausted')) {
        metric.state = 'QUOTA_EXCEEDED';
        metric.quotaResetTime = Date.now() + 5 * 60 * 1000; // 5 minute backoff
      } else {
        metric.state = 'TEMPORARILY_UNAVAILABLE';
      }
    }
  }

  public getProviderState(providerName: string): ProviderState {
    return this.metrics.get(providerName)?.state || 'DISABLED';
  }

  public getAllMetrics(): ProviderMetrics[] {
    return Array.from(this.metrics.values());
  }
}

export const quotaManager = new CentralQuotaManager();
