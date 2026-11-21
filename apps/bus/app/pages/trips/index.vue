<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Trips: departures by day (table `bus_trips`). Permission: bus.trips.read (doc 27).
// GET /api/ops/w/{workspace}/bus/trips?direction=departure&date= (ttklia-api). Times are shown in Malaysia time.
useHead({ title: 'Trips' })

interface Row extends Record<string, unknown> {
    uuid: string
    trip_no: string | null
    company: string | null
    destination: string | null
    departs_at: string | null
    plate_no: string | null
    capacity: number | null
    sold_seats: number
    status: string
}

const { resolveTo } = useOpsShell()
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' })
const date = ref(today)
const localTime = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kuala_Lumpur' }) : '-')

const columns: TableColumn<Row>[] = [
    { accessorKey: 'departs_at', header: 'Departure', cell: ({ row }) => localTime(row.original.departs_at) },
    { accessorKey: 'company', header: 'Operator', cell: ({ row }) => row.original.company ?? '-' },
    { accessorKey: 'destination', header: 'Destination', cell: ({ row }) => row.original.destination ?? '-' },
    { accessorKey: 'trip_no', header: 'Trip no', cell: ({ row }) => row.original.trip_no ?? '-' },
    { accessorKey: 'plate_no', header: 'Bus', cell: ({ row }) => row.original.plate_no ?? '-' },
    { accessorKey: 'sold_seats', header: 'Sold', cell: ({ row }) => `${row.original.sold_seats} / ${row.original.capacity ?? '-'}` },
    { accessorKey: 'status', header: 'Status' },
    { id: 'open', header: '', cell: ({ row }) => h(resolveComponent('UButton'), { label: 'Open', variant: 'link', size: 'sm', to: resolveTo(`/trips/${row.original.uuid}`) }) },
]

const search = ref('')
const query = reactive({ direction: 'departure', date })
const list = useApiList<Row>({ search, path: '/bus/trips', workspaceScoped: true, query })
onMounted(() => list.load())
watch(date, () => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Trips"
        subject="trips"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        @page="list.load"
    >
        <template #actions>
            <UInput v-model="date" type="date" size="sm" />
        </template>
    </OpsListPage>
</template>
