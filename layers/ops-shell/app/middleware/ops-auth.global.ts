/**
 * Staff apps: every page needs a signed-in user (useAuth, as fleet-management). No token, or one
 * the API rejects, goes to the login: this app's /login, or the single login at NUXT_PUBLIC_AUTH_URL
 * when set (doc 16, "Login"). Then `/me` is loaded for the workspace, and a location the user has no
 * role in shows "not found" (doc 16: "An unknown location shows 'not found', never a default").
 *
 * The workspace is the first part of the path (taxi: /{location}/…), or, in an app with `savedLocationType` (bus),
 * the location kept in a cookie (useSavedLocation):
 * - `?location=klia2` on any page (the workspace switcher, links from other apps) saves it, then is dropped;
 * - a saved location the user no longer holds is forgotten;
 * - with none saved: a user with one location gets it; otherwise /choose-location, then back to the page.
 */
export default defineNuxtRouteMiddleware(async (to) => {
    if (import.meta.server) return
    if (to.path === '/login') return
    // The single login (apps/auth) is where signed-out users are sent: it never asks for a sign-in itself.
    if (useRuntimeConfig().public.app === 'auth') return

    const { me, loaded } = useMe()
    const { token, setToken, getToken, loginLocation } = useAuth()
    const { config } = useOpsShell()
    const savedType = config.savedLocationType ?? null
    const { saved } = useSavedLocation()

    const asked = savedType && typeof to.query.location === 'string' && to.query.location !== '' ? to.query.location : null
    if (asked) saved.value = asked
    let location = savedType ? saved.value : ((to.params as Record<string, string | undefined>).location ?? null)

    // Check the token against the API on the first page, after a sign-in, when the cookie is gone, or when the
    // location was just changed (its abilities differ).
    if (!loaded.value || !me.value || !token.value || asked) {
        const valid = await getToken({ workspace: location, redirect: false })
        if (!valid) {
            const target = loginLocation(to.fullPath, location)
            return navigateTo(target.url, { external: target.external })
        }
    } else {
        // Already checked this visit: just slide the 24-hour window forward.
        setToken(token.value)
    }

    if (savedType) {
        const mine = (me.value?.workspaces ?? []).filter((w) => w.type === savedType)
        // Old addresses with the location in the path (/lalaport/bookings, from before 21 Nov 2026, bookmarks, a
        // tab still running the old app): no page matches, so open the same page at that location instead of 404.
        if (to.matched.length === 0) {
            const [first, ...rest] = to.path.split('/').filter(Boolean)
            if (first && mine.some((w) => w.slug === first)) {
                const query = new URLSearchParams(to.query as Record<string, string>)
                query.set('location', first)
                return navigateTo(`/${rest.join('/')}?${query.toString()}${to.hash}`, { external: true })
            }
        }
        if (location && !mine.some((w) => w.slug === location)) {
            saved.value = null
            location = null
            if (asked) return abortNavigation(createError({ statusCode: 404, statusMessage: 'Location not found' }))
        }
        if (!location && mine.length === 1) {
            saved.value = mine[0]!.slug
            location = saved.value
            await getToken({ workspace: location, redirect: false })
        }
        if (!location) {
            if (to.path === '/choose-location') return
            return navigateTo({ path: '/choose-location', query: { redirect: to.fullPath } })
        }
        if (asked) {
            const { location: _dropped, ...query } = to.query
            return navigateTo({ path: to.path, query, hash: to.hash }, { replace: true })
        }
        return
    }

    if (location && !me.value?.workspaces.some((w) => w.slug === location)) {
        return abortNavigation(createError({ statusCode: 404, statusMessage: 'Location not found' }))
    }
})
