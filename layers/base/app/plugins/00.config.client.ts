/**
 * SPA apps are built once; the deploy job writes the settings into `config.json`
 * beside the files (doc 16, "Front-end config at scale", step 2). Read it before anything else.
 * The SSR `public` app gets the same values as environment variables instead.
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
