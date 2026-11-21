<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Payouts: paid to the vendor's bank (table `payouts`). Permission: vendor.statements.read (doc 32).
// GET /api/v1/vendor-portal/payouts (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
// API: GET /vendor-portal/payouts (doc 32). TODO(api): generated client.
useHead({ title: 'Payouts' })

interface Row extends Record<string, unknown> {
    uuid: string
    period_start: string
    period_end: string
    amount_sen: number
    status: string
    paid_at: string | null
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'period_start', header: 'Period start' },
    { accessorKey: 'period_end', header: 'Period end' },
    { accessorKey: 'amount_sen', header: 'Amount (RM)', cell: ({ row }) => formatSen(row.original.amount_sen as number | null) },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'paid_at', header: 'Paid at' },
]

const vendorPath = useVendorPath()
const search = ref('')
const list = useApiList<Row>({ search, path: '/vendor-portal/payouts' })
onMounted(() => list.load())
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
    />
</template>
