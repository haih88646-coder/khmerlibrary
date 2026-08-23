import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  // Load all env vars so the dev proxy can inject AI API keys server-side,
  // mirroring the Vercel Edge Functions in /api (accepts both plain and
  // legacy VITE_ prefixed names).
  const env = loadEnv(mode, process.cwd(), '')
  const nvidiaKey = env.NVIDIA_API_KEY || env.VITE_NVIDIA_API_KEY || ''
  const openrouterKey = env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY || ''

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'logo.svg', 'icons.svg'],
        manifest: {
          name: 'បណ្ណាល័យឌីជីថលខ្មែរ – Khmer Digital Library',
          short_name: 'បណ្ណាល័យខ្មែរ',
          description: 'Read and discover Khmer books and documents — free digital library.',
          lang: 'km',
          dir: 'ltr',
          theme_color: '#4c6ef5',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          icons: [
            { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }
          ]
        },
        workbox: {
          // App shell: cached at install time so the SPA boots offline.
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          navigateFallback: '/index.html',
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          runtimeCaching: [
            {
              // Book covers / thumbnails from Bloom Library
              urlPattern: /^https:\/\/([a-z0-9-]+\.)*bloomlibrary\.org\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'img-bloom', expiration: { maxEntries: 250, maxAgeSeconds: 60 * 60 * 24 * 30 } }
            },
            {
              // Archive.org covers and scans
              urlPattern: /^https:\/\/archive\.org\/(services|iiif)\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'img-archive', expiration: { maxEntries: 250, maxAgeSeconds: 60 * 60 * 24 * 30 } }
            },
            {
              // eLibrary images
              urlPattern: /^https:\/\/www\.elibraryofcambodia\.org\/wp-content\/.*\.(?:png|jpe?g|gif|webp)$/i,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'img-elibrary', expiration: { maxEntries: 250, maxAgeSeconds: 60 * 60 * 24 * 30 } }
            },
            {
              // eLibrary book PDFs – cached so previously opened books can be
              // re-read offline.
              urlPattern: /^https:\/\/www\.elibraryofcambodia\.org\/wp-content\/.*\.pdf$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'pdf-elibrary',
                expiration: { maxEntries: 15, maxAgeSeconds: 60 * 60 * 24 * 60 },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              // Bloom Library book PDFs
              urlPattern: /^https:\/\/server\.bloomlibrary\.org\/.*\.pdf$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'pdf-bloom',
                expiration: { maxEntries: 15, maxAgeSeconds: 60 * 60 * 24 * 60 },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              // eLibrary REST API – fresh when online, last response offline
              urlPattern: /^https:\/\/www\.elibraryofcambodia\.org\/wp-json\/.*/i,
              handler: 'NetworkFirst',
              options: { cacheName: 'api-elibrary', networkTimeoutSeconds: 5, expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 } }
            },
            {
              // Google Fonts stylesheet
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: { cacheName: 'google-fonts-stylesheets', cacheableResponse: { statuses: [200] } }
            },
            {
              // Google Fonts binaries
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: { cacheName: 'google-fonts-files', cacheableResponse: { statuses: [200] }, expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 } }
            }
          ]
        }
      })
    ],
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
