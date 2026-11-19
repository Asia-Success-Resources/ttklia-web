<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Turnstiles: live lanes, modes (table `turnstiles`). Permission: bus.turnstiles.read (doc 27).
// TODO(pending: V1) see doc 30.
// TODO(pending: I1) see doc 30.
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  name: string
  lane_no: number
  controller_ip: string
  directions: string
  side_a: string
  platform_location_ids: unknown | null
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'lane_no', header: 'Lane no' },
  { accessorKey: 'controller_ip', header: 'Controller ip' },
  { accessorKey: 'directions', header: 'Directions' },
  { accessorKey: 'side_a', header: 'Side a' },
  { accessorKey: 'platform_location_ids', header: 'Platform location ids' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Turnstiles"
    subject="turnstiles"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    note="Waiting on: V1, I1 (doc 30)."
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
