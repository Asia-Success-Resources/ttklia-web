<script setup lang="ts">
import type { PrintedTicket } from '~/composables/useBoardingPassPrint'

// Booking page, laid out as ttklia-v2's admin/bus/bookings/{id} (bookings/show.blade.php), in v3's own styling:
// 1. four stat cards: Destination, Departure, Total Price, Status;
// 2. Booking Details (code, reference, date, departure, ticket types, seats, operator, platform, trip no);
// 3. Customer Information, Passenger Details (per seat), Financial Details (charges, payment, card details);
// 4. Sold By / Sold At / Channel; right column: the boarding passes and "Print Boarding Pass" (paid bookings).
// GET /api/ops/w/{workspace}/orders/{uuid}; printing POSTs …/orders/{uuid}/reprint, which logs the reprint.
// Permission: bus.bookings.read (or bus.orders.read / bus.sales.read). Phone, e-mail and ID numbers need
// bus.customers.pii.read.
// TODO: v2's phone update, cancel and refund decision buttons come with their API.
useHead({ title: 'Booking' })

interface Ticket {
    uuid: string
    seat_no: string | null
    ticket_type: string
    kind: string
    status: string
    destination: string | null
    departs_at: string | null
    trip_no: string | null
}
interface Booking {
    uuid: string
    code: string
    reference: string | null
    status: string
    channel: string
    kind: string
    title: string | null
    zone: string | null
    platform: string | null
    company_name: string | null
    travel_date: string | null
    total_pax: number | null
    total_sen: number
    is_collection: boolean
    contact_name: string | null
    contact_phone_e164: string | null
    contact_email: string | null
    sold_by: string | null
    kiosk: string | null
    created_at: string
    charge_lines: { label: string; detail: string | null; amount_sen: number }[]
    tickets: Ticket[]
    passengers: { seat_no: string | null; ticket_type: string; name: string | null; id_no: string | null }[]
    payment: {
        method: string
        status: string
        card: Partial<Record<'card_no' | 'card_scheme' | 'approval_code' | 'rrn' | 'trace_no' | 'batch_no' | 'status', string>> & { amount_sen?: number } | null
    } | null
    bus_tickets: PrintedTicket[]
}

const route = useRoute()
const uuid = String(route.params.uuid ?? '')
const api = useApi()
const { slug } = useWorkspace()
const { resolveTo } = useOpsShell()
const printer = useBoardingPassPrint()

const booking = ref<Booking | null>(null)
const error = ref<string | null>(null)
const loading = ref(true)
async function load() {
    loading.value = true
    error.value = null
    try {
        const res = await api.get<{ data: Booking }>(api.workspacePath(slug.value ?? '', `/orders/${uuid}`))
        booking.value = res?.data ?? null
        if (booking.value) useHead({ title: `Booking #${booking.value.code}` })
    } catch (e) {
        const problem = toProblem(e)
        error.value = problem?.detail ?? problem?.title ?? 'Unable to load the booking.'
    } finally {
        loading.value = false
    }
}
onMounted(load)

const b = computed(() => booking.value)
const departs = computed(() => b.value?.tickets[0]?.departs_at ?? b.value?.travel_date ?? null)
const printable = computed(() => !!b.value && ['paid', 'partially_refunded'].includes(b.value.status) && b.value.bus_tickets.length > 0)
const typeSummary = computed(() => {
    const counts: Record<string, number> = {}
    for (const t of b.value?.tickets ?? []) {
        const label = t.ticket_type.charAt(0).toUpperCase() + t.ticket_type.slice(1)
        counts[label] = (counts[label] ?? 0) + 1
    }
    return Object.entries(counts).map(([label, n]) => (n > 1 ? `${n} × ${label}` : label)).join(', ') || '-'
})
const channelLabels: Record<string, string> = { counter: 'Counter', kiosk: 'Kiosk', web: 'Website', app: 'App', operator_api: 'Operator', ota_api: 'Online agent' }
const methodLabels: Record<string, string> = {
    cash: 'Cash', card: 'Card', card_present: 'Card (terminal)', duitnow_qr: 'DuitNow QR', duitnow_qr_present: 'DuitNow QR (terminal)',
    ewallet: 'E-Wallet', wallet: 'Wallet', fpx: 'FPX',
}

const stats = computed(() => [
    { label: 'Destination', icon: 'i-bx-map', value: b.value?.zone ?? b.value?.title ?? '-', tone: 'bg-info/10 text-info' },
    { label: 'Departure', icon: 'i-bx-time', value: klTime(departs.value, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }), tone: 'bg-primary/10 text-primary' },
    { label: 'Total Price', icon: 'i-bx-dollar-circle', value: b.value ? formatSen(b.value.total_sen) : '-', tone: 'bg-success/10 text-success' },
    {
        label: 'Status',
        icon: b.value && ['cancelled', 'refunded', 'expired'].includes(b.value.status) ? 'i-bx-x-circle' : 'i-bx-check-circle',
        value: b.value ? (orderStatusLabels[b.value.status] ?? b.value.status) : '-',
        tone: b.value && ['cancelled', 'refunded', 'expired'].includes(b.value.status) ? 'bg-error/10 text-error' : 'bg-success/10 text-success',
    },
])

