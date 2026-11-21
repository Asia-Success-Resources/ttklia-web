<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Top up requests: operator credit top-ups by bank transfer (table `wallet_topup_requests`). Permission: bus.top_up_requests.read (doc 27).
// GET /api/ops/w/{workspace}/top-up-requests (ttklia-api).
useHead({ title: 'Top-up requests' })

interface Row extends Record<string, unknown> {
    organisation_name: string | null
    amount_sen: number
    bank_reference: string | null
    status: string
    reject_reason: string | null
    created_at: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'organisation_name', header: 'Operator' },
    { accessorKey: 'amount_sen', header: 'Amount (RM)', cell: ({ row }) => formatSen(row.original.amount_sen as number | null) },
    { accessorKey: 'bank_reference', header: 'Bank reference' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'reject_reason', header: 'Reject reason' },
    { accessorKey: 'created_at', header: 'Requested at' },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/top-up-requests', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Top up requests"
        subject="top up requests"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        @page="list.load"
    />
</template>
