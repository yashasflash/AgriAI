import React, { createContext, useContext, useState } from 'react';
import { en } from './en';
import { kn } from './kn';
import { hi } from './hi';

export const translations = { en, kn, hi };

export const LANGUAGE_STORAGE_KEY = 'agriai_language';

export const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: en,
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

  const t = translations[language] || translations.en;

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
      t: en,
    };
  }
  return context;
}
