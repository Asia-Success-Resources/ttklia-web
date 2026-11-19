<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Requests: access, correction, 21 days (table `data_subject_requests`). Permission: global.privacy_requests.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  requester_name: string
  requester_contact: string
  kind: string
  identity_checked_by: number | null
  status: string
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'requester_name', header: 'Requester name' },
  { accessorKey: 'requester_contact', header: 'Requester contact' },
  { accessorKey: 'kind', header: 'Kind' },
  { accessorKey: 'identity_checked_by', header: 'Identity checked by' },
  { accessorKey: 'status', header: 'Status' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: false })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Requests"
    subject="requests"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
