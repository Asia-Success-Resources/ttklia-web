<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Users: company staff (company admin) (table `user_roles`). Permission: operator.users.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  scope: string
  granted_by: number
  expires_at: string | null
  created_at: string
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'scope', header: 'Scope' },
  { accessorKey: 'granted_by', header: 'Granted by' },
  { accessorKey: 'expires_at', header: 'Expires at' },
  { accessorKey: 'created_at', header: 'Created at' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: false })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Users"
    subject="users"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
