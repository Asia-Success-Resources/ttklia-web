<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Categories: till tabs and their order (table `product_categories`). Permission: vendor.products.read (doc 32).
// API: GET /vendor-portal/o/{outlet}/categories (doc 04, doc 32). TODO(api): generated client.

interface Row extends Record<string, unknown> {
  uuid: string
  name: string
  colour: string | null
  sort: number
  is_active: boolean
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'colour', header: 'Colour' },
  { accessorKey: 'sort', header: 'Sort' },
  { accessorKey: 'is_active', header: 'Is active' },
]

const vendorPath = useVendorPath()
const search = ref('')
const list = useApiList<Row>({ path: vendorPath('categories') })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Categories"
    subject="categories"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
