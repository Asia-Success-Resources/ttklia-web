<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { OpsListFilter } from '~/types/list'

// Trips, as ttklia-v2's admin/bus/trips index (Trip $indexFields, trips/index-filter):
// ID, Route ID, Zone, Operator, Date, Time, Plate Number, Bus Type, Trip No, Platform, Available Seats, Status, Actions.
// Filter: Future Only (default Yes), Trips (default parent trips only), System Provider, Date, Operator, Zone, Status.
// GET /api/ops/w/{workspace}/bus/trips (ttklia-api). Permission: bus.trips.read (doc 27). Times in Malaysia time.
// TODO(api): v2 changed a trip's status from the list (update-status); v3 has only the trip page's actions so far.
useHead({ title: 'Trips' })

interface Row extends Record<string, unknown> {
    id: number
    uuid: string
    route_id: number
    zone: string | null
    destination: string | null
    sub_trips: number
    company: string | null
    departs_at: string | null
    plate_no: string | null
    bus_type: string | null
    trip_no: string | null
    platform: string | null
    available_seats: number | null
    status: string
}

const { resolveTo } = useOpsShell()
const options = useBusOptions()


const columns: TableColumn<Row>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'route_id', header: 'Route ID' },
    {
        accessorKey: 'zone',
        header: 'Zone',
        cell: ({ row }) => row.original.sub_trips > 0
            ? h(resolveComponent('UBadge'), { label: `${row.original.sub_trips + 1} zones`, variant: 'soft', color: 'success' })
            : row.original.zone ?? row.original.destination ?? '-',
    },
    { accessorKey: 'company', header: 'Operator', cell: ({ row }) => row.original.company ?? '-' },
    { id: 'date', header: 'Date', cell: ({ row }) => klTime(row.original.departs_at, { day: '2-digit', month: '2-digit', year: 'numeric' }) },
    { id: 'time', header: 'Time', cell: ({ row }) => klTime(row.original.departs_at, { hour: '2-digit', minute: '2-digit' }) },
    { accessorKey: 'plate_no', header: 'Plate Number', cell: ({ row }) => row.original.plate_no ?? '-' },
    { accessorKey: 'bus_type', header: 'Bus Type', cell: ({ row }) => row.original.bus_type ?? '-' },
    { accessorKey: 'trip_no', header: 'Trip No', cell: ({ row }) => row.original.trip_no ?? '-' },
    { accessorKey: 'platform', header: 'Platform', cell: ({ row }) => row.original.platform ?? '-' },
    { accessorKey: 'available_seats', header: 'Available Seats', cell: ({ row }) => row.original.available_seats ?? '-' },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => h(resolveComponent('UBadge'), { label: tripStatusLabels[row.original.status] ?? row.original.status, variant: 'soft', color: tripStatusColor(row.original.status) }),
    },
]

const filters = computed<OpsListFilter[]>(() => [
    { key: 'future', label: 'Future Only', items: [{ label: 'Yes', value: '1' }, { label: 'No', value: '0' }], emptyLabel: 'Yes' },
    { key: 'parent_only', label: 'Trips', items: [{ label: 'Show Parent Trips Only', value: '1' }, { label: 'All', value: '0' }], emptyLabel: 'Show Parent Trips Only' },
    { key: 'system_provider_id', label: 'System Provider', items: options.systemProviders.value },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'company_id', label: 'Operator', items: options.operators.value },
    { key: 'zone_id', label: 'Zone', items: options.zones.value },
    { key: 'status', label: 'Status', items: Object.entries(tripStatusLabels).slice(0, 7).map(([value, label]) => ({ label, value })) },
])
const filterValues = ref<Record<string, string | undefined>>({})

const search = ref('')
const list = useApiList<Row>({
    search,
    path: '/bus/trips',
    workspaceScoped: true,
    // v2 defaults: future trips only, parent trips only.
    query: () => ({ direction: 'departure', future: '1', parent_only: '1', ...chosen(filterValues.value) }),
})
onMounted(() => {
    list.load()
    options.load('operators', 'zones', 'systemProviders')
})
</script>

<template>
    <OpsListPage
        v-model:search="search"
        v-model:filter-values="filterValues"
        title="Trips"
        subject="trip"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        :filters="filters"
        :show-to="(row) => resolveTo(`/trips/${row.uuid}`)"
        @filter="list.load()"
        @page="list.load"
    />
</template>
