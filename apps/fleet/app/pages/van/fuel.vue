<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Van fuel (doc 19, "Fuel limit"): each van trip's fuel card limit and toll, worked out from the distances with the
// fuel rate of the trip's day: litres on the flat each way plus the climb to Genting up and down, rounded up to the
// next RM10. Pick a day's trips to work them out. GET/POST /fleet/van-trip-costs, PATCH …/{id}. Permission:
// fleet.van_fuel.read / write (doc 27).
useHead({ title: 'Van fuel' })

interface Row extends Record<string, unknown> {
    van_trip_id: number
    trip_no: string
    service_date: string
    pickup_at: string
    route_code: string
    route_name: string
    driver_name: string | null
    start_to_pickup_km: string
    pickup_to_destination_km: string
    destination_to_dropoff_km: string
    dropoff_to_base_km: string
    fuel_litres: string
    fuel_cost_sen: number
    fuel_limit_sen: number
    toll_sen: number
    diesel_sen_per_litre: number | null
}
interface Trip { id: number; trip_no: string; route_name: string; pickup_at: string; driver_name: string | null; fuel_limit_sen: number | null }

const api = useFleetApi()
const toast = useToast()
const { can } = useMe()
const canWrite = computed(() => can('fleet.van_fuel.write'))

const search = ref('')
const date = ref(todayYmd())
const list = useApiList<Row>({ search, path: '/fleet/van-trip-costs', workspaceScoped: true, query: () => ({ date: date.value }) })
const trips = useApiAll<Trip>({ path: '/fleet/van-trips', workspaceScoped: true, query: () => ({ date: date.value }) })
onMounted(() => {
    list.load()
    trips.load()
})
watch(date, () => {
    list.load()
    trips.load()
})
const missing = computed(() => trips.rows.value.filter((t) => t.fuel_limit_sen === null))

const { form, fieldError, show, submit } = useFormModal(() => ({ van_trip_id: 0, label: '', start_to_pickup_km: '', pickup_to_destination_km: '', destination_to_dropoff_km: '', dropoff_to_base_km: '' }))
function open(trip: Trip | null, row?: Row) {
    if (row) {
        show({ van_trip_id: row.van_trip_id, label: `${row.trip_no} · ${row.route_name}`, start_to_pickup_km: row.start_to_pickup_km, pickup_to_destination_km: row.pickup_to_destination_km, destination_to_dropoff_km: row.destination_to_dropoff_km, dropoff_to_base_km: row.dropoff_to_base_km })
    } else if (trip) {
        show({ van_trip_id: trip.id, label: `${trip.trip_no} · ${trip.route_name}` })
    }
}
async function save() {
    const saved = await submit((d) => api.post('/fleet/van-trip-costs', {
        van_trip_id: d.van_trip_id, start_to_pickup_km: Number(d.start_to_pickup_km), pickup_to_destination_km: Number(d.pickup_to_destination_km),
        destination_to_dropoff_km: d.destination_to_dropoff_km === '' ? null : Number(d.destination_to_dropoff_km),
        dropoff_to_base_km: d.dropoff_to_base_km === '' ? null : Number(d.dropoff_to_base_km),
    }))
    if (saved) {
        toast.add({ title: 'Fuel limit worked out', color: 'success' })
        await Promise.all([list.load(), trips.load()])
    }
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'pickup_at', header: 'Pick up' },
    { accessorKey: 'trip_no', header: 'Trip' },
    { accessorKey: 'route_name', header: 'Route' },
    { accessorKey: 'driver_name', header: 'Driver' },
    { id: 'km', header: 'Km (base → pickup → destination)', cell: ({ row }) => `${row.original.start_to_pickup_km} + ${row.original.pickup_to_destination_km}` },
    { accessorKey: 'fuel_litres', header: 'Litres' },
    { accessorKey: 'fuel_cost_sen', header: 'Fuel cost', cell: ({ row }) => formatSen(row.original.fuel_cost_sen) },
    { accessorKey: 'fuel_limit_sen', header: 'Card limit', cell: ({ row }) => h('span', { class: 'font-semibold' }, formatSen(row.original.fuel_limit_sen)) },
    { accessorKey: 'toll_sen', header: 'Toll', cell: ({ row }) => formatSen(row.original.toll_sen) },
    actionsColumn<Row>((row) => (canWrite.value ? [{ label: 'Change distances', icon: 'i-bx-edit', onSelect: () => open(null, row) }] : [])),
]
</script>

<template>
    <div>
        <OpsListPage
            v-model:search="search"
            title="Van fuel"
            subject="fuel limits"
            :rows="list.rows.value"
            :columns="columns"
            :loading="list.pending.value"
            :pagination="list.pagination.value"
            :can-export="false"
            @page="list.load"
        >
            <template #actions>
                <UInput v-model="date" type="date" class="w-40" />
                <UButton label="Fuel rates" icon="i-bx-petrol-pump" color="neutral" variant="outline" to="/fuel-rates" />
            </template>
        </OpsListPage>

        <div v-if="canWrite && missing.length" class="mt-6 rounded-xl border border-(--ops-border) bg-(--ops-card) p-5">
            <h3 class="mb-3 text-base font-medium">Trips on {{ formatDate(date) }} without a fuel limit</h3>
            <div class="flex flex-wrap gap-2">
                <UButton v-for="t in missing" :key="t.id" :label="`${formatTime(t.pickup_at)} ${t.route_name}${t.driver_name ? ` · ${t.driver_name}` : ''}`" size="sm" color="neutral" variant="outline" @click="open(t)" />
            </div>
        </div>

        <OpsFormModal v-model:open="form.open" :title="`Fuel: ${form.data.label}`" :saving="form.saving" :error="form.error" submit-label="Work Out" @submit="save">
            <OpsFormField label="Driver's base → pickup (km)" required :error="fieldError('start_to_pickup_km')"><UInput v-model="form.data.start_to_pickup_km" type="number" min="0" step="0.1" class="w-full" /></OpsFormField>
            <OpsFormField label="Pickup → destination (km)" required :error="fieldError('pickup_to_destination_km')"><UInput v-model="form.data.pickup_to_destination_km" type="number" min="0" step="0.1" class="w-full" /></OpsFormField>
            <OpsFormField label="Destination → drop-off (km, empty: same)" :error="fieldError('destination_to_dropoff_km')"><UInput v-model="form.data.destination_to_dropoff_km" type="number" min="0" step="0.1" class="w-full" /></OpsFormField>
            <OpsFormField label="Drop-off → base (km, empty: same)" :error="fieldError('dropoff_to_base_km')"><UInput v-model="form.data.dropoff_to_base_km" type="number" min="0" step="0.1" class="w-full" /></OpsFormField>
            <p class="text-xs text-gray-500 sm:col-span-2">{{ fieldError('van_trip_id') }}</p>
        </OpsFormModal>
    </div>
</template>
