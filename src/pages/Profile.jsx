import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { User, Mail, Calendar, Save } from 'lucide-react';
import { updateUserProfile } from '../supabase/auth';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatDate } from '../utils/helpers';
import { toast } from 'react-toastify';

export default function Profile() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const { lang, t } = useLanguage();
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setDisplayName(profile.displayName || '');
  }, [profile]);

  if (authLoading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { displayName });
      await refreshProfile();
      toast.success(t('common.success'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className={`text-3xl font-bold text-surface-900 dark:text-white mb-8 ${lang === 'km' ? 'font-khmer' : ''}`}>
          {t('profile.title')}
        </h1>

        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-8 shadow-sm">
          <div className="flex items-center gap-5 mb-8 pb-6 border-b border-surface-100 dark:border-surface-700">
            <div className="w-20 h-20 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span className={`text-3xl font-bold text-primary-600 dark:text-primary-400 ${lang === 'km' ? 'font-khmer' : ''}`}>
                {(profile?.displayName || user.email || '?')[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className={`text-xl font-bold text-surface-900 dark:text-white ${lang === 'km' ? 'font-khmer' : ''}`}>
                {profile?.displayName || user.email}
              </h2>
              <p className="text-sm text-surface-500">{user.email}</p>
              <p className="text-xs text-surface-400 mt-1">
                {t('profile.memberSince')}: {formatDate(profile?.created_at, lang)}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className={`text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block ${lang === 'km' ? 'font-khmer' : ''}`}>
                {t('profile.name')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className={`text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block ${lang === 'km' ? 'font-khmer' : ''}`}>
                {t('profile.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-700 rounded-xl text-sm text-surface-500 cursor-not-allowed"
                />
              </div>
            </div>

            <Button type="submit" loading={saving} icon={Save}>
              {t('profile.updateProfile')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
