/** One line of the shared basket (`orders`/`order_items`, doc 02 Bus CTS note). */
export interface BasketLine {
    key: string
    kind: 'bus_ticket' | 'taxi_coupon' | 'catalog_item' | 'protection' | 'boarding_pass' | 'deposit_topup'
    label: string
    quantity: number
    /** Price exactly as the API quoted it; the client never prices (doc 01). */
    unit_price_sen: number
}

/** Progress events from the agent's local WebSocket (doc 25, "Agent API"). */
export type TerminalProgress = 'waiting_for_card' | 'processing' | 'approved' | 'declined' | 'cancelled'
