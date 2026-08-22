import { Link, useNavigate } from 'react-router-dom';
import { Heart, Eye, Download, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'react-toastify';
import { isArchiveId, stripArchivePrefix, getArchivePdfUrl } from '../../utils/archiveApi';
import { isElibraryId, stripElibraryPrefix, getElibraryBookPdf } from '../../utils/elibraryApi';
import { isBloomId, getBloomBookPageUrl } from '../../utils/bloomApi';

export default function BookCard({ book, variant = 'default' }) {
  const { user, isFavorite, toggleFavorite } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const isArchive = isArchiveId(book.id);
  const isElibrary = isElibraryId(book.id);
  const isBloom = isBloomId(book.id);

  const title = lang === 'km' ? (book.title_km || book.title_en) : (book.title_en || book.title_km);
  const author = lang === 'km' ? (book.authorName_km || book.authorName || book.authorName_en) : (book.authorName_en || book.authorName || book.authorName_km);

  const handleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info(t('auth.favoriteRequired'));
      return;
    }
    await toggleFavorite(book.id);
  };

  const handleDownload = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info(t('auth.downloadRequired'));
      return;
    }
    if (book.fileUrl) {
      const link = document.createElement('a');
      link.href = book.fileUrl;
      link.download = `${title}.${book.fileType || 'pdf'}`;
      link.click();
    }
  };

  const openReader = async () => {
    const win = window.open('about:blank', '_blank');
    if (isElibrary) {
      const url = await getElibraryBookPdf(stripElibraryPrefix(book.id)).catch(() => null);
      if (url) {
        win.location.href = url;
      } else {
        win.close();
        toast.error(t('global.noReadableFile'));
      }
      return;
    }
    if (isArchive) {
      const url = await getArchivePdfUrl(stripArchivePrefix(book.id));
      if (url) {
        win.location.href = url;
      } else {
        win.location.href = `https://archive.org/details/${book.archiveId}`;
      }
      return;
    }
    if (isBloom) {
      win.location.href = book.fileUrl || book.link || getBloomBookPageUrl(book.bloomId);
      return;
    }
    if (book.fileUrl) {
      win.location.href = book.fileUrl;
      return;
    }
    win.close();
    navigate(`/book/${book.id}`);
  };

  if (variant === 'compact') {
    return (
      <div onClick={openReader} className="group flex gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-all duration-200 cursor-pointer">
        <div className="w-14 h-20 rounded-lg bg-surface-200 dark:bg-surface-700 shrink-0 overflow-hidden shadow-sm">
          {book.coverUrl ? (
            <img src={book.coverUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-surface-400" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={`book-title text-sm font-semibold line-clamp-2 text-surface-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors ${lang === 'km' ? 'font-khmer' : ''}`}>
            {title}
          </h3>
          <p className="text-xs text-surface-500 mt-0.5 truncate">{author}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-surface-400">
            {book.views > 0 && <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{book.views}</span>}
            {book.fileType && <span className="uppercase font-semibold">{book.fileType}</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group block bg-white dark:bg-surface-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-surface-100 dark:border-surface-700/50 transition-all duration-300 hover:-translate-y-1">
      <div onClick={openReader} className="cursor-pointer">
        <div className="relative aspect-[3/4] bg-surface-100 dark:bg-surface-700 overflow-hidden">
          {book.coverUrl ? (
            <img src={book.coverUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <FileText className="w-10 h-10 text-surface-300 dark:text-surface-500" />
              <span className="text-xs text-surface-400">No Cover</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <span className="px-4 py-2 bg-white dark:bg-surface-900 text-surface-900 dark:text-white text-xs font-semibold rounded-lg shadow-lg">
              {t('book.readNow')}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={handleFavorite}
                className={`p-2 rounded-lg shadow-lg transition-colors ${isFavorite(book.id) ? 'bg-red-500 text-white' : 'bg-white/90 dark:bg-surface-800/90 text-surface-600 dark:text-surface-300 hover:text-red-500'}`}
              >
                <Heart className="w-4 h-4" fill={isFavorite(book.id) ? 'currentColor' : 'none'} />
              </button>
              {!isArchive && !isElibrary && (
                <button
                  onClick={handleDownload}
                  className="p-2 rounded-lg shadow-lg bg-white/90 dark:bg-surface-800/90 text-surface-600 dark:text-surface-300 hover:text-primary-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {book.fileType && (
            <span className="absolute top-3 left-3 px-2 py-0.5 bg-surface-900/80 text-white text-[10px] font-bold uppercase rounded-md">
              {book.fileType}
            </span>
          )}

          {book.isFeatured && (
            <span className="absolute top-3 right-3 px-2 py-0.5 bg-secondary-500 text-white text-[10px] font-bold rounded-md">
              ★
            </span>
          )}
        </div>
      </div>

      <div onClick={openReader} className="p-4 cursor-pointer">
        <h3 className={`book-title text-sm font-semibold line-clamp-2 text-surface-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors ${lang === 'km' ? 'font-khmer' : ''}`}>
          {title}
        </h3>
        <p className="text-xs text-surface-500 mt-1 truncate">{author}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-surface-400">
          {book.publicationYear && <span>{book.publicationYear}</span>}
          {book.views > 0 && (
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" /> {book.views}
            </span>
          )}
          {book.downloads > 0 && (
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" /> {book.downloads}
            </span>
          )}
        </div>
      </div>


    </div>
  );
}
