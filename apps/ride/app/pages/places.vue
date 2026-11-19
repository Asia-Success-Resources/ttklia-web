<!-- TODO(removed-from-docs): Sitemap 4 moved this page to the admin app (apps/admin/app/pages/places.vue). Kept, not deleted; remove when agreed. -->
<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Places: POI catalogue, search cost (table `pois`). Permission: ride.places.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

interface Row extends Record<string, unknown> {
  uuid: string
  name: string
  short_code: string | null
  aliases: unknown | null
  category: string
  address_text: string | null
  lat: number
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'short_code', header: 'Short code' },
  { accessorKey: 'aliases', header: 'Aliases' },
  { accessorKey: 'category', header: 'Category' },
  { accessorKey: 'address_text', header: 'Address text' },
  { accessorKey: 'lat', header: 'Lat' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Places"
    subject="places"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
