import { fileURLToPath } from 'node:url'

// operator app: operator.ttklia.com. Rendering: SPA, static files on S3 behind CloudFront (doc 09).
// Layers as doc 09 lists them. Settings: doc 16, "Front-end config at scale".
export default defineNuxtConfig({
  extends: ['../../layers/base', '../../layers/ops-shell'],
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },
  // The app's primary colour; loaded after the layers' CSS, so it wins.
  css: [fileURLToPath(new URL('./app/assets/css/theme.css', import.meta.url))],
  runtimeConfig: {
    public: {
      app: 'operator',
    },
  },
})
