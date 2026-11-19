<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Clients: Genting and others (table `organisations`). Permission: fleet.clients.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  type: string
  name: string
  ssm_no: string | null
  tin: string | null
  sst_no: string | null
  contact_email: string | null
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'ssm_no', header: 'Ssm no' },
  { accessorKey: 'tin', header: 'Tin' },
  { accessorKey: 'sst_no', header: 'Sst no' },
  { accessorKey: 'contact_email', header: 'Contact email' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Clients"
    subject="clients"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
