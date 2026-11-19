<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Settlements: gateway matching (table `settlements`). Permission: finance.settlements.read (doc 27).
// TODO(pending: F1) see doc 30.
// TODO(pending: F2) see doc 30.
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  gateway: string
  settlement_date: string
  total_sen: number
  fee_sen: number
  status: string
  matched_at: string | null
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'gateway', header: 'Gateway' },
  { accessorKey: 'settlement_date', header: 'Settlement date' },
  { accessorKey: 'total_sen', header: 'Total (RM)', cell: ({ row }) => formatSen(row.original.total_sen as number | null) },
  { accessorKey: 'fee_sen', header: 'Fee (RM)', cell: ({ row }) => formatSen(row.original.fee_sen as number | null) },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'matched_at', header: 'Matched at' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: false })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Settlements"
    subject="settlements"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    note="Waiting on: F1, F2 (doc 30)."
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
