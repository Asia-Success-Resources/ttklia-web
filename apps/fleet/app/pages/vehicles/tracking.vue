<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Tracking: the fleet's vans and cars with their tracker and last position in the last 7 days (opens in Google Maps),
// speed and time. Vehicles with no tracker or no position yet show so. GET /fleet/tracking. Permission:
// fleet.vehicles_tracking.read (doc 27). TODO(pending: telematics): positions arrive once the trackers feed in.
useHead({ title: 'Tracking' })

interface Row extends Record<string, unknown> {
    id: number
    plate_no: string
    type: string
    vehicle_class: string
    provider: string | null
    has_tracker: boolean
    recorded_at: string | null
    lat: number | null
    lng: number | null
    speed_kmh: number | null
    odometer_km: number | null
}

const search = ref('')
const type = ref<string | undefined>(undefined)
const list = useApiList<Row>({ search, path: '/fleet/tracking', workspaceScoped: true, query: () => ({ type: type.value }) })
onMounted(() => list.load())
watch(type, () => list.load())

const mapUrl = (r: Row) => `https://www.google.com/maps?q=${r.lat},${r.lng}`
const columns: TableColumn<Row>[] = [
    { accessorKey: 'plate_no', header: 'Vehicle', cell: ({ row }) => h(resolveComponent('NuxtLink'), { to: `/vehicles/${row.original.id}`, class: 'font-medium hover:underline' }, () => row.original.plate_no) },
    { accessorKey: 'vehicle_class', header: 'Class', cell: ({ row }) => statusLabel(row.original.vehicle_class) },
    { accessorKey: 'provider', header: 'Tracker', cell: ({ row }) => (row.original.has_tracker ? statusLabel(row.original.provider) : 'None fitted') },
    {
        id: 'position',
        header: 'Last position',
        cell: ({ row }) => (row.original.lat === null ? '—' : h('a', { href: mapUrl(row.original), target: '_blank', rel: 'noopener', class: 'text-primary hover:underline' }, `${row.original.lat?.toFixed(5)}, ${row.original.lng?.toFixed(5)}`)),
    },
    { accessorKey: 'speed_kmh', header: 'Speed', cell: ({ row }) => (row.original.speed_kmh === null ? '—' : `${row.original.speed_kmh} km/h`) },
    { accessorKey: 'recorded_at', header: 'Seen' },
    { accessorKey: 'odometer_km', header: 'Odometer', cell: ({ row }) => (row.original.odometer_km ? `${row.original.odometer_km.toLocaleString('en-MY')} km` : '—') },
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Tracking"
        subject="vehicles"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        :can-export="false"
        note="Positions show once the GPS and OBD trackers send them."
        @page="list.load"
    >
        <template #actions>
            <USelect v-model="type" :items="[{ label: 'All types', value: undefined }, { label: 'MPV', value: 'mpv' }, { label: 'Van', value: 'van' }, { label: 'Car', value: 'car' }]" class="w-32" />
        </template>
    </OpsListPage>
</template>
