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
    // Browser tab title, as fleet-management: each page sets useHead({ title }) and this adds the suffix.
    // Change the text after %s to whatever this app should show.
    app: {
        head: {
            title: 'Home',
            titleTemplate: '%s | TTKLIA',
            // Tab icon: the TTKLIA one (v2/favicon.png, converted to .ico).
            link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
        },
    },
    runtimeConfig: {
        public: {
            app: 'public',
        },
    },
})
