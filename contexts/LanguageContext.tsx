import * as React from 'react';
import { translations, Language } from '../translations';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};


export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = React.useState<Language>(() => {
    const savedLang = localStorage.getItem('app-lang');
    return (savedLang === 'en' || savedLang === 'nl') ? savedLang : 'en';
  });

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('app-lang', newLang);
  };

  const t = React.useCallback((key: string, replacements?: Record<string, string | number>): string => {
    let translation = getNestedValue(translations[lang], key) || getNestedValue(translations.en, key) || key;

    if (replacements) {
        Object.keys(replacements).forEach(placeholder => {
            translation = translation.replace(`{${placeholder}}`, String(replacements[placeholder]));
        });
    }

    return translation;
  }, [lang]);

  const value = { lang, setLang: handleSetLang, t };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = React.useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
