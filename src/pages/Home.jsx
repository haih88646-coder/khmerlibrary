import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Folder, Eye, Star, TrendingUp, Globe, Library } from 'lucide-react';
import BookCard from '../components/common/BookCard';
import SearchBar from '../components/common/SearchBar';
import Loading from '../components/common/Loading';
import { useLanguage } from '../contexts/LanguageContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { getBooks } from '../supabase/books';
import { getCategories } from '../supabase/categories';
import { getAuthors } from '../supabase/authors';
import { getUsers } from '../supabase/users';
import { searchElibraryBooks } from '../utils/elibraryApi';
import { searchArchiveBooks } from '../utils/archiveApi';

export default function Home() {
  const { lang, t } = useLanguage();
  const { settings } = useSiteSettings();
  const [featured, setFeatured] = useState([]);
  const [newBooks, setNewBooks] = useState([]);
  const [popular, setPopular] = useState([]);
  const [elcBooks, setElcBooks] = useState([]);
  const [archiveBooks, setArchiveBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [stats, setStats] = useState({ books: 0, authors: 0, categories: 0, readers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [newRes, cats, auths, allBooksRes, usersRes, elcRes, arcRes] = await Promise.all([
          getBooks({ sortBy: 'created_at', sortDir: 'desc', pageSize: 8, publishedOnly: false }),
          getCategories(),
          getAuthors(),
          getBooks({ pageSize: 500, publishedOnly: false }),
          getUsers().catch(() => []),
          searchElibraryBooks('', 1, 8).catch(() => ({ books: [], total: 0 })),
          searchArchiveBooks('', 1, 8).catch(() => ({ books: [], total: 0 })),
        ]);
        const published = allBooksRes.books.filter(b => b.isPublished !== false);
        setNewBooks(newRes.books.filter(b => b.isPublished !== false));
        setCategories(cats);
        setAuthors(auths.slice(0, 8));
        setFeatured(published.filter(b => b.isFeatured).slice(0, 6));
        setPopular([...published].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 8));
        setElcBooks(elcRes.books);
        setArchiveBooks(arcRes.books);
        setStats({
          books: published.length + (elcRes.total || 0) + (arcRes.total || 0),
          authors: auths.length,
          categories: cats.length,
          readers: usersRes.length
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 text-white bg-cover bg-center"
        style={settings.heroImageUrl ? { backgroundImage: `url(${settings.heroImageUrl})` } : undefined}
      >
        {settings.heroImageUrl && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/85 via-primary-800/70 to-primary-600/55" />
        )}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className={`text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight ${lang === 'km' ? 'font-khmer' : ''}`}>
              {t('home.hero.title')}
            </h1>
            <p className={`text-lg md:text-xl text-primary-200 mb-10 ${lang === 'km' ? 'font-khmer' : ''}`}>
              {t('home.hero.subtitle')}
            </p>
            <div className="max-w-xl mx-auto mb-8">
              <SearchBar large />
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/browse" className="px-8 py-3.5 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors shadow-lg">
                {t('home.hero.cta')}
              </Link>
              <Link to="/signup" className="px-8 py-3.5 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors">
                {t('home.hero.ctaSecondary')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white dark:bg-surface-800 border-b border-surface-100 dark:border-surface-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: BookOpen, value: stats.books, label: t('home.stats.books'), color: 'text-primary-600 dark:text-primary-400' },
              { icon: Users, value: stats.authors, label: t('home.stats.authors'), color: 'text-secondary-600 dark:text-secondary-400' },
              { icon: Folder, value: stats.categories, label: t('home.stats.categories'), color: 'text-accent-600 dark:text-accent-400' },
              { icon: Eye, value: stats.readers, label: t('home.stats.readers'), color: 'text-purple-600 dark:text-purple-400' },
            ].map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-surface-50 dark:bg-surface-700 flex items-center justify-center ${color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900 dark:text-white">{value}</p>
                  <p className={`text-sm text-surface-500 ${lang === 'km' ? 'font-khmer' : ''}`}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Books */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-secondary-500" />
              <h2 className={`text-2xl font-bold text-surface-900 dark:text-white ${lang === 'km' ? 'font-khmer' : ''}`}>
                {t('home.featured')}
              </h2>
            </div>
            <Link to="/browse" className="flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors">
              {t('home.viewAll')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
            {featured.map(book => <BookCard key={book.id} book={book} />)}
          </div>
        </section>
      )}

      {/* New Books */}
      {newBooks.length > 0 && (
        <section className="bg-surface-50 dark:bg-surface-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-primary-500" />
                <h2 className={`text-2xl font-bold text-surface-900 dark:text-white ${lang === 'km' ? 'font-khmer' : ''}`}>
                  {t('home.newBooks')}
                </h2>
              </div>
              <Link to="/browse" className="flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors">
                {t('home.viewAll')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {newBooks.slice(0, 8).map(book => <BookCard key={book.id} book={book} />)}
            </div>
          </div>
        </section>
      )}

      {/* Popular Books */}
      {popular.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-accent-500" />
              <h2 className={`text-2xl font-bold text-surface-900 dark:text-white ${lang === 'km' ? 'font-khmer' : ''}`}>
                {t('home.popular')}
              </h2>
            </div>
            <Link to="/browse" className="flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors">
              {t('home.viewAll')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {popular.slice(0, 8).map(book => <BookCard key={book.id} book={book} />)}
          </div>
        </section>
      )}

      {/* From eLibrary of Cambodia */}
      {elcBooks.length > 0 && (
        <section className="bg-surface-50 dark:bg-surface-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Library className="w-5 h-5 text-secondary-500" />
                <h2 className={`text-2xl font-bold text-surface-900 dark:text-white ${lang === 'km' ? 'font-khmer' : ''}`}>
                  {t('home.fromElibrary')}
                </h2>
              </div>
              <Link to="/browse?source=elc" className="flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors">
                {t('home.viewAll')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {elcBooks.map(book => <BookCard key={book.id} book={book} />)}
            </div>
          </div>
        </section>
      )}

      {/* Popular on Archive.org */}
      {archiveBooks.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-primary-500" />
              <h2 className={`text-2xl font-bold text-surface-900 dark:text-white ${lang === 'km' ? 'font-khmer' : ''}`}>
                {t('home.fromArchive')}
              </h2>
            </div>
            <Link to="/global-books" className="flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors">
              {t('home.viewAll')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {archiveBooks.map(book => <BookCard key={book.id} book={book} />)}
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="bg-surface-50 dark:bg-surface-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="flex items-center justify-between mb-8">
              <h2 className={`text-2xl font-bold text-surface-900 dark:text-white ${lang === 'km' ? 'font-khmer' : ''}`}>
                {t('nav.categories')}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.slice(0, 12).map(cat => (
                <Link
                  key={cat.id}
                  to={`/browse?category=${cat.id}`}
                  className="bg-white dark:bg-surface-800 rounded-xl p-4 text-center hover:shadow-lg border border-surface-100 dark:border-surface-700 transition-all duration-200 hover:-translate-y-0.5 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors">
                    <Folder className="w-6 h-6 text-primary-500" />
                  </div>
                  <p className={`text-sm font-medium text-surface-700 dark:text-surface-300 ${lang === 'km' ? 'font-khmer' : ''}`}>
                    {lang === 'km' ? (cat.name_km || cat.name_en) : (cat.name_en || cat.name_km)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Authors */}
      {authors.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-center justify-between mb-8">
            <h2 className={`text-2xl font-bold text-surface-900 dark:text-white ${lang === 'km' ? 'font-khmer' : ''}`}>
              {t('nav.authors')}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {authors.map(author => (
              <Link
                key={author.id}
                to={`/browse?author=${author.id}`}
                className="flex flex-col items-center p-4 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group"
              >
                <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-2 group-hover:ring-2 group-hover:ring-primary-300 transition-all">
                  <span className={`text-lg font-bold text-primary-600 dark:text-primary-400 ${lang === 'km' ? 'font-khmer' : ''}`}>
                    {(lang === 'km' ? (author.name_km || author.name_en) : (author.name_en || author.name_km) || '?')[0]}
                  </span>
                </div>
                <p className={`text-xs font-medium text-center text-surface-700 dark:text-surface-300 line-clamp-2 ${lang === 'km' ? 'font-khmer' : ''}`}>
                  {lang === 'km' ? (author.name_km || author.name_en) : (author.name_en || author.name_km)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className={`text-2xl md:text-3xl font-bold mb-4 ${lang === 'km' ? 'font-khmer' : ''}`}>
            {t('home.hero.title')}
          </h2>
          <p className={`text-primary-200 mb-8 max-w-lg mx-auto ${lang === 'km' ? 'font-khmer' : ''}`}>
            {t('home.hero.subtitle')}
          </p>
          <Link to="/browse" className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors shadow-lg">
            {t('home.hero.cta')} <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
