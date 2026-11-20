<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Stock: levels and low stock (table `products`). Permission: vendor.stock.read (doc 32).
// API: GET /vendor-portal/o/{outlet}/stock (doc 04, doc 32). TODO(api): generated client.
useHead({ title: 'Stock' })

interface Row extends Record<string, unknown> {
    uuid: string
    sku: string
    name: string
    stock_qty: number
    low_stock_at: number | null
    track_stock: boolean
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'sku', header: 'Sku' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'stock_qty', header: 'Stock qty' },
    { accessorKey: 'low_stock_at', header: 'Low stock at' },
    { accessorKey: 'track_stock', header: 'Track stock' },
]

const vendorPath = useVendorPath()
const search = ref('')
const list = useApiList<Row>({ path: vendorPath('stock') })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Stock"
        subject="stock"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
