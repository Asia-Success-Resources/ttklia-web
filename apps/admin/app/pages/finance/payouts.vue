<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Payouts: drivers, operators (table `payouts`). Permission: finance.payouts.read (doc 27).
// GET /api/v1/admin/finance/payouts (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Payouts' })

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
const list = useApiList<Row>({ path: '/admin/finance/payouts' })
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
        :has-more="list.nextCursor.value !== null"
    
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
