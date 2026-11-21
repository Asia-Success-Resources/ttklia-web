<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Statements: per period: sales, commission, net (table `vendor_statements`). Permission: vendor.statements.read (doc 32).
// GET /api/v1/vendor-portal/statements (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
// API: GET /vendor-portal/statements, across the vendor's outlets (doc 32). TODO(api): generated client.
useHead({ title: 'Statements' })

interface Row extends Record<string, unknown> {
    uuid: string
    period_start: string
    period_end: string
    gross_sen: number
    commission_sen: number
    net_payable_sen: number
    status: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'period_start', header: 'Period start' },
    { accessorKey: 'period_end', header: 'Period end' },
    { accessorKey: 'gross_sen', header: 'Gross (RM)', cell: ({ row }) => formatSen(row.original.gross_sen as number | null) },
    { accessorKey: 'commission_sen', header: 'Commission (RM)', cell: ({ row }) => formatSen(row.original.commission_sen as number | null) },
    { accessorKey: 'net_payable_sen', header: 'Net payable (RM)', cell: ({ row }) => formatSen(row.original.net_payable_sen as number | null) },
    { accessorKey: 'status', header: 'Status' },
]

const vendorPath = useVendorPath()
const search = ref('')
const list = useApiList<Row>({ search, path: '/vendor-portal/statements' })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Statements"
        subject="statements"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        @page="list.load"
    />
</template>
