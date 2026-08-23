import { Navigate } from 'react-router-dom';
import BookCard from '../components/common/BookCard';
import EmptyState from '../components/common/EmptyState';
import Loading from '../components/common/Loading';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useFavoriteBooks } from '../hooks/useBooks';
import Button from '../components/common/Button';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Favorites() {
  const { user, favorites, loading: authLoading } = useAuth();
  const { lang, t } = useLanguage();
  const { books, loading } = useFavoriteBooks(favorites);

  if (authLoading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-6 h-6 text-red-500" />
          <h1 className={`text-3xl font-bold text-surface-900 dark:text-white ${lang === 'km' ? 'font-khmer' : ''}`}>
            {t('nav.favorites')}
          </h1>
          {!authLoading && favorites.length > 0 && (
            <span className={`px-2.5 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-sm font-bold rounded-full ${lang === 'km' ? 'font-khmer' : ''}`}>
              {favorites.length}
            </span>
          )}
        </div>

        {loading ? (
          <Loading />
        ) : books.length === 0 ? (
          <EmptyState
            type="favorites"
            title={t('book.noBooks')}
            action={
              <Link to="/browse">
                <Button>{t('home.hero.cta')}</Button>
              </Link>
            }
          />
        ) : (
          <>
            <h2 className={`text-xl font-bold text-surface-900 dark:text-white mb-6 ${lang === 'km' ? 'font-khmer' : ''}`}>
              {t('favorites.yourBooks')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {books.map(book => <BookCard key={book.id} book={book} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
