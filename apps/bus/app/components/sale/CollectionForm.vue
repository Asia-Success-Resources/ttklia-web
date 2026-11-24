<script setup lang="ts">
import type { ChargeLine } from './ChargeLines.vue'
import type { SaleSeat } from './SeatMap.vue'

// "Ticket Collection" tab, following ttklia-v2's CollectionForm.vue (admin/bus/bookings/dashboard):
// - Date (today by default), Operator and Reference always show.
// - Override off (the default): Fetch Details looks the reference up and the Summary shows the trip,
//   seat and customer. No Location, no trips.
// - Override on (the toggle appears once date, operator and reference are filled in): Location appears and the operator's trips
//   that day load as soon as date, operator and location are set (grouped by operator); pick a trip, then
//   one seat on the plan, or with no trip picked type Trip No, Seat No and Time (v2 storeOverrideCollection).
// The collection is paid by card when it is confirmed (v2 saveCollection): POST /orders, type collection.
const emit = defineEmits<{ created: [] }>()

interface Zone { id: number; name: string }
interface Company { id: number; name?: string | null; operator_code: string; system_provider_id: number | null; label?: string }
interface Trip { uuid: string; company: string; departs_at: string; trip_no: string | null }
/** What Fetch Details returns for a reference (v2 BookingController@ticket). */
interface FetchedTicket {
    trip: { uuid: string; destination?: string | null } | null
    seat_no: string | null
    customer_name?: string | null
    contact_no?: string | null
    ticket_type?: string | null
}

const api = useApi()
const { slug } = useWorkspace()
const path = (p: string) => api.workspacePath(slug.value ?? '', p)

const zones = useApiAll<Zone>({ path: '/zones', workspaceScoped: true, query: { type: 'bus_destination' } })
const companies = useApiAll<Company>({ path: '/bus/companies', workspaceScoped: true, query: { status: 'active' } })
const chargeLines = ref<ChargeLine[]>([])
const totalSen = ref(0)
onMounted(async () => {
    zones.load()
    companies.load()
    try {
        const quote = await api.get<{ data: { charge_lines: ChargeLine[]; total_sen: number } }>(path('/bus/collection-quote'))
        chargeLines.value = quote?.data?.charge_lines ?? []
        totalSen.value = quote?.data?.total_sen ?? 0
    } catch (e) {
        error.value = problemText(e, 'Unable to load the collection charges.')
    }
})

const date = ref('')
const operator = ref<Company | undefined>()
const reference = ref('')
const location = ref<Zone | undefined>()
const override = ref(false)
const manualTripNo = ref('')
const manualSeatNo = ref('')
const manualTime = ref('')
const trips = ref<Trip[]>([])
const tripId = ref<string | null>(null)
const seats = ref<SaleSeat[]>([])
const selectedSeats = ref<string[]>([])
const fetched = ref<FetchedTicket | null>(null)
const fetchingTrips = ref(false)
const fetchingSeats = ref(false)
const fetchingDetails = ref(false)
const busy = ref(false)
const error = ref<string | null>(null)

/** Location, trips and seats are picked by hand. */
const manual = computed(() => override.value)
/** The Override toggle only appears once Date, Operator and Reference are all filled in. */
const detailsFilled = computed(() => !!date.value && !!operator.value && reference.value.trim().length > 0)
watch(detailsFilled, (filled) => {
    if (!filled) override.value = false
})

const operatorItems = computed<Company[]>(() => companies.rows.value.map((c) => ({ ...c, label: c.name ?? c.operator_code })))
const localTime = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kuala_Lumpur' })
const tripGroups = computed(() => {
    const groups = new Map<string, Trip[]>()
    for (const t of trips.value) groups.set(t.company, [...(groups.get(t.company) ?? []), t])
    return [...groups].map(([name, items]) => ({ name, items }))
})
const seatLabel = computed(() => fetched.value?.seat_no ?? (selectedSeats.value.join(', ') || manualSeatNo.value || '-'))
const destination = computed(() => fetched.value?.trip?.destination ?? location.value?.name ?? '-')

const canConfirm = computed(() => {
    if (!operator.value || !reference.value.trim()) return false
    if (override.value && !tripId.value) return !!manualSeatNo.value.trim() && !!manualTime.value && !!location.value
    if (manual.value) return !!tripId.value && selectedSeats.value.length === 1
    return !!fetched.value?.trip && !!fetched.value.seat_no
})

function problemText(e: unknown, fallback: string): string {
    const problem = toProblem(e)
    return problem?.detail ?? problem?.title ?? fallback
}

