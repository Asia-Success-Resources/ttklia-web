<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Payouts: drivers, operators, vendors (table `payouts`). Permission: finance.payouts.read (doc 27).
// draft → approve (finance.payouts.approve) → paid with the bank reference (finance.payouts.write), which posts
// Dr payable · Cr bank or cash drawer (doc 06).
// GET /api/admin/finance/payouts, POST …/{id}/approve, POST …/{id}/paid (ttklia-api).
useHead({ title: 'Payouts' })

interface Row extends Record<string, unknown> {
    id: number
    payee_type: string
    payee_name: string | null
    period_start: string
    period_end: string
    amount_sen: number
    kind: string
    method: string
    due_at: string | null
    status: string
    bank_reference: string | null
}

const { can } = useMe()
const api = useApi()
const toast = useToast()
const reason = useReasonAction()

const search = ref('')
const status = ref<string | undefined>(undefined)
const list = useApiList<Row>({ search, path: '/admin/finance/payouts', query: () => ({ status: status.value }) })
onMounted(() => list.load())
watch(status, () => list.load())

async function approve(row: Row) {
    try {
        await api.post(`/admin/finance/payouts/${row.id}/approve`, {}, `payout-approve-${row.id}`)
        toast.add({ title: `Payout to ${row.payee_name ?? row.payee_type} approved`, color: 'success' })
        await list.load()
    } catch (e) {
        toast.add({ title: toProblem(e)?.detail ?? 'Unable to approve', color: 'error' })
    }
}
function markPaid(row: Row) {
    reason.ask({
        title: 'Mark Payout Paid',
        label: row.method === 'bank' ? 'Bank reference' : 'Note (optional)',
        required: row.method === 'bank',
        submitLabel: 'Mark Paid',
        run: async (text) => {
            await api.post(`/admin/finance/payouts/${row.id}/paid`, { bank_reference: text || null }, `payout-paid-${row.id}`)
            toast.add({ title: `RM${formatSen(row.amount_sen)} marked paid`, color: 'success' })
            await list.load()
        },
    })
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'payee_name', header: 'Payee', cell: ({ row }) => row.original.payee_name ?? row.original.payee_type },
    { accessorKey: 'kind', header: 'Kind', cell: ({ row }) => statusLabel(row.original.kind) },
    { accessorKey: 'period_end', header: 'Period', cell: ({ row }) => `${formatDate(row.original.period_start)} – ${formatDate(row.original.period_end)}` },
    { accessorKey: 'amount_sen', header: 'Amount (RM)', cell: ({ row }) => formatSen(row.original.amount_sen) },
    { accessorKey: 'method', header: 'Method', cell: ({ row }) => statusLabel(row.original.method) },
    { accessorKey: 'bank_reference', header: 'Bank reference' },
    { accessorKey: 'status', header: 'Status' },
    actionsColumn<Row>((row) => [
        ...(row.status === 'draft' && can('finance.payouts.approve') ? [{ label: 'Approve', icon: 'i-bx-check', onSelect: () => approve(row) }] : []),
        ...(row.status === 'approved' && can('finance.payouts.write') ? [{ label: 'Mark paid', icon: 'i-bx-dollar', onSelect: () => markPaid(row) }] : []),
    ]),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Payouts"
        subject="payouts"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        @page="list.load"
    >
        <template #actions>
            <USelect
                v-model="status"
                :items="[{ label: 'All', value: undefined }, { label: 'Draft', value: 'draft' }, { label: 'Approved', value: 'approved' }, { label: 'Paid', value: 'paid' }, { label: 'Failed', value: 'failed' }]"
                class="w-36"
            />
        </template>
    </OpsListPage>
    <OpsReasonModal :action="reason" />
</template>
