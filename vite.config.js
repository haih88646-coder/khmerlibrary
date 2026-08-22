import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Load all env vars so the dev proxy can inject AI API keys server-side,
  // mirroring the Vercel Edge Functions in /api (accepts both plain and
  // legacy VITE_ prefixed names).
  const env = loadEnv(mode, process.cwd(), '')
  const nvidiaKey = env.NVIDIA_API_KEY || env.VITE_NVIDIA_API_KEY || ''
  const openrouterKey = env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY || ''

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 3000,
      open: true,
      // Keep in sync with the headers block in vercel.json
      headers: {
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; media-src 'self' blob: https:; connect-src 'self' https: wss:; frame-src https://archive.org https://www.elibraryofcambodia.org; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
        'Cross-Origin-Opener-Policy': 'same-origin'
      },
      proxy: {
        '/api/nvidia': {
          target: 'https://integrate.api.nvidia.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/nvidia/, ''),
          configure: (proxy) => proxy.on('proxyReq', (proxyReq) => {
            if (nvidiaKey) proxyReq.setHeader('Authorization', `Bearer ${nvidiaKey}`)
          })
        },
        '/api/openrouter': {
          target: 'https://openrouter.ai',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/openrouter/, '/api/v1'),
          configure: (proxy) => proxy.on('proxyReq', (proxyReq) => {
            if (openrouterKey) proxyReq.setHeader('Authorization', `Bearer ${openrouterKey}`)
          })
        }
      }
    }
  }
})
