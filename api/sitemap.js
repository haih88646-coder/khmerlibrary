// Dynamic sitemap: works on any deploy domain (uses request origin) and
// includes all published local books so Google can index them.
export default async function handler(request) {
  const origin = new URL(request.url).origin;

  const staticPaths = ['/', '/browse', '/global-books'];

  let bookPaths = [];
  try {
    const base = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
    if (base && key) {
      const res = await fetch(
        `${base}/rest/v1/books?isPublished=eq.true&select=id&order=created_at.desc&limit=1000`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` } }
      );
      if (res.ok) {
        bookPaths = (await res.json()).map((b) => `/book/${b.id}`);
      }
    }
  } catch {
    // fall back to static paths only
  }

  const urls = [...staticPaths, ...bookPaths]
    .map((p) => `  <url><loc>${origin}${p}</loc></url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, s-maxage=3600',
    },
  });
}

export const config = { runtime: 'edge' };
