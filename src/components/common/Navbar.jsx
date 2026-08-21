import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, X, Globe, Sun, Moon, User, LogOut, Heart, Shield, BookOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';
import { useSearch } from '../../hooks/useBooks';
import DonateModal from './DonateModal';

export default function Navbar() {
  const { user, profile, isAdmin, logout } = useAuth();
  const { lang, t, toggleLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { settings, getName } = useSiteSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  const { results, search, loading: searchLoading } = useSearch();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) search(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, search]);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { to: '/', label: t('nav.home'), icon: BookOpen },
    { to: '/browse', label: t('nav.browse'), icon: Search },
    { to: '/global-books', label: t('nav.global'), icon: Globe },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 dark:bg-surface-900/95 shadow-sm' : 'bg-white dark:bg-surface-900'}`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-md overflow-hidden">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="" className="w-full h-full object-contain" />
                ) : (
                  <BookOpen className="w-5 h-5 text-white" strokeWidth={2.5} />
                )}
              </div>
              <span className={`font-bold text-lg tracking-tight ${lang === 'km' ? 'font-khmer' : ''} text-surface-900 dark:text-white hidden sm:block`}>
                {getName(lang)}
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === to ? 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/30' : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100 dark:text-surface-400 dark:hover:text-white dark:hover:bg-surface-800'}`}
                >
                  {label}
                </Link>
              ))}
              {user && (
                <Link
                  to="/favorites"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/favorites' ? 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/30' : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100 dark:text-surface-400 dark:hover:text-white dark:hover:bg-surface-800'}`}
                >
                  {t('nav.favorites')}
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDonateOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm"
            >
              <Heart className="w-4 h-4 fill-current" />
              <span className={lang === 'km' ? 'font-khmer' : ''}>{t('nav.donate')}</span>
            </button>
            <div ref={searchRef} className="relative">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 rounded-lg text-surface-500 hover:text-surface-700 hover:bg-surface-100 dark:text-surface-400 dark:hover:text-white dark:hover:bg-surface-800 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              {searchOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-surface-800 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 p-3 fade-in">
                  <form onSubmit={handleSearch}>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('search.placeholder')}
                      className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                      autoFocus
                    />
                  </form>
                  {searchQuery.length >= 2 && (
                    <div className="mt-2 max-h-72 overflow-y-auto">
                      {searchLoading ? (
                        <div className="py-4 text-center text-sm text-surface-500">{t('common.loading')}</div>
                      ) : results.length > 0 ? (
                        results.slice(0, 8).map(book => (
                          <Link
                            key={book.id}
                            to={`/book/${book.id}`}
                            onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                          >
                            <div className="w-10 h-14 rounded bg-surface-200 dark:bg-surface-600 shrink-0 overflow-hidden">
                              {book.coverUrl && <img src={book.coverUrl} alt="" className="w-full h-full object-cover" />}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-sm font-medium truncate text-surface-900 dark:text-white ${lang === 'km' ? 'font-khmer' : ''}`}>
                                {lang === 'km' ? (book.title_km || book.title_en) : (book.title_en || book.title_km)}
                              </p>
                              <p className="text-xs text-surface-500 truncate">{book.authorName || ''}</p>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="py-4 text-center text-sm text-surface-500">{t('search.noResults')}</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-surface-500 hover:text-surface-700 hover:bg-surface-100 dark:text-surface-400 dark:hover:text-white dark:hover:bg-surface-800 transition-colors hidden sm:flex"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleLanguage}
              className="p-2 rounded-lg text-surface-500 hover:text-surface-700 hover:bg-surface-100 dark:text-surface-400 dark:hover:text-white dark:hover:bg-surface-800 transition-colors hidden sm:flex items-center gap-1"
            >
              <Globe className="w-5 h-5" />
              <span className="text-xs font-semibold">{lang === 'km' ? 'EN' : 'ខ្មែរ'}</span>
            </button>

            {user ? (
              <div ref={userMenuRef} className="relative hidden md:block">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                      {(profile?.displayName || user.email || '?')[0].toUpperCase()}
                    </span>
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-surface-800 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 py-2 fade-in">
                    <div className="px-4 py-2 border-b border-surface-100 dark:border-surface-700">
                      <p className={`text-sm font-semibold text-surface-900 dark:text-white ${lang === 'km' ? 'font-khmer' : ''}`}>{profile?.displayName || user.email}</p>
                      <p className="text-xs text-surface-500 truncate">{user.email}</p>
                    </div>
                    <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors">
                      <User className="w-4 h-4" /> {t('nav.profile')}
                    </Link>
                    <Link to="/favorites" className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors">
                      <Heart className="w-4 h-4" /> {t('nav.favorites')}
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors">
                        <Shield className="w-4 h-4" /> {t('nav.admin')}
                      </Link>
                    )}
                    <hr className="my-1 border-surface-100 dark:border-surface-700" />
                    <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <LogOut className="w-4 h-4" /> {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:text-surface-900 dark:hover:text-white transition-colors">
                  {t('nav.login')}
                </Link>
                <Link to="/signup" className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
                  {t('nav.signup')}
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-surface-500 hover:text-surface-700 hover:bg-surface-100 dark:text-surface-400 dark:hover:text-white dark:hover:bg-surface-800 transition-colors md:hidden"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-surface-200 dark:border-surface-700 py-3 fade-in">
            <div className="space-y-1">
              <button
                onClick={() => setDonateOpen(true)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors text-left ${lang === 'km' ? 'font-khmer' : ''}`}
              >
                <Heart className="w-4 h-4 fill-current" /> {t('nav.donate')}
              </button>
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === to ? 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/30' : 'text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800'}`}>
                  <Icon className="w-4 h-4" /> {label}
                </Link>
              ))}
              {user && (
                <Link to="/favorites" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/favorites' ? 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/30' : 'text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800'}`}>
                  <Heart className="w-4 h-4" /> {t('nav.favorites')}
                </Link>
              )}
              <hr className="border-surface-200 dark:border-surface-700 my-2" />
              <button onClick={toggleLanguage} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800 transition-colors w-full text-left">
                <Globe className="w-4 h-4" /> {lang === 'km' ? 'English' : 'ភាសាខ្មែរ'}
              </button>
              <button onClick={toggleTheme} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800 transition-colors w-full text-left">
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} {isDark ? 'Light Mode' : 'Dark Mode'}
              </button>
              {user ? (
                <>
                  <Link to="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800 transition-colors">
                    <User className="w-4 h-4" /> {t('nav.profile')}
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30 transition-colors">
                      <Shield className="w-4 h-4" /> {t('nav.admin')}
                    </Link>
                  )}
                  <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left">
                    <LogOut className="w-4 h-4" /> {t('nav.logout')}
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  <Link to="/login" className="px-4 py-2.5 text-sm font-medium text-center border border-surface-200 dark:border-surface-700 rounded-lg text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                    {t('nav.login')}
                  </Link>
                  <Link to="/signup" className="px-4 py-2.5 text-sm font-medium text-center bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    {t('nav.signup')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
      <DonateModal isOpen={donateOpen} onClose={() => setDonateOpen(false)} />
    </header>
  );
}
