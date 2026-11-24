<script setup lang="ts">
// Teeko dashboard (doc 09, "Dashboard"; doc 07): today's requests and how they ended, requests still looking for a
// driver, drivers on a ride now, today's fares, scheduled rides in the next 24 hours; requests and completed rides
// over the last 7 days; the latest requests. GET /ops/w/{workspace}/dashboard (DashboardController::rideDashboard).
// Permission: ride.dashboard.read.
// TODO(api): drivers online and a live map of drivers and rides (Google Maps JS, doc 09) once the presence store is in.
useHead({ title: 'Dashboard' })

interface Dashboard {
    today: { requests: number; accepted: number; no_driver: number; cancelled: number; completed: number; fares_sen: number }
    open_requests: number
    drivers_on_ride: number
    scheduled_next_24h: number
    chart_dates: string[]
    chart_requests: number[]
    chart_completed: number[]
    latest: { uuid: string; status: string; vehicle_class: string; quoted_fare_sen: number; rider_name: string | null; scheduled: boolean; created_at: string }[]
}

const api = useRideApi()
const data = ref<Dashboard | null>(null)
const error = ref<string | null>(null)
async function load() {
    try {
        data.value = (await api.get<{ data: Dashboard }>('/dashboard')).data
        error.value = null
    } catch (e) {
        error.value = rideError(e, 'Unable to load the dashboard.')
    }
}
onMounted(load)

const series = computed(() => [
    { name: 'Requests', data: data.value?.chart_requests ?? [] },
    { name: 'Completed rides', data: data.value?.chart_completed ?? [] },
])
const secondary = computed<{ label: string; value: number; to?: string }[]>(() => {
    const d = data.value
    if (!d) return []
    return [
        { label: 'Completed today', value: d.today.completed },
        { label: 'No driver today', value: d.today.no_driver },
        { label: 'Cancelled today', value: d.today.cancelled },
        { label: 'Scheduled, next 24 h', value: d.scheduled_next_24h, to: '/scheduled' },
    ]
})
const latest = computed(() =>
    (data.value?.latest ?? []).map((r) => ({
        title: `${r.rider_name ?? 'Rider'}${r.scheduled ? ' · booked ahead' : ''}`,
        subtitle: `${carLabel(r.vehicle_class)} · ${formatSen(r.quoted_fare_sen)} · ${formatDateTime(r.created_at)}`,
        status: r.status,
        to: `/requests/${r.uuid}`,
    })),
)
</script>

<template>
    <div>
        <OpsBreadcrumb title="Teeko Ride" />
        <UAlert v-if="error" class="mb-4" color="error" variant="soft" icon="i-bx-alert-circle" :title="error" />
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
            <OpsMetricCard label="Requests today" :value="data?.today.requests ?? null" icon="i-bx-clock-3" />
            <OpsMetricCard label="Looking for a driver" :value="data?.open_requests ?? null" icon="i-bx-search" />
            <OpsMetricCard label="Drivers on a ride" :value="data?.drivers_on_ride ?? null" icon="i-bx-user-check" />
            <OpsMetricCard label="Fares today" :value="data?.today.fares_sen ?? null" :money="true" icon="i-bx-wallet" />
        </div>
        <div class="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2 md:gap-6">
            <OpsChartCard title="Last 7 days" type="bar" :series="series" :categories="data?.chart_dates ?? []" fill />
            <div class="rounded-2xl border border-(--ops-border) bg-(--ops-card) p-5 sm:p-6">
                <div class="mb-4 flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Latest requests</h3>
                    <NuxtLink to="/requests" class="text-sm text-primary hover:underline">View all</NuxtLink>
                </div>
                <p v-if="!latest.length" class="text-sm text-gray-500">No requests yet</p>
                <ul v-else class="divide-y divide-(--ops-border)">
                    <li v-for="item in latest" :key="item.to">
                        <NuxtLink :to="item.to" class="flex items-center justify-between gap-3 py-2.5 text-sm hover:opacity-80">
                            <span class="min-w-0">
                                <span class="block truncate font-medium text-gray-800 dark:text-white/90">{{ item.title }}</span>
                                <span class="block truncate text-xs text-gray-500">{{ item.subtitle }}</span>
                            </span>
                            <OpsStatusCell :status="item.status" class="w-28 shrink-0" />
                        </NuxtLink>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>
