import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ZoomIn, ZoomOut, Sun, Moon, Maximize, Minimize, BookOpen, Type } from 'lucide-react';
import Loading from '../common/Loading';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getBook } from '../../supabase/books';

export default function TXTReader() {
  const { id } = useParams();
  const { lang, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const [book, setBook] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [readingMode, setReadingMode] = useState('light');
  const containerRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const b = await getBook(id);
        setBook(b);
        if (b?.fileUrl) {
          const res = await fetch(b.fileUrl);
          const text = await res.text();
          setContent(text);
        }
      } catch {
        setBook(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const increaseFontSize = () => setFontSize(s => Math.min(s + 2, 32));
  const decreaseFontSize = () => setFontSize(s => Math.max(s - 2, 12));

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const getBgColor = () => {
    if (readingMode === 'dark') return 'bg-surface-900';
    if (readingMode === 'sepia') return 'bg-amber-50';
    return 'bg-white';
  };

  const getTextColor = () => {
    if (readingMode === 'dark') return 'text-surface-200';
    if (readingMode === 'sepia') return 'text-amber-900';
    return 'text-surface-900';
  };

  if (loading) return <Loading />;

  if (!book || !content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-900">
        <div className="text-center text-white">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-surface-500" />
          <p>Content not available</p>
          <Link to={`/book/${id}`} className="text-primary-400 hover:underline mt-2 inline-block">{t('common.back')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`min-h-screen flex flex-col ${getBgColor()}`}>
      {/* Toolbar */}
      <div className="bg-surface-800 border-b border-surface-700 px-3 sm:px-4 py-2 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link to={`/book/${id}`} className="p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className={`text-xs sm:text-sm font-medium text-white truncate max-w-[100px] sm:max-w-[400px] ${lang === 'km' ? 'font-khmer' : ''}`}>
            {lang === 'km' ? (book.title_km || book.title_en) : (book.title_en || book.title_km)}
          </h1>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 flex-wrap justify-end">
          <button onClick={decreaseFontSize} className="p-1.5 sm:p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors">
            <Type className="w-4 h-4" />
            <span className="text-[10px]">-</span>
          </button>
          <span className="text-xs text-surface-400 px-0.5 sm:px-1 hidden sm:inline">{fontSize}px</span>
          <button onClick={increaseFontSize} className="p-1.5 sm:p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors">
            <Type className="w-4 h-4" />
            <span className="text-[10px]">+</span>
          </button>
          <div className="w-px h-6 bg-surface-600 mx-0.5 sm:mx-1 hidden sm:block" />
          <div className="flex bg-surface-700 rounded-lg p-0.5">
            {['light', 'dark', 'sepia'].map(mode => (
              <button
                key={mode}
                onClick={() => setReadingMode(mode)}
                className={`px-1.5 sm:px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${readingMode === mode ? 'bg-primary-600 text-white' : 'text-surface-400 hover:text-white'}`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-surface-600 mx-0.5 sm:mx-1" />
          <button onClick={toggleFullscreen} className="p-1.5 sm:p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors">
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto flex justify-center p-6 md:p-12">
        <div
          ref={contentRef}
          className={`w-full max-w-3xl ${getTextColor()} ${lang === 'km' ? 'font-khmer' : ''} leading-relaxed whitespace-pre-wrap`}
          style={{ fontSize: `${fontSize}px`, lineHeight }}
        >
          {content}
        </div>
      </div>
    </div>
  );
}
