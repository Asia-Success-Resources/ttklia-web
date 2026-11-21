<script setup lang="ts">
import type { TabsItem, TableColumn } from '@nuxt/ui'
import type { SaleStat } from '~/types/sale'

// Sale Dashboard: the counter's booking screen, laid out like today's ttklia-v2
// `admin/bus/bookings/dashboard`: title with Session Info and End Session, then one card with
// tabs for Create Booking, Tour Booking, Ticket Collection, Sell Code and Recent Bookings.
// With no open booking session it shows Start New Session instead: pick a counter and the
// opening cash (doc 09, "Counter sessions").
// Permission: bus.sales.read (doc 27); each tab also needs its write permission.
// TODO(api): check the tab permission names against the seeder.
useHead({ title: 'Sale Dashboard' })

const { me, can } = useMe()
const preview = computed(() => !useRuntimeConfig().public.apiBase && !me.value)
const allowed = (permission: string) => preview.value || can(permission)

const tabs = computed<TabsItem[]>(() => [
    { label: 'Create Booking', value: 'booking', slot: 'booking' as const, show: allowed('bus.bookings.write') },
    { label: 'Tour Booking', value: 'tour', slot: 'tour' as const, show: allowed('bus.tour_orders.write') },
    { label: 'Ticket Collection', value: 'collection', slot: 'collection' as const, show: allowed('bus.bookings.write') },
    { label: 'Sell Code', value: 'code', slot: 'code' as const, show: allowed('bus.codes.write') },
    { label: 'Recent Bookings', value: 'recent', slot: 'recent' as const, show: true },
].filter((t) => t.show))
const active = ref<string>('')
watchEffect(() => {
    if (!tabs.value.some((t) => t.value === active.value)) active.value = String(tabs.value[0]?.value ?? 'recent')
})

// The open cash session (doc 09, "Counter sessions"; doc 04).
const { resolveTo } = useOpsShell()
const counter = useCounterSession('booking')
const session = counter.mine
const showWithoutSession = ref(false)
onMounted(() => counter.load())
const infoOpen = ref(false)
const endOpen = ref(false)
const closingCash = ref<number | null>(null)

const counts = computed<SaleStat[]>(() => [
    { label: 'Total Bookings', value: session.value?.total_bookings ?? null },
    { label: 'Total Collections', value: session.value?.total_collections ?? null },
    { label: 'Total Codes Sold', value: session.value?.total_codes ?? null },
    { label: 'Total Cancelled', value: session.value?.total_cancelled ?? null },
])
const money = computed<SaleStat[]>(() => [
    { label: 'Opening Cash', value: session.value?.opening_float_sen ?? null, money: true },
    { label: 'Current Cash (Including Float)', value: session.value?.current_cash_sen ?? null, money: true, highlight: true },
])

async function endSession() {
    if (closingCash.value === null) return
    if (await counter.end(Math.round(closingCash.value * 100))) {
        endOpen.value = false
        closingCash.value = null
    }
}

// Recent Bookings: this session's bookings, tour orders and code sales.
// GET /api/ops/w/{workspace}/orders (ttklia-api). TODO(api): scope to the open session and
// check the field names against the generated types.
interface RecentRow extends Record<string, unknown> {
    uuid: string
    kind: 'booking' | 'collection' | 'tour' | 'code'
    title: string | null
    travel_date: string | null
    created_at: string
    total_pax: number | null
    total_sen: number
}
const kindLabels: Record<RecentRow['kind'], string> = { booking: 'Booking', collection: 'Collection', tour: 'Tour', code: 'Code Sale' }
const recentColumns: TableColumn<RecentRow>[] = [
    { accessorKey: 'kind', header: 'Type', cell: ({ row }) => kindLabels[row.original.kind] ?? row.original.kind },
    { accessorKey: 'title', header: 'Dest/Tour', cell: ({ row }) => row.original.title ?? '-' },
    { accessorKey: 'travel_date', header: 'Date', cell: ({ row }) => formatDate(row.original.travel_date ?? row.original.created_at) },
    { accessorKey: 'created_at', header: 'Time Sold', cell: ({ row }) => formatTime(row.original.created_at) },
    { accessorKey: 'total_pax', header: 'Total Pax', cell: ({ row }) => row.original.total_pax ?? '-' },
    { accessorKey: 'total_sen', header: 'Amount', cell: ({ row }) => formatSen(row.original.total_sen) },
    { id: 'action', header: () => h('div', { class: 'text-right' }, 'Action') },
]
const recent = useApiList<RecentRow>({ path: '/orders', workspaceScoped: true, query: { session: 'current' } })
onMounted(() => recent.load())

