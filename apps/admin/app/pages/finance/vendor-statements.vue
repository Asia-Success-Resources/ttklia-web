<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Vendor statements: check and approve (table `vendor_statements`). Permission: vendors.statements.approve (doc 32).
// API: POST /admin/vendor-statements/{id}/approve (doc 04, doc 32). TODO(api): generated client.
// Approval sends the payout with the drivers and operators, or the e-invoice for commission (doc 32).
useHead({ title: 'Vendor statements' })

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

const search = ref('')
const list = useApiList<Row>({ path: '/admin/vendor-statements' })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Vendor statements"
        subject="vendor statements"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
