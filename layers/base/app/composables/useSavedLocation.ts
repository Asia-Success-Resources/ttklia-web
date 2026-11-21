/**
 * The location an app without one in its address works in (bus.ttklia.com, doc 16 "Domains and locations"): chosen
 * once on /choose-location or from the workspace switcher, and kept in a cookie for a year, so bus.ttklia.com/bookings
 * opens the bookings of that location. An app opts in with `ops.savedLocationType` (the workspace type it holds).
 */
export function useSavedLocation() {
    const saved = useCookie<string | null>('ttklia_location', { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax', default: () => null })
    return { saved }
}
