import { useState } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Folder, Users, ChevronLeft, ChevronRight, Menu, X, LogOut, Globe, Sun, Moon, Shield, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';

export default function AdminLayout() {
  const { user, profile, isAdmin, logout } = useAuth();
  const { lang, t, toggleLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { settings, getName } = useSiteSettings();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user || !isAdmin) return <Navigate to="/login" replace />;

  const navItems = [
    { to: '/admin', label: t('admin.dashboard'), icon: LayoutDashboard, exact: true },
    { to: '/admin/books', label: t('admin.books'), icon: BookOpen },
    { to: '/admin/categories', label: t('admin.categories'), icon: Folder },
    { to: '/admin/authors', label: t('admin.authors'), icon: Users },
    { to: '/admin/users', label: t('admin.users'), icon: Shield },
    { to: '/admin/settings', label: t('admin.settings'), icon: Settings },
  ];

  const isActive = (path, exact) => exact ? location.pathname === path : location.pathname.startsWith(path);

  const Sidebar = () => (
    <aside className={`bg-surface-900 dark:bg-black text-white flex flex-col shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} ${mobileOpen ? 'fixed inset-0 z-50 w-64' : 'hidden lg:flex'}`}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-surface-800">
        <Link to="/admin" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center overflow-hidden">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="" className="w-full h-full object-contain" />
            ) : (
              <BookOpen className="w-5 h-5 text-white" strokeWidth={2.5} />
            )}
          </div>
          {sidebarOpen && (
            <span className={`font-bold text-sm ${lang === 'km' ? 'font-khmer' : ''}`}>
              {getName(lang)}
            </span>
          )}
        </Link>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 text-surface-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <Link
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive(to, exact) ? 'bg-primary-600 text-white' : 'text-surface-400 hover:text-white hover:bg-surface-800'}`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className={lang === 'km' ? 'font-khmer' : ''}>{label}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-surface-800">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
        >
          <Globe className="w-5 h-5 shrink-0" />
          {sidebarOpen && <span>{t('nav.home')}</span>}
        </Link>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex">
      <Sidebar />

      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => { if (window.innerWidth < 1024) setMobileOpen(true); else setSidebarOpen(!sidebarOpen); }} className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <p className={`text-lg font-semibold text-surface-900 dark:text-white ${lang === 'km' ? 'font-khmer' : ''}`}>
              {navItems.find(n => isActive(n.to, n.exact))?.label || t('admin.dashboard')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={toggleLanguage} className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors flex items-center gap-1">
              <Globe className="w-5 h-5" />
              <span className="text-xs font-semibold">{lang === 'km' ? 'EN' : 'ខ្មែរ'}</span>
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-surface-200 dark:border-surface-700">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <span className="text-sm font-bold text-primary-600">{(profile?.displayName || user.email || '?')[0].toUpperCase()}</span>
              </div>
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300 hidden sm:block">{profile?.displayName || user.email}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
