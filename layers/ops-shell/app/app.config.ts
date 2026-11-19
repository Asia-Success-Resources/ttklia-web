// Defaults for every ops app. An app overrides any of these in its own app.config.ts (Nuxt merges them),
// e.g. ops: { brand: { name: 'Global Marque', logo: '/brand/fleet.svg' } }.
export default defineAppConfig({
  ops: {
    // No name here: each module shows its own `title` unless its app.config.ts sets brand.name.
    // logo: each app serves its own public/, so /logo.png is apps/<app>/public/logo.png, a different file per module.
    // icon: shown only while that image is missing.
    brand: {
      logo: '/logo.png',
      icon: 'i-bx-shapes',
    },
  },
})
