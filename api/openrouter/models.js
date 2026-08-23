// Vercel Edge Function – same-origin proxy for the OpenRouter model catalog.
// Injects the API key server-side so it is never bundled into client JS.
export const config = { runtime: 'edge' };

export default async function handler(req) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'not-configured' }, { status: 500 });
  }

  const headers = new Headers();
  headers.set('Authorization', `Bearer ${apiKey}`);
  headers.set('HTTP-Referer', new URL(req.url).origin);
  headers.set('X-Title', 'Khmer Digital Library');

  const res = await fetch('https://openrouter.ai/api/v1/models', { headers });
  return new Response(res.body, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' },
  });
}
