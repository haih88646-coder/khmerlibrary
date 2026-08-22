// Integration with Bloom Library (https://bloomlibrary.org) by SIL Global.
// Books are fetched from their Parse REST server, filtered to Khmer (language:km).
// PDF and thumbnail URLs are derived from the book's baseUrl the same way
// bloomlibrary.org does it.
const PARSE_URL = 'https://server.bloomlibrary.org/parse/classes/books';
const PARSE_APP_ID = 'R6qNTeumQXjJCMutAJYAwPtip1qBulkFyLefkCE5';
const BLOOM_SITE_URL = 'https://bloomlibrary.org';

export const BLOOM_PREFIX = 'bloom:';
export const PAGE_SIZE = 24;

const HEADERS = { 'X-Parse-Application-Id': PARSE_APP_ID };

const KEYS =
  'objectId,title,baseUrl,summary,copyright,tags,pageCount,publisher,' +
  'downloadCount,analytics_startedCount,createdAt,updatedAt,license,show';

const KM_WHERE = {
  langPointers: {
    $inQuery: { where: { isoCode: 'km' }, className: 'language' },
  },
  inCirculation: { $in: [true, null] },
  draft: { $in: [false, null] },
};

export const isBloomId = (v) => String(v).startsWith(BLOOM_PREFIX);
export const stripBloomPrefix = (v) =>
  String(v).replace(new RegExp(`^${BLOOM_PREFIX}`), '');

export const getBloomBookPageUrl = (bloomId) => `${BLOOM_SITE_URL}/book/${bloomId}`;

// Extracts the raw uploaded book name segment from a baseUrl, mirroring
// getRawBookNameFromUrl() on bloomlibrary.org.
const getRawBookNameFromUrl = (baseUrl) => {
  const lastSlashIndex = baseUrl.lastIndexOf('%2f');
  if (lastSlashIndex < 0) return '';
  const leadin = baseUrl.substring(0, lastSlashIndex);
  const slashBeforeBookName = leadin.lastIndexOf('%2f');
  if (slashBeforeBookName < 0) return '';
  return leadin.substring(slashBeforeBookName + 3);
};

export const getPdfUrlFromBaseUrl = (baseUrl) => {
  if (!baseUrl) return '';
  const name = getRawBookNameFromUrl(baseUrl);
  if (!name) return '';
  // The uploaded PDF sits next to the book folder under its own name;
  // %2f separators become real slashes and '+' was wrongly-encoded space.
  return `${baseUrl}${name}.pdf`.replace(/%2f/g, '/').replace(/\+/g, '%20');
};

const getThumbnailUrlFromBaseUrl = (baseUrl, updatedAt) => {
  if (!baseUrl) return '';
  return `${baseUrl.replace(/%2f/g, '/')}thumbnail-256.png?version=${updatedAt || ''}`;
};

const extractYear = (copyright) => {
  const m = typeof copyright === 'string' ? copyright.match(/\b(19|20)\d{2}\b/) : null;
  return m ? Number(m[0]) : null;
};

const normalizeBook = (b) => {
  const pdfUrl = getPdfUrlFromBaseUrl(b.baseUrl);
  const topicTags = (b.tags || [])
    .filter((t) => typeof t === 'string' && t.startsWith('topic:'))
    .map((t) => t.slice('topic:'.length));
  return {
    id: `${BLOOM_PREFIX}${b.objectId}`,
    bloomId: b.objectId,
    link: getBloomBookPageUrl(b.objectId),
    title_km: b.title || '',
    title_en: b.title || '',
    authorName: b.publisher || '',
    description_km: b.summary || '',
    description_en: b.summary || '',
    publisher: b.publisher || '',
    publicationYear: extractYear(b.copyright),
    language: 'km',
    pages: b.pageCount || null,
    tags: topicTags,
    license: b.license || '',
    coverUrl: getThumbnailUrlFromBaseUrl(b.baseUrl, b.updatedAt),
    fileUrl: pdfUrl,
    fileType: pdfUrl ? 'pdf' : null,
    fileSize: null,
    downloads: b.downloadCount || 0,
    // Times readers opened this book on Bloom Library — a real "views" metric.
    views: b.analytics_startedCount || 0,
    created_at: b.createdAt,
    createdAt: b.createdAt,
    source: 'bloom',
  };
};

async function queryBooks(params) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => qs.set(k, typeof v === 'string' ? v : JSON.stringify(v)));
  const res = await fetch(`${PARSE_URL}?${qs.toString()}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const isOfferedAsPdf = (b) => b?.show?.pdf?.enabled !== false && !!b.baseUrl;

let khmerCache = null;
const KHMER_CACHE_TTL = 5 * 60 * 1000;

// Returns all in-circulation Khmer books (cached for 5 minutes).
export const getBloomKhmerBooks = async () => {
  if (khmerCache && Date.now() - khmerCache.at < KHMER_CACHE_TTL) {
    return khmerCache.books;
  }
  const PAGE_LIMIT = 200;
  const MAX_BOOKS = 1000;
  const books = [];
  let skip = 0;
  while (books.length < MAX_BOOKS) {
    const data = await queryBooks({
      where: KM_WHERE,
      keys: KEYS,
      limit: PAGE_LIMIT,
      skip,
      order: '-createdAt',
    });
    const results = data?.results || [];
    books.push(...results.filter(isOfferedAsPdf).map(normalizeBook));
    if (results.length < PAGE_LIMIT) break;
    skip += PAGE_LIMIT;
  }
  khmerCache = { at: Date.now(), books };
  return books;
};

export const getBloomBooksByIds = async (ids) => {
  if (!ids || ids.length === 0) return [];
  const chunks = [];
  for (let i = 0; i < ids.length; i += 50) chunks.push(ids.slice(i, i + 50));
  const results = await Promise.allSettled(
    chunks.map(async (chunk) => {
      const data = await queryBooks({
        where: { objectId: { $in: chunk }, ...KM_WHERE },
        keys: KEYS,
        limit: chunk.length,
      });
      return (data?.results || []).map(normalizeBook);
    })
  );
  return results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value)
    .filter((b) => ids.includes(b.bloomId));
};
