<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Platforms: who holds each platform (table `platform_occupancies`). Permission: bus.platforms.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  from_at: string
  until_at: string | null
  released_at: string | null
  source: string
  created_at: string
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'from_at', header: 'From at' },
  { accessorKey: 'until_at', header: 'Until at' },
  { accessorKey: 'released_at', header: 'Released at' },
  { accessorKey: 'source', header: 'Source' },
  { accessorKey: 'created_at', header: 'Created at' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Platforms"
    subject="platforms"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
