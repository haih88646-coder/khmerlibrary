import { BookOpen } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Loading({ message }) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center animate-pulse">
          <BookOpen className="w-8 h-8 text-primary-500" />
        </div>
        <div className="absolute inset-0 rounded-2xl border-2 border-primary-200 dark:border-primary-800 animate-spin border-t-transparent" />
      </div>
      <p className="mt-4 text-sm text-surface-500 dark:text-surface-400">{message || t('common.loading')}</p>
    </div>
  );
}
