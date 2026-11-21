/**
 * Load `/bootstrap` on the server too, so the first HTML already has the right brand (doc 09, teeko.ai:
 * pages are server-rendered for search engines). The API picks the brand from the request host's
 * `app_domains` row; no host names live in this app. The state is shared with the client, so the
 * base layer's client bootstrap does not fetch it again.
 */
import type { Bootstrap } from '../../../../layers/base/app/types/api'

export default defineNuxtPlugin({
    name: 'public-brand',
    async setup() {
        if (!import.meta.server || !useRuntimeConfig().public.apiBase) return
        const { bootstrap } = useBootstrap()
        if (bootstrap.value) return
        try {
            bootstrap.value = unwrapBootstrap(await useApi().get<{ data: Bootstrap } | Bootstrap>('/bootstrap', { host: useRequestURL().host, app: 'public' }))
        } catch {
            bootstrap.value = null
        }
    },
})
