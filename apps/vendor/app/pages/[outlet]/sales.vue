<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Sales: orders, filters, export (table `orders`). Permission: vendor.reports.read (doc 32).
// GET /api/v1/vendor-portal/o/{outlet}/orders (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
// Orders at this outlet. TODO(api): doc 32 lists no order list for the back office beyond GET …/orders?status=…; columns from `orders` once the client is generated.
useHead({ title: 'Sales' })

interface Row extends Record<string, unknown> {
    uuid: string
    name: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'name', header: 'Name' },
]

const vendorPath = useVendorPath()
const search = ref('')
const list = useApiList<Row>({ path: '/orders', outletScoped: true, query: { status: 'paid' } })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Sales"
        subject="sales"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
