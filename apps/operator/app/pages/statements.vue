<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Statements: daily T+2 payouts (table `payouts`). Permission: operator.statements.read (doc 27).
// GET /api/operator-portal/statements (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Statements' })

interface Row extends Record<string, unknown> {
    uuid: string
    payee_type: string
    period_start: string
    period_end: string
    amount_sen: number
    due_at: string | null
    status: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'payee_type', header: 'Payee type' },
    { accessorKey: 'period_start', header: 'Period start' },
    { accessorKey: 'period_end', header: 'Period end' },
    { accessorKey: 'amount_sen', header: 'Amount (RM)', cell: ({ row }) => formatSen(row.original.amount_sen as number | null) },
    { accessorKey: 'due_at', header: 'Due at' },
    { accessorKey: 'status', header: 'Status' },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/operator-portal/statements' })
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
