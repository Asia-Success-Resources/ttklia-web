<script setup lang="ts">
import type { PaymentMethod, SalePassenger } from '~/types/sale'

// "Tour Booking" tab, laid out like today's TourBookingForm.vue: tour, package, date or
// schedule and tickets on the left, Summary and payment on the right, passengers below.
// TODO(api): packages and schedules from GET /tour-schedules, price from POST /quotes,
// order from POST /orders and payment from POST /orders/{uuid}/pay (doc 04).
const emit = defineEmits<{ created: [] }>()

interface Tour { uuid: string; name: string; price_sen: number }
interface Schedule { uuid: string; date: string; time_text: string; available_seats: number | null }

const tours = useApiList<Tour>({ path: '/catalog-items', workspaceScoped: true, query: { type: 'tour' } })
onMounted(() => tours.load())
const schedules = ref<Schedule[]>([])

const tour = ref<Tour | undefined>()
const date = ref('')
const schedule = ref<Schedule | undefined>()
const tickets = reactive({ adult: 0, child: 0, senior: 0 })
const passengers = ref<Record<string, SalePassenger>>({})
const payment = ref<PaymentMethod | null>(null)
const paid = ref<number | null>(null)
const totalSen = ref(0)

const hasSchedules = computed(() => schedules.value.length > 0)
const paxSlots = computed(() => {
    const slots: { key: string; label: string }[] = []
    for (const [type, label] of [['adult', 'Adult'], ['child', 'Child'], ['senior', 'Senior']] as const) {
        for (let i = 1; i <= tickets[type]; i++) slots.push({ key: `${type}-${i}`, label: `${label} ${i}` })
    }
    return slots
})
const totalPax = computed(() => tickets.adult + tickets.child + tickets.senior)

async function createTourBooking() {
    // TODO(api): POST /orders with the tour line, then POST /orders/{uuid}/pay.
    emit('created')
}
</script>

<template>
    <div>
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div class="lg:col-span-7">
                <SalePanel title="Tour Booking Details">
                    <div class="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <UFormField label="Select Tour" class="lg:col-span-2">
                            <USelectMenu v-model="tour" :items="tours.rows.value" label-key="name" placeholder="Search Tour" size="lg" class="w-full" />
                        </UFormField>
                        <SaleDatePicker v-if="!hasSchedules" v-model="date" />
                        <UFormField v-else label="Time">
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

                    <h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Tickets</h3>
                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <SaleTicketCount v-model="tickets.adult" label="Adult" />
                        <SaleTicketCount v-model="tickets.child" label="Child" />
                        <SaleTicketCount v-model="tickets.senior" label="Senior" />
                    </div>
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
                            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Pax</dt>
                            <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ totalPax || '-' }}</dd>
                        </div>
                        <div class="flex justify-between border-t border-(--ops-border) pt-3">
                            <dt class="text-base font-medium text-gray-500 dark:text-gray-400">Total Price</dt>
                            <dd class="text-xl font-bold text-gray-900 dark:text-white">{{ formatSen(totalSen) }}</dd>
                        </div>
                    </dl>
                    <SalePaymentMethod v-model="payment" v-model:paid="paid" :total-sen="totalSen" />
                    <UButton block size="xl" label="Confirm Booking" :disabled="!tour || totalPax === 0 || !payment" @click="createTourBooking" />
                </SalePanel>
            </div>
        </div>

        <SalePassengers v-model="passengers" :slots="paxSlots" />
    </div>
</template>
