import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Image, FileText, Save } from 'lucide-react';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { useLanguage } from '../../contexts/LanguageContext';
import { addBook, updateBook, getBook, uploadBookFile, uploadCoverImage } from '../../supabase/books';
import { getCategories } from '../../supabase/categories';
import { getAuthors } from '../../supabase/authors';
import { validateBookFile, validateCoverImage } from '../../utils/helpers';
import { toast } from 'react-toastify';

export default function AddEditBook() {
  const { id } = useParams();
  const isEdit = !!id;
  const { lang, t } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [coverProgress, setCoverProgress] = useState(0);

  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);

  const [form, setForm] = useState({
    title_km: '', title_en: '', authorId: '', authorName: '', categoryId: '',
    description_km: '', description_en: '', publisher: '', publicationYear: new Date().getFullYear(),
    language: 'Khmer', isbn: '', pages: '', tags: '',
    isFeatured: false, isPublished: true,
  });

  const [bookFile, setBookFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [existingBook, setExistingBook] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [cats, auths] = await Promise.all([getCategories(), getAuthors()]);
        setCategories(cats);
        setAuthors(auths);
        if (isEdit) {
          const book = await getBook(id);
          if (book) {
            setExistingBook(book);
            setForm({
              title_km: book.title_km || '', title_en: book.title_en || '',
              authorId: book.authorId || '', authorName: book.authorName || '',
              categoryId: book.categoryId || '',
              description_km: book.description_km || '', description_en: book.description_en || '',
              publisher: book.publisher || '', publicationYear: book.publicationYear || new Date().getFullYear(),
              language: book.language || 'Khmer', isbn: book.isbn || '', pages: book.pages || '',
              tags: (book.tags || []).join(', '),
              isFeatured: book.isFeatured || false, isPublished: book.isPublished ?? true,
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit]);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleBookFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateBookFile(file);
    if (!validation.valid) { toast.error(validation.error); return; }
    setBookFile(file);
  };

  const handleCoverFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateCoverImage(file);
    if (!validation.valid) { toast.error(validation.error); return; }
    setCoverFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let fileUrl = existingBook?.fileUrl || '';
      let fileType = existingBook?.fileType || '';
      let fileSize = existingBook?.fileSize || 0;

      console.log('bookFile:', bookFile, 'existingFileUrl:', existingBook?.fileUrl);
      if (bookFile) {
        const result = await uploadBookFile(bookFile, setUploadProgress);
        console.log('Upload result:', result);
        fileUrl = result.url;
        fileType = bookFile.name.split('.').pop().toLowerCase();
        fileSize = bookFile.size;
      } else if (!isEdit || !existingBook?.fileUrl) {
        toast.error('Please select a book file');
        setSaving(false);
        return;
      }

      let coverUrl = existingBook?.coverUrl || '';
      if (coverFile) {
        const result = await uploadCoverImage(coverFile, setCoverProgress);
        coverUrl = result.url;
      }

      const selectedAuthor = authors.find(a => a.id === form.authorId);
      const authorName = selectedAuthor
        ? (lang === 'km' ? (selectedAuthor.name_km || selectedAuthor.name_en) : (selectedAuthor.name_en || selectedAuthor.name_km))
        : form.authorName;

      const bookData = {
        ...form,
        authorId: form.authorId || null,
        categoryId: form.categoryId || null,
        authorName,
        fileUrl, fileType, fileSize, coverUrl,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        publicationYear: Number(form.publicationYear),
        pages: form.pages ? Number(form.pages) : null,
      };
      console.log('Saving book with fileUrl:', bookData.fileUrl);

      if (isEdit) {
        await updateBook(id, bookData);
      } else {
        await addBook(bookData);
      }

      toast.success(isEdit ? 'Book updated successfully' : 'Book added successfully');
      navigate('/admin/books');
    } catch (err) {
      console.error(err);
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/admin/books')} className="flex items-center gap-2 text-sm text-surface-500 hover:text-primary-600 mb-6">
        <ArrowLeft className="w-4 h-4" /> {t('admin.back')}
      </button>

      <h1 className={`text-2xl font-bold text-surface-900 dark:text-white mb-6 ${lang === 'km' ? 'font-khmer' : ''}`}>
        {isEdit ? t('admin.editBook') : t('admin.addBook')}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
          <h2 className={`text-lg font-semibold text-surface-900 dark:text-white mb-4 ${lang === 'km' ? 'font-khmer' : ''}`}>
            {t('admin.bookTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">{t('admin.bookTitleKm')}</label>
              <input type="text" value={form.title_km} onChange={(e) => update('title_km', e.target.value)} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white font-khmer" />
            </div>
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">{t('admin.bookTitleEn')}</label>
              <input type="text" value={form.title_en} onChange={(e) => update('title_en', e.target.value)} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
          <h2 className={`text-lg font-semibold text-surface-900 dark:text-white mb-4 ${lang === 'km' ? 'font-khmer' : ''}`}>
            {t('book.description')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">{t('admin.descriptionKm')}</label>
              <textarea value={form.description_km} onChange={(e) => update('description_km', e.target.value)} rows={4} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white resize-none font-khmer" />
            </div>
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">{t('admin.descriptionEn')}</label>
              <textarea value={form.description_en} onChange={(e) => update('description_en', e.target.value)} rows={4} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white resize-none" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
          <h2 className={`text-lg font-semibold text-surface-900 dark:text-white mb-4 ${lang === 'km' ? 'font-khmer' : ''}`}>
            {t('book.details')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">{t('book.author')}</label>
              <select value={form.authorId} onChange={(e) => update('authorId', e.target.value)} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white">
                <option value="">Select Author</option>
                {authors.map(a => <option key={a.id} value={a.id}>{lang === 'km' ? (a.name_km || a.name_en) : (a.name_en || a.name_km)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">{t('book.category')}</label>
              <select value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white">
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{lang === 'km' ? (c.name_km || c.name_en) : (c.name_en || c.name_km)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">{t('book.publisher')}</label>
              <input type="text" value={form.publisher} onChange={(e) => update('publisher', e.target.value)} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white" />
            </div>
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">{t('book.year')}</label>
              <input type="number" value={form.publicationYear} onChange={(e) => update('publicationYear', e.target.value)} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white" />
            </div>
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">{t('book.language')}</label>
              <select value={form.language} onChange={(e) => update('language', e.target.value)} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white">
                <option>Khmer</option>
                <option>English</option>
                <option>French</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">ISBN</label>
              <input type="text" value={form.isbn} onChange={(e) => update('isbn', e.target.value)} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white" />
            </div>
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">{t('book.pages')}</label>
              <input type="number" value={form.pages} onChange={(e) => update('pages', e.target.value)} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">Tags (comma separated)</label>
              <input type="text" value={form.tags} onChange={(e) => update('tags', e.target.value)} placeholder="khmer, history, literature" className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
          <h2 className={`text-lg font-semibold text-surface-900 dark:text-white mb-4 ${lang === 'km' ? 'font-khmer' : ''}`}>
            {t('admin.uploadBook')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2 block">{t('admin.bookFile')} (PDF/TXT)</label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl cursor-pointer hover:border-primary-400 transition-colors bg-surface-50 dark:bg-surface-900">
                <FileText className="w-8 h-8 text-surface-400 mb-2" />
                <span className="text-sm text-surface-500">{bookFile ? bookFile.name : 'Click to upload'}</span>
                <input type="file" accept=".pdf,.txt" onChange={handleBookFile} className="hidden" />
              </label>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2">
                  <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="text-xs text-surface-500 mt-1">{Math.round(uploadProgress)}%</p>
                </div>
              )}
              {existingBook?.fileUrl && !bookFile && (
                <p className="text-xs text-accent-600 mt-2">Current file attached</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2 block">{t('admin.coverImage')}</label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl cursor-pointer hover:border-primary-400 transition-colors bg-surface-50 dark:bg-surface-900">
                <Image className="w-8 h-8 text-surface-400 mb-2" />
                <span className="text-sm text-surface-500">{coverFile ? coverFile.name : 'Click to upload cover'}</span>
                <input type="file" accept="image/*" onChange={handleCoverFile} className="hidden" />
              </label>
              {coverProgress > 0 && coverProgress < 100 && (
                <div className="mt-2">
                  <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${coverProgress}%` }} />
                  </div>
                  <p className="text-xs text-surface-500 mt-1">{Math.round(coverProgress)}%</p>
                </div>
              )}
              {existingBook?.coverUrl && !coverFile && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={existingBook.coverUrl} alt="" className="w-10 h-14 rounded object-cover" />
                  <span className="text-xs text-accent-600">Current cover</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => update('isFeatured', e.target.checked)} className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500" />
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPublished} onChange={(e) => update('isPublished', e.target.checked)} className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500" />
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{t('admin.published')}</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" type="button" onClick={() => navigate('/admin/books')}>{t('admin.cancel')}</Button>
          <Button type="submit" loading={saving} icon={Save}>{t('admin.save')}</Button>
        </div>
      </form>
    </div>
  );
}
