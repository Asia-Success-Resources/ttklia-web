<script setup lang="ts">
import type { PaymentMethod, SalePassenger } from '~/types/sale'
import type { ChargeLine } from './ChargeLines.vue'
import type { SaleSeat } from './SeatMap.vue'

// "Create Booking" tab, laid out exactly like ttklia-v2's BookingForm.vue: date and location, then
// Tickets, then Select Trip (departure hour, then trip cards) on the left (7/12); Summary and payment
// on the right (5/12); the seat map and Passenger Details full width below.
// As in v2 there is no separate customer field: passenger 1 is the order's contact.
// Trips: GET /bus/trips?date&zone_id&sellable=1; seats: GET /bus/trips/{uuid}/seats; ticket types: GET /bus/ticket-types.
// Confirm Seats holds them with POST /orders (5 minutes); Confirm Payment calls POST /orders/{uuid}/pay.
// The charge lines and total always come from the API's order, never worked out here.
const emit = defineEmits<{ created: [] }>()

interface Zone { id: number; name: string }
interface PassengerType { uuid: string; name: string }
interface Trip { uuid: string; company: string; departs_at: string; trip_no: string | null; capacity: number | null; available_seats: number | null }
type Seat = SaleSeat
interface SaleOrder { uuid: string; status: string; total_sen: number; charge_lines: ChargeLine[]; hold_expires_at: string | null; change_sen?: number | null }

const api = useApi()
const { slug } = useWorkspace()
const path = (p: string) => api.workspacePath(slug.value ?? '', p)

const zones = useApiAll<Zone>({ path: '/zones', workspaceScoped: true, query: { type: 'bus_destination' } })
const passengerTypes = ref<PassengerType[]>([])
onMounted(async () => {
    zones.load()
    try {
        const res = await api.get<{ data: PassengerType[] }>(path('/bus/ticket-types'))
        passengerTypes.value = res?.data ?? []
    } catch (e) {
        error.value = problemText(e, 'Unable to load ticket types.')
    }
})
const trips = ref<Trip[]>([])
const seats = ref<Seat[]>([])
const fetchingTrips = ref(false)
const fetchingSeats = ref(false)

const date = ref('')
const location = ref<Zone | undefined>()
const tickets = reactive<Record<string, number>>({})
const tripId = ref<string | null>(null)
const tripsExpanded = ref(true)
const selectedHour = ref<string | null>(null)
const selectedSeats = ref<string[]>([])
const passengers = ref<Record<string, SalePassenger>>({})
const order = ref<SaleOrder | null>(null)
const held = computed(() => order.value !== null)
const payment = ref<PaymentMethod | null>(null)
const paid = ref<number | null>(null)
const busy = ref(false)
const error = ref<string | null>(null)
const totalSen = computed(() => order.value?.total_sen ?? 0)
// Fare (the same on every channel) + Facility charge (APAD) per ticket (doc 23, TBS structure), from the order.
const chargeLines = computed<ChargeLine[]>(() => order.value?.charge_lines ?? [])
const totalTickets = computed(() => Object.values(tickets).reduce((a, b) => a + (b || 0), 0))

/** Departure hours in Malaysia time, as the counter reads them. */
const localHour = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', timeZone: 'Asia/Kuala_Lumpur' }) + ':00'
const localTime = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kuala_Lumpur' })
const hours = computed(() => {
    const counts = new Map<string, number>()
    for (const t of trips.value) counts.set(localHour(t.departs_at), (counts.get(localHour(t.departs_at)) ?? 0) + 1)
    return [...counts].map(([label, count]) => ({ label, count }))
})
const visibleTrips = computed(() => (selectedHour.value ? trips.value.filter((t) => localHour(t.departs_at) === selectedHour.value) : trips.value))
const selectedTrip = computed(() => trips.value.find((t) => t.uuid === tripId.value) ?? null)
const tooFewSeats = (trip: Trip) => totalTickets.value > 0 && trip.available_seats !== null && trip.available_seats < totalTickets.value
const seatSlots = computed(() => selectedSeats.value.map((s, i) => ({ key: s, label: `Passenger ${i + 1} - Seat ${s}`, short: `Seat ${s}` })))
const contact = computed(() => passengers.value[selectedSeats.value[0] ?? ''] ?? null)

function problemText(e: unknown, fallback: string): string {
    const problem = toProblem(e)
    return problem?.detail ?? problem?.title ?? fallback
}

// Trips for the chosen day and destination, in departure order.
watch([date, location], async () => {
    trips.value = []
    tripId.value = null
    selectedHour.value = null
    if (!date.value || !location.value) return
    fetchingTrips.value = true
    error.value = null
    try {
        const res = await api.get<{ data: Trip[] }>(path('/bus/trips'), { date: date.value, zone_id: location.value.id, sellable: 1, limit: 100 })
        trips.value = res?.data ?? []
    } catch (e) {
        error.value = problemText(e, 'Unable to load trips.')
    } finally {
        fetchingTrips.value = false
    }
})

