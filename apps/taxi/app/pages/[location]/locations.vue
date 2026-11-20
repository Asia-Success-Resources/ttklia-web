<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Locations: ranks, bays (table `locations`). Permission: taxi.locations.read (doc 27).
// GET /api/v1/ops/w/{workspace}/locations (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Locations' })

interface Row extends Record<string, unknown> {
    uuid: string
    type: string
    code: string
    name: string
    lat: number | null
    lng: number | null
    h3_r10: number | null
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'type', header: 'Type' },
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'lat', header: 'Lat' },
    { accessorKey: 'lng', header: 'Lng' },
    { accessorKey: 'h3_r10', header: 'H3 r10' },
]

const search = ref('')
const list = useApiList<Row>({ path: '/locations', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Locations"
        subject="locations"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
    
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
