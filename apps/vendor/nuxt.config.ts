import { fileURLToPath } from 'node:url'

// vendor app: vendor.ttklia.com/{outlet}. The POS till (/pos, full screen) and the vendor back office (doc 09, doc 32).
// Rendering: SPA, static files on S3 behind CloudFront (doc 09). Organisation-scoped: a vendor user sees only
// their own outlets (doc 27). Layers as doc 09 lists them. Settings: doc 16, "Front-end config at scale".
export default defineNuxtConfig({
  extends: ['../../layers/base', '../../layers/ops-shell', '../../layers/counter'],
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },
  // The app's primary colour; loaded after the layers' CSS, so it wins.
  css: [fileURLToPath(new URL('./app/assets/css/theme.css', import.meta.url))],
  runtimeConfig: {
    public: {
      app: 'vendor',
    },
  },
})
