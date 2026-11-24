/**
 * The Teeko workspace's staff API (`/ops/w/{workspace}/…`, doc 04) for the ride ops pages, and the message to show
 * when a call fails: the field error, the problem's detail, or a fallback.
 */
export function useRideApi() {
    const api = useApi()
    const { slug } = useWorkspace()
    const path = (p: string) => api.workspacePath(slug.value ?? '', p)

    return {
        get: <T>(p: string, query?: Record<string, string | number | boolean | undefined>) => api.get<T>(path(p), query),
        post: <T>(p: string, body?: unknown) => api.post<T>(path(p), body as never),
        patch: <T>(p: string, body?: unknown) => api.patch<T>(path(p), body as never),
        path,
    }
}

/** A failed call as one line: the first field error, else the problem's detail, else `fallback`. */
export function rideError(e: unknown, fallback = 'Unable to save'): string {
    const data = (e as { data?: { errors?: Record<string, string[]>; message?: string } })?.data
    const first = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined
    return first ?? toProblem(e)?.detail ?? data?.message ?? fallback
}
