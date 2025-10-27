export const locales = ['en', 'zh', 'ja', 'de', 'fr', 'es', 'ko', 'it', 'ar', 'nl'] as const;
export type Locale = typeof locales[number];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '中文 (Chinese)',
  ja: '日本語 (Japanese)',
  de: 'Deutsch (German)',
  fr: 'Français (French)',
  es: 'Español (Spanish)',
  ko: '한국어 (Korean)',
  it: 'Italiano (Italian)',
  ar: 'العربية (Arabic)',
  nl: 'Nederlands (Dutch)',
};

export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  zh: '🇨🇳',
  ja: '🇯🇵',
  de: '🇩🇪',
  fr: '🇫🇷',
  es: '🇪🇸',
  ko: '🇰🇷',
  it: '🇮🇹',
  ar: '🇸🇦',
  nl: '🇳🇱',
};

// Translation keys for homepage - we'll use API for dynamic content later
export const homepageTranslations: Partial<Record<Locale, any>> = {
  en: {
    // This will be English content - we'll keep English as-is for now
    // For other languages, we'll use the translation API
  }
};

