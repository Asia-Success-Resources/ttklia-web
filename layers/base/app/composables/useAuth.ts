/** Name of the cookie that holds the Sanctum token; useApi reads it to send `Authorization: Bearer …`. */
export const AUTH_TOKEN_COOKIE = 'auth_token'

/** The workspace of an app that has only one (its slug in `workspaces`), for the single login's address. */
const APP_WORKSPACE: Record<string, string> = { admin: 'global', fleet: 'fleet', ride: 'ride' }

/** Strictly 24 hours (in seconds), as fleet-management. */
const ONE_DAY = 60 * 60 * 24

/**
 * The one token every composable reads and writes. Separate `useCookie` calls each keep their own
 * ref and do not see each other's writes, so useApi (set up before sign-in) would keep sending no
 * token. The value lives in shared state; writes go through to the cookie.
 */
let hostCookieCleared = false

export function useAuthToken() {
    const domain = useRuntimeConfig().public.authCookieDomain || undefined
    // A token saved before the cookie was shared sits on this host only and would be read ahead of the shared
    // one: drop it once (a cookie set without a domain is removed only by a write without a domain).
    if (domain && import.meta.client && !hostCookieCleared) {
        hostCookieCleared = true
        document.cookie = `${AUTH_TOKEN_COOKIE}=; Max-Age=0; path=/; SameSite=Lax`
    }
    // With a domain (NUXT_PUBLIC_AUTH_COOKIE_DOMAIN) every staff app on it shares the sign-in and the sign-out.
    const cookie = useCookie<string | null>(AUTH_TOKEN_COOKIE, { maxAge: ONE_DAY, sameSite: 'lax', path: '/', domain })
    const state = useState<string | null>('ttklia-auth-token', () => cookie.value ?? null)
    return computed<string | null>({
        get: () => state.value,
        set: (value) => {
            state.value = value
            cookie.value = value
        },
    })
}

/**
 * Sign-in token, ported from fleet-management's composables/useAuth.ts: a Sanctum token in a
 * 24-hour cookie, checked against the API and renewed on every check, so an active user stays
 * signed in and an idle one is sent to the login after a day.
 * Checked with `GET /me` (fleet-management used `GET /user`), which also loads the user and
 * their abilities for the workspace (useMe).
 */
export function useAuth() {
    const runtime = useRuntimeConfig().public
    const { me, load } = useMe()

    const token = useAuthToken()

    /** Re-assigning the value with maxAge set resets the cookie's 24-hour timer. */
    function extendTokenLease(value: string) {
        token.value = value
    }

    function setToken(value: string) {
        extendTokenLease(value)
    }

    /**
     * Where signed-out users go: the single login at NUXT_PUBLIC_AUTH_URL/{workspace} (auth.ttklia.com/lalaport,
     * apps/auth) when it is set, else this app's /login. The workspace is the one the user was in (the bus app's
     * saved location, the taxi app's path), else the app's own (admin → global, fleet, ride); none for the rest.
     */
    function loginLocation(returnTo?: string, workspace?: string | null) {
        if (runtime.authUrl) {
            const ws = workspace ?? useSavedLocation().saved.value ?? APP_WORKSPACE[String(runtime.app ?? '')] ?? null
            const back = returnTo && import.meta.client ? `?return=${encodeURIComponent(window.location.origin + returnTo)}` : ''
            const base = String(runtime.authUrl).replace(/\/+$/, '')
            return { url: `${base}/${ws ? encodeURIComponent(ws) : ''}${back}`, external: true }
        }
        return { url: returnTo && returnTo !== '/' ? `/login?return=${encodeURIComponent(returnTo)}` : '/login', external: false }
    }

    /** Forget the token and the user, then go to the login. */
    async function logout(returnTo?: string) {
        token.value = null
        me.value = null
        const target = loginLocation(returnTo)
        await navigateTo(target.url, { external: target.external })
    }

    /**
     * The token if it is still valid, else null. With `redirect` (the default, as fleet-management)
     * a missing or rejected token also logs out and goes to the login.
     */
    async function getToken(options: { workspace?: string | null; redirect?: boolean } = {}): Promise<string | null> {
        const { workspace = null, redirect = true } = options
        // The cookie expired or was never set.
        if (!token.value) {
            if (redirect) await logout()
            return null
        }
        // Ask the API whether the token is still good (401 from Sanctum when not).
        const user = await load(workspace)
        if (!user) {
            token.value = null
            if (redirect) await logout()
            return null
        }
        // Token is solid: slide the 24-hour window forward from now.
        extendTokenLease(token.value)
        return token.value
    }

    return { token, setToken, getToken, logout, loginLocation }
}
