import type { Bootstrap } from '../types/api'

/**
 * Workspace name, logo, languages and features come from `GET /bootstrap` at start (doc 16),
 * never from config files. The API answers by host (`app_domains`); the app also sends its own name, which is what
 * it goes by where the host is not registered (localhost). Single-workspace apps (fleet, Teeko) get their workspace
 * here, which every `/ops/w/{workspace}/…` call needs.
 */
export function useBootstrap() {
    const bootstrap = useState<Bootstrap | null>('ttklia-bootstrap', () => null)
    const api = useApi()

    async function load(): Promise<Bootstrap | null> {
        if (bootstrap.value) return bootstrap.value
        try {
            const app = (useAppConfig() as { ops?: { app?: string } }).ops?.app ?? 'public'
            const res = await api.get<{ data: Bootstrap } | Bootstrap>('/bootstrap', { app })
            bootstrap.value = unwrapBootstrap(res)
        } catch {
            bootstrap.value = null
        }
        return bootstrap.value
    }

    return { bootstrap, load }
}

/** The API wraps the answer in `data` (doc 04); accept either shape. */
export function unwrapBootstrap(res: { data: Bootstrap } | Bootstrap | null | undefined): Bootstrap | null {
    if (!res) return null
    return 'data' in res ? res.data : res
}
