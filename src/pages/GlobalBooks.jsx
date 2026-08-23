import { useState, useEffect, useCallback } from 'react';
import { Search, Globe, BookOpen, Loader2, Heart } from 'lucide-react';
import { toast } from 'react-toastify';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import { searchArchiveBooks, PAGE_SIZE, stripArchivePrefix, getArchivePdfUrl } from '../utils/archiveApi';

export default function GlobalBooks() {
  const { lang, t } = useLanguage();
  const { user, isFavorite, toggleFavorite } = useAuth();
  const [term, setTerm] = useState('');
  const [submittedTerm, setSubmittedTerm] = useState('');
  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  const runSearch = useCallback(async (searchTerm, pageNum) => {
    setLoading(true);
    setError(false);
    try {
      const { books: docs, total: found } = await searchArchiveBooks(searchTerm, pageNum, PAGE_SIZE);
      setTotal(found);
      setBooks(docs);
    } catch {
      setError(true);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runSearch(submittedTerm, 1);
  }, [submittedTerm, runSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSubmittedTerm(term);
  };

  const handlePageChange = (p) => {
    setPage(p);
    runSearch(submittedTerm, p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFavorite = async (e, book) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info(t('auth.favoriteRequired'));
      return;
    }
    try {
      await toggleFavorite(book.id);
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleRead = async (book) => {
    const win = window.open('about:blank', '_blank');
    const url = await getArchivePdfUrl(stripArchivePrefix(book.id));
    if (url) {
      win.location.href = url;
    } else {
      win.location.href = `https://archive.org/details/${book.archiveId}`;
    }
  };

  const km = lang === 'km';

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium mb-4">
            <Globe className="w-4 h-4" /> Archive.org
          </div>
          <h1 className={`text-3xl font-bold text-surface-900 dark:text-white mb-3 ${km ? 'font-khmer' : ''}`}>
            {t('global.title')}
          </h1>
          <p className={`text-surface-500 dark:text-surface-400 max-w-xl mx-auto ${km ? 'font-khmer' : ''}`}>
            {t('global.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-10">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder={t('global.searchPlaceholder')}
                className={`w-full pl-12 pr-4 py-3.5 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white shadow-sm ${km ? 'font-khmer' : ''}`}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-sm font-medium text-sm disabled:opacity-60 flex items-center gap-2 ${km ? 'font-khmer' : ''}`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {t('global.search')}
            </button>
          </div>
        </form>

        {!loading && !error && total > 0 && (
          <h2 className={`text-sm text-surface-500 dark:text-surface-400 mb-6 font-normal ${km ? 'font-khmer' : ''}`}>
            {total.toLocaleString()} {t('global.resultsFound')}
            {submittedTerm && <> · "<span className="font-medium">{submittedTerm}</span>"</>}
          </h2>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[2/3] bg-surface-200 dark:bg-surface-700 rounded-xl mb-3" />
                <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState type="error" title={t('common.error')} description={t('global.tryAgain')} />
        ) : books.length === 0 ? (
          <EmptyState type="search" title={t('global.noResults')} description={t('global.startExploring')} />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {books.map((book) => {
                const fav = isFavorite(book.id);
                return (
                  <div
                    key={book.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleRead(book)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleRead(book); } }}
                    className="group text-left cursor-pointer"
                  >
                    <div className="relative aspect-[2/3] bg-surface-200 dark:bg-surface-700 rounded-xl overflow-hidden shadow-sm group-hover:shadow-lg transition-all group-hover:-translate-y-1 mb-3">
                      <img
                        src={book.coverUrl}
                        alt={book.title_en}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <button
                        onClick={(e) => handleFavorite(e, book)}
                        aria-label="favorite"
                        className={`absolute top-2 right-2 p-2 rounded-full shadow-lg transition-all ${fav ? 'bg-red-500 text-white opacity-100' : 'bg-white/90 dark:bg-surface-800/90 text-surface-600 dark:text-surface-300 hover:text-red-500 opacity-0 group-hover:opacity-100'}`}
                      >
                        <Heart className="w-4 h-4" fill={fav ? 'currentColor' : 'none'} />
                      </button>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 pt-8">
                        <span className={`flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-surface-800 rounded-lg text-xs font-medium text-surface-900 dark:text-white ${km ? 'font-khmer' : ''}`}>
                          <BookOpen className="w-3.5 h-3.5" /> {t('global.readHere')}
                        </span>
                      </div>
                    </div>
                    <p className={`text-sm font-medium text-surface-900 dark:text-white line-clamp-2 leading-snug ${km ? 'font-khmer' : ''}`}>
                      {book.title_en}
                    </p>
                    <p className="text-xs text-surface-500 dark:text-surface-400 truncate mt-1">
                      {[book.authorName, book.publicationYear].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                );
              })}
            </div>

            <Pagination
              page={Math.min(page, totalPages)}
              totalPages={totalPages}
              onChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
}
