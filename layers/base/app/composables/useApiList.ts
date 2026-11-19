import type { CursorPage } from '../types/api'

interface ApiListOptions {
  /** Path from doc 04, relative to apiBase. `null` when doc 04 has no endpoint yet. */
  path: string | null
  /** Prefix the path with `/ops/w/{workspace}` (staff endpoints, doc 04). */
  workspaceScoped?: boolean
  query?: Record<string, string | number | boolean | undefined>
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

  async function load(cursor?: string) {
    if (!options.path) return
    const api = useApi()
    const path = options.workspaceScoped && slug.value ? api.workspacePath(slug.value, options.path) : options.path
    pending.value = true
    error.value = null
    try {
      const page = await api.get<CursorPage<T>>(path, { ...options.query, cursor, limit: 50 })
      rows.value = cursor ? [...rows.value, ...page.data] : page.data
      nextCursor.value = page.next_cursor
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      pending.value = false
    }
  }

  return { rows, nextCursor, pending, error, load }
}
