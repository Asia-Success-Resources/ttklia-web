import type { Me } from '../types/api'

/**
 * The signed-in user and their abilities in the current workspace (`GET /me?workspace=…`, doc 27).
 * Menus and buttons follow these abilities; the API still checks every call.
 */
export function useMe() {
    const me = useState<Me | null>('ttklia-me', () => null)
    const loaded = useState<boolean>('ttklia-me-loaded', () => false)
    const api = useApi()

    async function load(workspace: string | null): Promise<Me | null> {
        try {
            // ttklia-api wraps every response as { data, message, code_status } (Controller::jsonResp).
            const res = await api.get<{ data: Me | null }>('/me', workspace ? { workspace } : undefined)
            me.value = res?.data ?? null
        } catch {
            me.value = null
        } finally {
            loaded.value = true
        }
        return me.value
    }

    /** `write` includes `read` (doc 27, "Permissions"). */
    function can(permission: string): boolean {
        const abilities = me.value?.abilities ?? []
        if (abilities.includes(permission)) return true
        if (permission.endsWith('.read')) return abilities.includes(permission.replace(/\.read$/, '.write'))
        return false
    }

    return { me, loaded, load, can }
}
