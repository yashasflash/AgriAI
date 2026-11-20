import React, { createContext, useContext, useState } from 'react';
import { en } from './en';
import { kn } from './kn';
import { hi } from './hi';

export const translations = { en, kn, hi };

export const LANGUAGE_STORAGE_KEY = 'agriai_language';

export function createTranslationProxy(dict, fallbackDict = en) {
  const translateFn = (key, fallback) => {
    if (!key || typeof key !== 'string') return fallback !== undefined ? fallback : '';
    const parts = key.split('.');
    let cur = dict;
    for (const part of parts) {
      if (cur == null || typeof cur !== 'object') {
        cur = undefined;
        break;
      }
      cur = cur[part];
    }
    if (cur !== undefined && cur !== null) return cur;

    // Fallback to English dictionary if key was missing in current language
    if (fallbackDict && fallbackDict !== dict) {
      let fallbackCur = fallbackDict;
      for (const part of parts) {
        if (fallbackCur == null || typeof fallbackCur !== 'object') {
          fallbackCur = undefined;
          break;
        }
        fallbackCur = fallbackCur[part];
      }
      if (fallbackCur !== undefined && fallbackCur !== null) return fallbackCur;
    }

    return fallback !== undefined ? fallback : key;
  };
  return Object.assign(translateFn, dict);
}

const defaultT = createTranslationProxy(en);

export const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: defaultT,
});

export function LanguageProvider({ children, initialLanguage = 'en', onLanguageChange }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) || initialLanguage || 'en';
  });

  const setLanguage = (lang) => {
    if (translations[lang]) {
      setLanguageState(lang);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      if (onLanguageChange) {
        onLanguageChange(lang);
      }
    }
  };

  const activeDict = translations[language] || translations.en;
  const t = createTranslationProxy(activeDict, translations.en);

  return React.createElement(
    LanguageContext.Provider,
    { value: { language, setLanguage, t } },
    children
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'en',
      setLanguage: () => {},
      t: defaultT,
    };
  }
  return context;
}
