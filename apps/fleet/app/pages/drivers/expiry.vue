<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Drivers expiry: documents (table `documents`). Permission: fleet.drivers_expiry.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  documentable_type: string
  type: string
  number: string | null
  issued_on: string | null
  expires_on: string | null
  status: string
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'documentable_type', header: 'Documentable type' },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'number', header: 'Number' },
  { accessorKey: 'issued_on', header: 'Issued on' },
  { accessorKey: 'expires_on', header: 'Expires on' },
  { accessorKey: 'status', header: 'Status' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Drivers expiry"
    subject="drivers expiry"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
