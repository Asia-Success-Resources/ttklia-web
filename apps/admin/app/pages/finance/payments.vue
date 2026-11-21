<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Payments: list (table `payment_intents`). Permission: finance.payments.read (doc 27).
// GET /api/admin/finance/payments (ttklia-api).
useHead({ title: 'Payments' })

interface Row extends Record<string, unknown> {
    uuid: string
    purpose_type: string
    amount_sen: number
    currency: string
    status: string
    gateway: string | null
    created_at: string
}
interface Payment extends Row {
    workspace_code: string | null
    attempts: { gateway: string; method: string; gateway_reference: string | null; status: string; failure_code: string | null; created_at: string }[]
    refunds: { id: number; amount_sen: number; reason: string; status: string; created_at: string }[]
}

// One payment with its attempts and refunds.
const api = useApi()
const toast = useToast()
const payment = ref<Payment | null>(null)
async function view(uuid: string) {
    try {
        payment.value = (await api.get<{ data: Payment }>(`/admin/finance/payments/${uuid}`)).data
    } catch (e) {
        toast.add({ title: toProblem(e)?.detail ?? 'Unable to open the payment', color: 'error' })
    }
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'created_at', header: 'Created' },
    { accessorKey: 'purpose_type', header: 'For', cell: ({ row }) => statusLabel(row.original.purpose_type) },
    { accessorKey: 'amount_sen', header: 'Amount (RM)', cell: ({ row }) => formatSen(row.original.amount_sen) },
    { accessorKey: 'gateway', header: 'Gateway' },
    { accessorKey: 'status', header: 'Status' },
    actionsColumn<Row>((row) => [{ label: 'View', icon: 'i-bx-eye', onSelect: () => view(row.uuid) }]),
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/admin/finance/payments' })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Payments"
        subject="payments"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        @page="list.load"
    />

    <UModal :open="!!payment" :title="payment ? `RM${formatSen(payment.amount_sen)} · ${statusLabel(payment.status)}` : ''" :ui="{ content: 'sm:max-w-3xl' }" @update:open="(v) => { if (!v) payment = null }">
        <template #body>
            <div v-if="payment" class="space-y-4 text-sm">
                <p>{{ payment.workspace_code }} · {{ statusLabel(payment.purpose_type) }} · {{ formatDateTime(payment.created_at) }}</p>
                <div>
                    <p class="mb-1 font-medium">Attempts</p>
                    <p v-for="(a, i) in payment.attempts" :key="i" class="text-gray-600 dark:text-gray-300">
                        {{ formatDateTime(a.created_at) }} · {{ statusLabel(a.method) }} via {{ a.gateway }} · {{ statusLabel(a.status) }}<span v-if="a.gateway_reference"> · ref {{ a.gateway_reference }}</span><span v-if="a.failure_code"> · {{ a.failure_code }}</span>
                    </p>
                </div>
                <div v-if="payment.refunds.length">
                    <p class="mb-1 font-medium">Refunds</p>
                    <p v-for="r in payment.refunds" :key="r.id" class="text-gray-600 dark:text-gray-300">
                        {{ formatDateTime(r.created_at) }} · RM{{ formatSen(r.amount_sen) }} · {{ statusLabel(r.status) }} · {{ r.reason }}
                    </p>
                </div>
            </div>
        </template>
    </UModal>
</template>
