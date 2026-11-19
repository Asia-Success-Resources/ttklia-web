<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Zones: zones and limo fares (table `zones`). Permission: fleet.zones.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  code: string
  name: string
  type: string
  h3_resolution: number
  polygon_geojson: unknown
  version: number
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'code', header: 'Code' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'h3_resolution', header: 'H3 resolution' },
  { accessorKey: 'polygon_geojson', header: 'Polygon geojson' },
  { accessorKey: 'version', header: 'Version' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Zones"
    subject="zones"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
