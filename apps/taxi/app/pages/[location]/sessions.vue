<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Sessions: counter cash sessions (table `cash_sessions`). Permission: taxi.sessions.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  opened_at: string
  closed_at: string | null
  opening_float_sen: number
  expected_sen: number | null
  counted_sen: number | null
  variance_sen: number | null
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'opened_at', header: 'Opened at' },
  { accessorKey: 'closed_at', header: 'Closed at' },
  { accessorKey: 'opening_float_sen', header: 'Opening float (RM)', cell: ({ row }) => formatSen(row.original.opening_float_sen as number | null) },
  { accessorKey: 'expected_sen', header: 'Expected (RM)', cell: ({ row }) => formatSen(row.original.expected_sen as number | null) },
  { accessorKey: 'counted_sen', header: 'Counted (RM)', cell: ({ row }) => formatSen(row.original.counted_sen as number | null) },
  { accessorKey: 'variance_sen', header: 'Variance (RM)', cell: ({ row }) => formatSen(row.original.variance_sen as number | null) },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Sessions"
    subject="sessions"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
