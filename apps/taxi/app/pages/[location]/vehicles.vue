<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Vehicles: list (table `vehicles`). Permission: taxi.vehicles.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  plate_no: string
  type: string
  vehicle_class: string
  make: string | null
  model: string | null
  year: number | null
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'plate_no', header: 'Plate no' },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'vehicle_class', header: 'Vehicle class' },
  { accessorKey: 'make', header: 'Make' },
  { accessorKey: 'model', header: 'Model' },
  { accessorKey: 'year', header: 'Year' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Vehicles"
    subject="vehicles"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
