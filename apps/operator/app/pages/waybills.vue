<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Waybills: drivers and bus per trip (table `bus_trips`). Permission: operator.waybills.read (doc 27).
// GET /api/operator-portal/trips (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Waybills' })

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
const list = useApiList<Row>({ search, path: '/operator-portal/trips' })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Waybills"
        subject="waybills"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
    
        @page="list.load"
    />
</template>
