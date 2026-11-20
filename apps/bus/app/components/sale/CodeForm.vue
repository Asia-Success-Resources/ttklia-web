<script setup lang="ts">
import type { PaymentMethod } from '~/types/sale'

// "Sell Code" tab, laid out like today's CodeForm.vue: value tiles on the left, Summary and payment on the right.
// TODO(api): the code sale (table `access_codes` / stored value) has no write endpoint in doc 04 yet.
const emit = defineEmits<{ created: [] }>()

// Today's fixed values (RM 10, 20, 50, 100, 200), in sen. TODO(pending): move to workspace settings.
const values = [1000, 2000, 5000, 10000, 20000]
const valueSen = ref(0)
const payment = ref<PaymentMethod | null>(null)
const paid = ref<number | null>(null)

async function confirmPayment() {
    // TODO(api): sell the code, then print it through the counter agent.
    emit('created')
}
</script>

<template>
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div class="lg:col-span-7">
            <SalePanel title="Code Amount">
                <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <button
                        v-for="v in values"
                        :key="v"
                        type="button"
                        class="rounded-lg border p-4 text-center text-lg font-semibold transition"
                        :class="valueSen === v ? 'border-primary bg-primary/10 text-primary' : 'border-(--ops-border) text-gray-800 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5'"
                        @click="valueSen = v"
                    >
                        {{ formatSen(v) }}
                    </button>
                </div>
            </SalePanel>
        </div>
        <div class="lg:col-span-5">
            <SalePanel title="Summary">
                <dl class="mb-6 space-y-3">
                    <div class="flex justify-between">
                        <dt class="text-base font-medium text-gray-500 dark:text-gray-400">Total Price</dt>
                        <dd class="text-xl font-bold text-gray-900 dark:text-white">{{ formatSen(valueSen) }}</dd>
                    </div>
                </dl>
                <template v-if="valueSen !== 0">
                    <SalePaymentMethod v-model="payment" v-model:paid="paid" :total-sen="valueSen" />
                    <UButton block size="xl" label="Confirm Payment" :disabled="!payment" @click="confirmPayment" />
                </template>
            </SalePanel>
        </div>
    </div>
</template>
