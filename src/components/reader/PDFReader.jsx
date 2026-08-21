import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ZoomIn, ZoomOut, Maximize, Minimize, Sun, Moon, BookOpen, ExternalLink, Loader } from 'lucide-react';
import Loading from '../common/Loading';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getBook, incrementViews } from '../../supabase/books';

export default function PDFReader() {
  const { id } = useParams();
  const { t, lang } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [pageImages, setPageImages] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const containerRef = useRef(null);
  const canvasContainerRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const b = await getBook(id);
        console.log('PDFReader book:', b, 'fileUrl:', b?.fileUrl);
        setBook(b);
      } catch {
        setBook(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const renderPages = useCallback(async (fileUrl, currentScale) => {
    if (!fileUrl) return;
    setRendering(true);
    setPdfError(false);
    setPageImages([]);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).href;
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setTotalPages(pdf.numPages);
      incrementViews(id).catch(() => {});

      const images = [];
      const maxPages = Math.min(pdf.numPages, 50);
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: currentScale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;
        images.push(canvas.toDataURL('image/png'));
      }
      setPageImages(images);
    } catch (err) {
      console.error('PDF error:', err);
      setPdfError(true);
    } finally {
      setRendering(false);
    }
  }, [id]);

  useEffect(() => {
    if (book?.fileUrl && !pdfError) {
      renderPages(book.fileUrl, scale);
    }
  }, [book?.fileUrl, scale, renderPages, pdfError]);

  const zoomIn = () => setScale(s => Math.min(s + 0.3, 3));
  const zoomOut = () => setScale(s => Math.max(s - 0.3, 0.5));

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

  if (loading) return <Loading />;
  if (!book || !book.fileUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-900">
        <div className="text-center text-white">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-surface-500" />
          <p>File not available</p>
          <Link to={`/book/${id}`} className="text-primary-400 hover:underline mt-2 inline-block">{t('common.back')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-surface-900 flex flex-col">
      {/* Toolbar */}
      <div className="bg-surface-800 border-b border-surface-700 px-3 sm:px-4 py-2 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link to={`/book/${id}`} className="p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className={`text-xs sm:text-sm font-medium text-white truncate max-w-[120px] sm:max-w-[400px] ${lang === 'km' ? 'font-khmer' : ''}`}>
            {lang === 'km' ? (book.title_km || book.title_en) : (book.title_en || book.title_km)}
          </h1>
          {totalPages > 0 && (
            <span className="text-xs text-surface-500 hidden sm:block">{totalPages} pages</span>
          )}
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <button onClick={zoomOut} className="p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors" title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-surface-400 px-2 min-w-[3rem] text-center">{Math.round(scale * 100 / 1.5)}%</span>
          <button onClick={zoomIn} className="p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors" title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-surface-600 mx-1" />
          <button onClick={toggleTheme} className="p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <a href={book.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors">
            <ExternalLink className="w-4 h-4" />
          </a>
          <button onClick={toggleFullscreen} className="p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors">
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto p-4" ref={canvasContainerRef}>
        {rendering ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white">
              <Loader className="w-10 h-10 mx-auto mb-3 animate-spin text-primary-400" />
              <p className="text-sm text-surface-400">Loading PDF...</p>
            </div>
          </div>
        ) : pdfError ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white max-w-md">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-surface-500" />
              <p className="mb-4">Could not render PDF inline. Open it directly instead.</p>
              <a
                href={book.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> Open PDF in new tab
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {pageImages.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Page ${i + 1}`}
                className="max-w-full rounded-lg shadow-2xl bg-white"
              />
            ))}
            {totalPages > 50 && (
              <div className="text-center py-8">
                <p className="text-surface-400 mb-3">Showing first 50 of {totalPages} pages</p>
                <a
                  href={book.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Open full PDF
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
