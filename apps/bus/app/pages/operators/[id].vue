<script setup lang="ts">
import type { TableColumn, TabsItem } from '@nuxt/ui'

// Company page, laid out as ttklia-v2's admin/bus/companies/{id} (companies/show.blade.php), in v3's own styling:
// 1. four stat cards: This Month Bookings, This Month Revenue, This Month Trips, Total Routes;
// 2. the company card (logo, name, code, system provider) with Back;
// 3. Credit Balance with "Add Credit (use negative to deduct)" and the Credit Log (bus.operator_credit.approve);
// 4. Operator Accounts (users whose role is scoped to the company) with Top-up Requests;
// 5. Custom Pricing (zone × ticket type), when the company has its own fares;
// 6. tabs with counts: Routes, Trips, Bus Types, Buses, Bookings, each a paged list read with `company_id`.
// GET /api/ops/w/{workspace}/bus/companies/{id}, …/credit/log, POST …/credit; the tab lists read /bus/routes,
// /bus/trips, /seat-layouts, /vehicles and /bus/bookings. Permission: bus.operators.read (doc 27).
// TODO: v2's Edit and Edit Pricing buttons come with the company form and the pricing page.
useHead({ title: 'Company' })

interface Company {
    id: number
    name: string
    operator_code: string
    logo_url: string | null
    system_provider: string | null
    status: string
    stats: { month_bookings: number; month_revenue_sen: number; month_trips: number; total_routes: number }
    counts: { routes: number; trips: number; bus_types: number; buses: number; bookings: number }
    credit_balance_sen: number | null
    pending_topups: number
    operator_users: { uuid: string; name: string; email: string | null }[]
    pricing: { types: { key: string; label: string }[]; zones: { zone: string; prices: Record<string, number | null> }[] }
}
interface LogRow extends Record<string, unknown> {
    uuid: string
    entry_type: string
    memo: string | null
    amount_sen: number
    old_balance_sen: number
    new_balance_sen: number
    posted_by: string | null
    posted_at: string
}

const route = useRoute()
const id = String(route.params.id ?? '')
const api = useApi()
const { slug } = useWorkspace()
const { can } = useMe()
const { resolveTo } = useOpsShell()
const toast = useToast()
const path = (p: string) => api.workspacePath(slug.value ?? '', p)

const company = ref<Company | null>(null)
const error = ref<string | null>(null)
async function loadCompany() {
    error.value = null
    try {
        const res = await api.get<{ data: Company }>(path(`/bus/companies/${id}`))
        company.value = res?.data ?? null
        if (company.value) useHead({ title: company.value.name })
    } catch (e) {
        const problem = toProblem(e)
        error.value = problem?.detail ?? problem?.title ?? 'Unable to load the company.'
    }
}

const stats = computed(() => [
    { label: 'This Month Bookings', icon: 'i-bx-receipt', value: company.value ? company.value.stats.month_bookings.toLocaleString() : '-', tone: 'bg-primary/10 text-primary' },
    { label: 'This Month Revenue', icon: 'i-bx-dollar-circle', value: company.value ? formatSen(company.value.stats.month_revenue_sen) : '-', tone: 'bg-success/10 text-success' },
    { label: 'This Month Trips', icon: 'i-bx-trip', value: company.value ? company.value.stats.month_trips.toLocaleString() : '-', tone: 'bg-warning/10 text-warning' },
    { label: 'Total Routes', icon: 'i-bx-map', value: company.value ? company.value.stats.total_routes.toLocaleString() : '-', tone: 'bg-info/10 text-info' },
])

