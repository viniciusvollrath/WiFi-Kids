import { useState, useCallback } from 'react';
import { translations } from '@/data/translations';

type Language = 'en' | 'pt' | 'es';

export const useTranslation = (initialLanguage: Language = 'en') => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(initialLanguage);

  const t = useCallback((key: string) => {
    const keys = key.split('.');
    let translation: any = translations[currentLanguage];
    
    for (const k of keys) {
      translation = translation?.[k];
    }
    
    return translation || key;
  }, [currentLanguage]);

  const setLanguage = useCallback((language: Language) => {
    setCurrentLanguage(language);
  }, []);

  return { t, setLanguage, currentLanguage };
};