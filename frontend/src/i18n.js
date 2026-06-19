import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import hi from './locales/hi.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'hi', // Default language is Hindi as requested
    lng: 'hi', // force default
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

export default i18n;
