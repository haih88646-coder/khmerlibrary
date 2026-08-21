import { Link } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { useLanguage } from '../../contexts/LanguageContext';

export default function LoginPrompt({ isOpen, onClose, message }) {
  const { t } = useLanguage();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('auth.loginRequired')} size="sm">
      <div className="text-center">
        <p className="text-sm text-surface-600 dark:text-surface-400 mb-6">{message || t('auth.loginRequired')}</p>
        <div className="flex flex-col gap-3">
          <Link to="/login" onClick={onClose}>
            <Button variant="primary" className="w-full" icon={LogIn}>{t('auth.login')}</Button>
          </Link>
          <Link to="/signup" onClick={onClose}>
            <Button variant="outline" className="w-full" icon={UserPlus}>{t('auth.signup')}</Button>
          </Link>
          <Button variant="ghost" onClick={onClose} className="w-full">{t('auth.continueReading')}</Button>
        </div>
      </div>
    </Modal>
  );
}
