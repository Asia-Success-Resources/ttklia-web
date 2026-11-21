/** Pages that exist only on teeko.ai (doc 09, Sitemap 1); on www.ttklia.com they go to the home page. */
export default defineNuxtRouteMiddleware(() => {
    if (!useBrand().isTeeko.value) return navigateTo('/')
})
