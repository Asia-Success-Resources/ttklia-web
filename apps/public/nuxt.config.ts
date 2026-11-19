import { fileURLToPath } from 'node:url'

// public app: www.ttklia.com. Rendering: SSR (search engines, shared links) (doc 09).
// Layers as doc 09 lists them. Settings: doc 16, "Front-end config at scale".
export default defineNuxtConfig({
  extends: ['../../layers/base'],
  compatibilityDate: '2025-07-15',
  ssr: true,
  devtools: { enabled: true },
  // The app's primary colour; loaded after the layers' CSS, so it wins.
  css: [fileURLToPath(new URL('./app/assets/css/theme.css', import.meta.url))],
  runtimeConfig: {
    public: {
      app: 'public',
    },
  },
})
