import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Loading from '../../components/common/Loading';
import { useLanguage } from '../../contexts/LanguageContext';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../../supabase/categories';
import { toast } from 'react-toastify';

export default function CategoryManagement() {
  const { lang, t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({ name_km: '', name_en: '', description_km: '', description_en: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch { setCategories([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name_km: '', name_en: '', description_km: '', description_en: '' });
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name_km: cat.name_km || '', name_en: cat.name_en || '', description_km: cat.description_km || '', description_en: cat.description_en || '' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name_en && !form.name_km) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await updateCategory(editing.id, form);
        setCategories(prev => prev.map(c => c.id === editing.id ? { ...c, ...form } : c));
      } else {
        const id = await addCategory(form);
        setCategories(prev => [...prev, { id, ...form }]);
      }
      setModalOpen(false);
      toast.success(t('common.success'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteCategory(deleteConfirm);
      setCategories(prev => prev.filter(c => c.id !== deleteConfirm));
      setDeleteConfirm(null);
      toast.success(t('common.success'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={`text-2xl font-bold text-surface-900 dark:text-white ${lang === 'km' ? 'font-khmer' : ''}`}>
          {t('admin.categories')} ({categories.length})
        </h1>
        <Button icon={Plus} onClick={openAdd}>{t('admin.addCategory')}</Button>
      </div>

      {loading ? <Loading /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className={`font-semibold text-surface-900 dark:text-white ${lang === 'km' ? 'font-khmer' : ''}`}>
                      {lang === 'km' ? (cat.name_km || cat.name_en) : (cat.name_en || cat.name_km)}
                    </h2>
                  {cat.name_km && cat.name_en && (
                    <p className="text-xs text-surface-500 mt-0.5">
                      {lang === 'km' ? cat.name_en : cat.name_km}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteConfirm(cat.id)} className="p-1.5 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {(cat.description_km || cat.description_en) && (
                <p className="text-xs text-surface-500 line-clamp-2">
                  {lang === 'km' ? (cat.description_km || cat.description_en) : (cat.description_en || cat.description_km)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('admin.edit') + ' ' + t('admin.categories') : t('admin.addCategory')}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">Name (Khmer)</label>
            <input type="text" value={form.name_km} onChange={(e) => setForm({ ...form, name_km: e.target.value })} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white font-khmer" />
          </div>
          <div>
            <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">Name (English)</label>
            <input type="text" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white" />
          </div>
          <div>
            <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">Description (Khmer)</label>
            <textarea value={form.description_km} onChange={(e) => setForm({ ...form, description_km: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white resize-none font-khmer" />
          </div>
          <div>
            <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">Description (English)</label>
            <textarea value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white resize-none" />
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
