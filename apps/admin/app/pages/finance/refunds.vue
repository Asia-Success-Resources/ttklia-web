<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Refunds: approvals (Finance HQ approves every amount, doc 27) (table `refunds`). Permission: finance.refunds.read.
// Approve posts the reversing entry for the refunded share (doc 06); the requester can never decide their own.
// TODO(pending: C1) see doc 30.
// GET /api/admin/finance/refunds, POST …/{id}/approve, POST …/{id}/reject (ttklia-api).
useHead({ title: 'Refunds' })

interface Row extends Record<string, unknown> {
    id: number
    amount_sen: number
    reason: string
    status: string
    requested_by_name: string | null
    approved_by_name: string | null
    gateway_reference: string | null
    created_at: string
}

const { can } = useMe()
const api = useApi()
const toast = useToast()
const reason = useReasonAction()

const search = ref('')
const status = ref<string | undefined>('requested')
const list = useApiList<Row>({ search, path: '/admin/finance/refunds', query: () => ({ status: status.value }) })
onMounted(() => list.load())
watch(status, () => list.load())

async function approve(row: Row) {
    try {
        await api.post(`/admin/finance/refunds/${row.id}/approve`, {}, `refund-approve-${row.id}`)
        toast.add({ title: `Refund of RM${formatSen(row.amount_sen)} approved`, color: 'success' })
        await list.load()
    } catch (e) {
        toast.add({ title: toProblem(e)?.detail ?? 'Unable to approve', color: 'error' })
    }
}
function reject(row: Row) {
    reason.ask({
        title: 'Reject Refund',
        submitLabel: 'Reject',
        run: async (text) => {
            await api.post(`/admin/finance/refunds/${row.id}/reject`, { reason: text })
            toast.add({ title: 'Refund rejected', color: 'success' })
            await list.load()
        },
    })
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'created_at', header: 'Requested' },
    { accessorKey: 'amount_sen', header: 'Amount (RM)', cell: ({ row }) => formatSen(row.original.amount_sen) },
    { accessorKey: 'reason', header: 'Reason' },
    { accessorKey: 'requested_by_name', header: 'Requested by' },
    { accessorKey: 'approved_by_name', header: 'Decided by' },
    { accessorKey: 'status', header: 'Status' },
    actionsColumn<Row>((row) =>
        row.status === 'requested' && can('finance.refunds.approve')
            ? [
                  { label: 'Approve', icon: 'i-bx-check', onSelect: () => approve(row) },
                  { label: 'Reject', icon: 'i-bx-x', color: 'error', onSelect: () => reject(row) },
              ]
            : [],
    ),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Refunds"
        subject="refunds"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        note="Waiting on: C1 (doc 30)."
        @page="list.load"
    >
        <template #actions>
            <USelect
                v-model="status"
                :items="[{ label: 'Waiting', value: 'requested' }, { label: 'Processing', value: 'processing' }, { label: 'Done', value: 'succeeded' }, { label: 'Rejected', value: 'failed' }, { label: 'All', value: undefined }]"
                class="w-36"
            />
        </template>
    </OpsListPage>
    <OpsReasonModal :action="reason" />
</template>
