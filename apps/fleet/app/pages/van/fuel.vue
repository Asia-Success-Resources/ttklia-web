<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Fuel: fuel limits and tolls (table `van_trip_costs`). Permission: fleet.van_fuel.read (doc 27).
// GET /api/v1/ops/w/{workspace}/fleet/van-trip-costs (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Fuel' })

interface Row extends Record<string, unknown> {
    uuid: string
    start_to_pickup_km: number
    pickup_to_destination_km: number
    destination_to_dropoff_km: number
    dropoff_to_base_km: number
    fuel_litres: number
    fuel_cost_sen: number
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'start_to_pickup_km', header: 'Start to pickup km' },
    { accessorKey: 'pickup_to_destination_km', header: 'Pickup to destination km' },
    { accessorKey: 'destination_to_dropoff_km', header: 'Destination to dropoff km' },
    { accessorKey: 'dropoff_to_base_km', header: 'Dropoff to base km' },
    { accessorKey: 'fuel_litres', header: 'Fuel litres' },
    { accessorKey: 'fuel_cost_sen', header: 'Fuel cost (RM)', cell: ({ row }) => formatSen(row.original.fuel_cost_sen as number | null) },
]

const search = ref('')
const list = useApiList<Row>({ path: '/fleet/van-trip-costs', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Fuel"
        subject="fuel"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
    
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
