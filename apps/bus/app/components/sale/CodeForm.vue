<script setup lang="ts">
import type { PaymentMethod } from '~/types/sale'

// "Sell Code" tab, laid out like today's CodeForm.vue: value tiles on the left, Summary and payment on the right.
// A prepaid value code (stored_value_codes, v2 CodeController@store): POST /orders type code, then POST /orders/{uuid}/pay.
const emit = defineEmits<{ created: [] }>()

// Today's fixed values (RM 10, 20, 50, 100, 200), in sen. TODO(pending): move to workspace settings.
const values = [1000, 2000, 5000, 10000, 20000]
const valueSen = ref(0)
const payment = ref<PaymentMethod | null>(null)
const paid = ref<number | null>(null)
const busy = ref(false)
const error = ref<string | null>(null)
const lastCode = ref<string | null>(null)

const api = useApi()
const { slug } = useWorkspace()
const path = (p: string) => api.workspacePath(slug.value ?? '', p)

async function confirmPayment() {
    if (!valueSen.value || !payment.value) return
    busy.value = true
    error.value = null
    try {
        const created = await api.post<{ data: { uuid: string } }>(path('/orders'), { type: 'code', value_sen: valueSen.value })
        const uuid = created?.data?.uuid
        if (!uuid) throw new Error('No order returned')
        const res = await api.post<{ data: { code: { code: string } | null } }>(path(`/orders/${uuid}/pay`), {
            method: payment.value,
            paid_sen: payment.value === 'cash' ? Math.round((paid.value ?? 0) * 100) : undefined,
        })
        // TODO(api): print the code through the counter agent (doc 08).
        lastCode.value = res?.data?.code?.code ?? null
        valueSen.value = 0
        payment.value = null
        paid.value = null
        emit('created')
    } catch (e) {
        const problem = toProblem(e)
        error.value = problem?.detail ?? problem?.title ?? 'Unable to sell the code.'
    } finally {
        busy.value = false
    }
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
                <UAlert v-if="lastCode" class="mb-4" color="success" variant="soft" icon="i-bx-check-circle" :title="`Code sold: ${lastCode}`" />
                <UAlert v-if="error" class="mb-4" color="error" variant="soft" icon="i-bx-alert-circle" :title="error" />
                <template v-if="valueSen !== 0">
                    <SalePaymentMethod v-model="payment" v-model:paid="paid" :total-sen="valueSen" />
                    <UButton block size="xl" label="Confirm Payment" :loading="busy" :disabled="!payment" @click="confirmPayment" />
                </template>
            </SalePanel>
        </div>
    </div>
</template>
