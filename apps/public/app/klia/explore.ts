/**
 * klia-bus App\Services\ExploreLinks: the link hub, popular routes and SEO cross-links, built from the same content
 * (config/destinations.php, lalaport-destinations.php, taxi-locations.php, popular-routes.php, exported to data/).
 */
import { trans } from 'laravel-vue-i18n'
import destinations from './data/destinations.json'
import lalaportAll from './data/lalaport-destinations.json'
import taxiLocations from './data/taxi-locations.json'
import popularRoutes from './data/popular-routes.json'
import { kliaRoute } from './routes'

export interface Place { name: string; slug: string; state?: string; actual_name?: string }
export interface Link { label: string; url: string; meta: string | null }
export interface Tab { key: string; label: string; links: Link[]; all: { label: string; url: string } | null }
export interface TourLink { id: number | string; name: string; slug?: string | null; url?: string }

export const DESTINATIONS = destinations as Place[]
// TODO(api): klia-bus hides Lalaport zones with show_in_kiosk = 0 (LalaportDestinations::all()).
export const LALAPORT_DESTINATIONS = lalaportAll as Place[]
export const TAXI_LOCATIONS = taxiLocations as Place[]
export const POPULAR = popularRoutes as { bus_klia2?: string[]; bus_lalaport?: string[]; taxi?: string[]; guides?: string[] }

/** Picks entries by slug (in the order given) or all of them, minus `except`. */
function resolve(entries: Place[], slugs: string[] | null, except: string | null = null): Place[] {
    const bySlug = new Map(entries.map((e) => [e.slug, e]))
    const picked = slugs === null ? entries : slugs.map((s) => bySlug.get(s)).filter((e): e is Place => !!e)
    return except === null ? picked : picked.filter((e) => e.slug !== except)
}

export function busFromKlia2(slugs: string[] | null = null, except: string | null = null): Link[] {
    return resolve(DESTINATIONS, slugs, except).map((d) => ({ label: trans('KLIA2 bus to :place', { place: d.name }), url: `/bus/klia2-to-${d.slug}`, meta: d.state ?? null }))
}

export function busFromLalaport(slugs: string[] | null = null, except: string | null = null): Link[] {
    return resolve(LALAPORT_DESTINATIONS, slugs, except).map((d) => ({ label: trans('Lalaport BBCC bus to :place', { place: d.name }), url: `/bus/lalaport-to-${d.slug}`, meta: d.state ?? null }))
}

export function taxiUrl(direction: string, slug: string): string {
    return direction.startsWith('to-') ? `/taxi/${slug}-${direction}` : `/taxi/${direction}-${slug}`
}

export function taxi(direction: string, slugs: string[] | null = null, except: string | null = null): Link[] {
    const airport = direction.includes('klia2') ? 'KLIA2' : 'KLIA'
    const toAirport = direction.startsWith('to-')
    return resolve(TAXI_LOCATIONS, slugs, except).map((l) => ({
        label: toAirport ? trans('Taxi from :place to :airport', { place: l.name, airport }) : trans('Taxi from :airport to :place', { place: l.name, airport }),
        url: taxiUrl(direction, l.slug),
        meta: null,
    }))
}

export const taxiFromKlia2 = (slugs: string[] | null = null, except: string | null = null) => taxi('klia2-to', slugs, except)
export const taxiToKlia2 = (slugs: string[] | null = null, except: string | null = null) => taxi('to-klia2', slugs, except)

export function guides(origin: 'klia2' | 'lalaport', slugs: string[] | null = null, except: string | null = null): Link[] {
    const lalaport = origin === 'lalaport'
    const originName = lalaport ? 'Lalaport' : 'KLIA2'
    return resolve(lalaport ? LALAPORT_DESTINATIONS : DESTINATIONS, slugs, except).map((d) => ({
        label: trans('How to get from :origin to :place', { origin: originName, place: d.name }),
        url: `/guide/how-to-get-from-${origin}-to-${d.slug}`,
        meta: d.state ?? null,
    }))
}
export const guidesFromKlia2 = (slugs: string[] | null = null, except: string | null = null) => guides('klia2', slugs, except)

