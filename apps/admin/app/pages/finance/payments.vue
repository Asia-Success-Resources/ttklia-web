<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Payments: list (table `payment_intents`). Permission: finance.payments.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  purpose_type: string
  amount_sen: number
  currency: string
  status: string
  gateway: string | null
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'purpose_type', header: 'Purpose type' },
  { accessorKey: 'amount_sen', header: 'Amount (RM)', cell: ({ row }) => formatSen(row.original.amount_sen as number | null) },
  { accessorKey: 'currency', header: 'Currency' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'gateway', header: 'Gateway' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: false })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Payments"
    subject="payments"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
