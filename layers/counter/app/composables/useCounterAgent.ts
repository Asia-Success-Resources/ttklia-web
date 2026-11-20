import type { TerminalProgress } from '../types/counter'

/**
 * Client for the counter agent on 127.0.0.1 (doc 08, doc 25 "Agent API (localhost)").
 * The agent reports card results to the core itself; this page never reports a payment.
 */
export function useCounterAgent() {
    const base = useRuntimeConfig().public.agentBase as string

    function url(path: string): string {
        if (!base) throw new ConfigMissing('NUXT_PUBLIC_AGENT_BASE')
        return `${base}${path}`
    }

    return {
        health: () => $fetch<{ version: string; peripherals: { kind: string; status: string }[] }>(url('/health')),
        /** Starts a sale; returns at once with a transaction id. Progress comes over `/events`. */
        sale: (intentUuid: string, amountSen: number) =>
            $fetch<{ transaction_id: string }>(url('/terminal/sale'), { method: 'POST', body: { intent_uuid: intentUuid, amount_sen: amountSen } }),
        cancel: () => $fetch(url('/terminal/cancel'), { method: 'POST' }),
        printReceipt: (orderUuid: string) => $fetch(url('/print/receipt'), { method: 'POST', body: { order_uuid: orderUuid } }),
        printTest: () => $fetch(url('/print/test'), { method: 'POST' }),
        /** Local WebSocket with sale progress. */
        events(onProgress: (state: TerminalProgress) => void): WebSocket {
            const socket = new WebSocket(url('/events').replace(/^http/, 'ws'))
            socket.onmessage = (message) => onProgress(JSON.parse(String(message.data)).state as TerminalProgress)
            return socket
        },
    }
}
