<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Fares: list (table `fare_rules`). Permission: global.pricing_fares.read (doc 27). Admin app, every business (Sitemap 4).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  product: string
  vehicle_class: string | null
  ticket_type: string | null
  flat_sen: number | null
  base_sen: number | null
  per_km_sen: number | null
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'product', header: 'Product' },
  { accessorKey: 'vehicle_class', header: 'Vehicle class' },
  { accessorKey: 'ticket_type', header: 'Ticket type' },
  { accessorKey: 'flat_sen', header: 'Flat (RM)', cell: ({ row }) => formatSen(row.original.flat_sen as number | null) },
  { accessorKey: 'base_sen', header: 'Base (RM)', cell: ({ row }) => formatSen(row.original.base_sen as number | null) },
  { accessorKey: 'per_km_sen', header: 'Per km (RM)', cell: ({ row }) => formatSen(row.original.per_km_sen as number | null) },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: false })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Fares"
    subject="fares"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
