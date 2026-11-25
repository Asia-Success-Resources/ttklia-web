<script setup lang="ts">
// Bus CTS dashboard, in ttklia-v2's layout (admin/bus/dashboard.blade.php), from GET /ops/w/{workspace}/dashboard:
// - today: bookings (with pax), revenue, collections, departures;
// - this month's bookings and unused loyalty points;
// - hourly bookings for a chosen day (‹ ›), bookings, new customers and online bookings over the last 7 days;
// - today's departures by bus company, top zones by departures and by bookings;
// - bus companies' credit, lowest first (red at RM100 or less, amber at RM200 or less).
// Each block shows only with its permission (the API leaves it out otherwise).
useHead({ title: 'Dashboard' })

interface Count { name: string; count: number }
/** Bookings (orders) and pax (tickets, one per passenger) of one kind: `sale` bought here, `collection` bought elsewhere. */
interface Split { bookings: number; pax: number }
interface Dashboard {
    workspace: { code: string; name: string }
    can: Record<'bookings' | 'collections' | 'trips' | 'companies' | 'customers' | 'credit', boolean>
    chart_dates: string[]
    today?: { bookings?: number; pax?: number; revenue_sen?: number; sale?: Split; collection?: Split; collections?: number; trips?: number }
    month?: { bookings: number; pax: number; label: string; sale?: Split; collection?: Split }
    hourly?: { date: string; hours: { hour: number; count: number; pax: number }[] }
    chart_bookings?: number[]
    chart_online?: number[]
    chart_customers?: number[]
    top_booking_zones?: Count[]
    top_trip_zones?: Count[]
    trips_by_company?: Count[]
    unused_points?: number
    company_credits?: { id: number; name: string; balance_sen: number }[]
}

const api = useApi()
const { slug } = useWorkspace()
const { resolveTo } = useOpsShell()

const data = ref<Dashboard | null>(null)
const error = ref<string | null>(null)
const loading = ref(false)

// Malaysia date, YYYY-MM-DD.
const todayMy = () => new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10)
const hourlyDate = ref(todayMy())

async function load() {
    if (!slug.value) return
    loading.value = true
    try {
        const q = hourlyDate.value === todayMy() ? '' : `?hourly_date=${hourlyDate.value}`
        data.value = (await api.get<{ data: Dashboard }>(api.workspacePath(slug.value, `/dashboard${q}`))).data
        error.value = null
    } catch (e) {
        error.value = toProblem(e)?.detail ?? 'Unable to load the dashboard.'
    } finally {
        loading.value = false
    }
}
onMounted(load)
watch([slug, hourlyDate], load)

