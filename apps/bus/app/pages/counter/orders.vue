<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Counter: orders: find, reprint, request refund (table `orders`). Permission: bus.counter_orders.read (doc 27).
// GET /api/ops/w/{workspace}/orders (ttklia-api).
useHead({ title: 'Counter: orders' })

definePageMeta({ layout: 'counter' })

interface Row extends Record<string, unknown> {
    uuid: string
    channel: string
    subtotal_sen: number
    sst_sen: number
    discount_sen: number
    total_sen: number
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'channel', header: 'Channel' },
    { accessorKey: 'subtotal_sen', header: 'Subtotal (RM)', cell: ({ row }) => formatSen(row.original.subtotal_sen as number | null) },
    { accessorKey: 'sst_sen', header: 'Sst (RM)', cell: ({ row }) => formatSen(row.original.sst_sen as number | null) },
    { accessorKey: 'discount_sen', header: 'Discount (RM)', cell: ({ row }) => formatSen(row.original.discount_sen as number | null) },
    { accessorKey: 'total_sen', header: 'Total (RM)', cell: ({ row }) => formatSen(row.original.total_sen as number | null) },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/orders', workspaceScoped: true, query: { channel: 'counter' } })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Counter: orders"
        subject="counter: orders"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
    
        @page="list.load"
    />
</template>
