<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Routes: pickup points and destination (table `van_routes`). Permission: fleet.van_routes.read (doc 27).
// GET /api/v1/ops/w/{workspace}/fleet/van-routes (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Routes' })

interface Row extends Record<string, unknown> {
    uuid: string
    code: string
    name: string
    region: string
    billing: string
    trip_price_sen: number | null
    seat_fare_sen: number | null
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'region', header: 'Region' },
    { accessorKey: 'billing', header: 'Billing' },
    { accessorKey: 'trip_price_sen', header: 'Trip price (RM)', cell: ({ row }) => formatSen(row.original.trip_price_sen as number | null) },
    { accessorKey: 'seat_fare_sen', header: 'Seat fare (RM)', cell: ({ row }) => formatSen(row.original.seat_fare_sen as number | null) },
]

const search = ref('')
const list = useApiList<Row>({ path: '/fleet/van-routes', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Routes"
        subject="routes"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
    
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
