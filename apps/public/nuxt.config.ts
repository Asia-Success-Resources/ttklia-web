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
            // klia-bus config('app.car_charter_enabled'), config('app.cashbacks_enabled'), services.teeko.contact_number.
            kliaCarCharter: false,
            kliaCashbacks: false,
            // klia-bus app.llp_origin_enabled: buses from Lalaport BBCC as well as KLIA2.
            kliaLalaport: false,
            teekoWhatsapp: '',
            googleMapsKey: '',
        },
    },
    // The ttklia.com pages copied from klia-bus (app/klia): their components keep their own names (TripsResult,
    // SearchCard, XIcon, …). Only .vue files: search/dates.js and google-maps.js are helpers, not components.
    components: [
        { path: '~/klia/components', pathPrefix: false, extensions: ['vue'] },
        '~/components',
    ],
    vite: {
        css: {
            preprocessorOptions: {
                // klia-bus's frontend.scss: Bootstrap 5.2.3 plus its tokens. Its deprecation warnings are Bootstrap's.
                scss: { quietDeps: true, silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function', 'mixed-decls'] },
            },
        },
        optimizeDeps: { include: ['jquery'] },
    },
})
