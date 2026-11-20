import { defineStore } from 'pinia'
import type { BasketLine } from '../types/counter'

// UI state only (doc 09, "State"): lines picked at the counter before `POST /orders`.
export const useBasketStore = defineStore('counter-basket', {
    state: () => ({ lines: [] as BasketLine[], voucherCode: '' }),
    getters: {
        totalSen: (state) => state.lines.reduce((sum, line) => sum + line.unit_price_sen * line.quantity, 0),
    },
    actions: {
        add(line: BasketLine) {
            this.lines.push(line)
        },
        remove(key: string) {
            this.lines = this.lines.filter((line) => line.key !== key)
        },
        clear() {
            this.lines = []
            this.voucherCode = ''
        },
    },
})
