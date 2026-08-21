import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2, ToggleLeft, ToggleRight, FileText } from 'lucide-react';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import Modal from '../../components/common/Modal';
import { useLanguage } from '../../contexts/LanguageContext';
import { getBooks, deleteBook, updateBook } from '../../supabase/books';
import { formatDate } from '../../utils/helpers';
import { toast } from 'react-toastify';

export default function BookManagement() {
  const { lang, t } = useLanguage();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadBooks = async () => {
    setLoading(true);
    try {
      const result = await getBooks({ pageSize: 100, publishedOnly: false });
      setBooks(result.books);
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBooks(); }, []);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteBook(deleteConfirm);
      setBooks(prev => prev.filter(b => b.id !== deleteConfirm));
      setDeleteConfirm(null);
      toast.success(t('common.success'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setDeleting(false);
    }
  };

  const togglePublished = async (id, current) => {
    try {
      await updateBook(id, { isPublished: !current });
      setBooks(prev => prev.map(b => b.id === id ? { ...b, isPublished: !current } : b));
      toast.success(t('common.success'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const filtered = books.filter(b => {
    const s = search.toLowerCase();
    return !s || (b.title_en || '').toLowerCase().includes(s) || (b.title_km || '').includes(search) || (b.authorName || '').toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className={`text-2xl font-bold text-surface-900 dark:text-white ${lang === 'km' ? 'font-khmer' : ''}`}>
          {t('admin.books')} ({books.length})
        </h1>
        <Link to="/admin/books/add">
          <Button icon={Plus}>{t('admin.addBook')}</Button>
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('search.placeholder')}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white"
        />
      </div>

      {loading ? <Loading /> : (
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-900">
                  <th className="text-left px-4 py-3 font-medium text-surface-500">{t('admin.bookTitle')}</th>
                  <th className="text-left px-4 py-3 font-medium text-surface-500 hidden md:table-cell">{t('book.author')}</th>
                  <th className="text-left px-4 py-3 font-medium text-surface-500 hidden lg:table-cell">{t('filter.format')}</th>
                  <th className="text-left px-4 py-3 font-medium text-surface-500 hidden lg:table-cell">{t('admin.publishStatus')}</th>
                  <th className="text-left px-4 py-3 font-medium text-surface-500 hidden xl:table-cell">{t('book.views')}</th>
                  <th className="text-left px-4 py-3 font-medium text-surface-500 hidden xl:table-cell">{t('book.downloads')}</th>
                  <th className="text-right px-4 py-3 font-medium text-surface-500">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                {filtered.map(book => {
                  const title = lang === 'km' ? (book.title_km || book.title_en) : (book.title_en || book.title_km);
                  return (
                    <tr key={book.id} className="hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-11 rounded bg-surface-200 dark:bg-surface-600 shrink-0 overflow-hidden">
                            {book.coverUrl ? <img src={book.coverUrl} alt="" className="w-full h-full object-cover" /> : <FileText className="w-4 h-4 text-surface-400 m-auto mt-3" />}
                          </div>
                          <span className={`font-medium text-surface-900 dark:text-white truncate max-w-[200px] ${lang === 'km' ? 'font-khmer' : ''}`}>{title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-surface-600 dark:text-surface-400 hidden md:table-cell">{book.authorName || '—'}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="px-2 py-0.5 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 text-xs font-semibold rounded uppercase">{book.fileType || '—'}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <button onClick={() => togglePublished(book.id, book.isPublished)} className="flex items-center gap-1">
                          {book.isPublished ? <ToggleRight className="w-6 h-6 text-accent-500" /> : <ToggleLeft className="w-6 h-6 text-surface-400" />}
                          <span className={`text-xs font-medium ${book.isPublished ? 'text-accent-600' : 'text-surface-500'}`}>{book.isPublished ? t('admin.published') : t('admin.unpublished')}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-surface-600 dark:text-surface-400 hidden xl:table-cell">{book.views || 0}</td>
                      <td className="px-4 py-3 text-surface-600 dark:text-surface-400 hidden xl:table-cell">{book.downloads || 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/book/${book.id}`} className="p-2 rounded-lg text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link to={`/admin/books/edit/${book.id}`} className="p-2 rounded-lg text-surface-400 hover:text-secondary-600 hover:bg-secondary-50 dark:hover:bg-secondary-900/30 transition-colors">
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button onClick={() => setDeleteConfirm(book.id)} className="p-2 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-surface-500">{t('common.noData')}</div>
          )}
        </div>
      )}

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title={t('admin.confirmDelete')} size="sm">
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>{t('admin.cancel')}</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>{t('admin.delete')}</Button>
        </div>
      </Modal>
    </div>
  );
}
