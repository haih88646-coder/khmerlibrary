import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Grid, List, Search } from 'lucide-react';
import BookCard from '../components/common/BookCard';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import { useLanguage } from '../contexts/LanguageContext';
import { getBooks } from '../supabase/books';
import { searchElibraryBooks, PAGE_SIZE as ELC_PAGE_SIZE } from '../utils/elibraryApi';
import { getBloomKhmerBooks } from '../utils/bloomApi';

const LOCAL_PAGE_SIZE = 24;

export default function Browse() {
  const { lang, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [pool, setPool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const [filters, setFilters] = useState({
    source: searchParams.get('source') || 'elc',
    search: searchParams.get('search') || '',
    page: Number(searchParams.get('page')) || 1,
  });

  const isElibrary = filters.source === 'elc';
  const pageSize = isElibrary ? ELC_PAGE_SIZE : LOCAL_PAGE_SIZE;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const currentPage = Math.min(filters.page, totalPages);
  const books = isElibrary ? pool : pool.slice((currentPage - 1) * LOCAL_PAGE_SIZE, currentPage * LOCAL_PAGE_SIZE);

  useEffect(() => {
    if (isElibrary) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        // My Library merges our own books with free Khmer books from Bloom Library.
        const bloomPromise = getBloomKhmerBooks().catch(() => []);
        const result = await getBooks({ pageSize: 500, sortBy: 'created_at', sortDir: 'desc', publishedOnly: false });
        const bloomBooks = await bloomPromise;
        let merged = [...result.books, ...bloomBooks];
        merged.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
        if (filters.search) {
          const s = filters.search.toLowerCase();
          merged = merged.filter(b =>
            (b.title_en || '').toLowerCase().includes(s) ||
            (b.title_km || '').includes(filters.search) ||
            (b.authorName || '').toLowerCase().includes(s) ||
            (b.tags || []).some(tag => tag.toLowerCase().includes(s))
          );
        }
        if (cancelled) return;
        setTotal(merged.length);
        setPool(merged);
      } catch {
        if (!cancelled) {
          setPool([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isElibrary, filters.search]);

  useEffect(() => {
    if (!isElibrary) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { books: results, total: found } = await searchElibraryBooks(filters.search, currentPage);
        if (cancelled) return;
        setPool(results);
        setTotal(found);
      } catch {
        if (!cancelled) {
          setPool([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isElibrary, filters.search, filters.page]);

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilter('search', searchInput.trim());
  };

  const updateFilter = (key, value) => {
    const next = { ...filters, [key]: value };
    if (key !== 'page') next.page = 1;
    setFilters(next);
    const params = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => {
      if (!v) return;
      if (k === 'page' && Number(v) <= 1) return;
      params.set(k, v);
    });
    setSearchParams(params);
  };

  const handlePageChange = (p) => {
    updateFilter('page', p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold text-surface-900 dark:text-white mb-2 ${lang === 'km' ? 'font-khmer' : ''}`}>
            {t('nav.browse')}
          </h1>
          <p className="text-surface-500 dark:text-surface-400">
            {t('home.hero.subtitle')}
          </p>
        </div>

        {/* Search box */}
        <form onSubmit={handleSearch} className="max-w-2xl mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={isElibrary ? t('browse.searchElibrary') : t('browse.searchLocal')}
                className={`w-full pl-12 pr-4 py-3 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white shadow-sm ${lang === 'km' ? 'font-khmer' : ''}`}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-sm font-medium text-sm disabled:opacity-60 ${lang === 'km' ? 'font-khmer' : ''}`}
            >
              {t('global.search')}
            </button>
          </div>
        </form>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm text-surface-500 dark:text-surface-400">
            {total.toLocaleString()} {t('home.stats.books')}
          </span>
          <div className="flex items-center gap-2">
            <div className={`flex items-center rounded-lg p-1 bg-surface-100 dark:bg-surface-800 ${lang === 'km' ? 'font-khmer' : ''}`}>
              <button
                onClick={() => updateFilter('source', 'local')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${!isElibrary ? 'bg-white dark:bg-surface-700 text-primary-600 shadow-sm' : 'text-surface-400 hover:text-surface-600'}`}
              >
                {t('browse.sourceLocal')}
              </button>
              <button
                onClick={() => updateFilter('source', 'elc')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${isElibrary ? 'bg-white dark:bg-surface-700 text-primary-600 shadow-sm' : 'text-surface-400 hover:text-surface-600'}`}
              >
                {t('browse.sourceElibrary')}
              </button>
            </div>
            <div className="flex items-center gap-1 bg-surface-100 dark:bg-surface-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-surface-700 text-primary-600 shadow-sm' : 'text-surface-400 hover:text-surface-600'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-surface-700 text-primary-600 shadow-sm' : 'text-surface-400 hover:text-surface-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {!loading && books.length > 0 && (
          <h2 className={`text-xl font-bold text-surface-900 dark:text-white mb-5 ${lang === 'km' ? 'font-khmer' : ''}`}>
            {t('browse.resultsHeading')}
          </h2>
        )}
        {loading ? (
          <Loading />
        ) : books.length === 0 ? (
          <EmptyState type="search" title={t('search.noResults')} />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {books.map(book => <BookCard key={book.id} book={book} />)}
          </div>
        ) : (
          <div className="space-y-3">
            {books.map(book => <BookCard key={book.id} book={book} variant="compact" />)}
          </div>
        )}

        {/* Pagination */}
        {!loading && (
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}
