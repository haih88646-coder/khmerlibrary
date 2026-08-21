import { useState, useEffect } from 'react';
import { Search, Shield, User, Mail, Calendar, ToggleLeft, ToggleRight } from 'lucide-react';
import Loading from '../../components/common/Loading';
import { useLanguage } from '../../contexts/LanguageContext';
import { getUsers, updateUser } from '../../supabase/users';
import { formatDate } from '../../utils/helpers';
import { toast } from 'react-toastify';

export default function UserManagement() {
  const { lang, t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleActive = async (uid, current) => {
    try {
      await updateUser(uid, { isActive: !current });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, isActive: !current } : u));
      toast.success(t('common.success'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const toggleRole = async (uid, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await updateUser(uid, { role: newRole });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
      toast.success(t('common.success'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const filtered = users.filter(u => {
    const s = search.toLowerCase();
    return !s || (u.displayName || '').toLowerCase().includes(s) || (u.email || '').toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className={`text-2xl font-bold text-surface-900 dark:text-white ${lang === 'km' ? 'font-khmer' : ''}`}>
          {t('admin.users')} ({users.length})
        </h1>
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
                  <th className="text-left px-4 py-3 font-medium text-surface-500">{t('profile.name')}</th>
                  <th className="text-left px-4 py-3 font-medium text-surface-500 hidden md:table-cell">{t('profile.email')}</th>
                  <th className="text-left px-4 py-3 font-medium text-surface-500 hidden lg:table-cell">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-surface-500 hidden lg:table-cell">{t('profile.memberSince')}</th>
                  <th className="text-left px-4 py-3 font-medium text-surface-500">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-surface-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                {filtered.map(user => (
                  <tr key={user.uid} className="hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-primary-600">{(user.displayName || user.email || '?')[0].toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-surface-900 dark:text-white">{user.displayName || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-surface-600 dark:text-surface-400 hidden md:table-cell">{user.email}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <button
                        onClick={() => toggleRole(user.uid, user.role)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${user.role === 'admin' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 hover:bg-primary-100' : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-200'}`}
                      >
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-surface-500 hidden lg:table-cell text-xs">
                      {formatDate(user.created_at, lang)}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(user.uid, user.isActive !== false)} className="flex items-center gap-1">
                        {user.isActive !== false ? <ToggleRight className="w-6 h-6 text-accent-500" /> : <ToggleLeft className="w-6 h-6 text-surface-400" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs font-medium ${user.isActive !== false ? 'text-accent-600' : 'text-red-600'}`}>
                        {user.isActive !== false ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-surface-500">{t('common.noData')}</div>
          )}
        </div>
      )}
    </div>
  );
}
