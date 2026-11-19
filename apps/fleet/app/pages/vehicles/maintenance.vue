<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Maintenance: list (table `maintenance_records`). Permission: fleet.vehicles_maintenance.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  done_on: string
  odometer_km: number
  vendor: string | null
  cost_sen: number | null
  notes: string | null
  created_at: string
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'done_on', header: 'Done on' },
  { accessorKey: 'odometer_km', header: 'Odometer km' },
  { accessorKey: 'vendor', header: 'Vendor' },
  { accessorKey: 'cost_sen', header: 'Cost (RM)', cell: ({ row }) => formatSen(row.original.cost_sen as number | null) },
  { accessorKey: 'notes', header: 'Notes' },
  { accessorKey: 'created_at', header: 'Created at' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Maintenance"
    subject="maintenance"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
