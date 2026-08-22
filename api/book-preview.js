// Vercel Edge Function – link-preview server for shared book links.
//
// Social apps (Telegram, Facebook, WhatsApp, X, ...) send crawlers that do
// not execute JavaScript, so the plain SPA would show no preview. Bots get a
// small HTML page with Open Graph tags for the specific book (title, cover,
// description). Regular visitors are served the normal index.html so the
// pretty /book/:id URLs keep working.

const BLOOM_PARSE_URL = 'https://server.bloomlibrary.org/parse/classes/books';
const BLOOM_APP_ID = 'R6qNTeumQXjJCMutAJYAwPtip1qBulkFyLefkCE5';
const ELC_API = 'https://www.elibraryofcambodia.org/wp-json/wp/v2';

// Crawlers that read meta tags without executing JavaScript.
const BOT_RE = /telegrambot|facebookexternalhit|facebookcatalog|twitterbot|slackbot|discordbot|whatsapp|linkedinbot|embedly|vkshare|quora|preview/i;

const DEFAULT_TITLE = 'Khmer Digital Library';
const DEFAULT_DESCRIPTION = 'Read and discover Khmer books and documents — free digital library.';

const stripHtml = (s = '') => String(s).replace(/<[^>]*>/g, '').trim();

async function resolveBook(id) {
  if (id.startsWith('bloom:')) {
    const objectId = id.slice(6);
    const where = encodeURIComponent(JSON.stringify({ objectId }));
    const res = await fetch(`${BLOOM_PARSE_URL}?where=${where}&limit=1`, {
      headers: { 'X-Parse-Application-Id': BLOOM_APP_ID },
    });
    if (!res.ok) return null;
    const b = (await res.json()).results?.[0];
    if (!b) return null;
    return {
      title: b.title || DEFAULT_TITLE,
      description: b.summary || '',
      image: b.baseUrl ? `${b.baseUrl.replace(/%2f/g, '/')}thumbnail-256.png` : '',
    };
  }

  if (id.startsWith('elc:')) {
    const res = await fetch(`${ELC_API}/ebook/${id.slice(4)}?_embed`);
    if (!res.ok) return null;
    const p = await res.json();
    return {
      title: stripHtml(p.title?.rendered) || DEFAULT_TITLE,
      description: 'eLibrary of Cambodia',
      image: p._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
    };
  }

  if (id.startsWith('ia:')) {
    const identifier = id.slice(3);
    const res = await fetch(`https://archive.org/metadata/${identifier}`);
    if (!res.ok) return null;
    const md = await res.json();
    const t = md?.metadata?.title;
    return {
      title: (typeof t === 'string' ? t : Array.isArray(t) ? t[0] : identifier) || DEFAULT_TITLE,
      description: 'Internet Archive',
      image: `https://archive.org/services/img/${identifier}`,
    };
  }

  // Our own Supabase catalog
  const base = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (!base || !key || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const res = await fetch(
    `${base}/rest/v1/books?id=eq.${id}&select=title_km,title_en,description_km,description_en,coverUrl`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  );
  if (!res.ok) return null;
  const b = (await res.json())?.[0];
  if (!b) return null;
  return {
    title: b.title_en || b.title_km || DEFAULT_TITLE,
    description: b.description_en || b.description_km || '',
    image: b.coverUrl || '',
  };
}

function escapeHtml(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export default async function handler(request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const ua = request.headers.get('user-agent') || '';

  // Humans: serve the SPA shell directly so /book/:id keeps working.
  if (!BOT_RE.test(ua)) {
    const shell = await fetch(`${origin}/index.html`).catch(() => null);
    if (shell?.ok) {
      return new Response(shell.body, {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'public, max-age=0, must-revalidate',
        },
      });
    }
    return Response.redirect(url.toString(), 302);
  }

  const rawId = decodeURIComponent(url.searchParams.get('id') || '');
  let title = DEFAULT_TITLE;
  let description = DEFAULT_DESCRIPTION;
  let image = `${origin}/og-default.png`;

  if (rawId) {
    try {
      const book = await resolveBook(rawId);
      if (book?.title) title = book.title;
      if (book?.description) description = String(book.description).slice(0, 300);
      if (book?.image && /^https?:\/\//i.test(book.image)) image = book.image;
    } catch {
      // keep defaults
    }
  }

  const shareUrl = `${origin}/book/${encodeURIComponent(rawId)}`;
  const html = `<!doctype html>
<html lang="km">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="${escapeHtml(DEFAULT_TITLE)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${escapeHtml(image)}">
<meta property="og:url" content="${escapeHtml(shareUrl)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(image)}">
<meta http-equiv="refresh" content="0;url=${escapeHtml(shareUrl)}">
</head>
<body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#4c6ef5;color:#fff">
<a href="${escapeHtml(shareUrl)}" style="color:#fff;font-size:18px">Khmer Digital Library — ${escapeHtml(title)}</a>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}

export const config = { runtime: 'edge' };
