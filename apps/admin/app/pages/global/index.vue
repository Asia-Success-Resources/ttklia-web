<script setup lang="ts">
// Global Dashboard, laid out and charted like ttklia-v2's resources/views/admin/dashboard.blade.php:
// month navigator; Total Revenue, Total Bookings, Total Passengers and Active Workspaces with their change on the
// month before; Daily Revenue Trend (area, previous month dashed); Monthly Comparison (bars) beside Workspace
// Performance; then the workspace cards. GET /api/admin/dashboard?year&month. Permission: global.dashboard.read
useHead({ title: 'Global Dashboard' })

interface Row { workspace: { name: string; code: string; slug: string; type: string }; daily_revenue: number; avg_daily_revenue_prev: number; current_revenue: number; previous_revenue: number; change_percent: number; bookings: number; pax: number }
interface Dashboard {
    month: { year: number; month: number; label: string }
    kpis: { total_revenue: number; revenue_change: number; total_bookings: number; bookings_change: number; total_pax: number; pax_change: number; active_workspaces: number }
    chartData: { categories: string[]; series: { name: string; data: number[] }[]; prevSeries: { name: string; data: number[] }[] }
    comparisonData: { labels: string[]; current: number[]; previous: number[] }
    performanceTable: Row[]
    workspaces: { id: number; code: string; slug: string; name: string; type: string; is_active: boolean }[]
}

const api = useApi()
const data = ref<Dashboard | null>(null)
const error = ref<string | null>(null)
const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const monthLabel = computed(() => `${monthNames[month.value - 1]} ${year.value}`)

let timer: ReturnType<typeof setTimeout> | undefined
async function load() {
    try {
        data.value = (await api.get<{ data: Dashboard }>('/admin/dashboard', { year: year.value, month: month.value })).data
        error.value = null
    } catch (e) {
        error.value = toProblem(e)?.detail ?? 'Unable to load the dashboard.'
    }
}
function shift(by: number) {
    month.value += by
    if (month.value < 1) { month.value = 12; year.value-- }
    if (month.value > 12) { month.value = 1; year.value++ }
    clearTimeout(timer)
    timer = setTimeout(load, 400)
}
onMounted(load)
onBeforeUnmount(() => clearTimeout(timer))

