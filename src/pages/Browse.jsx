import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Grid, List, SlidersHorizontal, X, Search } from 'lucide-react';
import BookCard from '../components/common/BookCard';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import { useLanguage } from '../contexts/LanguageContext';
import { useCategories, useAuthors } from '../hooks/useBooks';
import { getBooks } from '../supabase/books';
import { searchElibraryBooks, PAGE_SIZE as ELC_PAGE_SIZE } from '../utils/elibraryApi';

const LOCAL_PAGE_SIZE = 24;

export default function Browse() {
  const { lang, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [pool, setPool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');

  const { categories } = useCategories();
  const { authors } = useAuthors();

  const [filters, setFilters] = useState({
    source: searchParams.get('source') || 'elc',
    category: searchParams.get('category') || '',
    author: searchParams.get('author') || '',
    year: searchParams.get('year') || '',
    fileType: searchParams.get('fileType') || '',
    sortBy: searchParams.get('sortBy') || 'created_at',
    search: searchParams.get('search') || '',
    page: Number(searchParams.get('page')) || 1,
  });

  const isElibrary = filters.source === 'elc';
  const pageSize = isElibrary ? ELC_PAGE_SIZE : LOCAL_PAGE_SIZE;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const currentPage = Math.min(filters.page, totalPages);
  const books = isElibrary ? pool : pool.slice((currentPage - 1) * LOCAL_PAGE_SIZE, currentPage * LOCAL_PAGE_SIZE);

  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 30; y--) years.push(y);

  useEffect(() => {
    if (isElibrary) return;
    const load = async () => {
      setLoading(true);
      try {
        const opts = { pageSize: 500, sortBy: filters.sortBy === 'views' ? 'created_at' : filters.sortBy, sortDir: filters.sortBy === 'title_en' ? 'asc' : 'desc', publishedOnly: false };
        if (filters.category) opts.category = filters.category;
        if (filters.author) opts.author = filters.author;
        if (filters.year) opts.year = filters.year;
        if (filters.fileType) opts.fileType = filters.fileType;
        const result = await getBooks(opts);
        let filtered = [...result.books];
        if (filters.sortBy === 'views') {
          filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        }
        if (filters.search) {
          const s = filters.search.toLowerCase();
          filtered = filtered.filter(b =>
            (b.title_en || '').toLowerCase().includes(s) ||
            (b.title_km || '').includes(filters.search) ||
            (b.authorName || '').toLowerCase().includes(s) ||
            (b.tags || []).some(tag => tag.toLowerCase().includes(s))
          );
        }
        setTotal(filtered.length);
        setPool(filtered);
      } catch {
        setPool([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters.source, filters.category, filters.author, filters.year, filters.fileType, filters.sortBy, filters.search]);

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

  const handleElibrarySearch = (e) => {
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

  const clearFilters = () => {
    const cleared = { source: filters.source, category: '', author: '', year: '', fileType: '', sortBy: 'created_at', search: '', page: 1 };
    setFilters(cleared);
    setSearchInput('');
    const params = new URLSearchParams();
    if (filters.source === 'elc') params.set('source', 'elc');
    setSearchParams(params);
  };

  const hasActiveFilters = Object.values(filters).some((v, i) => i >= 1 && i <= 4 && v);

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

        {/* eLibrary search box */}
        {isElibrary && (
          <form onSubmit={handleElibrarySearch} className="max-w-2xl mb-8">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t('browse.searchElibrary')}
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
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Mobile filter overlay */}
          {showFilters && !isElibrary && (
            <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowFilters(false)} />
          )}
          {/* Sidebar Filters */}
          {!isElibrary && (
          <aside className={`lg:w-64 shrink-0 ${showFilters ? 'fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-surface-800 overflow-y-auto pt-20 shadow-2xl lg:relative lg:pt-0 lg:shadow-none lg:w-64' : 'hidden lg:block'}`}>
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-5 sticky top-24">
              <div className="flex items-center justify-between mb-5">
                <h3 className={`font-semibold text-surface-900 dark:text-white ${lang === 'km' ? 'font-khmer' : ''}`}>
                  {t('filter.sortBy')}
                </h3>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                    {t('common.close')}
                  </button>
                )}
              </div>

              <div className="space-y-5">
                <div>
                  <label className={`text-xs font-medium text-surface-500 uppercase tracking-wider mb-2 block ${lang === 'km' ? 'font-khmer' : ''}`}>
                    {t('filter.sortBy')}
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => updateFilter('sortBy', e.target.value)}
                    className="w-full px-3 py-2 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="created_at">{t('filter.newest')}</option>
                    <option value="views">{t('filter.popular')}</option>
                    <option value="title_en">{t('filter.title')}</option>
                  </select>
                </div>

                <div>
                  <label className={`text-xs font-medium text-surface-500 uppercase tracking-wider mb-2 block ${lang === 'km' ? 'font-khmer' : ''}`}>
                    {t('filter.category')}
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => updateFilter('category', e.target.value)}
                    className="w-full px-3 py-2 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="">{t('filter.all')}</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{lang === 'km' ? (c.name_km || c.name_en) : (c.name_en || c.name_km)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`text-xs font-medium text-surface-500 uppercase tracking-wider mb-2 block ${lang === 'km' ? 'font-khmer' : ''}`}>
                    {t('filter.author')}
                  </label>
                  <select
                    value={filters.author}
                    onChange={(e) => updateFilter('author', e.target.value)}
                    className="w-full px-3 py-2 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="">{t('filter.all')}</option>
                    {authors.map(a => (
                      <option key={a.id} value={a.id}>{lang === 'km' ? (a.name_km || a.name_en) : (a.name_en || a.name_km)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`text-xs font-medium text-surface-500 uppercase tracking-wider mb-2 block ${lang === 'km' ? 'font-khmer' : ''}`}>
                    {t('filter.year')}
                  </label>
                  <select
                    value={filters.year}
                    onChange={(e) => updateFilter('year', e.target.value)}
                    className="w-full px-3 py-2 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="">{t('filter.all')}</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <div>
                  <label className={`text-xs font-medium text-surface-500 uppercase tracking-wider mb-2 block ${lang === 'km' ? 'font-khmer' : ''}`}>
                    {t('filter.format')}
                  </label>
                  <div className="flex gap-2">
                    {['', 'pdf', 'txt'].map(type => (
                      <button
                        key={type}
                        onClick={() => updateFilter('fileType', type)}
                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${filters.fileType === type ? 'bg-primary-600 text-white border-primary-600' : 'bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-primary-300'}`}
                      >
                        {type ? type.toUpperCase() : t('filter.all')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                {!isElibrary && (
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                  </button>
                )}
                <span className="text-sm text-surface-500 dark:text-surface-400">
                  {total.toLocaleString()} {t('home.stats.books')}
                </span>
                {hasActiveFilters && !isElibrary && (
                  <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline">
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
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

            {/* Active Filter Tags */}
            {hasActiveFilters && !isElibrary && (
              <div className="flex flex-wrap gap-2 mb-5">
                {filters.category && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-xs font-medium">
                    {categories.find(c => c.id === filters.category)?.[`name_${lang}`] || filters.category}
                    <button onClick={() => updateFilter('category', '')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filters.author && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary-50 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-400 rounded-full text-xs font-medium">
                    {authors.find(a => a.id === filters.author)?.[`name_${lang}`] || filters.author}
                    <button onClick={() => updateFilter('author', '')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filters.year && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400 rounded-full text-xs font-medium">
                    {filters.year}
                    <button onClick={() => updateFilter('year', '')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filters.fileType && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium">
                    {filters.fileType.toUpperCase()}
                    <button onClick={() => updateFilter('fileType', '')}><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>
            )}

            {/* Results */}
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
      </div>
    </div>
  );
}
