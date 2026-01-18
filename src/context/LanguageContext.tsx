import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

import { getProfile } from '@/src/lib/settings';
import { isSupportedLanguage, type SupportedLanguage } from '@/src/lib/i18n';
import { useAuth } from '@/src/context/AuthContext';

const LANGUAGE_STORAGE_KEY = '@language_preference';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  isLoading: true,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
      .then((saved) => {
        if (isSupportedLanguage(saved)) {
          setLanguageState(saved);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    let isActive = true;

    if (!user) return;

    getProfile()
      .then((profile) => {
        if (!isActive) return;
        if (isSupportedLanguage(profile.language)) {
          setLanguageState(profile.language);
          AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, profile.language);
        }
      })
      .catch(() => {});

    return () => {
      isActive = false;
    };
  }, [user]);

  const setLanguage = (next: SupportedLanguage) => {
    setLanguageState(next);
    AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, next);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguagePreference() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguagePreference must be used within a LanguageProvider');
  }
  return context;
}
