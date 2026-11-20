import type { Sen } from '../../../../layers/base/app/types/api'

/** What a counter sells (`locations.counter_kind`, `cash_sessions.kind`, doc 03). */
export type CounterKind = 'booking' | 'product'

/**
 * The open counter cash session (`GET /cash-sessions/current`, doc 04).
 * TODO(api): replace with the generated type.
 */
export interface SaleSession {
    uuid: string
    kind: CounterKind
    counter_uuid: string
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
    uuid: string
    code: string
    name: string
    open_session: { user_name: string; opened_at: string } | null
}
