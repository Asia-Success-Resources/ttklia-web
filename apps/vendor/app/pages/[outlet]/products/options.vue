<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Options: sizes and add-ons (table `product_option_groups`). Permission: vendor.products.read (doc 32).
// API: GET /vendor-portal/o/{outlet}/option-groups (doc 04, doc 32). TODO(api): generated client.

interface Row extends Record<string, unknown> {
  uuid: string
  name: string
  min_select: number
  max_select: number
  sort: number
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'min_select', header: 'Min select' },
  { accessorKey: 'max_select', header: 'Max select' },
  { accessorKey: 'sort', header: 'Sort' },
]

const vendorPath = useVendorPath()
const search = ref('')
const list = useApiList<Row>({ path: vendorPath('option-groups') })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Options"
    subject="options"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
