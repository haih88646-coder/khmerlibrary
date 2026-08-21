import km from './km';
import en from './en';

const translations = { km, en };

let currentLang = localStorage.getItem('kdl_lang') || 'km';

const applyLanguage = (lang) => {
  document.documentElement.lang = lang;
  if (lang === 'km') {
    document.body.classList.add('lang-km');
    document.body.classList.remove('lang-en');
  } else {
    document.body.classList.add('lang-en');
    document.body.classList.remove('lang-km');
  }
};

applyLanguage(currentLang);

export const setLanguage = (lang) => {
  currentLang = lang;
  localStorage.setItem('kdl_lang', lang);
  applyLanguage(lang);
};

export const getLanguage = () => currentLang;

export const t = (path, lang) => {
  const l = lang || currentLang;
  const keys = path.split('.');
  let value = translations[l];
  for (const key of keys) {
    value = value?.[key];
  }
  return value || path;
};

export const getLocalizedField = (obj, field, lang) => {
  const l = lang || currentLang;
  return obj?.[`${field}_${l}`] || obj?.[`${field}_${l === 'km' ? 'en' : 'km'}`] || '';
};

export { translations };
