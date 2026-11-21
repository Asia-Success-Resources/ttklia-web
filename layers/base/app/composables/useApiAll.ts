import type { Page } from '../types/api'

/**
 * Every row of a list endpoint, for pickers (zones, operators, tours): reads page after page until the last.
 * Lists that people page through use useApiList instead. Stops at `max` rows so a wrong filter cannot loop forever.
 * `query` may be a function, read on every load (a month or date that changes).
 */
type Query = Record<string, string | number | boolean | undefined>

export function useApiAll<T>(options: { path: string; workspaceScoped?: boolean; query?: Query | (() => Query); max?: number }) {
    const rows = ref<T[]>([]) as Ref<T[]>
    const pending = ref(false)
    const error = ref<string | null>(null)
    const { slug } = useWorkspace()

    async function load() {
        const api = useApi()
        const path = options.workspaceScoped && slug.value ? api.workspacePath(slug.value, options.path) : options.path
        const max = options.max ?? 1000
        pending.value = true
        error.value = null
        try {
            const all: T[] = []
            let page = 1
            let last = 1
            do {
                const query = typeof options.query === 'function' ? options.query() : options.query
                const res = await api.get<Page<T>>(path, { ...query, page, limit: 100 })
                all.push(...(Array.isArray(res?.data) ? res.data : []))
                last = res?.meta?.last_page ?? 1
                page++
            } while (page <= last && all.length < max)
            rows.value = all
        } catch (e) {
            error.value = e instanceof Error ? e.message : String(e)
        } finally {
            pending.value = false
        }
    }

    return { rows, pending, error, load }
}
