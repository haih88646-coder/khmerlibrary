import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Loading from '../../components/common/Loading';
import { useLanguage } from '../../contexts/LanguageContext';
import { getAuthors, addAuthor, updateAuthor, deleteAuthor } from '../../supabase/authors';
import { toast } from 'react-toastify';

export default function AuthorManagement() {
  const { lang, t } = useLanguage();
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({ name_km: '', name_en: '', bio_km: '', bio_en: '', website: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { setAuthors(await getAuthors()); }
    catch { setAuthors([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name_km: '', name_en: '', bio_km: '', bio_en: '', website: '' });
    setModalOpen(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    setForm({ name_km: a.name_km || '', name_en: a.name_en || '', bio_km: a.bio_km || '', bio_en: a.bio_en || '', website: a.website || '' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name_en && !form.name_km) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await updateAuthor(editing.id, form);
        setAuthors(prev => prev.map(a => a.id === editing.id ? { ...a, ...form } : a));
      } else {
        const id = await addAuthor(form);
        setAuthors(prev => [...prev, { id, ...form }]);
      }
      setModalOpen(false);
      toast.success(t('common.success'));
    } catch {
      toast.error(t('common.error'));
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteAuthor(deleteConfirm);
      setAuthors(prev => prev.filter(a => a.id !== deleteConfirm));
      setDeleteConfirm(null);
      toast.success(t('common.success'));
    } catch { toast.error(t('common.error')); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={`text-2xl font-bold text-surface-900 dark:text-white ${lang === 'km' ? 'font-khmer' : ''}`}>
          {t('admin.authors')} ({authors.length})
        </h1>
        <Button icon={Plus} onClick={openAdd}>{t('admin.addAuthor')}</Button>
      </div>

      {loading ? <Loading /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {authors.map(author => (
            <div key={author.id} className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                    <span className={`text-lg font-bold text-primary-600 dark:text-primary-400 ${lang === 'km' ? 'font-khmer' : ''}`}>
                      {(lang === 'km' ? (author.name_km || author.name_en) : (author.name_en || author.name_km) || '?')[0]}
                    </span>
                  </div>
                  <div>
                    <h2 className={`font-semibold text-surface-900 dark:text-white ${lang === 'km' ? 'font-khmer' : ''}`}>
                      {lang === 'km' ? (author.name_km || author.name_en) : (author.name_en || author.name_km)}
                    </h2>
                    {author.name_km && author.name_en && (
                      <p className="text-xs text-surface-500">{lang === 'km' ? author.name_en : author.name_km}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(author)} className="p-1.5 rounded-lg text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteConfirm(author.id)} className="p-1.5 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {(author.bio_km || author.bio_en) && (
                <p className="text-xs text-surface-500 line-clamp-2">
                  {lang === 'km' ? (author.bio_km || author.bio_en) : (author.bio_en || author.bio_km)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('admin.edit') : t('admin.addAuthor')}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">Name (Khmer)</label>
              <input type="text" value={form.name_km} onChange={(e) => setForm({ ...form, name_km: e.target.value })} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white font-khmer" />
            </div>
            <div>
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">Name (English)</label>
              <input type="text" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">Bio (Khmer)</label>
            <textarea value={form.bio_km} onChange={(e) => setForm({ ...form, bio_km: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white resize-none font-khmer" />
          </div>
          <div>
            <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">Bio (English)</label>
            <textarea value={form.bio_en} onChange={(e) => setForm({ ...form, bio_en: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white resize-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">Website</label>
            <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>{t('admin.cancel')}</Button>
            <Button type="submit" loading={saving} icon={Save}>{t('admin.save')}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title={t('admin.confirmDelete')} size="sm">
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>{t('admin.cancel')}</Button>
          <Button variant="danger" onClick={handleDelete}>{t('admin.delete')}</Button>
        </div>
      </Modal>
    </div>
  );
}
