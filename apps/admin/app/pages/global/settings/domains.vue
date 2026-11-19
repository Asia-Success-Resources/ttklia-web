<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Domains: host → workspace (table `app_domains`). Permission: global.settings_domains.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  host: string
  app: string
  redirect_to: string | null
  is_primary: boolean
  tls_status: string
  verified_at: string | null
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'host', header: 'Host' },
  { accessorKey: 'app', header: 'App' },
  { accessorKey: 'redirect_to', header: 'Redirect to' },
  { accessorKey: 'is_primary', header: 'Is primary' },
  { accessorKey: 'tls_status', header: 'Tls status' },
  { accessorKey: 'verified_at', header: 'Verified at' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: false })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Domains"
    subject="domains"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
