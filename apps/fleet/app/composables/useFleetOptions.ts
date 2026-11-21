/**
 * Picker lists the fleet screens share, loaded once per page: clients (corporate clients), zones, places (pois),
 * the fleet's vehicles, van routes, and the driver board for a day (who is free, with their usual vehicle).
 */
export function useFleetOptions() {
    const clients = useApiAll<{ id: number; name: string }>({ path: '/clients', workspaceScoped: true })
    // Who takes transferred jobs: partners and fleet owners (GET /clients?type=…).
    const partners = useApiAll<{ id: number; name: string }>({ path: '/clients', workspaceScoped: true, query: { type: 'partner' } })
    const fleetOwners = useApiAll<{ id: number; name: string }>({ path: '/clients', workspaceScoped: true, query: { type: 'fleet_owner' } })
    const zones = useApiAll<{ id: number; code: string; name: string }>({ path: '/zones', workspaceScoped: true })
    const places = useApiAll<{ id: number; name: string; short_code: string | null }>({ path: '/places', workspaceScoped: true })
    const vehicles = useApiAll<{ id: number; plate_no: string; type: string; vehicle_class: string; blocked: boolean; status: string }>({
        path: '/vehicles',
        workspaceScoped: true,
    })
    const routes = useApiAll<{ id: number; code: string; name: string; status: string }>({ path: '/fleet/van-routes', workspaceScoped: true })
    const driverDate = ref(todayYmd())
    const drivers = useApiAll<{ id: number; name: string; driver_no: string | null; day_status: string; usual_vehicle: string | null; usual_vehicle_id: number | null; jobs_count: number }>({
        path: '/fleet/drivers/today',
        workspaceScoped: true,
        query: () => ({ date: driverDate.value }),
    })

    const items = {
        clients: computed(() => clients.rows.value.map((c) => ({ label: c.name, value: c.id }))),
        thirdParties: computed(() => [...partners.rows.value, ...fleetOwners.rows.value].map((c) => ({ label: c.name, value: c.id }))),
        zones: computed(() => zones.rows.value.map((z) => ({ label: `${z.name} (${z.code})`, value: z.id }))),
        places: computed(() => places.rows.value.map((p) => ({ label: p.short_code ? `${p.short_code} · ${p.name}` : p.name, value: p.id }))),
        vehicles: computed(() => vehicles.rows.value.filter((v) => v.status !== 'retired').map((v) => ({
            label: `${v.plate_no} · ${v.vehicle_class}${v.blocked ? ' (off the road)' : ''}`, value: v.id, disabled: v.blocked,
        }))),
        routes: computed(() => routes.rows.value.filter((r) => r.status === 'active').map((r) => ({ label: `${r.name} (${r.code})`, value: r.id }))),
        drivers: computed(() => drivers.rows.value.map((d) => ({
            label: `${d.name}${d.day_status !== 'available' ? ` (${d.day_status.replace(/_/g, ' ')})` : ''}${d.jobs_count ? ` · ${d.jobs_count} job(s)` : ''}`,
            value: d.id,
        }))),
    }

    const loadThirdParties = () => Promise.all([partners.load(), fleetOwners.load()])

    return { clients, partners, fleetOwners, loadThirdParties, zones, places, vehicles, routes, drivers, driverDate, items }
}

/** RM text → sen (null when empty). */
export function toSen(rm: string | number | null | undefined): number | null {
    if (rm === null || rm === undefined || rm === '') return null
    return Math.round(Number(rm) * 100)
}
/** sen → RM text for an input ('' when null). */
export function toRm(sen: number | null | undefined): string {
    return sen === null || sen === undefined ? '' : (sen / 100).toFixed(2)
}
/** RFC 3339 UTC → 'YYYY-MM-DDTHH:mm' in Malaysia time, for a datetime-local input. */
export function toLocalInput(iso: string | null | undefined): string {
    if (!iso) return ''
    return `${pickupDate(iso)}T${pickupTime(iso)}`
}

export const VEHICLE_CLASSES = ['alphard', 'vellfire', 'mercedes', 'taxi_mewah', 'limo', 'van', 'mpv', 'car'].map((c) => ({
    label: c === 'taxi_mewah' ? 'Taxi mewah' : c.charAt(0).toUpperCase() + c.slice(1),
    value: c,
}))
export const REQUIREMENTS = [
    { label: 'Chinese-speaking driver', value: 'chinese_speaking_driver' },
    { label: 'Good condition vehicle', value: 'good_condition_vehicle' },
    { label: 'New vehicle', value: 'new_vehicle' },
]
