// Status words as ttklia-v2's bus screens show them, on v3's statuses.

/** v2 Trip::STATUS_ARRAY on v3's trip statuses (doc 21): "On Time" is a scheduled trip, "Disabled" a cancelled one. */
export const tripStatusLabels: Record<string, string> = {
    scheduled: 'On Time', delayed: 'Delayed', boarding: 'Boarding', final_call: 'Final Call', departing: 'Departing',
    departed: 'Departed', cancelled: 'Disabled', expected: 'Expected', bus_arrived: 'Bus Arrived', alighting: 'Alighting', cleared: 'Cleared',
}
export const tripStatusColor = (s: string) =>
    s === 'cancelled' ? 'error' : s === 'delayed' ? 'warning' : ['boarding', 'final_call', 'departing'].includes(s) ? 'info' : s === 'departed' ? 'neutral' : 'success'

/** v2 Booking::STATUS_ARRAY on v3's order statuses. */
export const orderStatusLabels: Record<string, string> = { paid: 'Success', open: 'Pending', cancelled: 'Cancelled', refunded: 'Refunded', expired: 'Expired' }
export const orderStatusColor = (s: string) => (s === 'paid' ? 'success' : s === 'open' ? 'warning' : s === 'refunded' ? 'info' : 'error')

/** A time or date in Malaysia time, e.g. klTime(iso, { hour: '2-digit', minute: '2-digit' }). */
export const klTime = (iso: string | null | undefined, opts: Intl.DateTimeFormatOptions) =>
    iso ? new Date(iso).toLocaleString('en-GB', { ...opts, timeZone: 'Asia/Kuala_Lumpur' }) : '-'
