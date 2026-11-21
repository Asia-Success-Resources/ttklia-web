import type { Sen } from '../../../../layers/base/app/types/api'

/** What a counter sells (`locations.counter_kind`, `cash_sessions.kind`, doc 03). */
export type CounterKind = 'booking' | 'product'

/**
 * The open counter cash session (`GET /cash-sessions/current`, doc 04). Keyed by `id`: cash_sessions has no uuid.
 */
export interface SaleSession {
    id: number
    kind: CounterKind
    counter_id: number
    counter_name: string | null
    opened_at: string
    opening_float_sen: Sen
    current_cash_sen: Sen | null
    total_bookings: number | null
    total_collections: number | null
    total_codes: number | null
    total_orders: number | null
    total_cancelled: number | null
    total_sales_sen: Sen | null
    card_sales_sen: Sen | null
    ewallet_sales_sen: Sen | null
}

/** One label and number in the session modals. */
export interface SaleStat {
    label: string
    value: number | null
    money?: boolean
    highlight?: boolean
}

export type PaymentMethod = 'card' | 'wallet' | 'cash'

/** One passenger block in "Passenger Details". */
export interface SalePassenger {
    name: string
    phone: string
    id_no: string
    email: string
}

/** A counter offered on Start Session (`GET /locations?type=counter&counter_kind=…`, doc 04). */
export interface SaleCounter {
    id: number
    code: string
    name: string
    open_session: { user_name: string; opened_at: string } | null
}