function shiftDay(days: number) {
    const d = new Date(`${hourlyDate.value}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() + days)
    const next = d.toISOString().slice(0, 10)
    if (next <= todayMy()) hourlyDate.value = next
}
const isToday = computed(() => hourlyDate.value >= todayMy())
const dayLabel = computed(() => new Date(`${hourlyDate.value}T00:00:00Z`).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }))

const hours = computed(() => data.value?.hourly?.hours ?? [])
const hourMax = computed(() => Math.max(1, ...hours.value.map((h) => h.count)))
const hourTotal = computed(() => hours.value.reduce((a, h) => a + h.count, 0))
const hourPax = computed(() => hours.value.reduce((a, h) => a + h.pax, 0))

const num = (n: number | undefined) => (n ?? 0).toLocaleString('en-MY')
const creditColor = (sen: number) => (sen <= 10000 ? 'text-red-600 dark:text-red-400' : sen <= 20000 ? 'text-amber-600 dark:text-amber-400' : 'text-primary')

// The stat cards along the top, as v2 (icon colour, big number, label).
const stats = computed(() => {
    const d = data.value
    if (!d) return []
    const cards: { icon: string; tone: string; value: string; sub?: string; label: string }[] = []
    if (d.can.bookings) {
        cards.push({ icon: 'i-bx-receipt', tone: 'bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400', value: num(d.today?.bookings), label: "Today's Bookings" })
        cards.push({ icon: 'i-bx-dollar', tone: 'bg-green-50 text-green-500 dark:bg-green-500/10 dark:text-green-400', value: formatSen(d.today?.revenue_sen ?? 0), label: "Today's Revenue" })
    }
    if (d.can.collections) cards.push({ icon: 'i-bx-wallet', tone: 'bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400', value: num(d.today?.collections), label: "Today's Collections" })
    if (d.can.trips) cards.push({ icon: 'i-bx-map', tone: 'bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400', value: num(d.today?.trips), label: "Today's Trips" })
    return cards
})

/** The month's four cards: all bookings, those sold here, those collected here, and the passengers they carry. */
const monthCards = computed(() => {
    const m = data.value?.month
    if (!m) return []
    const cards = [{ label: 'Total Bookings', count: m.bookings, unit: 'tickets' }]
    if (m.sale && m.collection) {
        cards.push(
            { label: 'Sold Here', count: m.sale.bookings, unit: 'tickets'},
            { label: 'Collected Here', count: m.collection.bookings, unit: 'tickets' },
        )
    }
    cards.push({ label: 'Total Pax', count: m.pax, unit: 'pax' })
    return cards
})
const showPoints = computed(() => data.value?.unused_points !== undefined && data.value.unused_points > 0)

const card = 'rounded-2xl border border-(--ops-border) bg-(--ops-card)'
const cardHead = 'border-b border-(--ops-border) px-6 py-4'
</script>

<template>
    <div>
        <div class="mb-6">
            <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">{{ data?.workspace.name ?? 'Bus CTS' }} — Dashboard</h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Bus CTS operations overview</p>
        </div>
        <UAlert v-if="error" class="mb-4" color="error" variant="soft" icon="i-bx-alert-circle" :title="error" />

        <template v-if="data">
            <!-- Stats cards -->
            <div v-if="stats.length" class="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div v-for="s in stats" :key="s.label" :class="card" class="p-5">
                    <span class="mb-4 flex size-10 items-center justify-center rounded-xl" :class="s.tone"><UIcon :name="s.icon" class="size-5" /></span>
                    <h4 class="text-2xl font-bold text-gray-800 dark:text-white/90">
                        {{ s.value }} <span v-if="s.sub" class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ s.sub }}</span>
                    </h4>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ s.label }}</p>
                </div>
            </div>

            <!-- Secondary stats: the month's bookings, then split into sold here and collected here (they add up to it) -->
            <div v-if="data.month || data.unused_points !== undefined" class="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <template v-if="data.month">
                    <div v-for="m in monthCards" :key="m.label" :class="card" class="p-5">
                        <p class="text-sm text-gray-500 dark:text-gray-400">{{ m.label }} · {{ data.month.label }}</p>
                        <h4 class="mt-2 text-lg font-bold text-gray-800 dark:text-white/90">
                            {{ num(m.count) }} <span class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ m.unit }}</span>
                        </h4>
                    </div>
                </template>
                <div v-if="showPoints" :class="card" class="p-5">
                    <h4 class="text-lg font-bold text-gray-800 dark:text-white/90">{{ num(data.unused_points) }}</h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Unused Points</p>
                </div>
            </div>

            <!-- Hourly bookings and the 7-day charts -->
            <div class="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div v-if="data.hourly" :class="card">
                    <div :class="cardHead" class="flex flex-wrap items-center justify-between gap-3">
                        <div class="flex items-center gap-3">
                            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Hourly Bookings</h3>
                            <div class="flex items-center gap-2">
                                <UButton icon="i-bx-chevron-left" size="xs" color="neutral" variant="outline" aria-label="Previous day" :disabled="loading" @click="shiftDay(-1)" />
                                <span class="min-w-[5.5rem] text-center text-sm font-medium text-gray-700 dark:text-gray-300">{{ dayLabel }}</span>
                                <UButton icon="i-bx-chevron-right" size="xs" color="neutral" variant="outline" aria-label="Next day" :disabled="isToday || loading" @click="shiftDay(1)" />
                            </div>
                        </div>
                        <div class="flex gap-4 text-sm">
                            <span class="text-gray-500 dark:text-gray-400">Total: <strong class="text-gray-900 dark:text-white">{{ num(hourTotal) }}</strong> bookings</span>
                            <span class="text-gray-500 dark:text-gray-400">Pax: <strong class="text-gray-900 dark:text-white">{{ num(hourPax) }}</strong></span>
                        </div>
                    </div>
                    <div class="space-y-1 p-4">
                        <div v-if="!hourTotal" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">No bookings on {{ dayLabel }}</div>
                        <template v-for="h in hours" :key="h.hour">
                            <div
                                v-if="h.count > 0"
                                class="grid items-center px-3"
                                :class="h.count === hourMax ? 'rounded-lg bg-green-50 dark:bg-green-500/10' : ''"
                                style="grid-template-columns: 3rem 2.5rem 4rem 1fr"
                            >
                                <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ String(h.hour).padStart(2, '0') }}:00</span>
                                <span class="text-right text-sm font-bold text-gray-800 dark:text-white">{{ h.count }}</span>
                                <span class="text-right text-xs text-gray-400 dark:text-gray-500">{{ h.pax }} pax</span>
                                <div class="ml-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                                    <div class="h-full rounded-full transition-all" :class="h.count === hourMax ? 'bg-green-500' : 'bg-primary'" :style="{ width: `${(h.count / hourMax) * 100}%` }" />
                                </div>
                            </div>
                        </template>
                    </div>
                </div>

                <OpsChartCard v-if="data.chart_bookings" title="Daily Bookings (Last 7 Days)" type="area" :series="[{ name: 'Bookings', data: data.chart_bookings }]" :categories="data.chart_dates" />
                <OpsChartCard v-if="data.chart_customers" title="New Customers (Last 7 Days)" type="bar" :series="[{ name: 'New customers', data: data.chart_customers }]" :categories="data.chart_dates" />
                <OpsChartCard v-if="data.chart_online" title="Customer Online Bookings (Last 7 Days)" type="area" :series="[{ name: 'Online bookings', data: data.chart_online }]" :categories="data.chart_dates" />
            </div>

            <!-- Today's trips by company -->
            <div v-if="data.trips_by_company?.length" :class="card" class="mb-6">
                <div :class="cardHead"><h3 class="text-base font-semibold text-gray-900 dark:text-white">Today's Trips by Company</h3></div>
                <div class="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
                    <NuxtLink
                        v-for="c in data.trips_by_company"
                        :key="c.name"
                        :to="resolveTo('/trips')"
                        class="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
                    >
                        <span class="mr-2 truncate text-sm font-medium text-gray-700 dark:text-gray-300">{{ c.name }}</span>
                        <span class="text-lg font-bold text-primary">{{ c.count }}</span>
                    </NuxtLink>
                </div>
            </div>

            <!-- Top 5 zones -->
            <div v-if="data.top_trip_zones?.length || data.top_booking_zones?.length" class="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div v-for="block in [
                    { title: 'Top Zones (Trips)', rows: data.top_trip_zones, tone: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' },
                    { title: 'Top Zones (Bookings)', rows: data.top_booking_zones, tone: 'bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400' },
                ].filter((b) => b.rows?.length)" :key="block.title" :class="card">
                    <div :class="cardHead"><h3 class="text-base font-semibold text-gray-900 dark:text-white">{{ block.title }}</h3></div>
                    <div class="space-y-2 p-4">
                        <div v-for="(z, i) in block.rows" :key="z.name" class="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/[0.04]">
                            <div class="flex items-center gap-3">
                                <span class="flex size-6 items-center justify-center rounded-full text-xs font-bold" :class="block.tone">{{ i + 1 }}</span>
                                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ z.name }}</span>
                            </div>
                            <span class="text-sm font-bold text-gray-800 dark:text-white">{{ z.count }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Company credit balances -->
            <div v-if="data.company_credits?.length" :class="card" class="mb-6">
                <div :class="cardHead">
                    <h3 class="text-base font-semibold text-gray-900 dark:text-white">Company Credit Balances</h3>
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Companies with a balance or credit activity in the past month, lowest balance first</p>
                </div>
                <div class="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
                    <NuxtLink
                        v-for="c in data.company_credits"
                        :key="c.id"
                        :to="resolveTo(`/operators/${c.id}`)"
                        class="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
                    >
                        <span class="mr-2 truncate text-sm font-medium text-gray-700 dark:text-gray-300">{{ c.name }}</span>
                        <span class="text-lg font-bold" :class="creditColor(c.balance_sen)">{{ formatSen(c.balance_sen) }}</span>
                    </NuxtLink>
                </div>
            </div>
        </template>
        <div v-else-if="loading" class="py-16 text-center text-sm text-gray-500">Loading…</div>
    </div>
</template>
