/**
 * The current workspace slug.
 * - taxi: the first part of the path, taxi.ttklia.com/{location} (doc 16, "Domains and locations");
 * - bus: the location chosen and kept in a cookie (useSavedLocation), as bus.ttklia.com has no location in its path;
 * - vendor: the outlet code, first part of the path, vendor.ttklia.com/{outlet} (doc 32);
 * - fleet, ride and other single-workspace apps: from `GET /bootstrap`, which answers by host (doc 16);
 * - admin and operator: none (global, or organisation-scoped).
 */
export function useWorkspace() {
    const route = useRoute()
    const { bootstrap } = useBootstrap()
    // Apps that keep the chosen location in a cookie instead of the path (bus: `ops.savedLocationType`).
    const savesLocation = !!(useAppConfig() as { ops?: { savedLocationType?: string } }).ops?.savedLocationType
    const { saved } = useSavedLocation()
    const slug = computed<string | null>(() => {
        const params = route.params as Record<string, string | string[] | undefined>
        const value = params.location ?? params.outlet
        if (typeof value === 'string' && value !== '') return value
        if (savesLocation && saved.value) return saved.value
        return bootstrap.value?.workspace?.slug ?? null
    })
    return { slug }
}
