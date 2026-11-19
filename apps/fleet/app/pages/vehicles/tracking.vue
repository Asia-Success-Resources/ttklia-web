<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Tracking: GPS (table `telematics_devices`). Permission: fleet.vehicles_tracking.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  provider: string
  installed_at: string
  odometer_baseline_km: number
  status: string
  created_at: string
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'provider', header: 'Provider' },
  { accessorKey: 'installed_at', header: 'Installed at' },
  { accessorKey: 'odometer_baseline_km', header: 'Odometer baseline km' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'created_at', header: 'Created at' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Tracking"
    subject="tracking"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
