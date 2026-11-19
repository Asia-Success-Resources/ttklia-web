<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Dispatch: rounds, windows (table `ride_offers`). Permission: ride.dispatch.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  round: number
  ring_k: number
  eta_seconds: number
  offered_at: string
  expires_at: string
  response: string
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'round', header: 'Round' },
  { accessorKey: 'ring_k', header: 'Ring k' },
  { accessorKey: 'eta_seconds', header: 'Eta seconds' },
  { accessorKey: 'offered_at', header: 'Offered at' },
  { accessorKey: 'expires_at', header: 'Expires at' },
  { accessorKey: 'response', header: 'Response' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Dispatch"
    subject="dispatch"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