async function loadSeats() {
    seats.value = []
    if (!tripId.value) return
    fetchingSeats.value = true
    try {
        const res = await api.get<{ data: Seat[] }>(path(`/bus/trips/${tripId.value}/seats`))
        seats.value = res?.data ?? []
    } catch (e) {
        error.value = problemText(e, 'Unable to load seats.')
    } finally {
        fetchingSeats.value = false
    }
}

function pickTrip(trip: Trip) {
    tripId.value = trip.uuid
    tripsExpanded.value = false
    selectedSeats.value = []
    loadSeats()
}

function pickHour(label: string) {
    selectedHour.value = label
    tripId.value = null
    seats.value = []
    selectedSeats.value = []
}

async function confirmSeats() {
    if (!tripId.value) return
    if (selectedSeats.value.length !== totalTickets.value) {
        error.value = 'Selected seats does not match total tickets.'
        return
    }
    if (!contact.value?.name || !contact.value?.phone) {
        error.value = 'Enter passenger 1\'s name and phone number.'
        return
    }
    busy.value = true
    error.value = null
    try {
        const res = await api.post<{ data: SaleOrder }>(path('/orders'), {
            type: 'booking',
            trip_uuid: tripId.value,
            tickets: { ...tickets },
            seats: selectedSeats.value,
            passengers: passengers.value,
            contact_name: contact.value.name,
            contact_phone: contact.value.phone,
            contact_email: contact.value.email || undefined,
        })
        order.value = res?.data ?? null
    } catch (e) {
        error.value = problemText(e, 'Unable to place booking.')
        await loadSeats()
    } finally {
        busy.value = false
    }
}

async function confirmPayment() {
    if (!order.value || !payment.value) return
    busy.value = true
    error.value = null
    try {
        await api.post(path(`/orders/${order.value.uuid}/pay`), {
            method: payment.value,
            paid_sen: payment.value === 'cash' ? Math.round((paid.value ?? 0) * 100) : undefined,
        })
        // TODO(api): print the receipt through the counter agent (doc 08) once it is wired.
        reset()
        emit('created')
    } catch (e) {
        error.value = problemText(e, 'Unable to take the payment.')
        if (toProblem(e)?.code === 'hold_expired') reset(false)
    } finally {
        busy.value = false
    }
}

function reset(clearAll = true) {
    order.value = null
    payment.value = null
    paid.value = null
    selectedSeats.value = []
    passengers.value = {}
    if (clearAll) {
        for (const key of Object.keys(tickets)) tickets[key] = 0
    }
    loadSeats()
}
</script>

