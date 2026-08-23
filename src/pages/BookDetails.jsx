import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Download, Eye, Calendar, BookOpen, FileText, ArrowLeft, User, Globe, Hash, Clock, BarChart3, Users } from 'lucide-react';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';
import BookCard from '../components/common/BookCard';
import LoginPrompt from '../components/common/LoginPrompt';
import ShareButtons from '../components/common/ShareButtons';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getBook, incrementViews, incrementDownloads, incrementReads, getBooks } from '../supabase/books';
import { getBloomBooksByIds, isBloomId, stripBloomPrefix } from '../utils/bloomApi';
import { getArchiveBooksByIds, isArchiveId, stripArchivePrefix, getArchivePdfUrl } from '../utils/archiveApi';
import { getElibraryBooksByIds, isElibraryId, stripElibraryPrefix, getElibraryBookPdf } from '../utils/elibraryApi';
import { formatDate, formatFileSize } from '../utils/helpers';
import { toast } from 'react-toastify';

export default function BookDetails() {
  const { id } = useParams();
  const { user, isFavorite, toggleFavorite } = useAuth();
  const { lang, t } = useLanguage();

  const [book, setBook] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loginPrompt, setLoginPrompt] = useState({ open: false, message: '' });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let b = null;
        if (isBloomId(id)) {
          const arr = await getBloomBooksByIds([stripBloomPrefix(id)]);
          b = arr?.[0] || null;
        } else if (isElibraryId(id)) {
          const arr = await getElibraryBooksByIds([stripElibraryPrefix(id)]);
          b = arr?.[0] || null;
        } else if (isArchiveId(id)) {
          const arr = await getArchiveBooksByIds([stripArchivePrefix(id)]);
          b = arr?.[0] || null;
        } else {
          b = await getBook(id);
          if (b?.categoryId) {
            getBooks({ category: b.categoryId, pageSize: 6, publishedOnly: false })
              .then(res => setRelated(res.books.filter(bo => bo.id !== id)))
              .catch(() => {});
          }
        }
        setBook(b);
      } catch {
        setBook(null);
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) return <Loading />;
  if (!book) return <EmptyState type="error" title={t('errors.notFound')} />;

  const title = lang === 'km' ? (book.title_km || book.title_en) : (book.title_en || book.title_km);
  const altTitle = lang === 'km' ? book.title_en : book.title_km;
  const desc = lang === 'km' ? (book.description_km || book.description_en) : (book.description_en || book.description_km);

  const handleFavorite = async () => {
    if (!user) {
      setLoginPrompt({ open: true, message: t('auth.favoriteRequired') });
      return;
    }
    await toggleFavorite(book.id);
  };

  const isExternal = isBloomId(book.id) || isElibraryId(book.id) || isArchiveId(book.id);

  const handleDownload = () => {
    if (!user) {
      setLoginPrompt({ open: true, message: t('auth.downloadRequired') });
      return;
    }
    if (book.fileUrl) {
      const link = document.createElement('a');
      link.href = book.fileUrl;
      link.download = `${title}.${book.fileType || 'pdf'}`;
      link.click();
      if (!isExternal) incrementDownloads(book.id).catch(() => {});
    }
  };

  const handleRead = () => {
    if (isExternal) return;
    incrementViews(book.id).catch(() => {});
    incrementReads(book.id).catch(() => {});
  };

  const openExternalBook = async () => {
    let url = book.fileUrl || book.link || '';
    if (!url && isElibraryId(book.id)) {
      url = await getElibraryBookPdf(stripElibraryPrefix(book.id)).catch(() => '');
    }
    if (!url && isArchiveId(book.id)) {
      const plain = stripArchivePrefix(book.id);
      url = await getArchivePdfUrl(plain).catch(() => '') || `https://archive.org/details/${plain}`;
    }
    if (url) window.open(url, '_blank', 'noopener');
  };

  const readPath = book.fileType?.toLowerCase() === 'txt' ? `/read-txt/${book.id}` : `/read/${book.id}`;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/browse" className="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-primary-600 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> {t('common.back')}
        </Link>

        <div className="bg-white dark:bg-surface-800 rounded-3xl border border-surface-200 dark:border-surface-700 overflow-hidden shadow-sm">
          <div className="flex flex-col lg:flex-row">
            {/* Cover */}
            <div className="lg:w-80 shrink-0 bg-surface-100 dark:bg-surface-900 p-8 flex items-center justify-center">
              <div className="w-52 h-72 rounded-2xl overflow-hidden shadow-xl bg-surface-200 dark:bg-surface-700">
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt={title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                    <FileText className="w-12 h-12 text-surface-400" />
                    <span className="text-xs text-surface-400 uppercase font-semibold">{book.fileType || 'book'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 p-8">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className={`book-title text-2xl md:text-3xl font-bold text-surface-900 dark:text-white mb-1 ${lang === 'km' ? 'font-khmer' : ''}`}>
                    {title}
                  </h1>
                  {altTitle && (
                    <p className={`book-title text-lg text-surface-500 dark:text-surface-400 ${lang === 'km' ? '' : 'font-khmer'}`}>
                      {altTitle}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {book.fileType && (
                  <span className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-semibold rounded-full uppercase">
                    {book.fileType}
                  </span>
                )}
                {book.isPublished === false && (
                  <span className="px-3 py-1 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-semibold rounded-full">
                    Draft
                  </span>
                )}
                {book.isFeatured && (
                  <span className="px-3 py-1 bg-secondary-50 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-400 text-xs font-semibold rounded-full">
                    ★ Featured
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 text-sm">
                {book.authorName && (
                  <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <User className="w-4 h-4 shrink-0" />
                    <span>{book.authorName}</span>
                  </div>
                )}
                {book.publicationYear && (
                  <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>{book.publicationYear}</span>
                  </div>
                )}
                {book.publisher && (
                  <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <span>{book.publisher}</span>
                  </div>
                )}
                {book.language && (
                  <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <Globe className="w-4 h-4 shrink-0" />
                    <span>{book.language}</span>
                  </div>
                )}
                {book.isbn && (
                  <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <Hash className="w-4 h-4 shrink-0" />
                    <span>{book.isbn}</span>
                  </div>
                )}
                {book.pages && (
                  <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <FileText className="w-4 h-4 shrink-0" />
                    <span>{book.pages} {t('book.pages')}</span>
                  </div>
                )}
                {book.fileSize && (
                  <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <BarChart3 className="w-4 h-4 shrink-0" />
                    <span>{formatFileSize(book.fileSize)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                  <Eye className="w-4 h-4 shrink-0" />
                  <span>{book.views || 0} {t('book.views')}</span>
                </div>
                <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                  <Users className="w-4 h-4 shrink-0" />
                  <span>{book.reads || 0} {t('book.readers')}</span>
                </div>
                <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                  <Download className="w-4 h-4 shrink-0" />
                  <span>{book.downloads || 0} {t('book.downloads')}</span>
                </div>
                {book.created_at && (
                  <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>{formatDate(book.created_at, lang)}</span>
                  </div>
                )}
              </div>

              {desc && (
                <div className="mb-6">
                  <h2 className={`text-sm font-semibold text-surface-500 dark:text-surface-400 mb-2 uppercase tracking-wider ${lang === 'km' ? 'font-khmer' : ''}`}>
                    {t('book.description')}
                  </h2>
                  <p className={`text-surface-700 dark:text-surface-300 leading-relaxed ${lang === 'km' ? 'font-khmer' : ''}`}>
                    {desc}
                  </p>
                </div>
              )}

              {book.tags && book.tags.length > 0 && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {book.tags.map((tag, i) => (
                      <span key={i} className="px-2.5 py-1 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-surface-100 dark:border-surface-700">
                {isExternal ? (
                  <Button size="lg" icon={BookOpen} onClick={openExternalBook}>{t('book.readNow')}</Button>
                ) : (
                  <Link to={readPath} onClick={handleRead}>
                    <Button size="lg" icon={BookOpen}>{t('book.readNow')}</Button>
                  </Link>
                )}
                <Button size="lg" variant="secondary" icon={Download} onClick={handleDownload}>
                  {t('book.download')}
                </Button>
                <Button
                  size="lg"
                  variant={isFavorite(book.id) ? 'danger' : 'outline'}
                  icon={Heart}
                  onClick={handleFavorite}
                >
                  {isFavorite(book.id) ? t('book.unfavorite') : t('book.favorite')}
                </Button>
              </div>

              <div className="pt-4">
                <ShareButtons title={title} path={`/book/${book.id}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Related Books */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className={`text-xl font-bold text-surface-900 dark:text-white mb-6 ${lang === 'km' ? 'font-khmer' : ''}`}>
              {t('book.related')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
              {related.map(b => <BookCard key={b.id} book={b} />)}
            </div>
          </div>
        )}
      </div>

      <LoginPrompt
        isOpen={loginPrompt.open}
        onClose={() => setLoginPrompt({ open: false, message: '' })}
        message={loginPrompt.message}
      />
    </div>
  );
}
