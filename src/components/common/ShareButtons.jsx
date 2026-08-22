import { Link2, Share2 } from 'lucide-react';
import { FaTelegram, FaFacebookF } from 'react-icons/fa6';
import { toast } from 'react-toastify';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ShareButtons({ title, path }) {
  const { lang, t } = useLanguage();
  const url = `${window.location.origin}${path || window.location.pathname}`;
  const text = `${title || t('ai.title')} — Khmer Digital Library`;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  const iconBase =
    'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('share.copied'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: text, url });
        return;
      } catch {
        return; // user closed the share sheet
      }
    }
    handleCopy();
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className={`text-sm font-medium text-surface-500 dark:text-surface-400 mr-1 ${lang === 'km' ? 'font-khmer' : ''}`}>
        {t('share.title')}
      </span>
      <a
        href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`}
        target="_blank"
        rel="noreferrer"
        aria-label={t('share.telegram')}
        title={t('share.telegram')}
        className={`${iconBase} bg-[#229ED9] text-white`}
      >
        <FaTelegram className="w-4.5 h-4.5" />
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noreferrer"
        aria-label={t('share.facebook')}
        title={t('share.facebook')}
        className={`${iconBase} bg-[#1877F2] text-white`}
      >
        <FaFacebookF className="w-4.5 h-4.5" />
      </a>
      <button
        type="button"
        onClick={handleNative}
        aria-label={t('share.more')}
        title={t('share.more')}
        className={`${iconBase} bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600`}
      >
        <Share2 className="w-4.5 h-4.5" />
      </button>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={t('share.copy')}
        title={t('share.copy')}
        className={`${iconBase} bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600`}
      >
        <Link2 className="w-4.5 h-4.5" />
      </button>
    </div>
  );
}
