import type { CursorPage } from '../types/api'

interface ApiListOptions {
    /** Path from doc 04, relative to apiBase. `null` when doc 04 has no endpoint yet. */
    path: string | null
    /** Prefix the path with `/ops/w/{workspace}` (staff endpoints, doc 04). */
    workspaceScoped?: boolean
    /** Prefix the path with `/vendor-portal/o/{outlet}` (vendor app, doc 32). */
    outletScoped?: boolean
    /** `{name}` in a string value is replaced by that route parameter, as in the path. */
    query?: Record<string, string | number | boolean | undefined>
}

/** Fills `{name}` with the page's route parameter of that name, e.g. `/admin/vendors/{id}/users`. */
function fill(value: string, params: Record<string, string | string[] | undefined>): string {
    return value.replace(/\{(\w+)\}/g, (_, name: string) => {
        const param = params[name]
        return encodeURIComponent(Array.isArray(param) ? param[0] ?? '' : param ?? '')
    })
}

/**
 * A typed list read for list pages. Returns empty data (never fake records) until the
 * generated client exists. TODO(api): replace the body with the generated openapi-fetch call.
 */
export function useApiList<T>(options: ApiListOptions) {
    const rows = ref<T[]>([]) as Ref<T[]>
    const nextCursor = ref<string | null>(null)
    const pending = ref(false)
    const error = ref<string | null>(null)
    const { slug } = useWorkspace()
    const route = useRoute()

    async function load(cursor?: string) {
        if (!options.path) return
        const api = useApi()
        const params = route.params as Record<string, string | string[] | undefined>
        let path = fill(options.path, params)
        if (options.workspaceScoped && slug.value) path = api.workspacePath(slug.value, path)
        else if (options.outletScoped && slug.value) path = `/vendor-portal/o/${encodeURIComponent(slug.value)}${path}`
        const query = Object.fromEntries(
            Object.entries(options.query ?? {}).map(([key, value]) => [key, typeof value === 'string' ? fill(value, params) : value]),
        )
        pending.value = true
        error.value = null
        try {
            const page = await api.get<CursorPage<T>>(path, { ...query, cursor, limit: 50 })
            // An endpoint that is still a stub answers `data: null`; treat it as no rows.
            const data = Array.isArray(page?.data) ? page.data : []
            rows.value = cursor ? [...rows.value, ...data] : data
            nextCursor.value = page?.next_cursor ?? null
        } catch (e) {
            error.value = e instanceof Error ? e.message : String(e)
        } finally {
            pending.value = false
        }
    }

    return { rows, nextCursor, pending, error, load }
}
