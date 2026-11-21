/**
 * Status colours from fleet-management's boards (pages/[role]/vehicles, bookings): green for done or live, orange for
 * waiting or in progress, blue for issued or assigned, red for stopped or failed, grey for anything else.
 */
const GROUPS: [string, string[]][] = [
    ['#00c875', ['active', 'online', 'paid', 'completed', 'approved', 'succeeded', 'verified', 'boarded', 'departed', 'exited', 'redeemed', 'accepted', 'published', 'valid', 'matched', 'closed']],
    ['#fdab3d', ['pending', 'open', 'scheduled', 'expected', 'delayed', 'boarding', 'final_call', 'departing', 'in_waiting_area', 'waiting', 'called', 'entered', 'on_hold', 'held', 'draft', 'workshop', 'in_progress', 'on_the_way', 'searching', 'planned', 'onboarding', 'applied', 'reserved', 'started', 'needs_review']],
    ['#579bfc', ['issued', 'assigned', 'confirmed', 'offered', 'standby', 'arrived', 'bus_arrived', 'alighting', 'new', 'parsed', 'sent']],
    ['#e2445c', ['cancelled', 'refunded', 'partially_refunded', 'rejected', 'suspended', 'failed', 'expired', 'burned', 'cleared', 'blocked', 'revoked', 'disabled', 'inactive', 'no_driver', 'cannot_provide', 'forfeited', 'retired', 'ended']],
]

export function statusColor(status: string | null | undefined): string {
    const key = String(status ?? '').toLowerCase().replace(/\s+/g, '_')
    for (const [colour, names] of GROUPS) if (names.includes(key)) return colour
    return '#797e93'
}

/** "in_waiting_area" → "In waiting area". */
export function statusLabel(status: string | null | undefined): string {
    const s = String(status ?? '-').replace(/_/g, ' ')
    return s.charAt(0).toUpperCase() + s.slice(1)
}