// --- Credit Balance (v2 CompanyController@updateBalance) ---
const canCredit = computed(() => can('bus.operator_credit.approve'))
const typeLabels: Record<string, string> = { wallet_topup: 'Addition', wallet_deduction: 'Deduction', opening_balance: 'Opening balance' }
const label = (s: string) => typeLabels[s] ?? s.replaceAll('_', ' ').replace(/^\w/, (c) => c.toUpperCase())
const creditLog = useApiList<LogRow>({ path: `/bus/companies/${id}/credit/log`, workspaceScoped: true })
const money = (sen: number) => h('span', { class: sen < 0 ? 'text-error' : '' }, formatSen(sen))
const logColumns: TableColumn<LogRow>[] = [
    { accessorKey: 'entry_type', header: 'Type', cell: ({ row }) => label(row.original.entry_type) },
    {
        accessorKey: 'amount_sen',
        header: 'Amount',
        cell: ({ row }) => h('span', { class: ['font-medium', row.original.amount_sen < 0 ? 'text-error' : 'text-success'] }, (row.original.amount_sen > 0 ? '+' : '') + formatSen(row.original.amount_sen)),
    },
    { accessorKey: 'old_balance_sen', header: 'Old Balance', cell: ({ row }) => money(row.original.old_balance_sen) },
    { accessorKey: 'new_balance_sen', header: 'New Balance', cell: ({ row }) => money(row.original.new_balance_sen) },
    { accessorKey: 'memo', header: 'Reference', cell: ({ row }) => row.original.memo ?? '-' },
    { accessorKey: 'posted_by', header: 'By', cell: ({ row }) => row.original.posted_by ?? '-' },
    { accessorKey: 'posted_at', header: 'Date', cell: ({ row }) => formatDateTime(row.original.posted_at) },
]
const amount = ref<number | null>(null)
const saving = ref(false)
const amountError = ref<string | null>(null)
async function updateBalance() {
    amountError.value = null
    const sen = Math.round((amount.value ?? 0) * 100)
    if (!sen) {
        amountError.value = 'Enter an amount (use negative to deduct).'
        return
    }
    saving.value = true
    try {
        await api.post(path(`/bus/companies/${id}/credit`), { amount_sen: sen })
        amount.value = null
        await loadCompany()
        toast.add({ title: `Credit balance for ${company.value?.name ?? 'the company'} updated to ${formatSen(company.value?.credit_balance_sen ?? 0)}`, color: 'success' })
        creditLog.load()
    } catch (e) {
        const problem = toProblem(e)
        amountError.value = problem?.detail ?? problem?.title ?? 'Unable to update the credit balance.'
    } finally {
        saving.value = false
    }
}

// --- Tabs (v2: Routes, Trips, Bus Types, Buses, Bookings, each with its count) ---
const tabs = computed<TabsItem[]>(() => {
    const c = company.value?.counts
    const all = [
        { value: 'routes', label: 'Routes', icon: 'i-bx-map', count: c?.routes, show: can('bus.routes.read') },
        { value: 'trips', label: 'Trips', icon: 'i-bx-trip', count: c?.trips, show: can('bus.trips.read') },
        { value: 'bus_types', label: 'Bus Types', icon: 'i-bx-bus', count: c?.bus_types, show: can('bus.seat_layouts.read') },
        { value: 'buses', label: 'Buses', icon: 'i-bx-car', count: c?.buses, show: can('bus.buses.read') },
        { value: 'bookings', label: 'Bookings', icon: 'i-bx-receipt', count: c?.bookings, show: can('bus.bookings.read') },
    ]
    return all.filter((t) => t.show).map((t) => ({
        value: t.value,
        label: t.label,
        icon: t.icon,
        badge: t.count === undefined ? undefined : { label: t.count.toLocaleString(), variant: 'soft' as const, color: 'neutral' as const },
    }))
})
const tab = ref<string>('routes')
watchEffect(() => {
    if (tabs.value.length && !tabs.value.some((t) => t.value === tab.value)) tab.value = String(tabs.value[0]!.value)
})

