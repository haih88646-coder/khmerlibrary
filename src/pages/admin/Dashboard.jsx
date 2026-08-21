import { useState, useEffect } from 'react';
import { BookOpen, Users, Folder, Eye, Download, TrendingUp, Clock } from 'lucide-react';
import Loading from '../../components/common/Loading';
import { useLanguage } from '../../contexts/LanguageContext';
import { getBooks } from '../../supabase/books';
import { getCategories } from '../../supabase/categories';
import { getAuthors } from '../../supabase/authors';
import { getUsers } from '../../supabase/users';
import { formatDate } from '../../utils/helpers';

export default function AdminDashboard() {
  const { lang, t } = useLanguage();
  const [stats, setStats] = useState({ books: 0, users: 0, authors: 0, categories: 0, totalViews: 0, totalDownloads: 0, totalReads: 0 });
  const [recentBooks, setRecentBooks] = useState([]);
  const [popularBooks, setPopularBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [booksRes, cats, auths, users] = await Promise.all([
          getBooks({ pageSize: 100, publishedOnly: false }),
          getCategories(),
          getAuthors(),
          getUsers()
        ]);
        const popularRes = await getBooks({ sortBy: 'created_at', sortDir: 'desc', pageSize: 20, publishedOnly: false });

        const totalViews = booksRes.books.reduce((sum, b) => sum + (b.views || 0), 0);
        const totalDownloads = booksRes.books.reduce((sum, b) => sum + (b.downloads || 0), 0);
        const totalReads = booksRes.books.reduce((sum, b) => sum + (b.reads || 0), 0);

        setStats({
          books: booksRes.books.length,
          users: users.length,
          authors: auths.length,
          categories: cats.length,
          totalViews,
          totalDownloads,
          totalReads
        });
        setRecentBooks(booksRes.books.slice(0, 5));
        setPopularBooks([...popularRes.books].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loading />;

  const statCards = [
    { label: t('admin.totalBooks'), value: stats.books, icon: BookOpen, color: 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' },
    { label: t('admin.totalUsers'), value: stats.users, icon: Users, color: 'bg-secondary-50 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-400' },
    { label: t('admin.totalAuthors'), value: stats.authors, icon: TrendingUp, color: 'bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400' },
    { label: t('admin.totalCategories'), value: stats.categories, icon: Folder, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    { label: t('admin.totalDownloads'), value: stats.totalDownloads, icon: Download, color: 'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' },
    { label: t('admin.totalReads'), value: stats.totalReads, icon: Eye, color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{value.toLocaleString()}</p>
              <p className={`text-sm text-surface-500 ${lang === 'km' ? 'font-khmer' : ''}`}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary-500" />
            <h3 className={`font-semibold text-surface-900 dark:text-white ${lang === 'km' ? 'font-khmer' : ''}`}>
              {t('admin.recentUploads')}
            </h3>
          </div>
          <div className="space-y-3">
            {recentBooks.map(book => {
              const title = lang === 'km' ? (book.title_km || book.title_en) : (book.title_en || book.title_km);
              return (
                <div key={book.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors">
                  <div className="w-10 h-14 rounded-lg bg-surface-200 dark:bg-surface-600 shrink-0 overflow-hidden">
                    {book.coverUrl && <img src={book.coverUrl} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate text-surface-900 dark:text-white ${lang === 'km' ? 'font-khmer' : ''}`}>{title}</p>
                    <p className="text-xs text-surface-500">{formatDate(book.created_at, lang)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${book.isPublished ? 'bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400' : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                    {book.isPublished ? t('admin.published') : t('admin.unpublished')}
                  </span>
                </div>
              );
            })}
            {recentBooks.length === 0 && (
              <p className="text-sm text-surface-500 text-center py-4">{t('common.noData')}</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-secondary-500" />
            <h3 className={`font-semibold text-surface-900 dark:text-white ${lang === 'km' ? 'font-khmer' : ''}`}>
              {t('admin.mostPopular')}
            </h3>
          </div>
          <div className="space-y-3">
            {popularBooks.map((book, idx) => {
              const title = lang === 'km' ? (book.title_km || book.title_en) : (book.title_en || book.title_km);
              return (
                <div key={book.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors">
                  <span className="text-lg font-bold text-surface-300 dark:text-surface-600 w-6 text-center">{idx + 1}</span>
                  <div className="w-10 h-14 rounded-lg bg-surface-200 dark:bg-surface-600 shrink-0 overflow-hidden">
                    {book.coverUrl && <img src={book.coverUrl} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate text-surface-900 dark:text-white ${lang === 'km' ? 'font-khmer' : ''}`}>{title}</p>
                    <div className="flex items-center gap-3 text-xs text-surface-500">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{book.views || 0}</span>
                      <span className="flex items-center gap-1"><Download className="w-3 h-3" />{book.downloads || 0}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {popularBooks.length === 0 && (
              <p className="text-sm text-surface-500 text-center py-4">{t('common.noData')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
