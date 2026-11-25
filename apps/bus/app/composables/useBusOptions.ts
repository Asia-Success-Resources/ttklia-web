// Choices for the bus list pages' Filter panels (ttklia-v2 model `$filters` that read another table):
// operators (bus companies), destination zones, system providers and kiosks, loaded once per page that asks.
// `chosen()` drops the filters left on "All", so a page's own defaults stay in place.
/** A row keyed by `id`, or by `uuid` for tables that have one (devices). */
interface Named { id?: number; uuid?: string; name?: string | null; operator_code?: string }

export function useBusOptions() {
    const companies = useApiAll<Named>({ path: '/bus/companies', workspaceScoped: true })
    const zones = useApiAll<Named>({ path: '/zones', workspaceScoped: true, query: { type: 'bus_destination' } })
    const providers = useApiAll<Named>({ path: '/system-providers', workspaceScoped: true })
    const devices = useApiAll<Named>({ path: '/devices', workspaceScoped: true, query: { type: 'kiosk' } })

    const items = (rows: Named[]) =>
        rows
            .map((r) => ({ label: r.name ?? r.operator_code ?? String(r.id ?? r.uuid), value: String(r.id ?? r.uuid) }))
            .sort((a, b) => a.label.localeCompare(b.label))

    return {
        operators: computed(() => items(companies.rows.value)),
        zones: computed(() => items(zones.rows.value)),
        systemProviders: computed(() => items(providers.rows.value)),
        kiosks: computed(() => items(devices.rows.value)),
        load: (...which: ('operators' | 'zones' | 'systemProviders' | 'kiosks')[]) => {
            if (which.includes('operators')) companies.load()
            if (which.includes('zones')) zones.load()
            if (which.includes('systemProviders')) providers.load()
            if (which.includes('kiosks')) devices.load()
        },
    }
}

/** The filters actually chosen: no empty or "All" values. */
export function chosen(values: Record<string, string | undefined>): Record<string, string> {
    return Object.fromEntries(Object.entries(values).filter(([, v]) => v !== undefined && v !== '')) as Record<string, string>
}
