<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Notices: PDPA notice versions (table `privacy_notices`). Permission: global.privacy_notices.read (doc 27).
// TODO(pending: L1) see doc 30.
// TODO(pending: L2) see doc 30.
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  version: string
  locale: string
  channel: string
  short_text: string
  full_text: string
  effective_from: string
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'version', header: 'Version' },
  { accessorKey: 'locale', header: 'Locale' },
  { accessorKey: 'channel', header: 'Channel' },
  { accessorKey: 'short_text', header: 'Short text' },
  { accessorKey: 'full_text', header: 'Full text' },
  { accessorKey: 'effective_from', header: 'Effective from' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: false })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Notices"
    subject="notices"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    note="Waiting on: L1, L2 (doc 30)."
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
