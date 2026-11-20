<script setup lang="ts">
import type { TerminalProgress } from '../types/counter'

// Payment flow: create the order and intent through the API, then hand the card sale to the
// counter agent and wait. The agent reports the result to the core (doc 08); this screen only shows it.
const basket = useBasketStore()
const progress = ref<TerminalProgress | null>(null)
const message = ref<string | null>(null)

async function payByCard() {
    // TODO(api): POST /orders with the basket, then POST /orders/{uuid}/pay (doc 04) to get the intent,
    // then useCounterAgent().sale(intentUuid, amount). Not wired until the generated client exists.
    message.value = 'Card payment is not wired yet (TODO api).'
}

async function payByCash() {
    // TODO(api): POST /orders/{uuid}/pay with method cash against the open cash session (doc 04, doc 06).
    message.value = 'Cash payment is not wired yet (TODO api).'
}
</script>

<template>
    <div class="flex flex-col gap-2">
        <UButton block size="xl" icon="i-bx-credit-card" label="Card" :disabled="basket.lines.length === 0" @click="payByCard" />
        <UButton block size="xl" icon="i-bx-coins" label="Cash" color="neutral" :disabled="basket.lines.length === 0" @click="payByCash" />
        <p v-if="progress" class="text-sm">{{ progress }}</p>
        <p v-if="message" class="text-sm text-gray-500">{{ message }}</p>
    </div>
</template>
