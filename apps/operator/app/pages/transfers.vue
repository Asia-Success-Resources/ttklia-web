<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Transfers: move passengers (no table). Permission: operator.transfers.read (doc 27).
// TODO(pending: G2) see doc 30.
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  name: string
  status: string
  updated_at: string
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'updated_at', header: 'Updated at' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: false })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Transfers"
    subject="transfers"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    note="Waiting on: G2 (doc 30)."
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