const details = computed<[string, string][]>(() => {
    const x = b.value
    if (!x) return []
    const t = x.tickets[0]
    return [
        ['Code', x.code],
        ['Reference', x.reference ?? '-'],
        ['Date', klTime(departs.value, { day: '2-digit', month: '2-digit', year: 'numeric' })],
        ['Departure Time', klTime(departs.value, { hour: '2-digit', minute: '2-digit' })],
        ['Ticket Type', typeSummary.value],
        ['Seat No', x.tickets.map((s) => s.seat_no).filter(Boolean).join(', ') || '-'],
        ['Operator', x.company_name ?? '-'],
        ['Platform', x.platform ?? '-'],
        ['Trip No', t?.trip_no ?? '-'],
        ['Collection', x.is_collection ? 'Yes' : 'No'],
    ]
})
const customer = computed<[string, string][]>(() => {
    const x = b.value
    if (!x) return []
    return ([
        ['Customer Name', x.contact_name],
        ['Customer Phone', x.contact_phone_e164],
        ['Customer Email', x.contact_email],
    ] as [string, string | null][]).filter((r): r is [string, string] => !!r[1])
})
const cardRows = computed<[string, string][]>(() => {
    const c = b.value?.payment?.card
    if (!c) return []
    return ([
        ['Card', c.card_scheme],
        ['Card Number', c.card_no],
        ['Approval Code', c.approval_code],
        ['RRN', c.rrn],
        ['Trace Number', c.trace_no],
        ['Batch Number', c.batch_no],
        ['Terminal Status', c.status],
        ['Transaction Amount', c.amount_sen !== undefined ? formatSen(c.amount_sen) : null],
    ] as [string, string | null | undefined][]).filter((r): r is [string, string] => !!r[1])
})

const card = 'rounded-2xl border border-(--ops-border) bg-(--ops-card)'
const dt = 'text-sm font-medium text-gray-500 dark:text-gray-400'
const dd = 'mt-1 text-base font-semibold text-gray-800 dark:text-white/90'
const h3 = 'mb-4 border-b border-(--ops-border) pb-2 text-lg font-semibold text-gray-800 dark:text-white/90'
</script>

