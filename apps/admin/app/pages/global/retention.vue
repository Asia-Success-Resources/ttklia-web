<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Retention: list (table `retention_policies`). Permission: global.retention.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  data_class: string
  keep_days: number
  action: string
  created_at: string
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'data_class', header: 'Data class' },
  { accessorKey: 'keep_days', header: 'Keep days' },
  { accessorKey: 'action', header: 'Action' },
  { accessorKey: 'created_at', header: 'Created at' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: false })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Retention"
    subject="retention"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
