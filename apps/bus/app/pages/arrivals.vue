<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Arrivals: expected from terminal and operator systems (table `bus_trips`). Permission: bus.arrivals.read (doc 27).
// GET /api/ops/w/{workspace}/bus/arrivals (ttklia-api).
useHead({ title: 'Arrivals' })

interface Row extends Record<string, unknown> {
    uuid: string
    direction: string
    source: string
    trip_no: string | null
    sales_open: boolean
    seats_synced_at: string | null
    estimated_arrival_at: string | null
    status: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'direction', header: 'Direction' },
    { accessorKey: 'source', header: 'Source' },
    { accessorKey: 'trip_no', header: 'Trip no' },
    { accessorKey: 'estimated_arrival_at', header: 'Expected at' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'sales_open', header: 'Sales open' },
    { accessorKey: 'seats_synced_at', header: 'Seats synced at' },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/bus/arrivals', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Arrivals"
        subject="arrivals"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
    
        @page="list.load"
    />
</template>