function clearPick() {
    tripId.value = null
    seats.value = []
    selectedSeats.value = []
    manualSeatNo.value = ''
    manualTripNo.value = ''
    manualTime.value = ''
    fetched.value = null
}

// v2 searchTrips: only when the trips are picked by hand, and only with date, operator and location set.
async function searchTrips() {
    trips.value = []
    clearPick()
    if (!manual.value || !operator.value || !location.value || !date.value) return
    fetchingTrips.value = true
    error.value = null
    try {
        const res = await api.get<{ data: Trip[] }>(path('/bus/trips'), {
            date: date.value, zone_id: location.value.id, company_id: operator.value.id, limit: 100,
        })
        trips.value = res?.data ?? []
    } catch (e) {
        error.value = problemText(e, 'Unable to load trips.')
    } finally {
        fetchingTrips.value = false
    }
}
// v2 toggleOverride clears what was picked either way, then (entering override) loads the trips.
watch([date, operator, location, override], searchTrips)

async function pickTrip(trip: Trip) {
    tripId.value = trip.uuid
    selectedSeats.value = []
    seats.value = []
    fetchingSeats.value = true
    try {
        const res = await api.get<{ data: SaleSeat[] }>(path(`/bus/trips/${trip.uuid}/seats`))
        seats.value = res?.data ?? []
    } catch (e) {
        error.value = problemText(e, 'Unable to load seats.')
    } finally {
        fetchingSeats.value = false
    }
}

// v2 fetchDetails: the operator's own system finds the ticket by reference.
// TODO(api): GET /bus/collection-ticket (doc 24, operator integrations) is not built yet.
async function fetchDetails() {
    if (!operator.value || !reference.value.trim()) return
    fetchingDetails.value = true
    error.value = null
    fetched.value = null
    try {
        const res = await api.get<{ data: FetchedTicket }>(path('/bus/collection-ticket'), {
            reference_no: reference.value.trim(), company_id: operator.value.id, date: date.value,
        })
        fetched.value = res?.data ?? null
    } catch (e) {
        const status = toProblem(e)?.status ?? (e as { statusCode?: number } | null)?.statusCode
        error.value = status === 404 || status === 405
            ? 'Looking up tickets on the operator\'s system is not available yet. Turn on Override to pick the trip and seat.'
            : problemText(e, 'Unable to fetch the ticket details.')
    } finally {
        fetchingDetails.value = false
    }
}

async function createCollection() {
    if (!canConfirm.value || !operator.value) return
    busy.value = true
    error.value = null
    const manualTrip = override.value && !tripId.value
    try {
        await api.post(path('/orders'), {
            type: 'collection',
            company_id: operator.value.id,
            reference: reference.value.trim(),
            seat_no: fetched.value?.seat_no ?? (manualTrip ? manualSeatNo.value.trim() : selectedSeats.value[0]),
            contact_name: fetched.value?.customer_name ?? undefined,
            ...(manualTrip
                ? { override: true, trip_no: manualTripNo.value || undefined, time: manualTime.value, date: date.value, zone_id: location.value?.id }
                : { trip_uuid: fetched.value?.trip?.uuid ?? tripId.value }),
        })
        // TODO(api): print the boarding pass through the counter agent (doc 08).
        reference.value = ''
        if (manual.value) await searchTrips()
        else clearPick()
        emit('created')
    } catch (e) {
        error.value = problemText(e, 'Unable to create collection.')
        const trip = trips.value.find((t) => t.uuid === tripId.value)
        if (trip) pickTrip(trip)
    } finally {
        busy.value = false
    }
}
</script>

