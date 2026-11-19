<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Statements: daily T+2 payouts (table `payouts`). Permission: operator.statements.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  payee_type: string
  period_start: string
  period_end: string
  amount_sen: number
  due_at: string | null
  status: string
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'payee_type', header: 'Payee type' },
  { accessorKey: 'period_start', header: 'Period start' },
  { accessorKey: 'period_end', header: 'Period end' },
  { accessorKey: 'amount_sen', header: 'Amount (RM)', cell: ({ row }) => formatSen(row.original.amount_sen as number | null) },
  { accessorKey: 'due_at', header: 'Due at' },
  { accessorKey: 'status', header: 'Status' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: false })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Statements"
    subject="statements"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
