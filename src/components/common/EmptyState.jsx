import { BookOpen, SearchX, Heart, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const icons = {
  books: BookOpen,
  search: SearchX,
  favorites: Heart,
  error: AlertTriangle,
};

export default function EmptyState({ type = 'books', title, description, action }) {
  const { lang, t } = useLanguage();
  const Icon = icons[type] || BookOpen;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-3xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-5">
        <Icon className="w-10 h-10 text-surface-300 dark:text-surface-500" />
      </div>
      <h2 className={`text-lg font-semibold text-surface-700 dark:text-surface-300 mb-2 ${lang === 'km' ? 'font-khmer' : ''}`}>
        {title || t('book.noBooks')}
      </h2>
      {description && (
        <p className="text-sm text-surface-500 dark:text-surface-400 max-w-sm mb-5">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
