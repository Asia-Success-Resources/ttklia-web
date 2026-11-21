<script setup lang="ts">
import type { ChargeLine } from './ChargeLines.vue'

// "Ticket Collection" tab, laid out like today's CollectionForm.vue: date, operator, reference
// and location on the left with trips and seats (or the manual override), Summary on the right.
// Fetch Details lists the operator's trips that day to that destination; staff pick the trip and type the seat
// (v2 storeManualCollection). Override takes a trip that is not in the system (v2 storeOverrideCollection).
// The collection is paid by card when it is confirmed (v2 saveCollection): POST /orders, type collection.
// TODO(api): integrated operators look the reference up in their own system first (doc 24).
const emit = defineEmits<{ created: [] }>()

interface Zone { id: number; name: string }
interface Company { id: number; name?: string | null; operator_code: string; label?: string }
interface Trip { uuid: string; company: string; departs_at: string; trip_no: string | null; available_seats: number | null }

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
const passengerName = ref('')
const override = ref(false)
const manualTripNo = ref('')
const manualSeatNo = ref('')
const manualTime = ref('')
const trips = ref<Trip[]>([])
const tripId = ref<string | null>(null)
const fetching = ref(false)
const busy = ref(false)
const error = ref<string | null>(null)

const operatorItems = computed<Company[]>(() => companies.rows.value.map((c) => ({ ...c, label: c.name ?? c.operator_code })))
const localTime = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kuala_Lumpur' })
const selectedTrip = computed(() => trips.value.find((t) => t.uuid === tripId.value) ?? null)
const tripLabel = computed(() =>
    override.value ? manualTripNo.value || null : selectedTrip.value ? `${localTime(selectedTrip.value.departs_at)}${selectedTrip.value.trip_no ? ' · #' + selectedTrip.value.trip_no : ''}` : null,
)
const canConfirm = computed(() =>
    !!operator.value && reference.value.length > 0 && manualSeatNo.value.length > 0 &&
    (override.value ? !!manualTime.value && !!date.value && !!location.value : !!tripId.value),
)

function problemText(e: unknown, fallback: string): string {
    const problem = toProblem(e)
    return problem?.detail ?? problem?.title ?? fallback
}

async function fetchDetails() {
    if (!operator.value || !date.value || !location.value) {
        error.value = 'Choose the date, operator and location first.'
        return
    }
    fetching.value = true
    error.value = null
    tripId.value = null
    try {
        const res = await api.get<{ data: Trip[] }>(path('/bus/trips'), {
            date: date.value, zone_id: location.value.id, company_id: operator.value.id, limit: 100,
        })
        trips.value = res?.data ?? []
        if (!trips.value.length) error.value = 'No trips for this operator on that day. Use Override to enter the trip.'
    } catch (e) {
        error.value = problemText(e, 'Unable to load trips.')
    } finally {
        fetching.value = false
    }
}

async function createCollection() {
    if (!canConfirm.value || !operator.value) return
    busy.value = true
    error.value = null
    try {
        await api.post(path('/orders'), {
            type: 'collection',
            company_id: operator.value.id,
            reference: reference.value,
            seat_no: manualSeatNo.value,
            contact_name: passengerName.value || undefined,
            ...(override.value
                ? { override: true, trip_no: manualTripNo.value || undefined, time: manualTime.value, date: date.value, zone_id: location.value?.id }
                : { trip_uuid: tripId.value }),
        })
        // TODO(api): print the boarding pass through the counter agent (doc 08).
        reference.value = ''
        manualSeatNo.value = ''
        manualTripNo.value = ''
        passengerName.value = ''
        tripId.value = null
        emit('created')
    } catch (e) {
        error.value = problemText(e, 'Unable to create collection.')
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
                    <UFormField label="Location">
                        <USelectMenu v-model="location" :items="zones.rows.value" label-key="name" placeholder="Search Location" size="lg" class="w-full" />
                    </UFormField>
                </div>

                <div v-if="operator" class="mb-6">
                    <UCheckbox v-model="override" label="Override (Manual Trip/Seat Selection)" />
                </div>

                <div v-if="override" class="grid grid-cols-1 gap-4 lg:grid-cols-2">
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

                <div v-if="!override && trips.length" class="mt-6">
                    <h3 class="mb-3 text-sm font-semibold text-gray-800 dark:text-white">Trip</h3>
                    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <button
                            v-for="trip in trips"
                            :key="trip.uuid"
                            type="button"
                            class="rounded-lg border p-3 text-left text-sm transition"
                            :class="tripId === trip.uuid ? 'border-primary bg-primary/10' : 'border-(--ops-border) hover:bg-gray-50 dark:hover:bg-white/5'"
                            @click="tripId = trip.uuid"
                        >
                            <div class="font-semibold text-gray-800 dark:text-white">{{ localTime(trip.departs_at) }}</div>
                            <div class="text-xs text-gray-500"><span v-if="trip.trip_no">Trip #{{ trip.trip_no }}</span></div>
                        </button>
                    </div>
                </div>
                <div v-if="override || tripId" class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <UFormField v-if="!override" label="Seat No (1 Seat)">
                        <UInput v-model="manualSeatNo" placeholder="Seat on the ticket" size="lg" class="w-full" />
                    </UFormField>
                    <UFormField label="Passenger Name">
                        <UInput v-model="passengerName" placeholder="Optional" size="lg" class="w-full" />
                    </UFormField>
                </div>
                <UAlert v-if="error" class="mt-4" color="error" variant="soft" icon="i-bx-alert-circle" :title="error" />

                <UButton
                    v-if="!override"
                    class="mt-6"
                    label="Fetch Details"
                    icon="i-bx-search"
                    :loading="fetching"
                    :disabled="!operator || !date || !location"
                    @click="fetchDetails"
                />
            </SalePanel>
        </div>

        <div class="lg:col-span-5">
            <SalePanel title="Summary">
                <dl class="mb-6 space-y-3">
                    <div class="flex justify-between">
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Operator</dt>
                        <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ operator ? (operator.name ?? operator.operator_code) : '-' }}</dd>
                    </div>
                    <div class="flex justify-between">
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Reference</dt>
                        <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ reference || '-' }}</dd>
                    </div>
                    <div class="flex justify-between">
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Passenger</dt>
                        <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ passengerName || '-' }}</dd>
                    </div>
                    <div class="flex justify-between">
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Trip</dt>
                        <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ tripLabel ?? '-' }}</dd>
                    </div>
                    <div class="flex justify-between">
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Seat</dt>
                        <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ manualSeatNo || '-' }}</dd>
                    </div>
                    <SaleChargeLines :lines="chargeLines" />
                    <div class="flex justify-between border-t border-(--ops-border) pt-3">
                        <dt class="text-base font-medium text-gray-500 dark:text-gray-400">Total</dt>
                        <dd class="text-xl font-bold text-gray-900 dark:text-white">{{ formatSen(totalSen) }}</dd>
                    </div>
                </dl>
                <p v-if="override" class="mb-4 text-xs text-gray-500">
                    Override Mode: for a trip that is not in the system. Enter the trip time and the seat on the ticket.
                </p>
                <UButton
                    block
                    size="xl"
                    color="success"
                    label="Confirm Collection (Card)"
                    :loading="busy"
                    :disabled="!canConfirm"
                    @click="createCollection"
                />
            </SalePanel>
        </div>
    </div>
</template>