type Any = Record<string, unknown>
const lists = {
    routes: useApiList<Any>({ path: '/bus/routes', workspaceScoped: true, query: { company_id: id } }),
    trips: useApiList<Any>({ path: '/bus/trips', workspaceScoped: true, query: { company_id: id } }),
    bus_types: useApiList<Any>({ path: '/seat-layouts', workspaceScoped: true, query: { company_id: id } }),
    buses: useApiList<Any>({ path: '/vehicles', workspaceScoped: true, query: { company_id: id } }),
    bookings: useApiList<Any>({ path: '/bus/bookings', workspaceScoped: true, query: { company_id: id } }),
}
type TabKey = keyof typeof lists
const tabKey = computed<TabKey>(() => (tab.value in lists ? tab.value : 'routes') as TabKey)
// Each tab reads its list the first time it is opened.
const loaded = new Set<TabKey>()
watch(tabKey, (t) => {
    if (loaded.has(t)) return
    loaded.add(t)
    lists[t].load()
}, { immediate: true })
const active = computed(() => lists[tabKey.value])

const str = (v: unknown) => (v === null || v === undefined || v === '' ? '-' : String(v))
const badge = (text: string, color: string) => h(resolveComponent('UBadge'), { label: text, color, variant: 'soft' })
const viewLink = (to: string) => h('div', { class: 'text-right' }, h(resolveComponent('UButton'), { label: 'View', to, variant: 'link', size: 'xs' }))
const tabColumns: Record<TabKey, TableColumn<Any>[]> = {
    routes: [
        { accessorKey: 'id', header: 'ID' },
        { accessorKey: 'destination_name', header: 'Name' },
        { accessorKey: 'code', header: 'Code', cell: ({ row }) => str(row.original.code) },
        { accessorKey: 'zone', header: 'Zone', cell: ({ row }) => str(row.original.zone) },
    ],
    trips: [
        { id: 'date', header: 'Date', cell: ({ row }) => klTime(row.original.departs_at as string, { day: '2-digit', month: '2-digit', year: 'numeric' }) },
        { id: 'time', header: 'Time', cell: ({ row }) => klTime(row.original.departs_at as string, { hour: '2-digit', minute: '2-digit' }) },
        { accessorKey: 'zone', header: 'Zone', cell: ({ row }) => str(row.original.zone ?? row.original.destination) },
        { accessorKey: 'trip_no', header: 'Trip No', cell: ({ row }) => str(row.original.trip_no) },
        { accessorKey: 'plate_no', header: 'Plate', cell: ({ row }) => str(row.original.plate_no) },
        { accessorKey: 'platform', header: 'Platform', cell: ({ row }) => str(row.original.platform) },
        { id: 'seats', header: 'Seats', cell: ({ row }) => `${str(row.original.available_seats)}/${str(row.original.capacity)}` },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => badge(tripStatusLabels[row.original.status as string] ?? str(row.original.status), tripStatusColor(row.original.status as string)),
        },
        { id: 'view', header: '', cell: ({ row }) => viewLink(resolveTo(`/trips/${row.original.uuid}`)) },
    ],
    bus_types: [
        { accessorKey: 'id', header: 'ID' },
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'seat_count', header: 'Total Seats', cell: ({ row }) => str(row.original.seat_count) },
    ],
    buses: [
        { accessorKey: 'id', header: 'ID' },
        { accessorKey: 'plate_no', header: 'Plate Number', cell: ({ row }) => str(row.original.plate_no) },
        { accessorKey: 'bus_type', header: 'Bus Type', cell: ({ row }) => str(row.original.bus_type) },
        { accessorKey: 'status', header: 'Status', cell: ({ row }) => (row.original.status === 'active' ? badge('Active', 'success') : badge('Disabled', 'neutral')) },
    ],
    bookings: [
        { accessorKey: 'code', header: 'Code', cell: ({ row }) => h('span', { class: 'font-medium text-gray-800 dark:text-white' }, str(row.original.code)) },
        { accessorKey: 'contact_name', header: 'Customer', cell: ({ row }) => str(row.original.contact_name) },
        { accessorKey: 'zone', header: 'Zone', cell: ({ row }) => str(row.original.zone) },
        { id: 'date', header: 'Date', cell: ({ row }) => klTime(row.original.departs_at as string, { day: '2-digit', month: '2-digit', year: 'numeric' }) },
        { accessorKey: 'total_sen', header: 'Total', cell: ({ row }) => h('span', { class: 'font-semibold' }, formatSen(row.original.total_sen as number)) },
        {
            accessorKey: 'status',
            header: 'Payment',
            cell: ({ row }) => badge(orderStatusLabels[row.original.status as string] ?? str(row.original.status), orderStatusColor(row.original.status as string)),
        },
    ],
}
const empty: Record<TabKey, string> = {
    routes: 'No routes found for this company.',
    trips: 'No trips found for this company.',
    bus_types: "No bus types used by this company's trips.",
    buses: 'No buses found for this company.',
    bookings: 'No bookings found for this company.',
}

