import type { Bootstrap } from '../types/api'

/**
 * Workspace name, logo, languages and features come from `GET /bootstrap` at start (doc 16),
 * never from config files.
 */
export function useBootstrap() {
    const bootstrap = useState<Bootstrap | null>('ttklia-bootstrap', () => null)
    const api = useApi()

    async function load(): Promise<Bootstrap | null> {
        if (bootstrap.value) return bootstrap.value
        try {
            bootstrap.value = await api.get<Bootstrap>('/bootstrap')
        } catch {
            bootstrap.value = null
        }
        return bootstrap.value
    }

    return { bootstrap, load }
}
