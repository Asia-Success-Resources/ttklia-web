<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// One customer: details, what they spent per business, points, and their orders in every workspace.
// GET /api/admin/customers/{uuid}, …/orders; POST …/block. Permission: global.customers.read / .write (doc 27).
useHead({ title: 'Customer' })

interface Customer { uuid: string; name: string; email: string | null; phone_e164: string | null; locale: string; status: string; created_at: string; points: number; spend: { workspace: string; orders: number; total_sen: number }[] }
interface OrderRow extends Record<string, unknown> { uuid: string; workspace: string; channel: string; total_sen: number; status: string; created_at: string }

const route = useRoute()
const uuid = computed(() => String(route.params.id ?? ''))
const api = useApi()
const { can } = useMe()
const customer = ref<Customer | null>(null)
const error = ref<string | null>(null)
const busy = ref(false)
const orders = useApiList<OrderRow>({ path: `/admin/customers/${uuid.value}/orders` })

const fields = computed(() => [
    { label: 'Name', value: customer.value?.name ?? null },
    { label: 'Email', value: customer.value?.email ?? null },
    { label: 'Phone', value: customer.value?.phone_e164 ?? null },
    { label: 'Language', value: customer.value?.locale ?? null },
    { label: 'Status', value: customer.value?.status ?? null },
    { label: 'Points', value: customer.value ? customer.value.points.toLocaleString('en-MY') : null },
    { label: 'Spent', value: customer.value ? customer.value.spend.map((s) => `${s.workspace} ${formatSen(s.total_sen)} (${s.orders})`).join(', ') || '-' : null },
    { label: 'Customer since', value: customer.value ? formatDate(customer.value.created_at) : null },
])
const columns: TableColumn<OrderRow>[] = [
    { accessorKey: 'created_at', header: 'Date' },
    { accessorKey: 'workspace', header: 'Workspace' },
    { accessorKey: 'channel', header: 'Channel' },
    { accessorKey: 'total_sen', header: 'Total', cell: ({ row }) => formatSen(row.original.total_sen) },
    { accessorKey: 'status', header: 'Status' },
]

async function load() {
    try {
        customer.value = (await api.get<{ data: Customer }>(`/admin/customers/${uuid.value}`)).data
    } catch (e) {
        error.value = toProblem(e)?.detail ?? 'Unable to load the customer.'
    }
}
onMounted(() => {
    load()
    orders.load()
})

async function toggleBlock() {
    if (!customer.value) return
    const blocking = customer.value.status === 'active'
    const reason = prompt(blocking ? 'Why block this customer?' : 'Why unblock this customer?')
    if (!reason) return
    busy.value = true
    try {
        await api.post(`/admin/customers/${uuid.value}/block`, { blocked: blocking, reason })
        await load()
    } catch (e) {
        error.value = toProblem(e)?.detail ?? 'Unable to change the customer.'
    } finally {
        busy.value = false
    }
}
</script>

<template>
    <OpsDetailPage :title="customer?.name ?? 'Customer'" :fields="fields">
        <template #actions>
            <UButton v-if="can('global.customers.write') && customer" :label="customer.status === 'active' ? 'Block' : 'Unblock'"
                icon="i-bx-block" :color="customer.status === 'active' ? 'error' : 'success'" variant="soft" :loading="busy" @click="toggleBlock" />
            <UAlert v-if="error" class="w-full" color="error" variant="soft" :title="error" />
        </template>
        <template #body>
            <div class="rounded-2xl border border-(--ops-border) bg-(--ops-card)">
                <h4 class="px-5 pt-5 text-lg font-semibold text-gray-800 dark:text-white/90">Orders</h4>
                <UTable :data="orders.rows.value" :columns="columns" :loading="orders.pending.value" empty="No orders." />
                <OpsPagination v-if="orders.pagination.value && orders.pagination.value.total > 0" :meta="orders.pagination.value" :loading="orders.pending.value" @page="orders.load" />
            </div>
        </template>
    </OpsDetailPage>
</template>