onMounted(() => {
    loadCompany()
    if (canCredit.value) creditLog.load()
})

const card = 'rounded-2xl border border-(--ops-border) bg-(--ops-card)'
</script>

<template>
    <div>
        <OpsBreadcrumb :title="company?.name ?? 'Company'" :parent="{ label: 'Companies', to: resolveTo('/operators') }" />
        <UAlert v-if="error" class="mb-6" color="error" variant="soft" icon="i-bx-alert-circle" :title="error" />

        <!-- Stat cards -->
        <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div v-for="s in stats" :key="s.label" :class="card" class="p-5">
                <div class="flex items-center gap-3">
                    <div class="flex size-11 items-center justify-center rounded-xl" :class="s.tone">
                        <UIcon :name="s.icon" class="size-6" />
                    </div>
                    <div>
                        <p class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ s.label }}</p>
                        <p class="mt-0.5 text-2xl font-bold text-gray-800 dark:text-white/90">{{ s.value }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Company info + actions -->
        <div :class="card" class="mb-6 p-6">
            <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="flex items-center gap-4">
                    <img v-if="company?.logo_url" :src="company.logo_url" :alt="company.name" class="size-16 rounded-xl border border-(--ops-border) object-contain">
                    <div v-else class="flex size-16 items-center justify-center rounded-xl bg-primary/10">
                        <UIcon name="i-bx-buildings" class="size-8 text-primary" />
                    </div>
                    <div>
                        <h2 class="text-xl font-bold text-gray-800 dark:text-white/90">{{ company?.name ?? '…' }}</h2>
                        <p v-if="company?.operator_code" class="text-sm text-gray-500">
                            Code: <span class="font-mono font-semibold text-gray-700 dark:text-gray-300">{{ company.operator_code }}</span>
                        </p>
                        <p v-if="company?.system_provider" class="mt-0.5 text-sm text-gray-500">
                            System Provider: <span class="font-semibold text-gray-700 dark:text-gray-300">{{ company.system_provider }}</span>
                        </p>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2">
                    <UButton label="Back" icon="i-bx-arrow-back" color="neutral" variant="outline" :to="resolveTo('/operators')" />
                </div>
            </div>
        </div>

        <!-- Credit Balance -->
        <div v-if="canCredit && company" :class="card" class="mb-6 p-6">
            <div class="flex flex-wrap items-center justify-between gap-4 border-b border-(--ops-border) pb-4">
                <div>
                    <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Credit Balance</p>
                    <p class="mt-0.5 text-2xl font-bold" :class="(company.credit_balance_sen ?? 0) < 0 ? 'text-error' : 'text-gray-800 dark:text-white/90'">
                        {{ company.credit_balance_sen === null ? '-' : formatSen(company.credit_balance_sen) }}
                    </p>
                </div>
                <form class="flex items-end gap-2" @submit.prevent="updateBalance">
                    <UFormField label="Add Credit (use negative to deduct)" :error="amountError ?? undefined">
                        <UInput v-model="amount" type="number" step="0.01" placeholder="0.00" class="w-40" />
                    </UFormField>
                    <UButton type="submit" label="Update" icon="i-bx-plus" :loading="saving" />
                </form>
            </div>
            <div class="mt-4">
                <h3 class="mb-3 text-base font-semibold text-gray-800 dark:text-white/90">Credit Log</h3>
                <UTable :data="creditLog.rows.value" :columns="logColumns" :loading="creditLog.pending.value" empty="No credit log entries." />
                <OpsPagination
                    v-if="creditLog.pagination.value && creditLog.pagination.value.total > 0"
                    :meta="creditLog.pagination.value"
                    :loading="creditLog.pending.value"
                    @page="creditLog.load"
                />
            </div>
        </div>

        <!-- Operator Accounts -->
        <div v-if="company && can('bus.operators.write')" :class="card" class="mb-6 p-6">
            <div class="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">Operator Accounts</h3>
                    <p class="mt-0.5 text-xs text-gray-500">
                        Users tied to this company see only its trips and credit logs, and can submit credit top-up requests.
                        Set by giving the user a role scoped to this company (Users → edit).
                    </p>
                </div>
                <UButton :to="resolveTo('/top-up-requests')" icon="i-bx-wallet" color="neutral" variant="outline">
                    Top-up Requests
                    <UBadge v-if="company.pending_topups > 0" :label="`${company.pending_topups} pending`" color="warning" variant="soft" size="sm" />
                </UButton>
            </div>
            <div class="mt-4">
                <p v-if="!company.operator_users.length" class="text-sm text-gray-500">
                    No operator accounts yet. Create a user with the Operator role and scope it to this company.
                </p>
                <ul v-else class="divide-y divide-(--ops-border)">
                    <li v-for="u in company.operator_users" :key="u.uuid" class="py-2">
                        <p class="text-sm font-medium text-gray-800 dark:text-white">{{ u.name }}</p>
                        <p class="text-xs text-gray-500">{{ u.email ?? '-' }}</p>
                    </li>
                </ul>
            </div>
        </div>

        <!-- Custom Pricing -->
        <div v-if="company?.pricing.zones.length" :class="card" class="mb-6 p-6">
            <h3 class="mb-4 border-b border-(--ops-border) pb-2 text-base font-semibold text-gray-800 dark:text-white/90">Custom Pricing</h3>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="border-b border-(--ops-border) text-left">
                            <th class="pb-2 pr-4 font-medium text-gray-500">Zone</th>
                            <th v-for="t in company.pricing.types" :key="t.key" class="pb-2 pr-4 font-medium text-gray-500">{{ t.label }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="z in company.pricing.zones" :key="z.zone" class="border-b border-(--ops-border)">
                            <td class="py-2 pr-4 font-medium text-gray-800 dark:text-white">{{ z.zone }}</td>
                            <td v-for="t in company.pricing.types" :key="t.key" class="py-2 pr-4 text-gray-700 dark:text-gray-300">
                                {{ z.prices[t.key] === null || z.prices[t.key] === undefined ? '-' : formatSen(z.prices[t.key]!) }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Tabs -->
        <div v-if="tabs.length" :class="card">
            <UTabs
                v-model="tab"
                :items="tabs"
                variant="link"
                :content="false"
                :ui="{ list: 'border-b border-(--ops-border) px-4 overflow-x-auto', trigger: 'py-3.5 whitespace-nowrap' }"
            />
            <div class="p-6">
                <UTable :key="tabKey" :data="active.rows.value" :columns="tabColumns[tabKey]" :loading="active.pending.value" :empty="empty[tabKey]" />
                <OpsPagination v-if="active.pagination.value && active.pagination.value.total > 0" :meta="active.pagination.value" :loading="active.pending.value" @page="active.load" />
            </div>
        </div>
    </div>
</template>
