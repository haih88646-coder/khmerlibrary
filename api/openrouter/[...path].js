// Vercel Edge Function – same-origin proxy for OpenRouter (/api/v1/*).
// Injects the API key server-side so it is never bundled into client JS.
export const config = { runtime: 'edge' };

export default async function handler(req) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'not-configured' }, { status: 500 });
  }
  const incoming = new URL(req.url);
  const target = `https://openrouter.ai/api/v1${incoming.pathname.replace(/^\/api\/openrouter/, '')}${incoming.search}`;

  const headers = new Headers();
  headers.set('Authorization', `Bearer ${apiKey}`);
  headers.set('Content-Type', req.headers.get('content-type') || 'application/json');
  headers.set('HTTP-Referer', incoming.origin);
  headers.set('X-Title', 'Khmer Digital Library');

  const res = await fetch(target, {
    method: req.method,
    headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req.body,
  });

  return new Response(res.body, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' },
  });
}
