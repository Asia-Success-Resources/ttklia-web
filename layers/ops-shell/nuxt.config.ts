import { fileURLToPath } from 'node:url'

// Ops-shell layer (doc 09): sidebar, header, workspace switcher (same type only), list, detail
// and form pages, metric and chart cards, modals. Used by bus, taxi, fleet, ride, admin, operator.
// Expects the base layer to be extended by the app as well.
// ops-theme.css holds the shell's colour tokens; an app recolours the shell by overriding them.
export default defineNuxtConfig({
    css: [fileURLToPath(new URL('./app/assets/css/ops-theme.css', import.meta.url))],
})
