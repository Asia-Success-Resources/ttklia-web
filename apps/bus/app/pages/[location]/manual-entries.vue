<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Manual entries: manual bus entries (table `gate_overrides`). Permission: bus.manual_entries.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  reason: string
  opened_at: string
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'reason', header: 'Reason' },
  { accessorKey: 'opened_at', header: 'Opened at' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Manual entries"
    subject="manual entries"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
