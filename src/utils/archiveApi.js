const SEARCH_URL = 'https://archive.org/advancedsearch.php';
const METADATA_URL = 'https://archive.org/metadata';

export const ARCHIVE_PREFIX = 'ia:';
export const PAGE_SIZE = 24;

const normalizeDoc = (doc) => ({
  id: `${ARCHIVE_PREFIX}${doc.identifier}`,
  archiveId: doc.identifier,
  title_en: Array.isArray(doc.title) ? doc.title[0] : (doc.title || 'Untitled'),
  authorName: Array.isArray(doc.creator) ? doc.creator[0] : (doc.creator || ''),
  publicationYear: doc.year || null,
  language: Array.isArray(doc.language) ? doc.language[0] : (doc.language || ''),
  coverUrl: `https://archive.org/services/img/${doc.identifier}`,
});

export const searchArchiveBooks = async (searchTerm, page = 1, pageSize = PAGE_SIZE) => {
  const q = searchTerm.trim()
    ? `(${searchTerm.trim()}) AND mediatype:texts AND format:"Text PDF"`
    : 'mediatype:texts AND format:"Text PDF"';
  const params = new URLSearchParams();
  params.set('q', q);
  ['identifier', 'title', 'creator', 'year', 'language'].forEach(f => params.append('fl[]', f));
  params.set('rows', pageSize);
  params.set('page', page);
  params.set('output', 'json');
  if (!searchTerm.trim()) params.append('sort[]', 'downloads desc');

  const res = await fetch(`${SEARCH_URL}?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();

  return {
    books: (json?.response?.docs || []).map(normalizeDoc),
    total: json?.response?.numFound || 0,
  };
};

export const getArchiveBooksByIds = async (identifiers) => {
  if (!identifiers || identifiers.length === 0) return [];
  const results = await Promise.allSettled(
    identifiers.map(async (id) => {
      const res = await fetch(`${METADATA_URL}/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const m = json?.metadata;
      if (!m?.identifier) throw new Error('not found');
      return normalizeDoc({
        identifier: m.identifier,
        title: m.title,
        creator: m.creator,
        year: m.year,
        language: m.language,
      });
    })
  );
  return results.filter(r => r.status === 'fulfilled').map(r => r.value);
};

export const stripArchivePrefix = (favId) => String(favId).replace(new RegExp(`^${ARCHIVE_PREFIX}`), '');
export const isArchiveId = (favId) => String(favId).startsWith(ARCHIVE_PREFIX);

const pdfCache = new Map();

export const getArchivePdfUrl = async (archiveId) => {
  const key = String(archiveId);
  if (pdfCache.has(key)) return pdfCache.get(key);
  try {
    const res = await fetch(`${METADATA_URL}/${encodeURIComponent(key)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const pdf = (data?.files || []).find((f) => /\.pdf$/i.test(f.name || ''));
    const url = pdf ? `https://archive.org/download/${key}/${encodeURIComponent(pdf.name)}` : null;
    pdfCache.set(key, url);
    return url;
  } catch {
    return null;
  }
};
