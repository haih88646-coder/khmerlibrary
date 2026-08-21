import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { registerUser } from '../../supabase/auth';
import Button from '../../components/common/Button';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'react-toastify';

export default function SignUp() {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await registerUser(email, password, displayName);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use' ? 'Email already in use' :
        err.code === 'auth/weak-password' ? 'Password is too weak' :
        'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold text-surface-900 dark:text-white mb-2 ${lang === 'km' ? 'font-khmer' : ''}`}>
            {t('auth.signup')}
          </h1>
          <p className={`text-surface-500 ${lang === 'km' ? 'font-khmer' : ''}`}>
            {t('home.hero.subtitle')}
          </p>
        </div>

        <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={`text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block ${lang === 'km' ? 'font-khmer' : ''}`}>
                {t('auth.displayName')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white"
                />
              </div>
            </div>

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

            <div>
              <label className={`text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block ${lang === 'km' ? 'font-khmer' : ''}`}>
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-12 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className={`text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block ${lang === 'km' ? 'font-khmer' : ''}`}>
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-surface-900 dark:text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading} icon={UserPlus}>
              {t('auth.signup')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className={`text-sm text-surface-500 ${lang === 'km' ? 'font-khmer' : ''}`}>
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
                {t('auth.login')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
