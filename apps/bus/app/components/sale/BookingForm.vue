<script setup lang="ts">
import type { PaymentMethod, SalePassenger } from '~/types/sale'

// "Create Booking" tab, laid out like today's BookingForm.vue: details, tickets and trip on the
// left (7/12), Summary and payment on the right (5/12), seats and passengers below.
// TODO(api): trips from GET /bus/trips, seats from GET /bus/trips/{uuid}/seats, price from POST /quotes,
// hold from POST /orders and payment from POST /orders/{uuid}/pay (doc 04). Not wired until the client exists.
const emit = defineEmits<{ created: [] }>()

interface Zone { uuid: string; name: string }
interface PassengerType { uuid: string; name: string }
interface Trip { uuid: string; company: string; departs_at: string; trip_no: string | null; available_seats: number | null }
interface Seat { uuid: string; seat_no: string; deck: 'lower' | 'upper'; available: boolean }

const zones = useApiList<Zone>({ path: '/zones', workspaceScoped: true })
onMounted(() => zones.load())
// TODO(api): no endpoint for passenger ticket types (Adult, Child, Senior, …) in doc 04 yet.
const passengerTypes = ref<PassengerType[]>([])
const trips = ref<Trip[]>([])
const seats = ref<Seat[]>([])
const fetchingTrips = ref(false)

const date = ref('')
const location = ref<Zone | undefined>()
const reference = ref('')
const tickets = reactive<Record<string, number>>({})
const tripId = ref<string | null>(null)
const tripsExpanded = ref(true)
const selectedHour = ref<string | null>(null)
const selectedSeats = ref<string[]>([])
const passengers = ref<Record<string, SalePassenger>>({})
const held = ref(false)
const payment = ref<PaymentMethod | null>(null)
const paid = ref<number | null>(null)
const totalSen = ref(0)

const hours = computed(() => [...new Set(trips.value.map((t) => t.departs_at.slice(11, 13) + ':00'))])
const visibleTrips = computed(() =>
    selectedHour.value ? trips.value.filter((t) => t.departs_at.slice(11, 13) + ':00' === selectedHour.value) : trips.value,
)
const selectedTrip = computed(() => trips.value.find((t) => t.uuid === tripId.value) ?? null)
const lowerSeats = computed(() => seats.value.filter((s) => s.deck === 'lower'))
const upperSeats = computed(() => seats.value.filter((s) => s.deck === 'upper'))
const seatSlots = computed(() => selectedSeats.value.map((s) => ({ key: s, label: `Seat ${s}` })))

function pickTrip(trip: Trip) {
    tripId.value = trip.uuid
    tripsExpanded.value = false
    selectedSeats.value = []
}

function toggleSeat(seat: Seat) {
    if (!seat.available) return
    const i = selectedSeats.value.indexOf(seat.seat_no)
    if (i >= 0) selectedSeats.value.splice(i, 1)
    else selectedSeats.value.push(seat.seat_no)
}

async function confirmSeats() {
    // TODO(api): POST /orders to hold the seats with the operator.
}

async function confirmPayment() {
    // TODO(api): POST /orders/{uuid}/pay, then print the receipt through the counter agent.
    emit('created')
}
</script>

