import { useCallback } from 'react';

import { useLanguagePreference } from '@/src/context/LanguageContext';
import { t, type TranslationKey } from '@/src/lib/i18n';

export function useTranslations() {
  const { language } = useLanguagePreference();

  return {
    language,
    t: useCallback(
      (key: TranslationKey, params?: Record<string, string | number>) =>
        t(language, key, params),
      [language]
    ),
  };
}
