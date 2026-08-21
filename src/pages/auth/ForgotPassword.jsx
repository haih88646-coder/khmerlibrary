import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { resetPassword } from '../../supabase/auth';
import Button from '../../components/common/Button';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'react-toastify';

export default function ForgotPassword() {
  const { lang, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      const msg = err.code === 'auth/user-not-found' ? 'No account found with this email' : 'Failed to send reset email';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold text-surface-900 dark:text-white mb-2 ${lang === 'km' ? 'font-khmer' : ''}`}>
            {t('auth.resetPassword')}
          </h1>
        </div>

        <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700 p-8">
          {sent ? (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-accent-500 mx-auto mb-4" />
              <p className={`text-surface-700 dark:text-surface-300 mb-6 ${lang === 'km' ? 'font-khmer' : ''}`}>
                {t('auth.resetSent')}
              </p>
              <Link to="/login">
                <Button variant="secondary" className="w-full" icon={ArrowLeft}>{t('auth.login')}</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={`text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block ${lang === 'km' ? 'font-khmer' : ''}`}>
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                {t('auth.resetPassword')}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
              {t('common.back')} {t('auth.login')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
