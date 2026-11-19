<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Products: list (table `catalog_items`). Permission: bus.products.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  type: string
  sku: string
  name: string
  price_sen: number
  sst_rate_bp: number
  is_active: boolean
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'sku', header: 'Sku' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'price_sen', header: 'Price (RM)', cell: ({ row }) => formatSen(row.original.price_sen as number | null) },
  { accessorKey: 'sst_rate_bp', header: 'Sst rate bp' },
  { accessorKey: 'is_active', header: 'Is active' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: true })
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
