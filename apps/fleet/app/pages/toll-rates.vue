<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Toll rates: list (table `toll_rates`). Permission: fleet.toll_rates.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  toll_class: number
  leg: string
  amount_sen: number
  created_at: string
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'toll_class', header: 'Toll class' },
  { accessorKey: 'leg', header: 'Leg' },
  { accessorKey: 'amount_sen', header: 'Amount (RM)', cell: ({ row }) => formatSen(row.original.amount_sen as number | null) },
  { accessorKey: 'created_at', header: 'Created at' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Toll rates"
    subject="toll rates"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
