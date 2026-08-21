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

  return {
    books: (posts || []).map(normalizePost),
    total: Number(res.headers.get('x-wp-total') || posts.length),
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
  return results.filter(r => r.status === 'fulfilled').map(r => r.value);
};

export const isElibraryId = (v) => String(v).startsWith(ELC_PREFIX);
export const stripElibraryPrefix = (v) => String(v).replace(new RegExp(`^${ELC_PREFIX}`), '');

const pdfCache = new Map();

export const getElibraryBookPdf = async (elcId) => {
  const key = String(elcId);
  if (pdfCache.has(key)) return pdfCache.get(key);
  const res = await fetch(`https://www.elibraryofcambodia.org/wp-json/wp/v2/media?parent=${key}&per_page=20`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const media = await res.json();
  const pdf = (media || []).find((m) => m.mime_type === 'application/pdf');
  const url = pdf?.source_url || null;
  pdfCache.set(key, url);
  return url;
};
