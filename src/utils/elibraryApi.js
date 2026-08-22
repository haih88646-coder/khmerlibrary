const API = 'https://www.elibraryofcambodia.org/wp-json/wp/v2/ebook';

export const ELC_PREFIX = 'elc:';
export const PAGE_SIZE = 20;

const stripHtml = (html = '') => {
  const el = document.createElement('textarea');
  el.innerHTML = html.replace(/<[^>]*>/g, '');
  return el.value.trim();
};

const normalizePost = (post) => ({
  id: `${ELC_PREFIX}${post.id}`,
  elcId: post.id,
  link: post.link,
  title_km: stripHtml(post.title?.rendered),
  title_en: stripHtml(post.title?.rendered),
  coverUrl: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
});

export const searchElibraryBooks = async (searchTerm = '', page = 1, pageSize = PAGE_SIZE) => {
  const params = new URLSearchParams();
  if (searchTerm.trim()) params.set('search', searchTerm.trim());
  params.set('per_page', pageSize);
  params.set('page', page);
  params.append('_embed', '');

  const res = await fetch(`${API}?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const posts = await res.json();

  const books = await filterOpenableBooks((posts || []).map(normalizePost));

  return {
    books,
    total: Number(res.headers.get('x-wp-total') || books.length),
  };
};

export const getElibraryBooksByIds = async (ids) => {
  if (!ids || ids.length === 0) return [];
  const results = await Promise.allSettled(
    ids.map(async (id) => {
      const res = await fetch(`${API}/${id}?_embed`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return normalizePost(await res.json());
    })
  );
  const books = results.filter(r => r.status === 'fulfilled').map(r => r.value);
  return filterOpenableBooks(books);
};

export const isElibraryId = (v) => String(v).startsWith(ELC_PREFIX);
export const stripElibraryPrefix = (v) => String(v).replace(new RegExp(`^${ELC_PREFIX}`), '');

const pdfCache = new Map();

const MEDIA_API = 'https://www.elibraryofcambodia.org/wp-json/wp/v2/media';

const findPdfUrl = (media = []) => {
  const pdf = (media || []).find(
    (m) => m?.mime_type === 'application/pdf' || /\.pdf(\?|$)/i.test(m?.source_url || '')
  );
  return pdf?.source_url || null;
};

// Resolves the readable PDF url for an ebook post. Only CORS-enabled REST
// endpoints are used, so this works from the browser. Results (including
// "no PDF found") are cached.
export const getElibraryBookPdf = async (elcId) => {
  const key = String(elcId);
  if (pdfCache.has(key)) return pdfCache.get(key);
  let url = null;

  // 1) Files attached directly to the ebook post
  try {
    const res = await fetch(`${MEDIA_API}?parent=${key}&per_page=100`);
    if (res.ok) url = findPdfUrl(await res.json());
  } catch { /* ignore */ }

  // 2) Search the media library by the book title
  if (!url) {
    try {
      const res = await fetch(`${API}/${key}`);
      if (res.ok) {
        const title = stripHtml((await res.json()).title?.rendered);
        if (title) {
          const sres = await fetch(`${MEDIA_API}?search=${encodeURIComponent(title)}&mime_type=application/pdf&per_page=5`);
          if (sres.ok) url = findPdfUrl(await sres.json());
        }
      }
    } catch { /* ignore */ }
  }

  // 3) Older books embed their file through the pdf.js viewer shortcode
  //    without attaching it to the post. Those uploads are created moments
  //    before the post, so probe neighbouring media ids.
  if (!url) {
    try {
      const n = parseInt(key, 10);
      if (Number.isFinite(n)) {
        const ids = [n - 1, n - 2, n - 3, n - 4].filter((x) => x > 0).join(',');
        const res = await fetch(`${MEDIA_API}?include=${ids}&mime_type=application/pdf&per_page=10`);
        if (res.ok) url = findPdfUrl(await res.json());
      }
    } catch { /* ignore */ }
  }

  pdfCache.set(key, url);
  return url;
};

// Keep only books whose PDF is actually reachable from the browser, so the
// catalog never shows a book that cannot be opened.
const filterOpenableBooks = async (books) => {
  const results = await Promise.allSettled(
    (books || []).map(async (b) => ((await getElibraryBookPdf(b.elcId ?? stripElibraryPrefix(b.id))) ? b : null))
  );
  return results.filter((r) => r.status === 'fulfilled' && r.value).map((r) => r.value);
};
