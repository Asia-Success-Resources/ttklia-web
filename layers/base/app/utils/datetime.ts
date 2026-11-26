/**
 * Dates on screen are DD/MM/YYYY in Asia/Kuala_Lumpur (doc 09, "Dates and times").
 * The API sends RFC 3339 in UTC and takes plain dates as YYYY-MM-DD (doc 04); only the display changes.
 */
const TZ = 'Asia/Kuala_Lumpur'

function parts(value: string | Date): Record<string, string> | null {
    // A bare YYYY-MM-DD is a calendar date, not an instant: show it as is, with no time zone shift.
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split('-') as [string, string, string]
        return { year, month, day, hour: '00', minute: '00', second: '00' }
    }
    const date = typeof value === 'string' ? new Date(value) : value
    if (Number.isNaN(date.getTime())) return null
    const out: Record<string, string> = {}
    for (const p of new Intl.DateTimeFormat('en-GB', {
        timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(date)) out[p.type] = p.value
    return out
}

/** "2026-11-20" or an RFC 3339 instant → "20/11/2026". */
export function formatDate(value: string | Date | null | undefined): string {
    const p = value ? parts(value) : null
    return p ? `${p.day}/${p.month}/${p.year}` : '—'
}

/** The clock part: "14:05" or, with `hour12`, "2:05 PM" (the workspace's `time_format`, useTimeFormat). */
function clock(p: Record<string, string>, opts: { hour12?: boolean; seconds?: boolean; minutes?: boolean } = {}): string {
    const tail = (opts.minutes === false ? '' : `:${p.minute}`) + (opts.seconds ? `:${p.second}` : '')
    if (!opts.hour12) return `${p.hour}${opts.minutes === false ? ':00' : ''}${tail}`
    const h = Number(p.hour)
    return `${h % 12 || 12}${tail} ${h < 12 ? 'AM' : 'PM'}`
}

/** RFC 3339 instant → "20/11/2026 14:05", or "20/11/2026 2:05 PM" with `hour12`. */
export function formatDateTime(value: string | Date | null | undefined, opts: { hour12?: boolean } = {}): string {
    const p = value ? parts(value) : null
    return p ? `${p.day}/${p.month}/${p.year} ${clock(p, opts)}` : '—'
}

/** RFC 3339 instant → "14:05:09", or "2:05:09 PM" with `hour12`; `seconds: false` drops the seconds. */
export function formatTime(value: string | Date | null | undefined, opts: { hour12?: boolean; seconds?: boolean } = {}): string {
    const p = value ? parts(value) : null
    return p ? clock(p, { hour12: opts.hour12, seconds: opts.seconds ?? true }) : '—'
}

/** RFC 3339 instant → its hour: "14:00", or "2 PM" with `hour12` (the sale form's departure hour buttons). */
export function formatHour(value: string | Date | null | undefined, opts: { hour12?: boolean } = {}): string {
    const p = value ? parts(value) : null
    return p ? clock(p, { hour12: opts.hour12, minutes: false }) : '—'
}

/** Today in Kuala Lumpur as YYYY-MM-DD (the API's date format), shifted by whole days. */
export function isoDateKL(offsetDays = 0): string {
    const p = parts(new Date(Date.now() + offsetDays * 86_400_000))!
    return `${p.year}-${p.month}-${p.day}`
}
