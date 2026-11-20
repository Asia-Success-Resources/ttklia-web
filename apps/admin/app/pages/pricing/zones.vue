<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Zones: H3 zone editor (table `zones`). Permission: global.pricing_zones.read (doc 27). Admin app, every business (Sitemap 4).
// GET /api/v1/admin/pricing/zones (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Zones' })

interface Row extends Record<string, unknown> {
    uuid: string
    code: string
    name: string
    type: string
    h3_resolution: number
    polygon_geojson: unknown
    version: number
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'type', header: 'Type' },
    { accessorKey: 'h3_resolution', header: 'H3 resolution' },
    { accessorKey: 'polygon_geojson', header: 'Polygon geojson' },
    { accessorKey: 'version', header: 'Version' },
]

const search = ref('')
const list = useApiList<Row>({ path: '/admin/pricing/zones' })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Zones"
        subject="zones"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
    
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
