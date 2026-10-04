/**
 * Storage Service Provider Abstraction
 * 
 * Free Provider: Client-side HTML5 Canvas compression (~15KB) stored in Firestore/localStorage.
 * Paid Provider: Cloud Storage (Blaze bucket) - strictly dormant under zero-billing policy.
 */

import { APP_FEATURES } from '../../config/features';

export interface IStorageService {
  compressAndStoreImage(file: File | Blob, maxWidth?: number, quality?: number): Promise<string>;
  removeImage(storageKey: string): Promise<void>;
}

export class LocalThumbnailStorageProvider implements IStorageService {
  async compressAndStoreImage(file: File | Blob, maxWidth: number = 320, quality: number = 0.6): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(e.target?.result as string);
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedBase64);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = () => reject(new Error('Failed to decode image for compression'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  }

  async removeImage(storageKey: string): Promise<void> {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  }
}

export class CloudStorageProvider implements IStorageService {
  async compressAndStoreImage(): Promise<never> {
    throw new Error('CloudStorageProvider is strictly dormant. Zero-billing policy is active.');
  }

  async removeImage(): Promise<never> {
    throw new Error('CloudStorageProvider is strictly dormant. Zero-billing policy is active.');
  }
}

export function getActiveStorageService(): IStorageService {
  if (APP_FEATURES.CLOUD_STORAGE_PAID_ENABLED) {
    return new CloudStorageProvider();
  }
  return new LocalThumbnailStorageProvider();
}
