<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Requests: list (table `ride_requests`). Permission: ride.requests.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  pickup_lat: number
  pickup_lng: number
  pickup_h3_r8: number
  dropoff_lat: number
  dropoff_lng: number
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'pickup_lat', header: 'Pickup lat' },
  { accessorKey: 'pickup_lng', header: 'Pickup lng' },
  { accessorKey: 'pickup_h3_r8', header: 'Pickup h3 r8' },
  { accessorKey: 'dropoff_lat', header: 'Dropoff lat' },
  { accessorKey: 'dropoff_lng', header: 'Dropoff lng' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Requests"
    subject="requests"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
