<script setup lang="ts">
// A client's monthly statement (doc 19, "Pricing"): every limo job that month (completed, or cancelled with a charge)
// with its charges, and every van trip on the client's routes at the per-trip price, with the totals. Client bookings
// are invoiced monthly, not paid one by one. Print it from the browser. GET /clients/{id}/statement?month=YYYY-MM.
// Permission: fleet.clients.read (doc 27).
interface Statement {
    organisation: { id: number; name: string; tin: string | null }
    month: string
    label: string
    limo: { uuid: string; reference: string; client_reference: string | null; pickup_at: string; guest_name: string | null; from_text: string; to_text: string | null; vehicle_class: string; status: string; charge_sen: number }[]
    van_trips: { trip_no: string; service_date: string; route_code: string; route_name: string; pax_count: number | null; price_sen: number }[]
    totals: { limo_jobs: number; limo_sen: number; van_trips: number; van_pax: number; van_sen: number; total_sen: number }
}

const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))
const api = useFleetApi()
const month = ref(todayYmd().slice(0, 7))
const data = ref<Statement | null>(null)
const error = ref<string | null>(null)
const loading = ref(false)
useHead({ title: () => (data.value ? `${data.value.organisation.name} · ${data.value.label}` : 'Statement') })

async function load() {
    loading.value = true
    try {
        data.value = (await api.get<{ data: Statement }>(`/clients/${id.value}/statement`, { month: month.value })).data
        error.value = null
    } catch (e) {
        error.value = fleetError(e, 'Unable to load the statement.')
    } finally {
        loading.value = false
    }
}
onMounted(load)
watch(month, load)
const printPage = () => window.print()
const card = 'rounded-2xl border border-(--ops-border) bg-(--ops-card) p-5'
</script>

<template>
    <div>
        <OpsBreadcrumb :title="data ? `${data.organisation.name}: statement` : 'Statement'" />
        <div class="mb-4 flex flex-wrap items-center gap-2 print:hidden">
            <UInput v-model="month" type="month" class="w-44" />
            <UButton label="Print" icon="i-bx-printer" color="neutral" variant="outline" @click="printPage" />
            <UButton label="Clients" icon="i-bx-arrow-left-stroke" color="neutral" variant="ghost" to="/clients" />
        </div>
        <UAlert v-if="error" class="mb-4" color="error" variant="soft" :title="error" />
        <template v-if="data">
            <div class="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div :class="card"><p class="text-sm text-gray-500">Limo jobs</p><p class="text-2xl font-bold">{{ data.totals.limo_jobs }}</p><p class="text-sm">{{ formatSen(data.totals.limo_sen) }}</p></div>
                <div :class="card"><p class="text-sm text-gray-500">Van trips</p><p class="text-2xl font-bold">{{ data.totals.van_trips }}</p><p class="text-sm">{{ formatSen(data.totals.van_sen) }}</p></div>
                <div :class="card"><p class="text-sm text-gray-500">Van passengers</p><p class="text-2xl font-bold">{{ data.totals.van_pax }}</p></div>
                <div :class="card"><p class="text-sm text-gray-500">Total · {{ data.label }}</p><p class="text-2xl font-bold">{{ formatSen(data.totals.total_sen) }}</p></div>
            </div>

            <div :class="card" class="mb-4 overflow-x-auto">
                <h3 class="mb-3 text-lg font-semibold">Limo jobs</h3>
                <p v-if="!data.limo.length" class="text-sm text-gray-500">None this month.</p>
                <table v-else class="w-full text-sm">
                    <thead class="text-left text-xs uppercase text-gray-500"><tr><th class="py-2">Pickup</th><th>RSVN</th><th>Guest</th><th>From → To</th><th>Vehicle</th><th>Status</th><th class="text-right">Amount</th></tr></thead>
                    <tbody>
                        <tr v-for="b in data.limo" :key="b.uuid" class="border-t border-(--ops-border)">
                            <td class="py-1.5">{{ formatDateTime(b.pickup_at) }}</td>
                            <td><NuxtLink :to="`/limo/${b.uuid}`" class="hover:underline">{{ b.client_reference ?? b.reference }}</NuxtLink></td>
                            <td>{{ b.guest_name ?? '—' }}</td>
                            <td>{{ b.from_text || '—' }} → {{ b.to_text || '—' }}</td>
                            <td>{{ b.vehicle_class }}</td>
                            <td>{{ b.status === 'cancelled' ? 'Cancellation charge' : 'Completed' }}</td>
                            <td class="text-right">{{ formatSen(b.charge_sen) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div :class="card" class="overflow-x-auto">
                <h3 class="mb-3 text-lg font-semibold">Van trips</h3>
                <p v-if="!data.van_trips.length" class="text-sm text-gray-500">None this month.</p>
                <table v-else class="w-full text-sm">
                    <thead class="text-left text-xs uppercase text-gray-500"><tr><th class="py-2">Date</th><th>Trip</th><th>Route</th><th>Pax</th><th class="text-right">Amount</th></tr></thead>
                    <tbody>
                        <tr v-for="t in data.van_trips" :key="t.trip_no" class="border-t border-(--ops-border)">
                            <td class="py-1.5">{{ formatDate(t.service_date) }}</td>
                            <td>{{ t.trip_no }}</td>
                            <td>{{ t.route_name }} ({{ t.route_code }})</td>
                            <td>{{ t.pax_count ?? '—' }}</td>
                            <td class="text-right">{{ formatSen(t.price_sen) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </template>
        <p v-else-if="loading" class="py-10 text-center text-sm text-gray-500">Loading…</p>
    </div>
</template>
