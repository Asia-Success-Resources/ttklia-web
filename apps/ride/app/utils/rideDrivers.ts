// Teeko drivers (table `drivers`, doc 07): GET /ops/w/{workspace}/drivers rows and the tiers.

export interface DriverRow extends Record<string, unknown> {
    id: number
    driver_no: string | null
    name: string | null
    phone_e164: string | null
    tier: string
    licence_class: string | null
    languages: string[]
    status: string
    approved_at: string | null
    rating_avg: number | null
    organisation_name: string | null
    licence_expires_on: string | null
    psv_expires_on: string | null
    /** Driver source (doc 36): a driver with both counts as GM when a booking is claimed. */
    is_gm_driver: boolean
    is_public_driver: boolean
    driver_source: 'gm' | 'public'
}

/** Filter by driver source (doc 36). */
export const DRIVER_SOURCES = [
    { label: 'All sources', value: undefined },
    { label: 'GM Driver', value: 'gm' },
    { label: 'Public Driver', value: 'public' },
]

/** `drivers.tier`: ttklia_taxi drivers get e-hailing offers first (doc 07). */
export const DRIVER_TIERS = [
    { label: 'TTKLIA taxi', value: 'ttklia_taxi' },
    { label: 'TTKLIA fleet', value: 'ttklia_fleet' },
    { label: 'Partner', value: 'partner' },
    { label: 'Independent', value: 'independent' },
]
export const tierLabel = (t: string) => DRIVER_TIERS.find((x) => x.value === t)?.label ?? t
export const DRIVER_STATUSES = [
    { label: 'All', value: undefined },
    { label: 'Applied', value: 'applied' },
    { label: 'Approved', value: 'approved' },
    { label: 'Suspended', value: 'suspended' },
    { label: 'Rejected', value: 'rejected' },
]
