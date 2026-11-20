<script setup lang="ts">
import type { PaymentMethod } from '~/types/sale'

// Card / e-Wallet / Cash tiles; cash also asks for the amount paid and shows the change.
const props = withDefaults(defineProps<{ totalSen: number; methods?: PaymentMethod[] }>(), {
    methods: () => ['card', 'wallet', 'cash'],
})
const method = defineModel<PaymentMethod | null>({ default: null })
const paid = defineModel<number | null>('paid', { default: null })

const labels: Record<PaymentMethod, string> = { card: 'Card', wallet: 'e-Wallet', cash: 'Cash' }

const change = computed(() => {
    if (!props.totalSen || !paid.value) return '—'
    return formatSen(Math.round(paid.value * 100) - props.totalSen)
})
</script>

<template>
    <div>
        <div class="mb-4 grid gap-3" :class="props.methods.length === 3 ? 'grid-cols-3' : 'grid-cols-2'">
            <button
                v-for="m in props.methods"
                :key="m"
                type="button"
                class="flex cursor-pointer items-center justify-center rounded-lg border p-3 text-sm font-medium transition"
                :class="method === m
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-(--ops-border) text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'"
                @click="method = m"
            >
                {{ labels[m] }}
            </button>
        </div>
        <div v-if="method === 'cash'" class="mb-4 space-y-4">
            <UFormField label="Amount Paid">
                <UInput v-model="paid" type="number" step="0.01" min="0" size="lg" class="w-full" />
            </UFormField>
            <UFormField label="Change">
                <UInput :model-value="change" readonly size="lg" class="w-full" />
            </UFormField>
        </div>
    </div>
</template>
