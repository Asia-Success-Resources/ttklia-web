<script setup lang="ts">
// Vendors live: tills open, sales today, offline tills, active outlets (Sitemap 6, doc 32).
// GET /api/admin/vendors/live. Permission: vendors.manage.read
useHead({ title: 'Vendor tills' })

interface Live { tills_open: number; sales_today_sen: number; tills_offline: number; outlets_active: number }
const api = useApi()
const live = ref<Live | null>(null)
const error = ref<string | null>(null)
async function load() {
    try {
        live.value = (await api.get<{ data: Live }>('/admin/vendors/live')).data
    } catch (e) {
        error.value = toProblem(e)?.detail ?? 'Unable to load the tills.'
    }
}
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
    load()
    timer = setInterval(load, 60_000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
    <div>
        <OpsBreadcrumb title="Vendor tills" />
        <UAlert v-if="error" class="mb-4" color="error" variant="soft" :title="error" />
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
            <OpsMetricCard label="Tills open" :value="live?.tills_open ?? null" icon="i-bx-store" />
            <OpsMetricCard label="Sales today" :value="live?.sales_today_sen ?? null" :money="true" icon="i-bx-wallet" />
            <OpsMetricCard label="Tills offline" :value="live?.tills_offline ?? null" icon="i-bx-wifi-slash" />
            <OpsMetricCard label="Outlets active" :value="live?.outlets_active ?? null" icon="i-bx-buildings" />
        </div>
        <p class="mt-4 text-sm text-gray-500">Refreshes every minute.</p>
    </div>
</template>
