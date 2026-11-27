/** klia-bus SeoController::BUS_ORIGINS and App\Support\SeoSchema. */
import type { Link } from './explore'

export interface Crumb { label: string; url?: string }

export const BUS_ORIGINS = {
    klia2: {
        key: 'klia2', name: 'KLIA2', long: 'KLIA2',
        hub: 'KLIA2 (Kuala Lumpur International Airport 2)',
        station: 'KLIA2 (klia2)',
        address: 'Kuala Lumpur International Airport 2, Sepang, Selangor, Malaysia',
        departure: 'KLIA2 (klia2), Sepang, Selangor',
        pickup: 'The bus pickup point is located at the KLIA2 Transportation Hub, Level 1. Follow the signs for "Bus" after exiting the arrival hall.',
        regions: 'Malaysia and Singapore',
        prefix: '/bus/klia2-to-', index: '/bus/destinations', indexLabel: 'Bus Destinations',
    },
    lalaport: {
        key: 'lalaport', name: 'Lalaport', long: 'Lalaport BBCC',
        hub: 'Lalaport Transportation Hub (Bukit Bintang City Centre)',
        station: 'Lalaport BBCC Transportation Hub',
        address: 'Lalaport BBCC, Kuala Lumpur, Malaysia',
        departure: 'Lalaport BBCC Transportation Hub, Kuala Lumpur',
        pickup: 'The bus pickup point is located at the Lalaport BBCC Transportation Hub at Bukit Bintang City Centre, Kuala Lumpur. Follow the signs for the bus terminal inside the complex.',
        regions: 'Malaysia, Singapore and Thailand',
        prefix: '/bus/lalaport-to-', index: '/bus/lalaport-destinations', indexLabel: 'Lalaport Bus Destinations',
    },
} as const
export type BusOriginKey = keyof typeof BUS_ORIGINS
export type BusOrigin = (typeof BUS_ORIGINS)[BusOriginKey]

export const schemaProvider = (origin: string) => ({ '@type': 'Organization', name: 'TTKLIA', url: `${origin}/` })

export function breadcrumbsSchema(crumbs: Crumb[], current: string) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, item: c.url ?? current })),
    }
}

export function collectionSchema(name: string, description: string, links: Pick<Link, 'label' | 'url'>[], current: string) {
    return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name, description, url: current,
        mainEntity: {
            '@type': 'ItemList',
            numberOfItems: links.length,
            itemListElement: links.map((l, i) => ({ '@type': 'ListItem', position: i + 1, name: l.label, url: l.url })),
        },
    }
}

/** RouteDepartures::days() and resolveDate(): today plus six days, in Malaysia time. */
export const DAYS_AHEAD = 6
export function mytToday(): Date {
    const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }).format(new Date())
    return new Date(`${ymd}T00:00:00`)
}
export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export function departureDays(): Date[] {
    const today = mytToday()
    return Array.from({ length: DAYS_AHEAD + 1 }, (_, i) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + i))
}
export function resolveDate(value: unknown): Date {
    const today = mytToday()
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return today
    const d = new Date(`${value}T00:00:00`)
    const last = new Date(today.getFullYear(), today.getMonth(), today.getDate() + DAYS_AHEAD)
    return d >= today && d <= last ? d : today
}
/** Carbon translatedFormat in the visitor's language. */
export const LOCALE_TAGS: Record<string, string> = { en: 'en-GB', ms: 'ms-MY', zh: 'zh-CN', th: 'th-TH' }
export const fmt = (d: Date, locale: string, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(LOCALE_TAGS[locale] ?? 'en-GB', opts).format(d)
