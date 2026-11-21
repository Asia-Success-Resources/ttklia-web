// Defaults for every ops app. An app overrides any of these in its own app.config.ts (Nuxt merges them),
// e.g. ops: { brand: { name: 'Global Marque', logo: '/brand/fleet.svg' } }.
export default defineAppConfig({
    ops: {
        // No name here: each module shows its own `title` unless its app.config.ts sets brand.name.
        // logo: each app serves its own public/, so /img/logo.png is apps/<app>/public/img/logo.png, a different file per module
        // (TTKLIA "tt" for bus, taxi, admin, operator, vendor; Teeko for ride; Global Marque for fleet).
        // icon: shown only while that image is missing.
        brand: {
            logo: '/img/logo.png',
            icon: 'i-bx-shapes',
        },
    },
})
