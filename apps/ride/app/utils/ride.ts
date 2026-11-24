// Teeko ride ops (doc 07, doc 35): the shapes GET /ride/requests and GET /rides/scheduled return, and their labels.

export interface RideRequestRow extends Record<string, unknown> {
    uuid: string
    status: string
    vehicle_class: string
    quoted_fare_sen: number
    payment_method: string
    channel: string
    scheduled_for: string | null
    matching_starts_at: string | null
    reminder_sent_at: string | null
    cancelled_by: string | null
    cancel_reason: string | null
    created_at: string
    rider_uuid: string | null
    rider_name: string | null
    /** Only with ride.riders.pii.read. */
    rider_phone: string | null
    pickup: string
    dropoff: string
    ride_uuid: string | null
    ride_status: string | null
    final_fare_sen: number | null
    driver_name: string | null
    vehicle_plate: string | null
    offers_count: number
}

export interface RideOffer {
    id: number
    driver_id: number
    driver_name: string | null
    driver_no: string | null
    round: number
    ring_k: number
    eta_seconds: number | null
    offered_at: string
    expires_at: string
    response: string
    responded_at: string | null
}

export interface RideRequestDetail extends RideRequestRow {
    offers: RideOffer[]
    ride: {
        uuid: string
        status: string
        accepted_at: string | null
        arrived_at: string | null
        picked_up_at: string | null
        completed_at: string | null
        distance_m: number | null
        duration_s: number | null
        final_fare_sen: number | null
        commission_sen: number | null
        cancel_reason: string | null
    } | null
}

/** `ride_requests.status` in words. */
export const REQUEST_STATUSES = [
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'Searching', value: 'searching' },
    { label: 'Offered', value: 'offered' },
    { label: 'Accepted', value: 'accepted' },
    { label: 'No driver', value: 'no_driver' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Expired', value: 'expired' },
]
/** Staff may cancel while no driver has taken the request. */
export const CANCELLABLE = ['scheduled', 'searching', 'offered']

/** The car type; imported rides carry the old app's text, shown as "Legacy". */
/**
 * Teeko's car types, as the passenger app sells them (the API's QuoteController::RIDE_CLASSES, priced by the ride
 * fare rules). TODO(api): read them from a vehicle class endpoint once there is a table for them.
 */
export const RIDE_CLASSES = [
    { value: 'economy', name: 'Teeko Economy', seats: 3 },
    { value: 'teeko_6', name: 'Teeko 6', seats: 6 },
    { value: 'luxe', name: 'Teeko Luxe', seats: 4 },
    { value: 'executive', name: 'Teeko Executive (Alphard)', seats: 6 },
    { value: 'van_10', name: 'Teeko Van (10 seats)', seats: 9 },
] as const

export function carLabel(value: string | null | undefined): string {
    if (!value || value === 'legacy' || value.includes(';')) return 'Legacy'
    return RIDE_CLASSES.find((c) => c.value === value)?.name ?? statusLabel(value)
}

/** "12.4 km", "18 min". */
export const km = (m: number | null) => (m == null ? '—' : `${(m / 1000).toFixed(1)} km`)
export const minutes = (s: number | null) => (s == null ? '—' : `${Math.round(s / 60)} min`)

/** Today in Kuala Lumpur time, yyyy-mm-dd (doc 04: times are UTC, clients show Kuala Lumpur time). */
export function todayYmd(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}
