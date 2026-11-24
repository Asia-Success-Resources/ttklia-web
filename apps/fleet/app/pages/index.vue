<script setup lang="ts">
// Fleet dashboard (doc 19), from GET /ops/w/{workspace}/dashboard: today's limo jobs (and how many still need a car or
// driver), van trips and pax, drivers off today; open vehicle issues, client changes waiting, this month's completed
// jobs, cannot-provide (lost revenue) and revenue; limo jobs and van trips over the last 7 days; and the next pickups
// still short of cars. Permission: fleet.dashboard.read (doc 27).
useHead({ title: 'Today' })

interface Dashboard {
    today: { limo_jobs: number; limo_by_status: Record<string, number>; limo_unassigned: number; van_trips: number; van_pax: number; van_unassigned: number; drivers_off: number }
    open_issues: number
    vehicles_off_road: number
    changes_waiting: number
    month: { label: string; limo_completed: number; cannot_provide: number; revenue_sen: number }
    chart_dates: string[]
    chart_limo: number[]
    chart_van: number[]
    next_unassigned: { uuid: string; reference: string; pickup_at: string; guest_name: string | null; from_text: string; to_text: string | null; vehicle_class: string; vehicles_needed: number; status: string }[]
}

const api = useFleetApi()
const data = ref<Dashboard | null>(null)
const error = ref<string | null>(null)
onMounted(async () => {
    try {
        data.value = (await api.get<{ data: Dashboard }>('/dashboard')).data
    } catch (e) {
        error.value = fleetError(e, 'Unable to load the dashboard.')
    }
})
const card = 'rounded-2xl border border-(--ops-border) bg-(--ops-card)'
</script>

<template>
    <div>
        <OpsBreadcrumb title="Fleet Management" />
        <UAlert v-if="error" class="mb-4" color="error" variant="soft" :title="error" />
        <template v-if="data">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
                <NuxtLink to="/limo"><OpsMetricCard label="Limo jobs today" :value="data.today.limo_jobs" icon="i-bx-car" /></NuxtLink>
                <NuxtLink to="/limo/pending"><OpsMetricCard label="Still need a car or driver" :value="data.today.limo_unassigned" icon="i-bx-user-plus" /></NuxtLink>
                <NuxtLink to="/van/trips"><OpsMetricCard label="Van trips today" :value="data.today.van_trips" icon="i-bx-bus" /></NuxtLink>
                <NuxtLink to="/van/trips"><OpsMetricCard label="Van passengers today" :value="data.today.van_pax" icon="i-bx-group" /></NuxtLink>
            </div>

            <div class="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2 md:gap-6">
                <OpsChartCard title="Last 7 days" type="bar" :series="[{ name: 'Limo jobs', data: data.chart_limo }, { name: 'Van trips', data: data.chart_van }]" :categories="data.chart_dates" />
                <div :class="card" class="p-5">
                    <h3 class="mb-3 text-lg font-semibold text-gray-800 dark:text-white/90">Next pickups without a car</h3>
                    <p v-if="!data.next_unassigned.length" class="text-sm text-gray-500">Every coming job has its car and driver.</p>
                    <NuxtLink
                        v-for="b in data.next_unassigned"
                        :key="b.uuid"
                        :to="`/limo/${b.uuid}`"
                        class="flex items-center justify-between gap-3 border-t border-(--ops-border) py-2 text-sm first:border-t-0 hover:bg-(--ops-nav-hover-bg)"
                    >
                        <span class="w-28 shrink-0 font-medium">{{ formatDateTime(b.pickup_at) }}</span>
                        <span class="min-w-0 flex-1 truncate">{{ b.from_text || '—' }} → {{ b.to_text || '—' }}<span class="text-gray-500"> · {{ b.guest_name ?? b.reference }}</span></span>
                        <span class="shrink-0 text-gray-500">{{ b.vehicle_class }}{{ b.vehicles_needed > 1 ? ` ×${b.vehicles_needed}` : '' }}</span>
                    </NuxtLink>
                </div>
            </div>
        </template>
    </div>
</template>
