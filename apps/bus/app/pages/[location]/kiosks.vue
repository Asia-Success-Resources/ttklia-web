<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Kiosks: list (table `devices`). Permission: bus.kiosks.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  type: string
  name: string
  status: string
  software_version: string | null
  os: string | null
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'software_version', header: 'Software version' },
  { accessorKey: 'os', header: 'Os' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Kiosks"
    subject="kiosks"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
