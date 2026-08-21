import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Search as SearchIcon, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSearch } from '../../hooks/useBooks';
import { stripElibraryPrefix, getElibraryBookPdf } from '../../utils/elibraryApi';

export default function SearchBar({ className, large = false }) {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const { results, loading, search } = useSearch();
  const wrapperRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) search(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/browse?search=${encodeURIComponent(query.trim())}`);
      setFocused(false);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className || ''}`}>
      <form onSubmit={handleSubmit}>
        <div className={`relative flex items-center bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-all ${large ? 'px-5 py-3' : 'px-3 py-2'}`}>
          <button
            type="submit"
            aria-label={t('global.search')}
            className={`${large ? 'w-5 h-5' : 'w-4 h-4'} text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 shrink-0 transition-colors flex items-center justify-center`}
          >
            <SearchIcon className="w-full h-full" />
          </button>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder={t('search.placeholder')}
            className={`w-full bg-transparent outline-none ${large ? 'ml-3 text-base' : 'ml-2 text-sm'} text-surface-900 dark:text-white placeholder-surface-400 ${lang === 'km' ? 'font-khmer' : ''}`}
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="p-1 text-surface-400 hover:text-surface-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {focused && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-surface-800 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 py-2 max-h-80 overflow-y-auto z-[60] fade-in">
          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-surface-500">{t('common.loading')}</div>
          ) : results.length > 0 ? (
            results.slice(0, 10).map((book) => {
              const title = lang === 'km' ? (book.title_km || book.title_en) : (book.title_en || book.title_km);
              const isElc = book.id?.startsWith('elc:');
              const handlePick = async () => {
                setQuery('');
                setFocused(false);
                if (isElc) {
                  const win = window.open('about:blank', '_blank');
                  const url = await getElibraryBookPdf(stripElibraryPrefix(book.id)).catch(() => null);
                  if (url) {
                    win.location.href = url;
                  } else {
                    win.close();
                    toast.error(t('global.noReadableFile'));
                  }
                } else {
                  navigate(`/book/${book.id}`);
                }
              };
              return (
                <button
                  key={book.id}
                  onClick={handlePick}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors text-left"
                >
                  <div className="w-8 h-11 rounded bg-surface-200 dark:bg-surface-600 shrink-0 overflow-hidden">
                    {book.coverUrl && <img src={book.coverUrl} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate text-surface-900 dark:text-white ${lang === 'km' ? 'font-khmer' : ''}`}>{title}</p>
                    <p className="text-xs text-surface-500 truncate">{book.authorName || 'eLibrary of Cambodia'}</p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="px-4 py-6 text-center text-sm text-surface-500">{t('search.noResults')}</div>
          )}
        </div>
      )}
    </div>
  );
}
