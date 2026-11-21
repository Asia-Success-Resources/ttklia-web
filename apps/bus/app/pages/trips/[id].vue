<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Trip: details, passengers and history (table `bus_trips`, `bus_trip_events`). Permission: bus.trips.read (doc 27).
// GET /api/ops/w/{workspace}/bus/trips/{uuid}; actions POST …/delay, …/boarding, …/departed and PATCH …/bus
// need bus.trips.write (v2 TripController: updateStatus, boarding). Times are shown in Malaysia time.
useHead({ title: 'Trip' })

interface Passenger { uuid: string; seat_no: string | null; kind: string; ticket_type: string; passenger_name: string | null; status: string }
interface TripEvent { event: string; source: string; data: Record<string, unknown> | null; occurred_at: string }
interface Trip {
    uuid: string
    trip_no: string | null
    company: string | null
    destination: string | null
    route_code: string | null
    departs_at: string | null
    estimated_departure_at: string | null
    departed_at: string | null
    delay_reason: string | null
    plate_no: string | null
    platform: string | null
    capacity: number | null
    sold_seats: number
    status: string
    remarks: string | null
    crew_names: string[] | null
    events: TripEvent[]
    passengers: Passenger[]
}

const route = useRoute()
const uuid = computed(() => String(route.params.id ?? ''))
const api = useApi()
const { slug } = useWorkspace()
const { can } = useMe()
const path = (p: string) => api.workspacePath(slug.value ?? '', p)

const trip = ref<Trip | null>(null)
const error = ref<string | null>(null)
const busy = ref(false)
const toast = useToast()
// Popups in the fleet-management style (useFormModal / OpsFormModal).
const { form: delay, fieldError: delayError, show: showDelay, submit: submitDelay } = useFormModal(() => ({ minutes: null as number | null, reason: '' }))
const { form: bus, fieldError: busError, show: showBus, submit: submitBus } = useFormModal(() => ({ plate_no: '' }))

const time = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kuala_Lumpur' }) : null
const closed = computed(() => ['departed', 'cleared', 'cancelled'].includes(trip.value?.status ?? ''))
const canWrite = computed(() => can('bus.trips.write'))

const fields = computed(() => [
    { label: 'Operator', value: trip.value?.company ?? null },
    { label: 'Destination', value: trip.value?.destination ?? null },
    { label: 'Route', value: trip.value?.route_code ?? null },
    { label: 'Trip no', value: trip.value?.trip_no ?? null },
    { label: 'Departure', value: time(trip.value?.departs_at ?? null) },
    { label: 'Estimated departure', value: time(trip.value?.estimated_departure_at ?? null) },
    { label: 'Delay reason', value: trip.value?.delay_reason ?? null },
    { label: 'Departed', value: time(trip.value?.departed_at ?? null) },
    { label: 'Bus', value: trip.value?.plate_no ?? null },
    { label: 'Platform', value: trip.value?.platform ?? null },
    { label: 'Drivers', value: trip.value?.crew_names?.filter(Boolean).join(', ') || null },
    { label: 'Seats sold', value: trip.value ? `${trip.value.sold_seats} / ${trip.value.capacity ?? '-'}` : null },
    { label: 'Status', value: trip.value?.status ?? null },
    { label: 'Remarks', value: trip.value?.remarks ?? null },
])

const passengerColumns: TableColumn<Passenger>[] = [
    { accessorKey: 'seat_no', header: 'Seat', cell: ({ row }) => row.original.seat_no ?? '-' },
    { accessorKey: 'passenger_name', header: 'Passenger', cell: ({ row }) => row.original.passenger_name ?? '-' },
    { accessorKey: 'ticket_type', header: 'Type' },
    { accessorKey: 'kind', header: 'Sale / collection' },
    { accessorKey: 'status', header: 'Status' },
]

function problemText(e: unknown, fallback: string): string {
    const problem = toProblem(e)
    return problem?.detail ?? problem?.title ?? fallback
}

