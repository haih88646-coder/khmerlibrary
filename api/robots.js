export default function handler(request) {
  const origin = new URL(request.url).origin;
  const txt = `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`;
  return new Response(txt, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, s-maxage=86400',
    },
  });
}

export const config = { runtime: 'edge' };
