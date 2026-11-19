<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// System: API keys, IP allow-list, call log (table `operator_api_clients`). Permission: operator.system.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  kind: string
  scopes: unknown
  last_used_at: string | null
  revoked_at: string | null
  created_at: string
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'kind', header: 'Kind' },
  { accessorKey: 'scopes', header: 'Scopes' },
  { accessorKey: 'last_used_at', header: 'Last used at' },
  { accessorKey: 'revoked_at', header: 'Revoked at' },
  { accessorKey: 'created_at', header: 'Created at' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: false })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="System"
    subject="system"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
