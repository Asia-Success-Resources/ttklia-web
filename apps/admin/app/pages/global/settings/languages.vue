<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Languages: translations (table `translations`). Permission: global.settings_languages.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  translatable_type: string
  field: string
  locale: string
  text: string
  source: string
  reviewed_by: number | null
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'translatable_type', header: 'Translatable type' },
  { accessorKey: 'field', header: 'Field' },
  { accessorKey: 'locale', header: 'Locale' },
  { accessorKey: 'text', header: 'Text' },
  { accessorKey: 'source', header: 'Source' },
  { accessorKey: 'reviewed_by', header: 'Reviewed by' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: false })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Languages"
    subject="languages"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