function reprint(_row: RecentRow) {
    // TODO(api): fetch the receipt and print it through the counter agent, then log the print.
}
</script>

<template>
    <div v-if="!counter.loaded.value" class="flex justify-center py-20">
        <UIcon name="i-bx-loader-lines" class="size-8 animate-spin text-gray-400" />
    </div>
    <SaleStartSession
        v-else-if="!session && !showWithoutSession"
        title="Sale Dashboard"
        :counters="counter.counters.value"
        :other="counter.other.value"
        :busy="counter.busy.value"
        :error="counter.error.value"
        :preview="counter.preview.value"
        @start="(id, float) => counter.start(id, float)"
        @end-other="navigateTo(resolveTo('/product-sales'))"
        @preview="showWithoutSession = true"
    />
    <div v-else>
        <SalePageHeader
            title="Sale Dashboard"
            description="Manage bookings, ticket collections, tours, and prepaid codes."
            @info="infoOpen = true"
            @end="endOpen = true"
        />

        <div class="rounded-2xl border border-(--ops-border) bg-(--ops-card) shadow-sm">
            <UTabs
                v-model="active"
                :items="tabs"
                variant="link"
                :unmount-on-hide="false"
                :ui="{ list: 'border-b border-(--ops-border) px-6 overflow-x-auto', trigger: 'py-4 whitespace-nowrap', content: 'p-6' }"
            >
                <template #booking>
                    <SaleBookingForm @created="recent.load()" />
                </template>
                <template #tour>
                    <SaleTourBookingForm @created="recent.load()" />
                </template>
                <template #collection>
                    <SaleCollectionForm @created="recent.load()" />
                </template>
                <template #code>
                    <SaleCodeForm @created="recent.load()" />
                </template>
                <template #recent>
                    <div class="overflow-x-auto rounded-xl border border-(--ops-border)">
                        <UTable :data="recent.rows.value" :columns="recentColumns" :loading="recent.pending.value" empty="No recent bookings found.">
                            <template #action-cell="{ row }">
                                <div class="text-right">
                                    <UButton label="Reprint" variant="link" size="sm" @click="reprint(row.original)" />
                                </div>
                            </template>
                        </UTable>
                    </div>
                    <OpsPagination v-if="recent.pagination.value && recent.pagination.value.total > 0" :meta="recent.pagination.value" :loading="recent.pending.value" @page="recent.load" />
                </template>
            </UTabs>
        </div>

        <UModal v-model:open="infoOpen" title="Session Info" :ui="{ overlay: 'bg-black/50', content: 'sm:max-w-2xl' }">
            <template #body>
                <SaleSessionInfo :session="session" :counts="counts" :money="money" />
            </template>
            <template #footer>
                <div class="flex w-full justify-end">
                    <UButton label="Close" color="neutral" variant="outline" @click="infoOpen = false" />
                </div>
            </template>
        </UModal>

        <UModal v-model:open="endOpen" title="End Session" :ui="{ overlay: 'bg-black/50', content: 'sm:max-w-2xl' }">
            <template #body>
                <SaleSessionInfo :session="session" :counts="counts" :money="money">
                    <div class="border-t border-(--ops-border) pt-4">
                        <UFormField label="Closing Cash (RM)" required>
                            <UInput v-model="closingCash" type="number" step="0.01" min="0" size="lg" class="w-full" />
                        </UFormField>
                    </div>
                </SaleSessionInfo>
            </template>
            <template #footer>
                <div class="flex w-full flex-wrap items-center justify-end gap-3">
                    <span v-if="counter.error.value" class="mr-auto text-sm text-error">{{ counter.error.value }}</span>
                    <UButton label="Cancel" color="neutral" variant="outline" @click="endOpen = false" />
                    <UButton
                        label="End Session & Close Register"
                        color="error"
                        :loading="counter.busy.value"
                        :disabled="closingCash === null || !session"
                        @click="endSession"
                    />
                </div>
            </template>
        </UModal>
    </div>
</template>
