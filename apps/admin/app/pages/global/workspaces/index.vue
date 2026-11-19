<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Workspaces: KL2, LLP, TAXI, FLEET, RIDE (table `workspaces`). Permission: global.workspaces.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  code: string
  slug: string
  name: string
  type: string
  timezone: string
  is_active: boolean
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'code', header: 'Code' },
  { accessorKey: 'slug', header: 'Slug' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'timezone', header: 'Timezone' },
  { accessorKey: 'is_active', header: 'Is active' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: false })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Workspaces"
    subject="workspaces"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
