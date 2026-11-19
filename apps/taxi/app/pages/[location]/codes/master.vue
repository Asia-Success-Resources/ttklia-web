<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Master codes: list (table `access_codes`). Permission: taxi.codes_master.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  code: string
  type: string
  pax_count: number | null
  entered_pax: number
  exited_pax: number
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'code', header: 'Code' },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'pax_count', header: 'Pax count' },
  { accessorKey: 'entered_pax', header: 'Entered pax' },
  { accessorKey: 'exited_pax', header: 'Exited pax' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Master codes"
    subject="master codes"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
