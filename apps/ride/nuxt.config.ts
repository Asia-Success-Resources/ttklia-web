import { fileURLToPath } from 'node:url'

// ride app = Teeko (e-hailing): teeko.ttklia.com (ride.ttklia.com redirects there). Rendering: SPA, static files on S3 behind CloudFront (doc 09).
// Layers as doc 09 lists them. Settings: doc 16, "Front-end config at scale".
export default defineNuxtConfig({
    extends: ['../../layers/base', '../../layers/ops-shell'],
    compatibilityDate: '2025-07-15',
    ssr: false,
    devtools: { enabled: true },
    // The app's primary colour; loaded after the layers' CSS, so it wins.
    css: [fileURLToPath(new URL('./app/assets/css/theme.css', import.meta.url))],
    // Browser tab title, as fleet-management: each page sets useHead({ title }) and this adds the suffix.
    // Change the text after %s to whatever this app should show.
    app: {
        head: {
            title: 'E-hailing',
            titleTemplate: '%s | Teeko',
            // Tab icon: the Teeko app icon (teeko-ride assets/teeko/logo.png, converted to .ico).
            link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
        },
    },
    runtimeConfig: {
        public: {
            app: 'ride',
            // NUXT_PUBLIC_MAPS_KEY: browser key locked to the domains (ride and admin only, doc 16)
            mapsKey: '',
        },
    },
})
