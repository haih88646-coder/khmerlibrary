import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const { lang } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-white dark:bg-surface-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto fade-in`}>
        <div className="flex items-center justify-between p-5 border-b border-surface-200 dark:border-surface-700">
          <h2 className={`text-lg font-semibold text-surface-900 dark:text-white ${lang === 'km' ? 'font-khmer' : ''}`}>
            {title}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
