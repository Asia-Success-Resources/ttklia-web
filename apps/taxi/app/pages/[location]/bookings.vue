<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Bookings: coupons (table `taxi_coupons`). Permission: taxi.bookings.read (doc 27).
// GET /api/ops/w/{workspace}/taxi/coupons (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Bookings' })

interface Row extends Record<string, unknown> {
    uuid: string
    vehicle_class: string
    pax_count: number
    fare_sen: number
    toll_sen: number
    sst_sen: number
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'vehicle_class', header: 'Vehicle class' },
    { accessorKey: 'pax_count', header: 'Pax count' },
    { accessorKey: 'fare_sen', header: 'Fare (RM)', cell: ({ row }) => formatSen(row.original.fare_sen as number | null) },
    { accessorKey: 'toll_sen', header: 'Toll (RM)', cell: ({ row }) => formatSen(row.original.toll_sen as number | null) },
    { accessorKey: 'sst_sen', header: 'Sst (RM)', cell: ({ row }) => formatSen(row.original.sst_sen as number | null) },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/taxi/coupons', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Bookings"
        subject="bookings"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
    
        @page="list.load"
    />
</template>