async function load() {
    error.value = null
    try {
        const res = await api.get<{ data: Trip }>(path(`/bus/trips/${uuid.value}`))
        trip.value = res?.data ?? null
    } catch (e) {
        error.value = problemText(e, 'Unable to load the trip.')
    }
}
onMounted(load)

async function saveDelay() {
    if (await submitDelay((d) => api.post(path(`/bus/trips/${uuid.value}/delay`), { minutes: Number(d.minutes), reason: d.reason }))) {
        toast.add({ title: 'Delay saved', color: 'success' })
        await load()
    }
}
async function saveBus() {
    if (await submitBus((d) => api.patch(path(`/bus/trips/${uuid.value}/bus`), d))) {
        toast.add({ title: `Bus changed to ${bus.data.plate_no.toUpperCase()}`, color: 'success' })
        await load()
    }
}

async function act(method: 'post' | 'patch', action: string, body: Record<string, unknown> = {}) {
    busy.value = true
    error.value = null
    try {
        await api[method](path(`/bus/trips/${uuid.value}/${action}`), body)
        await load()
    } catch (e) {
        error.value = problemText(e, 'Unable to update the trip.')
    } finally {
        busy.value = false
    }
}
</script>

<template>
    <OpsDetailPage :title="trip ? `${trip.company ?? 'Trip'} · ${trip.destination ?? ''}` : 'Trip'" :fields="fields">
        <template #actions>
            <template v-if="canWrite && trip && !closed">
                <UButton label="Delay" icon="i-bx-clock" color="warning" variant="soft" @click="showDelay()" />
                <UButton label="Change bus" icon="i-bx-bus" color="neutral" variant="soft" @click="showBus()" />
                <UButton label="Start boarding" icon="i-bx-arrow-in-right-square-half" color="primary" variant="soft" :loading="busy" @click="act('post', 'boarding')" />
                <UButton label="Departed" icon="i-bx-check" color="success" variant="soft" :loading="busy" @click="act('post', 'departed')" />
            </template>
            <UAlert v-if="error" color="error" variant="soft" icon="i-bx-alert-circle" :title="error" class="w-full" />
        </template>
        <template #body>
            <div class="rounded-2xl border border-(--ops-border) bg-(--ops-card) p-5">
                <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Passengers</h4>
                <UTable :data="trip?.passengers ?? []" :columns="passengerColumns" empty="No passengers yet." />
            </div>
        </template>
        <template #aside>
            <div class="rounded-2xl border border-(--ops-border) bg-(--ops-card) p-5">
                <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">History</h4>
                <ol v-if="trip?.events.length" class="space-y-3">
                    <li v-for="(e, i) in trip.events" :key="i" class="text-sm">
                        <div class="font-medium text-gray-800 dark:text-white">{{ e.event.replaceAll('_', ' ') }}</div>
                        <div class="text-xs text-gray-500">{{ time(e.occurred_at) }} · {{ e.source }}<span v-if="e.data?.reason"> · {{ e.data.reason }}</span></div>
                    </li>
                </ol>
                <p v-else class="text-sm text-gray-500">Nothing recorded yet.</p>
            </div>
        </template>
    </OpsDetailPage>

    <OpsFormModal v-model:open="delay.open" title="Delay Departure" :saving="delay.saving" :error="delay.error" submit-label="Save Delay" @submit="saveDelay">
        <OpsFormField label="Minutes late" required :error="delayError('minutes')"><UInput v-model="delay.data.minutes" type="number" min="1" class="w-full" /></OpsFormField>
        <OpsFormField label="Reason" required :error="delayError('reason')"><UInput v-model="delay.data.reason" placeholder="Traffic on NSE" class="w-full" /></OpsFormField>
    </OpsFormModal>

    <OpsFormModal v-model:open="bus.open" title="Change Bus" :saving="bus.saving" :error="bus.error" submit-label="Save Bus" @submit="saveBus">
        <OpsFormField label="Plate number" required :error="busError('plate_no')"><UInput v-model="bus.data.plate_no" placeholder="WXY 1234" class="w-full" /></OpsFormField>
    </OpsFormModal>
</template>
