<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Routes: departure and arrival routes (table `bus_routes`). Permission: bus.routes.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  code: string
  destination_name: string
  direction: string
  origin_name: string | null
  typical_travel_minutes: number | null
  operator_route_ref: string | null
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'code', header: 'Code' },
  { accessorKey: 'destination_name', header: 'Destination name' },
  { accessorKey: 'direction', header: 'Direction' },
  { accessorKey: 'origin_name', header: 'Origin name' },
  { accessorKey: 'typical_travel_minutes', header: 'Typical travel minutes' },
  { accessorKey: 'operator_route_ref', header: 'Operator route ref' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Routes"
    subject="routes"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
