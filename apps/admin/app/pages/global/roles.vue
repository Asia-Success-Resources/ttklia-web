<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Roles: access matrix: read, write, delete, export, approve (table `roles`). Permission: global.roles.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  workspace_type: string
  name: string
  description: string | null
  is_system: boolean
  guard_name: string
  created_at: string
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'workspace_type', header: 'Workspace type' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'description', header: 'Description' },
  { accessorKey: 'is_system', header: 'Is system' },
  { accessorKey: 'guard_name', header: 'Guard name' },
  { accessorKey: 'created_at', header: 'Created at' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: false })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Roles"
    subject="roles"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
