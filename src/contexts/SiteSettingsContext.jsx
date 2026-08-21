import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSiteSettings } from '../supabase/siteSettings';

const SiteSettingsContext = createContext(null);

export const useSiteSettings = () => useContext(SiteSettingsContext);

export const SiteSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    name_km: 'បណ្ណាល័យឌីជីថលខ្មែរ',
    name_en: 'Khmer Digital Library',
    tagline_km: 'ស្វែងរក អាន និងរក្សាទុកសៀវភៅខ្មែរ',
    tagline_en: 'Discover, Read, and Save Khmer Books',
    logoUrl: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSiteSettings()
      .then(setSettings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const refreshSettings = useCallback(async () => {
    const s = await getSiteSettings();
    setSettings(s);
  }, []);

  useEffect(() => {
    if (settings.logoUrl) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = settings.logoUrl;
    }
    if (settings.name_en) {
      document.title = settings.name_en;
    }
  }, [settings.logoUrl, settings.name_en]);

  const getName = useCallback((lang) => {
    return lang === 'km' ? (settings.name_km || settings.name_en) : (settings.name_en || settings.name_km);
  }, [settings]);

  const getTagline = useCallback((lang) => {
    return lang === 'km' ? (settings.tagline_km || settings.tagline_en) : (settings.tagline_en || settings.tagline_km);
  }, [settings]);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refreshSettings, getName, getTagline }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};
