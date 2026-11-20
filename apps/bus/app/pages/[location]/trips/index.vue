<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Trips: departures today (table `bus_trips`). Permission: bus.trips.read (doc 27).
// TODO(api): reads GET /bus/trips (doc 04) by hand until packages/api-client-ts is generated.
useHead({ title: 'Trips' })

interface Row extends Record<string, unknown> {
    uuid: string
    direction: string
    source: string
    trip_no: string | null
    sales_open: boolean
    seats_synced_at: string | null
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'direction', header: 'Direction' },
    { accessorKey: 'source', header: 'Source' },
    { accessorKey: 'trip_no', header: 'Trip no' },
    { accessorKey: 'sales_open', header: 'Sales open' },
    { accessorKey: 'seats_synced_at', header: 'Seats synced at' },
]

const search = ref('')
const list = useApiList<Row>({ path: "/bus/trips", workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Trips"
        subject="trips"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
    
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
