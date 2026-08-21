import { Heart } from 'lucide-react';
import Modal from './Modal';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';

export default function DonateModal({ isOpen, onClose }) {
  const { lang, t } = useLanguage();
  const { settings } = useSiteSettings();

  const donateText = lang === 'km'
    ? (settings.donate_text_km || settings.donate_text_en)
    : (settings.donate_text_en || settings.donate_text_km);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('donate.title')} size="sm">
      <div className="flex flex-col items-center text-center">
        <div className="w-64 h-64 rounded-2xl bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 flex items-center justify-center overflow-hidden">
          {settings.donateQrUrl ? (
            <img src={settings.donateQrUrl} alt={t('donate.qrAlt')} className="w-full h-full object-contain" />
          ) : (
            <span className={`text-sm text-surface-400 ${lang === 'km' ? 'font-khmer' : ''}`}>
              {t('donate.noQr')}
            </span>
          )}
        </div>
        {donateText && (
          <p className={`mt-4 text-sm text-surface-600 dark:text-surface-300 leading-relaxed whitespace-pre-line ${lang === 'km' ? 'font-khmer' : ''}`}>
            {donateText}
          </p>
        )}
        <div className="mt-4 flex items-center gap-2 text-primary-600 dark:text-primary-400">
          <Heart className="w-4 h-4 fill-current" />
          <span className={`text-xs font-medium ${lang === 'km' ? 'font-khmer' : ''}`}>{t('donate.thanks')}</span>
        </div>
      </div>
    </Modal>
  );
}
