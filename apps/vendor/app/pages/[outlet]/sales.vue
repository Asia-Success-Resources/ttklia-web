<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Sales: orders, filters, export (table `orders`). Permission: vendor.reports.read (doc 32).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.
// Orders at this outlet. TODO(api): doc 32 lists no order list for the back office beyond GET …/orders?status=…; columns from `orders` once the client is generated.

interface Row extends Record<string, unknown> {
  uuid: string
  name: string
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'name', header: 'Name' },
]

const vendorPath = useVendorPath()
const search = ref('')
const list = useApiList<Row>({ path: null })
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
