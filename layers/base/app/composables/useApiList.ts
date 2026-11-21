import type { Page, PageMeta } from '../types/api'

/** Rows per page on every list page (and the API's default `limit`). */
export const PAGE_SIZE = 10

interface ApiListOptions {
    /** Path from doc 04, relative to apiBase. `null` when doc 04 has no endpoint yet. */
    path: string | null
    /** Prefix the path with `/ops/w/{workspace}` (staff endpoints, doc 04). */
    workspaceScoped?: boolean
    /** Prefix the path with `/vendor-portal/o/{outlet}` (vendor app, doc 32). */
    outletScoped?: boolean
    /** `{name}` in a string value is replaced by that route parameter, as in the path. A function is read on every
     *  load, for filters the page changes (e.g. `() => ({ status: status.value })`). */
    query?: Record<string, string | number | boolean | undefined> | (() => Record<string, string | number | boolean | undefined>)
    /** The page's search box: sent as `?q=` and reloads the list (debounced, from page 1) when it changes. */
    search?: Ref<string>
}

/** Fills `{name}` with the page's route parameter of that name, e.g. `/admin/vendors/{id}/users`. */
function fill(value: string, params: Record<string, string | string[] | undefined>): string {
    return value.replace(/\{(\w+)\}/g, (_, name: string) => {
        const param = params[name]
        return encodeURIComponent(Array.isArray(param) ? param[0] ?? '' : param ?? '')
    })
}

/**
 * A typed list read for list pages, one numbered page at a time as in ttklia-v2:
 * `GET path?page&limit=10&q` → `{ data, meta }` (doc 04). `load(page)` fetches that page; `load()` goes back to page 1.
 * Shows no rows (never fake records) while the endpoint is a stub or the API is not configured.
 */
export function useApiList<T>(options: ApiListOptions) {
    const rows = ref<T[]>([]) as Ref<T[]>
    const pagination = ref<PageMeta | null>(null)
    const pending = ref(false)
    const error = ref<string | null>(null)
    const { slug } = useWorkspace()
    const route = useRoute()

    async function load(page = 1) {
        if (!options.path) return
        const api = useApi()
        const params = route.params as Record<string, string | string[] | undefined>
        let path = fill(options.path, params)
        if (options.workspaceScoped && slug.value) path = api.workspacePath(slug.value, path)
        else if (options.outletScoped && slug.value) path = `/vendor-portal/o/${encodeURIComponent(slug.value)}${path}`
        const query = Object.fromEntries(
            Object.entries((typeof options.query === 'function' ? options.query() : options.query) ?? {}).map(([key, value]) => [key, typeof value === 'string' ? fill(value, params) : value]),
        )
        const q = options.search?.value.trim() || undefined
        pending.value = true
        error.value = null
        try {
            const res = await api.get<Page<T>>(path, { ...query, q, page, limit: PAGE_SIZE })
            // An endpoint that is still a stub answers `data: null`; treat it as no rows.
            rows.value = Array.isArray(res?.data) ? res.data : []
            pagination.value = res?.meta ?? null
        } catch (e) {
            error.value = e instanceof Error ? e.message : String(e)
        } finally {
            pending.value = false
        }
    }

    if (options.search) {
        let timer: ReturnType<typeof setTimeout> | undefined
        watch(options.search, () => {
            clearTimeout(timer)
            timer = setTimeout(() => load(1), 300)
        })
        onScopeDispose(() => clearTimeout(timer))
    }

    return { rows, pagination, pending, error, load }
}
