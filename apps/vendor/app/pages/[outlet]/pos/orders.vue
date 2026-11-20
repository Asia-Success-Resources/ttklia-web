<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Today's orders: reprint, or start a refund request (POS 2, screen 8) (table `orders`). Permission: vendor.pos.sell (doc 32).
// GET /api/v1/vendor-portal/o/{outlet}/orders (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
// GET /vendor-portal/o/{outlet}/orders?status=today (doc 32). TODO(api): order columns once the client is generated.
useHead({ title: "Today's orders" })

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
const list = useApiList<Row>({ path: '/orders', outletScoped: true, query: { status: 'today' } })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Today's orders"
        subject="today's orders"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
