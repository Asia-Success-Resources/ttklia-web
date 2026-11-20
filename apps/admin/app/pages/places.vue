<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Places: POI catalogue, search cost (table `pois`). Permission: global.places.read (doc 27). Admin app, every business (Sitemap 4).
// GET /api/v1/admin/places (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Places' })

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
const list = useApiList<Row>({ path: '/admin/places' })
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
