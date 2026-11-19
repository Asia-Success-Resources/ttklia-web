<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Rentals: self-drive bookings (table `fleet_bookings`). Permission: fleet.rentals.read (doc 27).
// TODO(pending: P9) see doc 30.
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  reference: string
  service: string
  source: string
  client_reference: string | null
  guest_name: string | null
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'reference', header: 'Reference' },
  { accessorKey: 'service', header: 'Service' },
  { accessorKey: 'source', header: 'Source' },
  { accessorKey: 'client_reference', header: 'Client reference' },
  { accessorKey: 'guest_name', header: 'Guest name' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Rentals"
    subject="rentals"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    note="Waiting on: P9 (doc 30)."
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