<template>
    <div class="flex flex-col gap-6">
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div class="lg:col-span-7">
                <SalePanel title="Booking Details">
                    <div v-if="!held">
                        <div class="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <SaleDatePicker v-model="date" />
                            <UFormField label="Location">
                                <USelectMenu
                                    v-model="location"
                                    :items="zones.rows.value"
                                    label-key="name"
                                    placeholder="Search Location"
                                    size="lg"
                                    class="w-full"
                                />
                            </UFormField>
                        </div>

                        <!-- Tickets (before trips so the count is chosen first) -->
                        <div class="border-t border-(--ops-border) pt-6">
                            <h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Tickets</h3>
                            <div v-if="passengerTypes.length" class="grid grid-cols-2 gap-3">
                                <SaleTicketCount
                                    v-for="type in passengerTypes"
                                    :key="type.uuid"
                                    v-model="tickets[type.uuid]"
                                    :label="type.name"
                                />
                            </div>
                            <p v-else class="text-sm text-gray-500">No ticket types yet.</p>
                        </div>

                        <!-- Trips: by departure hour, collapsed once one is picked -->
                        <div class="mt-6 border-t border-(--ops-border) pt-6">
                            <div v-if="selectedTrip && !tripsExpanded" class="flex items-center justify-between rounded-lg border border-primary bg-primary/10 p-4">
                                <div class="flex items-center gap-3">
                                    <UIcon name="i-bx-bus" class="size-6 text-primary" />
                                    <div class="text-sm">
                                        <div class="font-semibold text-gray-800 dark:text-white">{{ localTime(selectedTrip.departs_at) }} — {{ selectedTrip.company }}</div>
                                        <div class="text-gray-500">
                                            <span v-if="selectedTrip.trip_no">Trip #{{ selectedTrip.trip_no }} · </span>
                                            <template v-if="selectedTrip.available_seats !== null">{{ selectedTrip.available_seats }} seats available</template>
                                        </div>
                                    </div>
                                </div>
                                <UButton label="Change" size="sm" variant="outline" @click="tripsExpanded = true" />
                            </div>

                            <div v-else>
                                <h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Select Trip</h3>

                                <UFormField v-if="hours.length" label="Departure Hour" class="mb-4">
                                    <div class="flex flex-wrap gap-2">
                                        <UButton
                                            v-for="h in hours"
                                            :key="h.label"
                                            :variant="selectedHour === h.label ? 'solid' : 'outline'"
                                            @click="pickHour(h.label)"
                                        >
                                            {{ h.label }}
                                            <UBadge :label="String(h.count)" size="sm" :color="selectedHour === h.label ? 'neutral' : 'primary'" variant="soft" class="rounded-full" />
                                        </UButton>
                                    </div>
                                </UFormField>

                                <div v-if="selectedHour && visibleTrips.length" class="space-y-3">
                                    <button
                                        v-for="trip in visibleTrips"
                                        :key="trip.uuid"
                                        type="button"
                                        :disabled="tooFewSeats(trip)"
                                        class="flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-40"
                                        :class="tripId === trip.uuid ? 'border-primary bg-primary/10' : 'border-(--ops-border) hover:bg-gray-50 dark:hover:bg-white/5'"
                                        @click="pickTrip(trip)"
                                    >
                                        <div class="flex items-center gap-3">
                                            <UIcon name="i-bx-bus" class="size-6 text-gray-500" />
                                            <div>
                                                <div class="font-semibold text-gray-800 dark:text-white">{{ trip.company }}</div>
                                                <div v-if="trip.trip_no" class="text-xs text-gray-500">Trip #{{ trip.trip_no }}</div>
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-3">
                                            <span class="font-semibold text-gray-800 dark:text-white">{{ localTime(trip.departs_at) }}</span>
                                            <UBadge
                                                v-if="trip.available_seats !== null"
                                                :label="`${trip.available_seats}/${trip.capacity ?? '-'}`"
                                                :color="trip.available_seats > 10 ? 'success' : trip.available_seats > 0 ? 'warning' : 'error'"
                                                variant="soft"
                                            />
                                        </div>
                                    </button>
                                </div>

                                <div v-if="trips.length === 0" class="rounded-lg border border-dashed border-(--ops-border) p-6 text-center text-sm text-gray-500">
                                    <p v-if="fetchingTrips">Loading...</p>
                                    <p v-else>No trips available</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <UAlert
                        v-else
                        color="warning"
                        variant="soft"
                        icon="i-bx-clock"
                        title="Booking has been created. Please make payment within 5 minutes."
                    />
                </SalePanel>
            </div>

            <div class="lg:col-span-5">
                <SalePanel title="Summary">
                    <dl class="mb-6 space-y-3">
                        <div class="flex justify-between">
                            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Destination</dt>
                            <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ location?.name ?? '-' }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Date</dt>
                            <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ date ? formatDate(date) : '-' }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Seats</dt>
                            <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ selectedSeats.length ? selectedSeats.join(', ') : '-' }}</dd>
                        </div>
                        <SaleChargeLines :lines="chargeLines" />
                        <div class="flex justify-between border-t border-(--ops-border) pt-3">
                            <dt class="text-base font-medium text-gray-500 dark:text-gray-400">Total Price</dt>
                            <dd class="text-xl font-bold text-gray-900 dark:text-white">{{ formatSen(totalSen) }}</dd>
                        </div>
                    </dl>

                    <UAlert v-if="error" class="mb-4" color="error" variant="soft" icon="i-bx-alert-circle" :title="error" />

                    <UButton
                        v-if="!held"
                        block
                        size="xl"
                        color="success"
                        label="Confirm Seats"
                        :loading="busy"
                        :disabled="!tripId || selectedSeats.length === 0"
                        @click="confirmSeats"
                    />
                    <template v-else>
                        <SalePaymentMethod v-model="payment" v-model:paid="paid" :total-sen="totalSen" />
                        <UButton block size="xl" label="Confirm Payment" :loading="busy" :disabled="!payment" @click="confirmPayment" />
                    </template>
                </SalePanel>
            </div>
        </div>

        <!-- Seat Selection: full width, viewport-constrained -->
        <div v-if="tripId && !held" class="rounded-xl border border-(--ops-border) bg-(--ops-card) p-6 shadow-sm">
            <SaleSeatMap v-model="selectedSeats" :seats="seats" :max="totalTickets" :loading="fetchingSeats" />
        </div>

        <!-- Passenger Details: one block per selected seat -->
        <SalePassengers v-if="!held" v-model="passengers" :slots="seatSlots" boxed />
    </div>
</template>
