<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Entries: gate entries and decisions (table `gate_decisions`). Permission: bus.buses_entries.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  scanned_code: string | null
  decision: string
  reason: string
  decided_by: string
  fare_sen: number
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'scanned_code', header: 'Scanned code' },
  { accessorKey: 'decision', header: 'Decision' },
  { accessorKey: 'reason', header: 'Reason' },
  { accessorKey: 'decided_by', header: 'Decided by' },
  { accessorKey: 'fare_sen', header: 'Fare (RM)', cell: ({ row }) => formatSen(row.original.fare_sen as number | null) },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Entries"
    subject="entries"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
