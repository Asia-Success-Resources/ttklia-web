<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Trips: daily trip sheet (replaces GGM sheet) (table `van_trips`). Permission: fleet.van_trips.read (doc 27).
// TODO(api): reads GET /fleet/van-trips (doc 04) by hand until packages/api-client-ts is generated.

interface Row extends Record<string, unknown> {
  uuid: string
  trip_no: string
  service_date: string
  pickup_at: string
  return_at: string | null
  pax_count: number | null
  remarks: string | null
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'trip_no', header: 'Trip no' },
  { accessorKey: 'service_date', header: 'Service date' },
  { accessorKey: 'pickup_at', header: 'Pickup at' },
  { accessorKey: 'return_at', header: 'Return at' },
  { accessorKey: 'pax_count', header: 'Pax count' },
  { accessorKey: 'remarks', header: 'Remarks' },
]

const search = ref('')
const list = useApiList<Row>({ path: "/fleet/van-trips", workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Trips"
    subject="trips"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
