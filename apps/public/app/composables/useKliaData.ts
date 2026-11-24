import sample from '~/klia/data/sample.json'

/**
 * Data the klia-bus views got from its own database. TODO(api): each list moves to a ttklia-api call; until then it is
 * a snapshot of klia-bus's data (app/klia/data/sample.json) so the pages look as they do today.
 */
export interface KliaAd { id: string; title: string; link: string | null; image: string }
export interface KliaOffer { id: string; title: string; slug: string; image: string | null; start_at: string | null; end_at: string | null }
export interface KliaTour { id: number; name: string; slug: string }
export interface KliaZone { id: number; name: string; state: string | null; code: string | null }
export interface KliaTaxiType { id: number; name: string; additional_charges: string; maximum_capacity: number; maximum_luggage: number; image: string | null; level: number }

export interface KliaOperator { id: number; name: string }

export function useKliaData() {
    return {
        ads: sample.ads as KliaAd[],
        offers: sample.offers as KliaOffer[],
        tours: sample.tours as KliaTour[],
        locations: sample.locations as KliaZone[],
        llpLocations: sample.llpLocations as KliaZone[],
        taxiTypes: sample.taxiTypes as KliaTaxiType[],
        // Bus companies that take ticket exchanges (system_provider_id set, is_show_online), and the fee
        // (settings customer_collection_price + qr_fee).
        operators: sample.operators as KliaOperator[],
        collectionPrice: sample.collectionPrice as number,
    }
}
