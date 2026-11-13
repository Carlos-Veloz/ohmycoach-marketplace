import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@locales/en.json';
import es from '@locales/es.json';
import { formatNumber } from '@/lib/format';

/**
 * D-062: the product is Spanish only, informal "tú". `es` is the only active language; the browser
 * language is ignored, there is no selector and no stored preference. `en` stays as the source
 * strings and as the fallback for missing keys; it is never offered to users.
 */
export const ACTIVE_LANGUAGE = 'es';
export const FALLBACK_LANGUAGE = 'en';

export const resources = {
  en: { translation: en },
  es: { translation: es },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: ACTIVE_LANGUAGE,
  fallbackLng: FALLBACK_LANGUAGE,
  interpolation: { escapeValue: false },
  returnNull: false,
});

// `{{value, number}}` in a translation uses es-MX like every other number (D-068), not `es`.
i18n.services.formatter?.add('number', (value: number) => formatNumber(value));

export default i18n;