<template>
    <div>
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
                            <UFormField label="Reference">
                                <UInput v-model="reference" placeholder="Reference" size="lg" class="w-full" />
                            </UFormField>
                        </div>

                        <div class="mb-6">
                            <h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Tickets</h3>
                            <div v-if="passengerTypes.length" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <SaleTicketCount
                                    v-for="type in passengerTypes"
                                    :key="type.uuid"
                                    v-model="tickets[type.uuid]"
                                    :label="type.name"
                                />
                            </div>
                            <p v-else class="text-sm text-gray-500">No ticket types yet.</p>
                        </div>

                        <div v-if="selectedTrip && !tripsExpanded" class="flex items-center justify-between rounded-lg border border-primary bg-primary/10 p-4">
                            <div class="flex items-center gap-3">
                                <UIcon name="i-bx-bus" class="size-6 text-primary" />
                                <div class="text-sm">
                                    <div class="font-semibold text-gray-800 dark:text-white">{{ selectedTrip.company }}</div>
                                    <div class="text-gray-500">
                                        <span v-if="selectedTrip.trip_no">Trip #{{ selectedTrip.trip_no }} · </span>{{ selectedTrip.departs_at.slice(11, 16) }}
                                    </div>
                                </div>
                            </div>
                            <UButton label="Change" size="sm" variant="outline" @click="tripsExpanded = true" />
                        </div>

                        <div v-else>
                            <h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Select Trip</h3>
                            <div v-if="hours.length" class="mb-4">
                                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Departure Hour</label>
                                <div class="flex flex-wrap gap-2">
                                    <UButton
                                        v-for="h in hours"
                                        :key="h"
                                        :label="h"
                                        size="sm"
                                        :variant="selectedHour === h ? 'solid' : 'outline'"
                                        @click="selectedHour = h; tripId = null"
                                    />
                                </div>
                            </div>
                            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <button
                                    v-for="trip in visibleTrips"
                                    :key="trip.uuid"
                                    type="button"
                                    class="rounded-lg border p-3 text-left text-sm transition"
                                    :class="tripId === trip.uuid ? 'border-primary bg-primary/10' : 'border-(--ops-border) hover:bg-gray-50 dark:hover:bg-white/5'"
                                    @click="pickTrip(trip)"
                                >
                                    <div class="font-semibold text-gray-800 dark:text-white">{{ trip.departs_at.slice(11, 16) }} · {{ trip.company }}</div>
                                    <div class="text-xs text-gray-500">
                                        <span v-if="trip.trip_no">Trip #{{ trip.trip_no }}</span>
                                        <span v-if="trip.available_seats !== null"> · {{ trip.available_seats }} seats left</span>
                                    </div>
                                </button>
                            </div>
                            <div v-if="trips.length === 0" class="rounded-lg border border-dashed border-(--ops-border) p-6 text-center text-sm text-gray-500">
                                <p v-if="fetchingTrips">Loading...</p>
                                <p v-else>Choose a date and location to see trips.</p>
                            </div>
                        </div>
                    </div>
                    <UAlert
                        v-else
                        color="warning"
                        variant="soft"
                        icon="i-bx-time"
                        title="Booking has been created. Please make payment within 3 minutes."
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
                        <div class="flex justify-between border-t border-(--ops-border) pt-3">
                            <dt class="text-base font-medium text-gray-500 dark:text-gray-400">Total Price</dt>
                            <dd class="text-xl font-bold text-gray-900 dark:text-white">{{ formatSen(totalSen) }}</dd>
                        </div>
                    </dl>

                    <UButton
                        v-if="!held"
                        block
                        size="xl"
                        color="success"
                        label="Confirm Seats"
                        :disabled="!tripId || selectedSeats.length === 0"
                        @click="confirmSeats"
                    />
                    <template v-else>
                        <SalePaymentMethod v-model="payment" v-model:paid="paid" :total-sen="totalSen" />
                        <UButton block size="xl" label="Confirm Payment" :disabled="!payment" @click="confirmPayment" />
                    </template>
                </SalePanel>
            </div>
        </div>

        <div v-if="tripId" class="mt-6 rounded-xl border border-(--ops-border) bg-(--ops-card) p-6 shadow-sm">
            <h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Select Seats</h3>
            <div class="grid max-h-[50vh] gap-4 overflow-y-auto" :class="upperSeats.length ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'">
                <div v-for="deck in (upperSeats.length ? [{ name: 'Lower Deck', seats: lowerSeats }, { name: 'Upper Deck', seats: upperSeats }] : [{ name: '', seats: lowerSeats }])" :key="deck.name">
                    <h5 v-if="deck.name" class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">{{ deck.name }}</h5>
                    <div class="grid grid-cols-4 gap-2">
                        <button
                            v-for="seat in deck.seats"
                            :key="seat.uuid"
                            type="button"
                            :disabled="!seat.available"
                            class="rounded-md border p-2 text-center text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40"
                            :class="selectedSeats.includes(seat.seat_no) ? 'border-primary bg-primary text-white' : 'border-(--ops-border) hover:bg-gray-50 dark:hover:bg-white/5'"
                            @click="toggleSeat(seat)"
                        >
                            {{ seat.seat_no }}
                        </button>
                    </div>
                </div>
            </div>
            <p v-if="seats.length === 0" class="text-sm text-gray-500">No seat map for this trip yet.</p>
        </div>

        <SalePassengers v-model="passengers" :slots="seatSlots" />
    </div>
</template>
