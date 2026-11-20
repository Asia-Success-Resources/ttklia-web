import { fileURLToPath } from 'node:url'
import { boxiconsCollections } from './boxicons'

// Base layer (doc 09): Nuxt UI theme, auth, API composables, permissions, Reverb, i18n, error page.
// Every app extends this layer. Settings come from runtimeConfig (doc 16, "Front-end config at scale"):
// no host or URL string lives in code.
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    modules: ['@nuxt/ui', '@pinia/nuxt', '@nuxtjs/i18n'],
    // theme.css: the shared fleet-management colour scheme; each app sets --app-primary in its own theme.css.
    css: [
        fileURLToPath(new URL('./app/assets/css/main.css', import.meta.url)),
        fileURLToPath(new URL('./app/assets/css/theme.css', import.meta.url)),
    ],
    runtimeConfig: {
        public: {
            // NUXT_PUBLIC_API_BASE, includes /api/v1 (same as Flutter's API_BASE_URL)
            apiBase: '',
            // NUXT_PUBLIC_AUTH_URL, the single login at the auth domain
            authUrl: '',
            // NUXT_PUBLIC_REVERB_HOST
            reverbHost: '',
            // NUXT_PUBLIC_APP, fixed per app in its own nuxt.config.ts
            app: '',
            // NUXT_PUBLIC_SENTRY_DSN, per app
            sentryDsn: '',
        },
    },
    i18n: {
        // Languages ms, en, zh (doc 09). The path's first part is the location, so no locale prefix.
        strategy: 'no_prefix',
        defaultLocale: 'en',
        restructureDir: fileURLToPath(new URL('./i18n', import.meta.url)),
        locales: [
            { code: 'en', name: 'English', file: 'en.json' },
            { code: 'ms', name: 'Bahasa Melayu', file: 'ms.json' },
            { code: 'zh', name: '中文', file: 'zh.json' },
        ],
    },
    icon: {
        // Boxicons 3 (https://boxicons.com, @boxicons/core), as today's admin (doc 09, "Look and layout").
        // Bundled with each app: only the icons found in the code are included, and nothing is fetched
        // at run time, so icons work offline (counters, kiosks) and from static hosting.
        customCollections: boxiconsCollections(),
        provider: 'none',
        serverBundle: false,
        clientBundle: {
            // Icon names in .ts files too (menus in app.config.ts, Nuxt UI's icons below).
            scan: { globInclude: ['**/*.{vue,ts}'] },
            includeCustomCollections: false,
        },
    },
})
