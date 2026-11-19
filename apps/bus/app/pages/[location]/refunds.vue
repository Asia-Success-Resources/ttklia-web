<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Refunds: refund requests (table `refunds`). Permission: bus.refunds.read (doc 27).
// TODO(pending: C1) see doc 30.
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  amount_sen: number
  reason: string
  status: string
  requested_by: number
  approved_by: number | null
  gateway_reference: string | null
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'amount_sen', header: 'Amount (RM)', cell: ({ row }) => formatSen(row.original.amount_sen as number | null) },
  { accessorKey: 'reason', header: 'Reason' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'requested_by', header: 'Requested by' },
  { accessorKey: 'approved_by', header: 'Approved by' },
  { accessorKey: 'gateway_reference', header: 'Gateway reference' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Refunds"
    subject="refunds"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    note="Waiting on: C1 (doc 30)."
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
