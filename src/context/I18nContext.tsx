import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { LanguageCode, TranslationSet } from '../types';
import { LANGUAGES, TRANSLATIONS } from '../data';
import { saveFarmerProfile } from '../services/userService';

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode, userUid?: string) => void;
  t: TranslationSet & Record<string, any>;
  languages: typeof LANGUAGES;
  formatString: (template: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Deep merge helper function so any missing translation key in a target language falls back seamlessly to English
function deepMerge(fallback: any, target: any): any {
  if (!target) return fallback;
  if (typeof fallback !== 'object' || fallback === null) return target ?? fallback;
  if (typeof target !== 'object' || target === null) return target ?? fallback;

  const result: any = Array.isArray(fallback) ? [...fallback] : { ...fallback };
  for (const key of Object.keys(target)) {
    if (target[key] !== undefined && target[key] !== null) {
      if (typeof target[key] === 'object' && !Array.isArray(target[key]) && typeof fallback[key] === 'object') {
        result[key] = deepMerge(fallback[key], target[key]);
      } else {
        result[key] = target[key];
      }
    }
  }
  return result;
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('agri_lang');
    if (saved && LANGUAGES.some(l => l.code === saved)) {
      return saved as LanguageCode;
    }
    return 'en';
  });

  const setLanguage = useCallback((newLang: LanguageCode, userUid?: string) => {
    setLanguageState(newLang);
    localStorage.setItem('agri_lang', newLang);

    // Save to Firestore user profile if logged in
    const uidToUse = userUid || localStorage.getItem('agri_user_uid');
    if (uidToUse && uidToUse !== 'guest_uid') {
      saveFarmerProfile(uidToUse, { language: newLang }).catch(err => {
        console.warn('Could not auto-save language preference to Firestore profile:', err);
      });
    }
  }, []);

  // Compute deep merged translation object with English fallback
  const t = useMemo(() => {
    const englishBase = TRANSLATIONS.en || {};
    const selectedDict = TRANSLATIONS[language] || {};
    return deepMerge(englishBase, selectedDict);
  }, [language]);

  const formatString = useCallback((template: string, vars?: Record<string, string | number>) => {
    if (!template) return '';
    if (!vars) return template;
    let res = template;
    Object.entries(vars).forEach(([k, v]) => {
      res = res.replace(new RegExp(`\\{{${k}\\}}`, 'g'), String(v));
    });
    return res;
  }, []);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, languages: LANGUAGES, formatString }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