const money = (v: number) => 'RM ' + (+v || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const num = (v: number, d = 2) => (+v || 0).toLocaleString('en-MY', { minimumFractionDigits: d, maximumFractionDigits: d })

const kpiCards = computed(() => {
    const k = data.value?.kpis
    return [
        { label: 'Total Revenue', value: k ? money(k.total_revenue) : '—', change: k?.revenue_change, icon: 'i-bx-dollar', tint: 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400' },
        { label: 'Total Bookings', value: k ? k.total_bookings.toLocaleString('en-MY') : '—', change: k?.bookings_change, icon: 'i-bx-receipt', tint: 'bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400' },
        { label: 'Total Passengers', value: k ? k.total_pax.toLocaleString('en-MY') : '—', change: k?.pax_change, icon: 'i-bx-group', tint: 'bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400' },
        { label: 'Active Workspaces', value: k ? String(k.active_workspaces) : '—', change: undefined, icon: 'i-bx-buildings', tint: 'bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400' },
    ]
})

// The same colours and options as v2's makeTrendOptions / makeCompOptions.
const chartColors = ['#465fff', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']
const prevChartColors = ['#a3b1ff', '#6ee7b7', '#fcd34d', '#c4b5fd', '#fca5a5', '#67e8f9']
const yMoney = { labels: { style: { colors: '#6b7280', fontSize: '11px' }, formatter: (v: number) => 'RM ' + v.toLocaleString() } }

const trendSeries = computed(() => [...(data.value?.chartData.series ?? []), ...(data.value?.chartData.prevSeries ?? [])])
const trendOptions = computed(() => {
    const count = data.value?.chartData.series.length ?? 0
    const total = trendSeries.value.length
    return {
        chart: { type: 'area', height: 350, fontFamily: 'inherit', toolbar: { show: false }, animations: { enabled: true, easing: 'easeinout', speed: 600 } },
        colors: [...chartColors.slice(0, count), ...Array.from({ length: total - count }, (_, i) => prevChartColors[i % prevChartColors.length])],
        xaxis: { categories: data.value?.chartData.categories ?? [], labels: { style: { colors: '#6b7280', fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: yMoney,
        stroke: { curve: 'smooth', width: 2, dashArray: [...Array(count).fill(0), ...Array(total - count).fill(5)] },
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.05, stops: [0, 90, 100] } },
        dataLabels: { enabled: false },
        tooltip: {
            shared: true,
            intersect: false,
            // As v2: each workspace, a divider before the (Prev) block, then the day's totals for each block.
            custom: ({ series, dataPointIndex, w }: { series: number[][]; dataPointIndex: number; w: { globals: { colors: string[]; seriesNames: string[]; categoryLabels: string[]; labels: string[] } } }) => {
                let rows = ''
                let cur = 0
                let prev = 0
                let prevShown = 0
                for (let i = 0; i < series.length; i++) {
                    const val = +(series[i]?.[dataPointIndex] ?? 0) || 0
                    if (i < count) cur += val
                    else { prev += val; prevShown++ }
                    if (i === count && count > 0) rows += '<div style="border-top:1px solid #e5e7eb;margin:4px 0;"></div>'
                    rows += `<div style="display:flex;align-items:center;gap:6px;padding:2px 0;"><span style="width:8px;height:8px;border-radius:50%;background:${w.globals.colors[i]};flex:none;"></span><span style="flex:1;">${w.globals.seriesNames[i]}</span><span style="font-weight:600;margin-left:12px;">${money(val)}</span></div>`
                }
                let totals = `<div style="border-top:1px solid #e5e7eb;margin-top:4px;padding-top:4px;"><div style="display:flex;justify-content:space-between;gap:12px;padding:2px 0;font-weight:700;"><span>Total</span><span>${money(cur)}</span></div>`
                if (prevShown > 0) totals += `<div style="display:flex;justify-content:space-between;gap:12px;padding:2px 0;color:#6b7280;"><span>Total (Prev)</span><span>${money(prev)}</span></div>`
                totals += '</div>'
                const title = w.globals.categoryLabels[dataPointIndex] || w.globals.labels[dataPointIndex] || ''
                return `<div style="padding:8px 10px;font-size:12px;min-width:200px;"><div style="font-weight:600;margin-bottom:4px;">${title}</div>${rows}${totals}</div>`
            },
        },
        grid: { borderColor: '#f3f4f6', strokeDashArray: 4 },
        legend: { position: 'top', horizontalAlign: 'left', fontSize: '12px', labels: { colors: '#6b7280' }, markers: { radius: 3 } },
    }
})

const compSeries = computed(() => [
    { name: 'Current Month', data: data.value?.comparisonData.current ?? [] },
    { name: 'Previous Month', data: data.value?.comparisonData.previous ?? [] },
])
const compOptions = computed(() => ({
    chart: { type: 'bar', height: 320, fontFamily: 'inherit', toolbar: { show: false } },
    colors: ['#465fff', '#d1d5db'],
    xaxis: { categories: data.value?.comparisonData.labels ?? [], labels: { style: { colors: '#6b7280', fontSize: '11px' }, trim: true, maxHeight: 60 }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: yMoney,
    plotOptions: { bar: { borderRadius: 6, columnWidth: '60%', dataLabels: { position: 'top' } } },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v: number) => money(v) } },
    grid: { borderColor: '#f3f4f6', strokeDashArray: 4 },
    legend: { position: 'top', horizontalAlign: 'left', fontSize: '12px', labels: { colors: '#6b7280' } },
}))

const totals = computed(() => {
    const rows = data.value?.performanceTable ?? []
    const sum = (k: keyof Row) => rows.reduce((a, r) => a + (r[k] as number), 0)
    return { daily: sum('daily_revenue'), avgPrev: sum('avg_daily_revenue_prev'), current: sum('current_revenue'), previous: sum('previous_revenue'), bookings: sum('bookings'), pax: sum('pax') }
})
const cutLabel = computed(() => {
    const isThisMonth = year.value === now.getFullYear() && month.value === now.getMonth() + 1
    const d = isThisMonth ? now.getDate() : new Date(year.value, month.value, 0).getDate()
    const suffix = d % 10 === 1 && d !== 11 ? 'st' : d % 10 === 2 && d !== 12 ? 'nd' : d % 10 === 3 && d !== 13 ? 'rd' : 'th'
    return `1st–${d}${suffix}`
})

// The workspace cards, as v2: Bus CTS Instance, Taxi System, Fleet Management (and Ride for e-hailing).
const kinds: Record<string, { label: string; icon: string; tint: string }> = {
    bus_terminal: { label: 'Bus CTS Instance', icon: 'i-bx-bus', tint: 'bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400 group-hover:bg-blue-500' },
    taxi: { label: 'Taxi System', icon: 'i-bx-taxi', tint: 'bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400 group-hover:bg-amber-500' },
    fleet: { label: 'Fleet Management', icon: 'i-bx-car', tint: 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400 group-hover:bg-emerald-500' },
    ride: { label: 'E-hailing', icon: 'i-bx-location-pin', tint: 'bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400 group-hover:bg-purple-500' },
}
const order = ['bus_terminal', 'taxi', 'fleet', 'ride']
const cards = computed(() => [...(data.value?.workspaces ?? [])].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type)))
</script>

<template>
    <div>
        <div class="mb-6 flex items-center justify-between">
            <div>
                <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">Global Dashboard</h2>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Overview of all workspace systems</p>
            </div>
            <div class="flex items-center gap-2">
                <button type="button" class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]" aria-label="Previous month" @click="shift(-1)">
                    <UIcon name="i-bx-chevron-left" class="size-5" />
                </button>
                <span class="min-w-[120px] text-center text-sm font-medium text-gray-700 dark:text-gray-300">{{ monthLabel }}</span>
                <button type="button" class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]" aria-label="Next month" @click="shift(1)">
                    <UIcon name="i-bx-chevron-right" class="size-5" />
                </button>
            </div>
        </div>
        <UAlert v-if="error" class="mb-6" color="error" variant="soft" :title="error" />

        <!-- KPI Cards -->
        <div class="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div v-for="card in kpiCards" :key="card.label" class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                <div class="mb-3 flex items-center justify-between">
                    <span class="flex h-10 w-10 items-center justify-center rounded-xl" :class="card.tint"><UIcon :name="card.icon" class="size-5" /></span>
                    <span v-if="card.change !== undefined" class="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium"
                        :class="card.change >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'">
                        <UIcon :name="card.change >= 0 ? 'i-bx-trending-up' : 'i-bx-trending-down'" class="size-3.5" />
                        {{ Math.abs(card.change) }}%
                    </span>
                </div>
                <h4 class="text-2xl font-bold text-gray-800 dark:text-white/90">{{ card.value }}</h4>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ card.label }}</p>
            </div>
        </div>

        <!-- Revenue Trend Chart -->
        <div class="mb-6 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
                <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">Daily Revenue Trend</h3>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Revenue per workspace by day</p>
            </div>
            <div class="p-4 sm:p-6" style="min-height: 350px">
                <ClientOnly><apexchart v-if="data" type="area" height="350" :options="trendOptions" :series="trendSeries" /></ClientOnly>
            </div>
        </div>

        <!-- Comparison Chart + Performance Table -->
        <div class="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
                    <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">Monthly Comparison</h3>
                    <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Current vs Previous Month</p>
                </div>
                <div class="p-4 sm:p-6" style="min-height: 320px">
                    <ClientOnly><apexchart v-if="data" type="bar" height="320" :options="compOptions" :series="compSeries" /></ClientOnly>
                </div>
            </div>
            <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
                    <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">Workspace Performance</h3>
                    <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Prev. compares same date range ({{ cutLabel }}) of previous month</p>
                </div>
                <div class="overflow-x-auto p-4 sm:p-6">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-200 dark:border-gray-700">
                                <th class="px-2 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Workspace</th>
                                <th class="px-2 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Daily Revenue</th>
                                <th class="px-2 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Avg. Daily (Prev.)</th>
                                <th class="px-2 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Revenue</th>
                                <th class="px-2 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Prev.</th>
                                <th class="px-2 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Change</th>
                                <th class="px-2 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Bookings</th>
                                <th class="px-2 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Pax</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in data?.performanceTable ?? []" :key="row.workspace.code" class="border-b border-gray-100 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]">
                                <td class="px-2 py-3">
                                    <NuxtLink :to="`/global/workspaces/${row.workspace.code}`" class="font-medium text-gray-800 transition hover:text-brand-500 dark:text-white/90">{{ row.workspace.name }}</NuxtLink>
                                </td>
                                <td class="px-2 py-3 text-right font-semibold text-gray-500 dark:text-gray-400">{{ num(row.daily_revenue) }}</td>
                                <td class="px-2 py-3 text-right text-gray-500 dark:text-gray-400">{{ num(row.avg_daily_revenue_prev) }}</td>
                                <td class="px-2 py-3 text-right font-semibold text-gray-800 dark:text-white/90">{{ num(row.current_revenue) }}</td>
                                <td class="px-2 py-3 text-right text-gray-500 dark:text-gray-400">{{ num(row.previous_revenue) }}</td>
                                <td class="px-2 py-3 text-right">
                                    <span class="inline-flex items-center gap-0.5 text-xs font-medium" :class="row.change_percent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
                                        <UIcon :name="row.change_percent >= 0 ? 'i-bx-trending-up' : 'i-bx-trending-down'" class="size-3.5" />
                                        {{ Math.abs(row.change_percent) }}%
                                    </span>
                                </td>
                                <td class="px-2 py-3 text-right text-gray-700 dark:text-gray-300">{{ row.bookings.toLocaleString('en-MY') }}</td>
                                <td class="px-2 py-3 text-right text-gray-700 dark:text-gray-300">{{ row.pax.toLocaleString('en-MY') }}</td>
                            </tr>
                            <tr v-if="data && !data.performanceTable.length">
                                <td colspan="8" class="py-8 text-center text-gray-400 dark:text-gray-500">No data available</td>
                            </tr>
                        </tbody>
                        <tfoot v-if="data?.performanceTable.length">
                            <tr class="border-t-2 border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/50">
                                <td class="px-2 py-3 font-bold text-gray-800 dark:text-white/90">Total</td>
                                <td class="px-2 py-3 text-right font-bold text-gray-500 dark:text-gray-400">{{ num(totals.daily) }}</td>
                                <td class="px-2 py-3 text-right font-bold text-gray-500 dark:text-gray-400">{{ num(totals.avgPrev) }}</td>
                                <td class="px-2 py-3 text-right font-bold text-gray-800 dark:text-white/90">{{ num(totals.current) }}</td>
                                <td class="px-2 py-3 text-right font-bold text-gray-500 dark:text-gray-400">{{ num(totals.previous) }}</td>
                                <td class="px-2 py-3" />
                                <td class="px-2 py-3 text-right font-bold text-gray-700 dark:text-gray-300">{{ totals.bookings.toLocaleString('en-MY') }}</td>
                                <td class="px-2 py-3 text-right font-bold text-gray-700 dark:text-gray-300">{{ totals.pax.toLocaleString('en-MY') }}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>

        <!-- Workspace Cards Grid -->
        <div class="mb-4">
            <h3 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Workspaces</h3>
        </div>
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <NuxtLink v-for="ws in cards" :key="ws.code" :to="`/global/workspaces/${ws.code}`"
                class="group rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:border-brand-200 hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-800">
                <div class="mb-4 flex items-center gap-4">
                    <div class="flex h-12 w-12 items-center justify-center rounded-xl transition-colors group-hover:text-white" :class="kinds[ws.type]?.tint">
                        <UIcon :name="kinds[ws.type]?.icon ?? 'i-bx-buildings'" class="size-6" />
                    </div>
                    <div>
                        <h3 class="text-sm font-semibold text-gray-800 transition-colors group-hover:text-brand-500 dark:text-white/90">{{ ws.name }}</h3>
                        <p class="text-xs text-gray-400 dark:text-gray-500">{{ kinds[ws.type]?.label ?? ws.type }}</p>
                    </div>
                </div>
                <div class="flex items-center justify-between">
                    <span class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
                        :class="ws.is_active ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'">
                        <span class="h-1.5 w-1.5 rounded-full" :class="ws.is_active ? 'bg-green-500' : 'bg-red-500'" />
                        {{ ws.is_active ? 'Active' : 'Inactive' }}
                    </span>
                    <UIcon name="i-bx-chevron-right" class="size-5 text-gray-400 transition-colors group-hover:text-brand-500" />
                </div>
            </NuxtLink>
        </div>
    </div>
</template>
