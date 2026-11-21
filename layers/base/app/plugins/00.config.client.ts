/**
 * TODO(removed-from-docs): doc 16 (20 Nov 2026) no longer uses `config.json`. Every app now runs under PM2 and
 * reads its settings from `/etc/ttklia/web/<app>.env` as NUXT_PUBLIC_* variables (doc 34). This plugin is kept as a
 * harmless fallback: with no `config.json` it does nothing.
 */
export default defineNuxtPlugin({
    name: 'ttklia-config',
    enforce: 'pre',
    async setup() {
        const config = useRuntimeConfig().public as Record<string, unknown>
        try {
            const values = await $fetch<Record<string, unknown>>('/config.json', { baseURL: '/' })
            for (const [key, value] of Object.entries(values)) {
                if (typeof value === 'string' && value !== '') config[key] = value
            }
        } catch {
            // No config.json: local dev, where .env provides NUXT_PUBLIC_* values.
        }
    },
})
