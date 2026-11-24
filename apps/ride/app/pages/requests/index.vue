<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { RideRequestRow } from '~/utils/ride'

// Requests (table `ride_requests`, doc 07): every ride asked for, newest first, with the rider, pickup and drop-off,
// car, quoted fare, payment, how it was booked, the status and, once matched, the driver and plate. Filters: status,
// day, booked ahead. Open one for its offers and ride; cancel while no driver has it.
// GET /ops/w/{workspace}/ride/requests, POST …/{uuid}/cancel. Permission: ride.requests.read / write (doc 27).
useHead({ title: 'Requests' })

const api = useRideApi()
const toast = useToast()
const { can } = useMe()

const search = ref('')
const status = ref<string | undefined>(undefined)
const date = ref('')
const ahead = ref<string | undefined>(undefined)
const list = useApiList<RideRequestRow>({
    search,
    path: '/ride/requests',
    workspaceScoped: true,
    query: () => ({ status: status.value, date: date.value || undefined, scheduled: ahead.value }),
})
onMounted(() => list.load())
watch([status, date, ahead], () => list.load())

const reasonAction = useReasonAction()
function cancel(row: RideRequestRow) {
    reasonAction.ask({
        title: `Cancel ${row.rider_name ?? 'this'} ride`,
        submitLabel: 'Cancel ride',
        run: async (reason) => {
            await api.post(`/ride/requests/${row.uuid}/cancel`, { reason })
            toast.add({ title: 'Ride cancelled', color: 'success' })
            await list.load(list.pagination.value?.current_page ?? 1)
        },
    })
}

const columns: TableColumn<RideRequestRow>[] = [
    { accessorKey: 'created_at', header: 'Requested' },
    { id: 'rider', header: 'Rider', cell: ({ row }) => h('div', [h('div', { class: 'font-medium' }, row.original.rider_name ?? '—'), row.original.rider_phone ? h('div', { class: 'text-xs text-gray-500' }, row.original.rider_phone) : null]) },
    { id: 'route', header: 'Pickup → Drop-off', cell: ({ row }) => h('div', { class: 'max-w-72' }, [h('div', { class: 'truncate' }, row.original.pickup), h('div', { class: 'truncate text-xs text-gray-500' }, `→ ${row.original.dropoff}`)]) },
    { accessorKey: 'vehicle_class', header: 'Car', cell: ({ row }) => carLabel(row.original.vehicle_class) },
    { accessorKey: 'quoted_fare_sen', header: 'Fare', cell: ({ row }) => formatSen(row.original.final_fare_sen || row.original.quoted_fare_sen) },
    { accessorKey: 'payment_method', header: 'Payment', cell: ({ row }) => statusLabel(row.original.payment_method) },
    { id: 'pickup_at', header: 'Booked ahead for', cell: ({ row }) => (row.original.scheduled_for ? formatDateTime(row.original.scheduled_for) : '—') },
    { id: 'driver', header: 'Driver', cell: ({ row }) => (row.original.driver_name ? `${row.original.driver_name}${row.original.vehicle_plate ? ` · ${row.original.vehicle_plate}` : ''}` : '—') },
    { accessorKey: 'status', header: 'Status' },
    actionsColumn<RideRequestRow>((row) => [
        { label: 'View', icon: 'i-bx-eye', onSelect: () => navigateTo(`/requests/${row.uuid}`) },
        ...(can('ride.requests.write') && CANCELLABLE.includes(row.status) ? [{ label: 'Cancel', icon: 'i-bx-x-circle', color: 'error' as const, onSelect: () => cancel(row) }] : []),
    ]),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Requests"
        subject="ride requests"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        :can-export="false"
        @page="list.load"
    >
        <template #actions>
            <UInput v-model="date" type="date" class="w-40" />
            <USelect v-model="status" :items="[{ label: 'All statuses', value: undefined }, ...REQUEST_STATUSES]" class="w-36" />
            <USelect v-model="ahead" :items="[{ label: 'Now and ahead', value: undefined }, { label: 'Booked ahead', value: '1' }, { label: 'Ride now', value: '0' }]" class="w-36" />
        </template>
    </OpsListPage>
    <OpsReasonModal :action="reasonAction" />
</template>
