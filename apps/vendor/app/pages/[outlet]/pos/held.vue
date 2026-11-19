<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Held baskets: parked baskets, released when the shift closes (table `orders`, `held_label`). Permission: vendor.pos.sell (doc 32).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.
// Held orders: GET /vendor-portal/o/{outlet}/orders?status=held (doc 32). TODO(api): columns from orders.held_label once the client is generated.

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
const list = useApiList<Row>({ path: null })
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
    :has-more="list.nextCursor.value !== null"
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
