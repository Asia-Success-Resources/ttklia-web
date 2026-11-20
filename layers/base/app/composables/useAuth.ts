/** Name of the cookie that holds the Sanctum token; useApi reads it to send `Authorization: Bearer …`. */
export const AUTH_TOKEN_COOKIE = 'auth_token'

/** Strictly 24 hours (in seconds), as fleet-management. */
const ONE_DAY = 60 * 60 * 24

/**
 * The one token every composable reads and writes. Separate `useCookie` calls each keep their own
 * ref and do not see each other's writes, so useApi (set up before sign-in) would keep sending no
 * token. The value lives in shared state; writes go through to the cookie.
 */
export function useAuthToken() {
    const cookie = useCookie<string | null>(AUTH_TOKEN_COOKIE, { maxAge: ONE_DAY, sameSite: 'lax', path: '/' })
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

    /** Where signed-out users go: the shared login if NUXT_PUBLIC_AUTH_URL is set, else this app's /login. */
    function loginLocation(returnTo?: string) {
        if (runtime.authUrl) {
            const back = returnTo && import.meta.client ? `?return=${encodeURIComponent(window.location.origin + returnTo)}` : ''
            return { url: `${runtime.authUrl}/login${back}`, external: true }
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
