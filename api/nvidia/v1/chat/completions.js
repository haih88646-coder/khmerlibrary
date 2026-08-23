// Vercel Edge Function – same-origin proxy for NVIDIA NIM chat completions.
// Injects the API key server-side so it is never bundled into client JS.
export const config = { runtime: 'edge' };

export default async function handler(req) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'not-configured' }, { status: 500 });
  }

  const headers = new Headers();
  headers.set('Authorization', `Bearer ${apiKey}`);
  headers.set('Content-Type', req.headers.get('content-type') || 'application/json');

  const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers,
    body: req.body,
  });
  return new Response(res.body, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' },
  });
}
