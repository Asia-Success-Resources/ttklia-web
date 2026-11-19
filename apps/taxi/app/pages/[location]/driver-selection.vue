<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Driver selection: force assign (table `taxi_coupons`). Permission: taxi.driver_selection.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  vehicle_class: string
  pax_count: number
  fare_sen: number
  toll_sen: number
  sst_sen: number
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'vehicle_class', header: 'Vehicle class' },
  { accessorKey: 'pax_count', header: 'Pax count' },
  { accessorKey: 'fare_sen', header: 'Fare (RM)', cell: ({ row }) => formatSen(row.original.fare_sen as number | null) },
  { accessorKey: 'toll_sen', header: 'Toll (RM)', cell: ({ row }) => formatSen(row.original.toll_sen as number | null) },
  { accessorKey: 'sst_sen', header: 'Sst (RM)', cell: ({ row }) => formatSen(row.original.sst_sen as number | null) },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Driver selection"
    subject="driver selection"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
