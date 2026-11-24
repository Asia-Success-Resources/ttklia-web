<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { RideRequestRow } from '~/utils/ride'

// Scheduled rides (doc 35, Sitemap 4): rides booked ahead, by pickup day (default today), earliest first, with status
// filters. Open one for its detail and offers; cancel with a reason; book one for a rider.
// GET /ops/w/{workspace}/rides/scheduled, POST /rides/{uuid}/cancel. Permission: ride.scheduled.read / write.
// TODO(doc 35): map and counts for the next hours.
useHead({ title: 'Scheduled rides' })

const api = useRideApi()
const toast = useToast()
const { can } = useMe()
const canWrite = computed(() => can('ride.scheduled.write'))

const statuses = [
    { label: 'All', value: undefined },
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'Matching', value: 'searching' },
    { label: 'Offered', value: 'offered' },
    { label: 'Accepted', value: 'accepted' },
    { label: 'No driver', value: 'no_driver' },
    { label: 'Cancelled', value: 'cancelled' },
]
const day = ref(todayYmd())
const status = ref<string | undefined>(undefined)
const search = ref('')
const list = useApiList<RideRequestRow>({ search, path: '/rides/scheduled', workspaceScoped: true, query: () => ({ date: day.value, status: status.value }) })
onMounted(() => list.load())
watch([day, status], () => list.load())

const reasonAction = useReasonAction()
function cancel(row: RideRequestRow) {
    reasonAction.ask({
        title: `Cancel the ${formatDateTime(row.scheduled_for)} ride`,
        submitLabel: 'Cancel ride',
        run: async (reason) => {
            await api.post(`/rides/${row.uuid}/cancel`, { reason })
            toast.add({ title: 'Scheduled ride cancelled', color: 'success' })
            await list.load(list.pagination.value?.current_page ?? 1)
        },
    })
}

const columns: TableColumn<RideRequestRow>[] = [
    { accessorKey: 'scheduled_for', header: 'Pickup at' },
    { accessorKey: 'matching_starts_at', header: 'Matching from' },
    { id: 'rider', header: 'Rider', cell: ({ row }) => h('div', [h('div', { class: 'font-medium' }, row.original.rider_name ?? '—'), row.original.rider_phone ? h('div', { class: 'text-xs text-gray-500' }, row.original.rider_phone) : null]) },
    { id: 'route', header: 'Pickup → Drop-off', cell: ({ row }) => h('div', { class: 'max-w-72' }, [h('div', { class: 'truncate' }, row.original.pickup), h('div', { class: 'truncate text-xs text-gray-500' }, `→ ${row.original.dropoff}`)]) },
    { accessorKey: 'vehicle_class', header: 'Car', cell: ({ row }) => carLabel(row.original.vehicle_class) },
    { accessorKey: 'quoted_fare_sen', header: 'Fare', cell: ({ row }) => formatSen(row.original.quoted_fare_sen) },
    { accessorKey: 'channel', header: 'Booked by', cell: ({ row }) => statusLabel(row.original.channel) },
    { id: 'driver', header: 'Driver', cell: ({ row }) => row.original.driver_name ?? '—' },
    { accessorKey: 'status', header: 'Status' },
    actionsColumn<RideRequestRow>((row) => [
        { label: 'View', icon: 'i-bx-eye', onSelect: () => navigateTo(`/scheduled/${row.uuid}`) },
        ...(canWrite.value && CANCELLABLE.includes(row.status) ? [{ label: 'Cancel', icon: 'i-bx-x-circle', color: 'error' as const, onSelect: () => cancel(row) }] : []),
    ]),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Scheduled rides"
        subject="scheduled rides"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        :can-export="false"
        :create-to="canWrite ? '/scheduled/new' : undefined"
        @page="list.load"
    >
        <template #actions>
            <UInput v-model="day" type="date" class="w-40" />
            <USelect v-model="status" :items="statuses" class="w-36" />
        </template>
    </OpsListPage>
    <OpsReasonModal :action="reasonAction" />
</template>