<template>
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div class="lg:col-span-7">
            <SalePanel title="Collection Details">
                <div class="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <SaleDatePicker v-model="date" />
                    <UFormField label="Operator">
                        <USelectMenu v-model="operator" :items="operatorItems" placeholder="Search Operator" size="lg" class="w-full" />
                    </UFormField>
                    <UFormField label="Reference">
                        <UInput v-model="reference" placeholder="Reference" size="lg" class="w-full" />
                    </UFormField>
                    <UFormField v-show="manual" label="Location">
                        <USelectMenu v-model="location" :items="zones.rows.value" label-key="name" placeholder="Search Location" size="lg" class="w-full" />
                    </UFormField>
                </div>

                <div v-if="detailsFilled" class="mb-6">
                    <USwitch
                        v-model="override"
                        :label="override ? 'Override Mode Active' : 'Override (Manual Trip/Seat Selection)'"
                        :color="override ? 'warning' : 'primary'"
                        :ui="{ label: override ? 'font-semibold text-warning' : '' }"
                    />
                </div>

                <div v-if="manual" class="border-t border-(--ops-border) pt-6">
                    <h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Trips</h3>
                    <div v-if="trips.length" class="space-y-4">
                        <div v-for="bus in tripGroups" :key="bus.name" class="rounded-lg border border-(--ops-border) p-4">
                            <h4 class="mb-3 text-sm font-semibold text-gray-800 dark:text-white">{{ bus.name }}</h4>
                            <div class="flex flex-wrap gap-2">
                                <UButton
                                    v-for="trip in bus.items"
                                    :key="trip.uuid"
                                    :variant="tripId === trip.uuid ? 'solid' : 'outline'"
                                    @click="pickTrip(trip)"
                                >
                                    {{ localTime(trip.departs_at) }}<span v-if="trip.trip_no" class="opacity-70">(Trip No: {{ trip.trip_no }})</span>
                                </UButton>
                            </div>
                        </div>
                    </div>
                    <div v-else class="rounded-lg border border-dashed border-(--ops-border) p-6 text-center text-sm text-gray-500">
                        <p v-if="fetchingTrips">Loading...</p>
                        <p v-else>No trips available</p>
                    </div>

                    <div v-if="override && !tripId" class="mt-6 border-t border-(--ops-border) pt-6">
                        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <UFormField label="Trip No">
                                <UInput v-model="manualTripNo" placeholder="Enter trip number" size="lg" class="w-full" />
                            </UFormField>
                            <UFormField label="Seat No (1 Seat)">
                                <UInput v-model="manualSeatNo" placeholder="Enter seat number" size="lg" class="w-full" />
                            </UFormField>
                            <UFormField label="Time">
                                <UInput v-model="manualTime" type="time" size="lg" class="w-full" />
                            </UFormField>
                        </div>
                    </div>

                    <div v-if="tripId" class="mt-6 border-t border-(--ops-border) pt-6">
                        <SaleSeatMap v-model="selectedSeats" :seats="seats" :max="1" :loading="fetchingSeats" title="Seats" />
                    </div>
                </div>
                <div v-else class="mt-6 border-t border-(--ops-border) pt-6">
                    <!-- Sized like v2's button: px-6 py-2.5, text-sm. -->
                    <UButton
                        label="Fetch Details"
                        icon="i-bx-search"
                        size="lg"
                        class="ps-4 pr-6 py-2.5"
                        :loading="fetchingDetails"
                        :disabled="!reference.trim() || !operator"
                        @click="fetchDetails"
                    />
                </div>
            </SalePanel>
        </div>

        <div class="lg:col-span-5">
            <SalePanel title="Summary">
                <dl class="mb-6 space-y-3">
                    <div class="flex justify-between">
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Destination</dt>
                        <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ destination }}</dd>
                    </div>
                    <div class="flex justify-between">
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Date</dt>
                        <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ date ? formatDate(date) : '-' }}</dd>
                    </div>
                    <div class="flex justify-between">
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Seats</dt>
                        <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ seatLabel }}</dd>
                    </div>
                    <template v-if="fetched">
                        <div class="flex justify-between">
                            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Customer Name</dt>
                            <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ fetched.customer_name ?? '-' }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Contact No</dt>
                            <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ fetched.contact_no ?? '-' }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Ticket Type</dt>
                            <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ fetched.ticket_type ?? '-' }}</dd>
                        </div>
                    </template>
                    <SaleChargeLines :lines="chargeLines" />
                    <div class="flex justify-between border-t border-(--ops-border) pt-3">
                        <dt class="text-base font-medium text-gray-500 dark:text-gray-400">Total</dt>
                        <dd class="text-xl font-bold text-gray-900 dark:text-white">{{ formatSen(totalSen) }}</dd>
                    </div>
                </dl>

                <p v-if="manual && operator" class="mb-4 text-xs text-gray-500">
                    <template v-if="override">Override Mode: pick the trip and the seat on the ticket, or type them in if the trip is not listed.</template>
                    <template v-else>Please make sure reference and seat is selected correctly!</template>
                </p>

                <UAlert v-if="error" class="mb-4" color="error" variant="soft" icon="i-bx-alert-circle" :title="error" />

                <UButton
                    block
                    size="xl"
                    color="success"
                    label="Confirm Collection"
                    :loading="busy"
                    :disabled="!canConfirm"
                    @click="createCollection"
                />
            </SalePanel>
        </div>
    </div>
</template>
