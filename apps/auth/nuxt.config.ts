import { fileURLToPath } from 'node:url'

// auth app: auth.ttklia.com, the single staff login (doc 16, "Login"; doc 09 "One login for all").
// auth.ttklia.com/{workspace} (lalaport, klia2, klia-taxi, fleet, ride, global) signs in, keeps the token in the
// cookie every staff app shares (NUXT_PUBLIC_AUTH_COOKIE_DOMAIN, .ttklia.com), and sends the user to that
// workspace's app, or back to `?return=` when it is one of our apps. The other apps' /login pages redirect here.
export default defineNuxtConfig({
    extends: ['../../layers/base', '../../layers/ops-shell'],
    compatibilityDate: '2025-07-15',
    ssr: false,
    devtools: { enabled: true },
    css: [fileURLToPath(new URL('./app/assets/css/theme.css', import.meta.url))],
    app: {
        head: {
            title: 'Sign in',
            titleTemplate: '%s | TTKLIA',
            link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
            meta: [{ name: 'robots', content: 'noindex' }],
        },
    },
    runtimeConfig: {
        public: {
            app: 'auth',
        },
    },
})
