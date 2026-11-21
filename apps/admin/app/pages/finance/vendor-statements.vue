<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Vendor statements (table `vendor_statements`, doc 32 "Statements"). Finance checks and approves each one: a positive
// net goes into the next payout batch (a draft payout), a negative net, or one where the vendor collected
// everything, becomes an e-invoice for our commission and fees. Permission: vendors.statements.approve.
useHead({ title: 'Vendor statements' })

interface Row extends Record<string, unknown> {
    id: number
    vendor_name: string | null
    period_start: string
    period_end: string
    order_count: number
    gross_sen: number
    refunds_sen: number
    commission_sen: number
    monthly_fee_sen: number
    net_payable_sen: number
    status: string
}

const { can } = useMe()
const api = useApi()
const toast = useToast()

const search = ref('')
const status = ref<string | undefined>('issued')
const list = useApiList<Row>({ search, path: '/admin/vendor-statements', query: () => ({ status: status.value }) })
onMounted(() => list.load())
watch(status, () => list.load())

async function approve(row: Row) {
    const what = row.net_payable_sen > 0 ? `pay ${row.vendor_name} RM${formatSen(row.net_payable_sen)}` : `invoice ${row.vendor_name} RM${formatSen(Math.abs(row.net_payable_sen))}`
    if (!confirm(`Approve and ${what}?`)) return
    try {
        const res = await api.post<{ data: { payout_created: boolean; einvoice_created: boolean } }>(`/admin/vendor-statements/${row.id}/approve`, {}, `vendor-statement-${row.id}`)
        toast.add({
            title: res.data.payout_created ? 'Approved: payout added to the next batch' : res.data.einvoice_created ? 'Approved: e-invoice queued' : 'Approved',
            color: 'success',
        })
        await list.load()
    } catch (e) {
        toast.add({ title: toProblem(e)?.detail ?? 'Unable to approve', color: 'error' })
    }
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'vendor_name', header: 'Vendor' },
    { accessorKey: 'period_end', header: 'Period', cell: ({ row }) => `${formatDate(row.original.period_start)} – ${formatDate(row.original.period_end)}` },
    { accessorKey: 'order_count', header: 'Orders' },
    { accessorKey: 'gross_sen', header: 'Gross (RM)', cell: ({ row }) => formatSen(row.original.gross_sen) },
    { accessorKey: 'commission_sen', header: 'Commission (RM)', cell: ({ row }) => formatSen(row.original.commission_sen) },
    { accessorKey: 'monthly_fee_sen', header: 'Fee (RM)', cell: ({ row }) => formatSen(row.original.monthly_fee_sen) },
    { accessorKey: 'net_payable_sen', header: 'Net to vendor (RM)', cell: ({ row }) => formatSen(row.original.net_payable_sen) },
    { accessorKey: 'status', header: 'Status' },
    actionsColumn<Row>((row) =>
        ['issued', 'disputed'].includes(row.status) && can('vendors.statements.approve') ? [{ label: 'Approve', icon: 'i-bx-check', onSelect: () => approve(row) }] : [],
    ),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Vendor statements"
        subject="vendor statements"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        @page="list.load"
    >
        <template #actions>
            <USelect
                v-model="status"
                :items="[{ label: 'To check', value: 'issued' }, { label: 'Disputed', value: 'disputed' }, { label: 'Approved', value: 'approved' }, { label: 'Settled', value: 'settled' }, { label: 'All', value: undefined }]"
                class="w-36"
            />
        </template>
    </OpsListPage>
</template>
