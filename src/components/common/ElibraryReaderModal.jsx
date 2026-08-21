import { useState, useEffect } from 'react';
import { Loader2, ExternalLink, FileWarning } from 'lucide-react';
import Modal from './Modal';
import { useLanguage } from '../../contexts/LanguageContext';
import { stripElibraryPrefix, getElibraryBookPdf } from '../../utils/elibraryApi';

export default function ElibraryReaderModal({ book, onClose }) {
  const { lang, t } = useLanguage();
  const km = lang === 'km';
  const [pdfUrl, setPdfUrl] = useState(null);
  const [status, setStatus] = useState('loading');
  const [frameLoaded, setFrameLoaded] = useState(false);

  useEffect(() => {
    if (!book) return;
    let cancelled = false;
    setStatus('loading');
    setPdfUrl(null);
    setFrameLoaded(false);

    const timeout = setTimeout(() => {
      if (!cancelled) setStatus('missing');
    }, 15000);

    getElibraryBookPdf(stripElibraryPrefix(book.id))
      .then((url) => {
        if (cancelled) return;
        clearTimeout(timeout);
        if (url) {
          setPdfUrl(url);
          setStatus('ready');
        } else {
          setStatus('missing');
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearTimeout(timeout);
          setStatus('missing');
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [book]);

  if (!book) return null;

  const title = book.title_km || book.title_en || '';

  return (
    <Modal isOpen onClose={onClose} title={title} size="xl">
      <div>
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-surface-500">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            <p className={`text-sm ${km ? 'font-khmer' : ''}`}>{t('common.loading')}</p>
          </div>
        )}

        {status === 'ready' && (
          <>
            <div className="relative">
              {!frameLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-100 dark:bg-surface-900 rounded-lg z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                  <p className={`text-sm text-surface-500 ${km ? 'font-khmer' : ''}`}>{t('common.loading')}</p>
                </div>
              )}
              <iframe
                src={`${pdfUrl}#view=FitH`}
                title={title}
                onLoad={() => setFrameLoaded(true)}
                className="w-full h-[70vh] rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-900"
              />
            </div>
            <div className="flex items-center justify-between mt-3">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-xs text-surface-500 hover:text-primary-600 transition-colors ${km ? 'font-khmer' : ''}`}
              >
                {t('global.openPdf')}
              </a>
              <a
                href={book.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1.5 text-xs text-surface-500 hover:text-primary-600 transition-colors ${km ? 'font-khmer' : ''}`}
              >
                <ExternalLink className="w-3.5 h-3.5" /> {t('global.openOnElibrary')}
              </a>
            </div>
          </>
        )}

        {status === 'missing' && (
          <div className="flex flex-col items-center justify-center h-[40vh] gap-4 text-center">
            <FileWarning className="w-10 h-10 text-surface-400" />
            <p className={`text-sm text-surface-500 dark:text-surface-400 ${km ? 'font-khmer' : ''}`}>
              {t('global.noReadableFile')}
            </p>
            <a
              href={book.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium ${km ? 'font-khmer' : ''}`}
            >
              <ExternalLink className="w-4 h-4" /> {t('global.openOnElibrary')}
            </a>
          </div>
        )}
      </div>
    </Modal>
  );
}
