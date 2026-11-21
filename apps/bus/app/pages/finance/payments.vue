<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Payments: list (table `payment_intents`). Permission: bus.finance_payments.read (doc 27).
// GET /api/ops/w/{workspace}/finance/payments (ttklia-api).
useHead({ title: 'Payments' })

interface Row extends Record<string, unknown> {
    uuid: string
    purpose_type: string
    amount_sen: number
    currency: string
    status: string
    gateway: string | null
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'purpose_type', header: 'Purpose type' },
    { accessorKey: 'amount_sen', header: 'Amount (RM)', cell: ({ row }) => formatSen(row.original.amount_sen as number | null) },
    { accessorKey: 'currency', header: 'Currency' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'gateway', header: 'Gateway' },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/finance/payments', workspaceScoped: true })
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
</template>
