<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Counters: list (table `locations`). Permission: bus.counters.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  type: string
  code: string
  name: string
  lat: number | null
  lng: number | null
  h3_r10: number | null
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'code', header: 'Code' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'lat', header: 'Lat' },
  { accessorKey: 'lng', header: 'Lng' },
  { accessorKey: 'h3_r10', header: 'H3 r10' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Counters"
    subject="counters"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
