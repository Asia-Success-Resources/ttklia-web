<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Manifests: passengers per trip (table `tickets`). Permission: operator.manifests.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  seat_no: string | null
  provider_ref: string | null
  ticket_type: string
  passenger_name: string | null
  fare_sen: number
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'seat_no', header: 'Seat no' },
  { accessorKey: 'provider_ref', header: 'Provider ref' },
  { accessorKey: 'ticket_type', header: 'Ticket type' },
  { accessorKey: 'passenger_name', header: 'Passenger name' },
  { accessorKey: 'fare_sen', header: 'Fare (RM)', cell: ({ row }) => formatSen(row.original.fare_sen as number | null) },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: false })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Manifests"
    subject="manifests"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
