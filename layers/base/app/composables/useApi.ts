import type { Problem } from '../types/api'

/** Thrown when a required runtime setting is empty. There is no fallback to production (doc 09). */
export class ConfigMissing extends Error {
    constructor(public readonly setting: string) {
        super(`Not configured: ${setting}`)
        this.name = 'ConfigMissing'
    }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions {
    query?: Record<string, string | number | boolean | undefined>
    body?: Record<string, unknown> | unknown[]
    /** POSTs that create money movement, a booking or a decision need a key (doc 04). Pass a stable key to retry safely. */
    idempotencyKey?: string
}

/**
 * The only way the web talks to the core. Base URL from runtimeConfig (NUXT_PUBLIC_API_BASE),
 * the Sanctum token from useAuth as a Bearer header (cookie session + CSRF otherwise), and an
 * Idempotency-Key on every write (doc 04, doc 09 "Shared rule").
 * TODO(api): once packages/api-client-ts is generated, build its openapi-fetch client on top of this.
 */
export function useApi() {
    const config = useRuntimeConfig().public
    const xsrf = useCookie<string | null>('XSRF-TOKEN')
    const token = useAuthToken()

    function baseURL(): string {
        if (!config.apiBase) throw new ConfigMissing('NUXT_PUBLIC_API_BASE')
        return config.apiBase
    }

    async function request<T>(method: Method, path: string, opts: RequestOptions = {}): Promise<T> {
        const headers: Record<string, string> = { Accept: 'application/json' }
        if (token.value) headers.Authorization = `Bearer ${token.value}`
        if (method !== 'GET') {
            headers['Idempotency-Key'] = opts.idempotencyKey ?? crypto.randomUUID()
            if (xsrf.value) headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrf.value)
        }
        return await $fetch<T>(path, {
            baseURL: baseURL(),
            method,
            query: opts.query,
            body: opts.body,
            headers,
            credentials: 'include',
        })
    }

    return {
        get: <T>(path: string, query?: RequestOptions['query']) => request<T>('GET', path, { query }),
        post: <T>(path: string, body?: RequestOptions['body'], idempotencyKey?: string) =>
            request<T>('POST', path, { body, idempotencyKey }),
        patch: <T>(path: string, body?: RequestOptions['body']) => request<T>('PATCH', path, { body }),
        put: <T>(path: string, body?: RequestOptions['body']) => request<T>('PUT', path, { body }),
        /** Staff endpoints (ops web, counter, handheld) go under `/ops/w/{workspace}/…` (doc 04, Workspace). */
        workspacePath: (workspace: string, path: string) => `/ops/w/${encodeURIComponent(workspace)}${path}`,
    }
}

/** Reads the problem details out of a failed $fetch call. */
export function toProblem(error: unknown): Problem | null {
    const data = (error as { data?: unknown } | null)?.data
    if (data && typeof data === 'object' && 'code' in data) return data as Problem
    return null
}
