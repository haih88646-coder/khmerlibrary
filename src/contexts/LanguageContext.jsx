import { createContext, useContext, useState, useCallback } from 'react';
import { t as translate, setLanguage as setLang, getLanguage, getLocalizedField } from '../i18n';

const LanguageContext = createContext(null);

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(getLanguage);

  const t = useCallback((path) => translate(path, lang), [lang]);

  const toggleLanguage = useCallback(() => {
    const newLang = lang === 'km' ? 'en' : 'km';
    setLangState(newLang);
    setLang(newLang);
  }, [lang]);

  const setLanguage = useCallback((newLang) => {
    setLangState(newLang);
    setLang(newLang);
  }, []);

  const localize = useCallback((obj, field) => {
    return getLocalizedField(obj, field, lang);
  }, [lang]);

  const value = { lang, t, toggleLanguage, setLanguage, localize };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
