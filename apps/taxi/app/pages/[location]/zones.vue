<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Zones: zone fares (table `zones`). Permission: taxi.zones.read (doc 27).
// GET /api/ops/w/{workspace}/zones (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
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
const list = useApiList<Row>({ search, path: '/zones', workspaceScoped: true })
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
        :pagination="list.pagination.value"
    
        @page="list.load"
    />
</template>
