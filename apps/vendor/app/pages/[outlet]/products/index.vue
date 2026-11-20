<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Products: list, price, SST, photo, barcode (table `products`). Permission: vendor.products.read (doc 32).
// API: GET /vendor-portal/o/{outlet}/products (doc 04, doc 32). TODO(api): generated client.
useHead({ title: 'Products' })

interface Row extends Record<string, unknown> {
    uuid: string
    sku: string
    name: string
    barcode: string | null
    price_sen: number
    sst_rate_bp: number
    stock_qty: number
    status: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'sku', header: 'Sku' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'barcode', header: 'Barcode' },
    { accessorKey: 'price_sen', header: 'Price (RM)', cell: ({ row }) => formatSen(row.original.price_sen as number | null) },
    { accessorKey: 'sst_rate_bp', header: 'Sst rate bp' },
    { accessorKey: 'stock_qty', header: 'Stock qty' },
    { accessorKey: 'status', header: 'Status' },
]

const vendorPath = useVendorPath()
const search = ref('')
const list = useApiList<Row>({ path: vendorPath('products') })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Products"
        subject="products"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
