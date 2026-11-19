<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Counter: queue: chee queue display and call (table `taxi_tickets`). Permission: taxi.counter_queue.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

definePageMeta({ layout: 'counter' })

interface Row extends Record<string, unknown> {
  uuid: string
  number: string
  service_date: string
  kind: string
  cucuk: boolean
  fee_sen: number
  sst_sen: number
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'number', header: 'Number' },
  { accessorKey: 'service_date', header: 'Service date' },
  { accessorKey: 'kind', header: 'Kind' },
  { accessorKey: 'cucuk', header: 'Cucuk' },
  { accessorKey: 'fee_sen', header: 'Fee (RM)', cell: ({ row }) => formatSen(row.original.fee_sen as number | null) },
  { accessorKey: 'sst_sen', header: 'Sst (RM)', cell: ({ row }) => formatSen(row.original.sst_sen as number | null) },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Counter: queue"
    subject="counter: queue"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
