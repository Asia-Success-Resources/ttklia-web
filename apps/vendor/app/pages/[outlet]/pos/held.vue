<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Held baskets: parked baskets, released when the shift closes (table `orders`, `held_label`). Permission: vendor.pos.sell (doc 32).
// GET /api/v1/vendor-portal/o/{outlet}/orders (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
// Held orders: GET /vendor-portal/o/{outlet}/orders?status=held (doc 32). TODO(api): columns from orders.held_label once the client is generated.
useHead({ title: 'Held baskets' })

definePageMeta({ layout: 'counter' })

interface Row extends Record<string, unknown> {
    uuid: string
    name: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'name', header: 'Name' },
]

const vendorPath = useVendorPath()
const search = ref('')
const list = useApiList<Row>({ search, path: '/orders', outletScoped: true, query: { status: 'held' } })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Held baskets"
        subject="held baskets"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        @page="list.load"
    />
</template>
