/**
 * Staff apps: every page needs a signed-in user (useAuth, as fleet-management). No token, or one
 * the API rejects, goes to the login: this app's /login, or the single login at NUXT_PUBLIC_AUTH_URL
 * when set (doc 16, "Login"). Then `/me` is loaded for the workspace in the path, and a location the
 * user has no role in shows "not found" (doc 16: "An unknown location shows 'not found', never a default").
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  if (to.path === '/login') return

  const { me, loaded } = useMe()
  const { token, setToken, getToken, loginLocation } = useAuth()
  const location = (to.params as Record<string, string | undefined>).location ?? null

  // Check the token against the API on the first page, after a sign-in, or when the cookie is gone.
  if (!loaded.value || !me.value || !token.value) {
    const valid = await getToken({ workspace: location, redirect: false })
    if (!valid) {
      const target = loginLocation(to.fullPath)
      return navigateTo(target.url, { external: target.external })
    }
  } else {
    // Already checked this visit: just slide the 24-hour window forward.
    setToken(token.value)
  }

  if (location && !me.value?.workspaces.some((w) => w.slug === location)) {
    return abortNavigation(createError({ statusCode: 404, statusMessage: 'Location not found' }))
  }
})