<template>
    <div>
        <OpsBreadcrumb :title="b ? `Booking #${b.code}` : 'Booking'" :parent="{ label: 'Bookings', to: resolveTo('/bookings') }" />
        <UAlert v-if="error" class="mb-6" color="error" variant="soft" icon="i-bx-alert-circle" :title="error" />
        <div v-if="loading" class="flex justify-center py-20">
            <UIcon name="i-bx-loader-lines" class="size-8 animate-spin text-gray-400" />
        </div>

        <template v-else-if="b">
            <!-- Stat cards -->
            <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div v-for="s in stats" :key="s.label" :class="card" class="p-5">
                    <div class="flex items-center gap-3">
                        <div class="flex size-11 shrink-0 items-center justify-center rounded-xl" :class="s.tone">
                            <UIcon :name="s.icon" class="size-6" />
                        </div>
                        <div class="min-w-0">
                            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ s.label }}</p>
                            <p class="mt-0.5 truncate text-lg font-bold text-gray-800 dark:text-white/90">{{ s.value }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div class="space-y-6 lg:col-span-7 xl:col-span-8">
                    <!-- Booking Details -->
                    <div :class="card" class="p-6">
                        <h3 :class="h3">Booking Details</h3>
                        <dl class="grid grid-cols-1 gap-y-4 sm:grid-cols-2">
                            <div v-for="[label, value] in details" :key="label">
                                <dt :class="dt">{{ label }}</dt>
                                <dd :class="dd">{{ value }}</dd>
                            </div>
                        </dl>
                    </div>

                    <!-- Customer Information -->
                    <div :class="card" class="p-6">
                        <h3 :class="h3">Customer Information</h3>
                        <dl v-if="customer.length" class="grid grid-cols-1 gap-y-4 sm:grid-cols-2">
                            <div v-for="[label, value] in customer" :key="label">
                                <dt :class="dt">{{ label }}</dt>
                                <dd :class="dd">{{ value }}</dd>
                            </div>
                        </dl>
                        <p v-else class="text-sm text-gray-500">No customer details were taken for this booking.</p>
                    </div>

                    <!-- Passenger Details -->
                    <div v-if="b.passengers.length" :class="card" class="p-6">
                        <h3 :class="h3">Passenger Details</h3>
                        <div class="space-y-4">
                            <div v-for="(p, i) in b.passengers" :key="i" class="rounded-xl border border-(--ops-border) p-4">
                                <div class="mb-3 flex items-center gap-2">
                                    <span class="inline-flex size-7 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">{{ i + 1 }}</span>
                                    <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">Passenger {{ i + 1 }} - Seat {{ p.seat_no ?? '-' }} ({{ p.ticket_type }})</span>
                                </div>
                                <dl class="grid grid-cols-1 gap-y-3 sm:grid-cols-2">
                                    <div v-if="p.name">
                                        <dt :class="dt">Name</dt>
                                        <dd class="mt-0.5 text-sm font-semibold text-gray-800 dark:text-white/90">{{ p.name }}</dd>
                                    </div>
                                    <div v-if="p.id_no">
                                        <dt :class="dt">ID / Passport</dt>
                                        <dd class="mt-0.5 text-sm font-semibold text-gray-800 dark:text-white/90">{{ p.id_no }}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </div>

                    <!-- Financial Details -->
                    <div :class="card" class="p-6">
                        <h3 :class="h3">Financial Details</h3>
                        <dl class="grid grid-cols-1 gap-y-4 sm:grid-cols-2">
                            <div v-for="line in b.charge_lines" :key="line.label">
                                <dt :class="dt">{{ line.label }}<span v-if="line.detail" class="font-normal"> ({{ line.detail }})</span></dt>
                                <dd :class="dd">{{ formatSen(line.amount_sen) }}</dd>
                            </div>
                            <div>
                                <dt :class="dt">Total Price</dt>
                                <dd class="mt-1 text-base font-semibold text-success">{{ formatSen(b.total_sen) }}</dd>
                            </div>
                            <div>
                                <dt :class="dt">Payment Status</dt>
                                <dd :class="dd">
                                    <UBadge :label="orderStatusLabels[b.status] ?? b.status" :color="orderStatusColor(b.status)" variant="soft" />
                                </dd>
                            </div>
                            <div v-if="b.payment">
                                <dt :class="dt">Payment Method</dt>
                                <dd :class="dd">{{ methodLabels[b.payment.method] ?? b.payment.method }}</dd>
                            </div>
                        </dl>

                        <div v-if="cardRows.length" class="mt-5 border-t border-(--ops-border) pt-5">
                            <h4 class="mb-3 text-sm font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">Transaction Details</h4>
                            <dl class="grid grid-cols-1 gap-y-3 sm:grid-cols-2">
                                <div v-for="[label, value] in cardRows" :key="label">
                                    <dt :class="dt">{{ label }}</dt>
                                    <dd class="mt-1 font-mono text-base font-semibold text-gray-800 dark:text-white/90">{{ value }}</dd>
                                </div>
                            </dl>
                        </div>

                        <div class="mt-6 space-y-2 rounded-xl bg-gray-50 p-4 dark:bg-white/[0.02]">
                            <div class="flex items-center justify-between text-sm">
                                <span class="font-medium text-gray-600 dark:text-gray-300">Sold By</span>
                                <span class="font-semibold text-gray-800 dark:text-white/90">{{ b.sold_by ?? b.kiosk ?? '-' }}</span>
                            </div>
                            <div class="flex items-center justify-between text-sm">
                                <span class="font-medium text-gray-600 dark:text-gray-300">Channel</span>
                                <span class="font-semibold text-gray-800 dark:text-white/90">{{ channelLabels[b.channel] ?? b.channel }}<template v-if="b.kiosk"> ({{ b.kiosk }})</template></span>
                            </div>
                            <div class="flex items-center justify-between text-sm">
                                <span class="font-medium text-gray-600 dark:text-gray-300">Sold At</span>
                                <span class="font-semibold text-gray-800 dark:text-white/90">{{ formatDateTime(b.created_at) }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-wrap gap-3">
                        <UButton label="Back to Bookings" icon="i-bx-arrow-back" color="neutral" variant="outline" :to="resolveTo('/bookings')" />
                    </div>
                </div>

                <!-- Boarding passes -->
                <div v-if="printable" class="lg:col-span-5 xl:col-span-4">
                    <div :class="card" class="sticky top-24 p-6">
                        <div class="mb-4 flex items-center justify-between gap-3 border-b border-(--ops-border) pb-4">
                            <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Boarding Pass</h3>
                            <UButton
                                label="Print Boarding Pass"
                                icon="i-bx-printer"
                                :loading="printer.printing.value === b.uuid"
                                @click="printer.print(b.uuid)"
                            />
                        </div>
                        <div class="max-h-[600px] overflow-auto rounded-xl bg-gray-100 p-4 dark:bg-gray-800">
                            <BoardingPassPrint :tickets="b.bus_tickets" preview />
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <BoardingPassPrint />
    </div>
</template>
