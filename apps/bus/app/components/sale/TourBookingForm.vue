<script setup lang="ts">
import type { PaymentMethod, SalePassenger } from '~/types/sale'

// "Tour Booking" tab, laid out like today's TourBookingForm.vue: tour, package, date or
// schedule and tickets on the left, Summary and payment on the right, passengers below.
// Tours are catalog items of type tour; POST /orders type tour, then POST /orders/{uuid}/pay.
// The first passenger is the contact. TODO(api): tour schedules (no table yet, doc 18) and child/senior prices.
const emit = defineEmits<{ created: [] }>()

interface Tour { id: number; name: string; price_sen: number; is_active: boolean }
interface Schedule { uuid: string; date: string; time_text: string; available_seats: number | null }

const tours = useApiAll<Tour>({ path: '/catalog-items', workspaceScoped: true, query: { type: 'tour', is_active: 1 } })
onMounted(() => tours.load())
const schedules = ref<Schedule[]>([])

const tour = ref<Tour | undefined>()
const date = ref('')
const schedule = ref<Schedule | undefined>()
const tickets = reactive({ adult: 0, child: 0, senior: 0 })
const passengers = ref<Record<string, SalePassenger>>({})
const payment = ref<PaymentMethod | null>(null)
const paid = ref<number | null>(null)
const busy = ref(false)
const error = ref<string | null>(null)

const hasSchedules = computed(() => schedules.value.length > 0)
const paxSlots = computed(() => {
    const slots: { key: string; label: string; short?: string }[] = []
    for (const [type, label] of [['adult', 'Adult'], ['child', 'Child'], ['senior', 'Senior']] as const) {
        for (let i = 1; i <= tickets[type]; i++) slots.push({ key: `${type}-${i}`, label: `Passenger ${slots.length + 1} - ${label}`, short: `Passenger 1` })
    }
    return slots
})
const totalPax = computed(() => tickets.adult + tickets.child + tickets.senior)
// Shown before the order exists; the order's own total (from the API) is what gets charged.
const totalSen = computed(() => (tour.value?.price_sen ?? 0) * totalPax.value)
const contact = computed(() => passengers.value[paxSlots.value[0]?.key ?? ''] ?? null)

const api = useApi()
const { slug } = useWorkspace()
const path = (p: string) => api.workspacePath(slug.value ?? '', p)

async function createTourBooking() {
    if (!tour.value || !totalPax.value || !payment.value) return
    if (!contact.value?.name || !contact.value?.phone) {
        error.value = 'Enter the first passenger\'s name and phone.'
        return
    }
    busy.value = true
    error.value = null
    try {
        const created = await api.post<{ data: { uuid: string; total_sen: number } }>(path('/orders'), {
            type: 'tour',
            catalog_item_id: tour.value.id,
            tickets: { ...tickets },
            contact_name: contact.value.name,
            contact_phone: contact.value.phone,
            contact_email: contact.value.email || undefined,
        })
        const order = created?.data
        if (!order) throw new Error('No order returned')
        await api.post(path(`/orders/${order.uuid}/pay`), {
            method: payment.value,
            paid_sen: payment.value === 'cash' ? Math.round((paid.value ?? 0) * 100) : undefined,
        })
        // TODO(api): print the receipt through the counter agent (doc 08).
        tickets.adult = tickets.child = tickets.senior = 0
        passengers.value = {}
        payment.value = null
        paid.value = null
        emit('created')
    } catch (e) {
        const problem = toProblem(e)
        error.value = problem?.detail ?? problem?.title ?? 'Unable to create the tour booking.'
    } finally {
        busy.value = false
    }
}
</script>

<template>
    <div>
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div class="lg:col-span-7">
                <SalePanel title="Tour Booking Details">
                    <div class="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <UFormField label="Select Tour" class="lg:col-span-2" required>
                            <USelectMenu v-model="tour" :items="tours.rows.value" label-key="name" placeholder="Search Tour" size="lg" class="w-full" />
                        </UFormField>
                        <SaleDatePicker v-if="!hasSchedules" v-model="date" />
                        <UFormField v-else label="Time" required>
                            <USelectMenu
                                v-model="schedule"
                                :items="schedules"
                                label-key="time_text"
                                placeholder="Select time"
                                size="lg"
                                class="w-full"
                            />
                        </UFormField>
                    </div>

                    <div v-show="tour" class="mt-6 border-t border-(--ops-border) pt-6">
                        <h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Tickets</h3>
                        <div class="mb-4 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <div>Adult Ticket Price: {{ formatSen(tour?.price_sen ?? 0) }}</div>
                            <div>Child Ticket Price: {{ formatSen(tour?.price_sen ?? 0) }}</div>
                            <div>Senior Ticket Price: {{ formatSen(tour?.price_sen ?? 0) }}</div>
                        </div>
                        <div class="flex gap-3">
                            <SaleTicketCount v-model="tickets.adult" label="Adult" />
                            <SaleTicketCount v-model="tickets.child" label="Child" />
                            <SaleTicketCount v-model="tickets.senior" label="Senior" />
                        </div>
                    </div>

                    <!-- Passenger Details: one block per pax, as in the bus booking form -->
                    <SalePassengers v-if="tour" v-model="passengers" :slots="paxSlots" />
                </SalePanel>
            </div>

            <div class="lg:col-span-5">
                <SalePanel title="Summary">
                    <dl class="mb-6 space-y-3">
                        <div class="flex justify-between">
                            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Tour</dt>
                            <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ tour?.name ?? '-' }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Date</dt>
                            <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ formatDate(schedule?.date ?? date) }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Adult Pax</dt>
                            <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ tickets.adult }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Child Pax</dt>
                            <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ tickets.child }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Senior Pax</dt>
                            <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ tickets.senior }}</dd>
                        </div>
                        <div class="flex justify-between border-t border-(--ops-border) pt-3">
                            <dt class="text-base font-medium text-gray-500 dark:text-gray-400">Total Price</dt>
                            <dd class="text-xl font-bold text-gray-900 dark:text-white">{{ formatSen(totalSen) }}</dd>
                        </div>
                    </dl>
                    <UAlert v-if="error" class="mb-4" color="error" variant="soft" icon="i-bx-alert-circle" :title="error" />
                    <SalePaymentMethod v-model="payment" v-model:paid="paid" :total-sen="totalSen" />
                    <UButton block size="xl" label="Confirm Payment" :loading="busy" :disabled="!tour || totalPax === 0 || !payment" @click="createTourBooking" />
                </SalePanel>
            </div>
        </div>
    </div>
</template>
