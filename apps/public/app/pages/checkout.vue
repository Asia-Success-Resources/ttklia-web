<script setup lang="ts">
// Checkout: travel protection pre-selected, voucher, pay (Sitemap 1, doc 29, doc 31).
// TODO(pending: L4) protection pre-selected by default needs written confirmation (doc 30).
// TODO(pending: P8) Allianz product details (doc 30).
// TODO(api): POST /orders then POST /orders/{uuid}/pay with an Idempotency-Key (doc 04).
useHead({ title: 'Checkout' })
const protection = ref(true)
const voucher = ref('')

// The charge lines, the same on every channel before payment (doc 23, TBS structure): Fare (one price on every
// channel) and Facility charge (APAD) per ticket. TODO(api): lines and total from the order's quote, never worked out here.
interface ChargeLine { label: string; detail?: string | null; amount_sen: number }
const lines = ref<ChargeLine[]>([])
const totalSen = computed<number | null>(() => (lines.value.length ? lines.value.reduce((sum, l) => sum + l.amount_sen, 0) : null))
</script>

<template>
    <PublicSection title="Checkout">
        <div class="flex flex-col gap-4 rounded-2xl border border-default p-6">
            <UCheckbox v-model="protection" label="Travel protection (Allianz)" />
            <UFormField label="Voucher code" name="voucher"><UInput v-model="voucher" /></UFormField>
            <dl class="space-y-2 border-t border-default pt-4 text-sm">
                <div v-for="line in lines" :key="line.label" class="flex justify-between">
                    <dt class="text-muted">{{ line.label }}<span v-if="line.detail" class="ml-2">{{ line.detail }}</span></dt>
                    <dd>{{ formatSen(line.amount_sen) }}</dd>
                </div>
                <div class="flex justify-between font-semibold">
                    <dt>Total</dt>
                    <dd>{{ formatSen(totalSen) }}</dd>
                </div>
            </dl>
            <UButton label="Pay" icon="i-bx-credit-card" disabled />
        </div>
    </PublicSection>
</template>
