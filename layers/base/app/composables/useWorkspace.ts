/**
 * The current workspace slug.
 * - bus and taxi: the first part of the path, bus.ttklia.com/{location} (doc 16, "Domains and locations");
 * - vendor: the outlet code, first part of the path, vendor.ttklia.com/{outlet} (doc 32);
 * - fleet, ride and other single-workspace apps: from `GET /bootstrap`, which answers by host (doc 16);
 * - admin and operator: none (global, or organisation-scoped).
 */
export function useWorkspace() {
    const route = useRoute()
    const { bootstrap } = useBootstrap()
    const slug = computed<string | null>(() => {
        const params = route.params as Record<string, string | string[] | undefined>
        const value = params.location ?? params.outlet
        if (typeof value === 'string' && value !== '') return value
        return bootstrap.value?.workspace?.slug ?? null
    })
    return { slug }
}
