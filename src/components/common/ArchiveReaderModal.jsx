import { ExternalLink } from 'lucide-react';
import Modal from './Modal';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ArchiveReaderModal({ book, onClose }) {
  const { lang, t } = useLanguage();
  const km = lang === 'km';

  if (!book) return null;

  return (
    <Modal isOpen onClose={onClose} title={book.title_en || book.title || ''} size="xl">
      <div>
        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden mb-4">
          <iframe
            src={`https://archive.org/embed/${book.archiveId}`}
            title={book.title_en || book.title}
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <p className={`text-sm text-surface-500 dark:text-surface-400 truncate ${km ? 'font-khmer' : ''}`}>
            {[book.authorName, book.publicationYear, book.language].filter(Boolean).join(' · ')}
          </p>
          <a
            href={`https://archive.org/details/${book.archiveId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium ${km ? 'font-khmer' : ''}`}
          >
            <ExternalLink className="w-4 h-4" /> {t('global.openOnArchive')}
          </a>
        </div>
      </div>
    </Modal>
  );
}