export function popularBusRoutes(limit: number) {
    return resolve(DESTINATIONS, POPULAR.bus_klia2 ?? []).slice(0, limit).map((d) => ({ from: 'KLIA2', to: d.name, state: d.state ?? null, url: `/bus/klia2-to-${d.slug}` }))
}

/** Laravel Str::slug for a state name (anchors on /bus/destinations). */
export const slug = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/@/g, '-at-').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export function states(): Link[] {
    return [...new Set(DESTINATIONS.map((d) => d.state).filter((s): s is string => !!s))].sort()
        .map((state) => ({ label: trans('Buses from KLIA2 to :place', { place: state }), url: `/bus/destinations#${slug(state)}`, meta: null }))
}

export function toursAndMore(tours: TourLink[]): Link[] {
    return [
        ...tours.slice(0, 12).map((t) => ({ label: t.name, url: t.url ?? kliaRoute('tours.show', { tour: t.slug || t.id }), meta: null })),
        { label: trans('Van from KLIA2 to Genting Highlands'), url: kliaRoute('genting.index'), meta: null },
        { label: trans('Car rental at KLIA2'), url: kliaRoute('rentals.index'), meta: null },
    ]
}

export function siteLinks(cashbacks: boolean): Link[] {
    return [
        { label: trans('Collect your bus ticket'), url: kliaRoute('collect'), meta: null },
        { label: trans('Promotions'), url: kliaRoute('offers.index'), meta: null },
        ...(cashbacks ? [{ label: trans('Cashbacks'), url: kliaRoute('cashbacks.index'), meta: null }] : []),
        { label: trans('Shop'), url: kliaRoute('products.index'), meta: null },
        { label: trans('Contact'), url: kliaRoute('contact-us'), meta: null },
        { label: trans('Terms'), url: kliaRoute('terms'), meta: null },
        { label: trans('Privacy'), url: kliaRoute('privacy'), meta: null },
    ]
}

export function hub(opts: { lalaport: boolean; cashbacks: boolean; tours: TourLink[] }): Tab[] {
    const tabs: Tab[] = [
        { key: 'bus-klia2', label: trans('Popular bus routes'), links: busFromKlia2(POPULAR.bus_klia2 ?? []), all: { label: trans('View all bus destinations'), url: '/bus/destinations' } },
    ]
    if (opts.lalaport) {
        tabs.push({ key: 'bus-lalaport', label: trans('Bus from Lalaport BBCC'), links: busFromLalaport(POPULAR.bus_lalaport ?? []), all: { label: trans('View all Lalaport destinations'), url: '/bus/lalaport-destinations' } })
    }
    tabs.push(
        { key: 'taxi-from', label: trans('Taxi from KLIA2'), links: taxiFromKlia2(POPULAR.taxi ?? []), all: { label: trans('View all taxi locations'), url: '/taxi/locations' } },
        { key: 'taxi-to', label: trans('Taxi to KLIA2'), links: taxiToKlia2(POPULAR.taxi ?? []), all: { label: trans('View all taxi locations'), url: '/taxi/locations' } },
        { key: 'states', label: trans('By state'), links: states(), all: { label: trans('View all bus destinations'), url: '/bus/destinations' } },
        { key: 'guides', label: trans('Travel guides'), links: guidesFromKlia2(POPULAR.guides ?? []), all: { label: trans('View all guides'), url: '/guide/how-to-get-from-klia2' } },
        { key: 'tours', label: trans('Tours and Genting'), links: toursAndMore(opts.tours), all: { label: trans('View all tours'), url: kliaRoute('tours.index') } },
        { key: 'ttklia', label: trans('TTKLIA links'), links: siteLinks(opts.cashbacks), all: null },
    )
    return tabs.filter((t) => t.links.length > 0)
}
