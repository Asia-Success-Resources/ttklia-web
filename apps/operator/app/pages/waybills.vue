<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Waybills: drivers and bus per trip (table `bus_trips`). Permission: operator.waybills.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  direction: string
  source: string
  trip_no: string | null
  sales_open: boolean
  seats_synced_at: string | null
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'direction', header: 'Direction' },
  { accessorKey: 'source', header: 'Source' },
  { accessorKey: 'trip_no', header: 'Trip no' },
  { accessorKey: 'sales_open', header: 'Sales open' },
  { accessorKey: 'seats_synced_at', header: 'Seats synced at' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: false })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Waybills"
    subject="waybills"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
