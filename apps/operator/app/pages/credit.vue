<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Credit: wallet, top-up requests (table `wallets`). Permission: operator.credit.read (doc 27).
// GET /api/operator-portal/credit (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Credit' })

interface Row extends Record<string, unknown> {
    uuid: string
    owner_type: string
    balance_sen: number
    min_balance_sen: number
    status: string
    version: number
    created_at: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'owner_type', header: 'Owner type' },
    { accessorKey: 'balance_sen', header: 'Balance (RM)', cell: ({ row }) => formatSen(row.original.balance_sen as number | null) },
    { accessorKey: 'min_balance_sen', header: 'Min balance (RM)', cell: ({ row }) => formatSen(row.original.min_balance_sen as number | null) },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'version', header: 'Version' },
    { accessorKey: 'created_at', header: 'Created at' },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/operator-portal/credit' })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Credit"
        subject="credit"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
    
        @page="list.load"
    />
</template>
