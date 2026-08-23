import { Link } from 'react-router-dom';
import { BookOpen, Mail, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';

export default function Footer() {
  const { lang, t } = useLanguage();
  const { settings, getName } = useSiteSettings();

  const aboutText = lang === 'km'
    ? (settings.footer_about_km || settings.footer_about_en || t('footer.aboutText'))
    : (settings.footer_about_en || settings.footer_about_km || t('footer.aboutText'));
  const email = settings.contact_email || 'info@khmerlibrary.com';
  const website = settings.contact_website || 'khmerlibrary.com';
  const websiteUrl = website.startsWith('http') ? website : `https://${website}`;

  return (
    <footer className="bg-surface-900 dark:bg-black text-surface-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center overflow-hidden">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="" className="w-full h-full object-contain" />
                ) : (
                  <BookOpen className="w-5 h-5 text-white" strokeWidth={2.5} />
                )}
              </div>
              <span className={`font-bold text-lg text-white ${lang === 'km' ? 'font-khmer' : ''}`}>
                {getName(lang)}
              </span>
            </Link>
            <p className={`text-surface-400 text-sm leading-relaxed max-w-md ${lang === 'km' ? 'font-khmer' : ''}`}>
              {aboutText}
            </p>
          </div>

          <div>
            <h2 className={`text-sm font-semibold text-white mb-4 uppercase tracking-wider ${lang === 'km' ? 'font-khmer' : ''}`}>
              {t('footer.quickLinks')}
            </h2>
            <ul className="space-y-2.5">
              {[
                { to: '/', label: t('nav.home') },
                { to: '/browse', label: t('nav.browse') },
                { to: '/browse?filter=categories', label: t('nav.categories') },
                { to: '/browse?filter=authors', label: t('nav.authors') },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-surface-400 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className={`text-sm font-semibold text-white mb-4 uppercase tracking-wider ${lang === 'km' ? 'font-khmer' : ''}`}>
              {t('footer.contact')}
            </h2>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${email}`} className="hover:text-white transition-colors">{email}</a>
              </li>
              <li>
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-white transition-colors">
                  <ExternalLink className="w-4 h-4" />
                  <span>{website}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-surface-800 mt-10 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            <h2 className={`text-xs font-semibold text-surface-300 uppercase tracking-wider shrink-0 ${lang === 'km' ? 'font-khmer' : ''}`}>
              {t('footer.sourcesText')}
            </h2>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <a
                href="https://www.elibraryofcambodia.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-white transition-colors"
              >
                eLibrary of Cambodia <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://archive.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-white transition-colors"
              >
                Internet Archive (Archive.org) <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://bloomlibrary.org/language:km"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-white transition-colors"
              >
                Bloom Library by SIL Global <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="border-t border-surface-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-surface-500">
              &copy; {new Date().getFullYear()} {getName(lang)}. {t('footer.rights')}.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-xs text-surface-500 hover:text-surface-300 transition-colors">{t('footer.privacy')}</a>
              <a href="#" className="text-xs text-surface-500 hover:text-surface-300 transition-colors">{t('footer.terms')}</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
