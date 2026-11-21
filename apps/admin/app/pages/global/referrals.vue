<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Referrals (doc 31 "Reports"): every code with its uses, the uses in the chosen dates, how many of those new users
// paid for an order and their order total. Disable or enable a code; give a code to someone who has none.
// Permission: global.referrals.read / write.
// TODO(pending: R3) see doc 30.
// TODO(pending: R4) see doc 30.
useHead({ title: 'Referrals' })

interface Row extends Record<string, unknown> {
    id: number
    code: string
    kind: string
    owner_name: string | null
    uses_count: number
    uses_in_range: number
    paid_users: number
    paid_total_sen: number
    status: string
}
interface Use extends Record<string, unknown> {
    registered_at: string
    user_name: string | null
    channel: string
    status: string
    reject_reason: string | null
    first_paid_at: string | null
}

const { can } = useMe()
const api = useApi()
const toast = useToast()

const search = ref('')
const kind = ref<string | undefined>(undefined)
const from = ref('')
const to = ref('')
const list = useApiList<Row>({ search, path: '/admin/referrals', query: () => ({ kind: kind.value, from: from.value || undefined, to: to.value || undefined }) })
onMounted(() => list.load())
watch([kind, from, to], () => list.load())

const reload = () => list.load(list.pagination.value?.current_page ?? 1)
async function setStatus(row: Row, status: string) {
    try {
        await api.patch(`/admin/referrals/${row.id}`, { status })
        toast.add({ title: `${row.code} ${status === 'active' ? 'enabled' : 'disabled'}`, color: 'success' })
        await reload()
    } catch (e) {
        toast.add({ title: toProblem(e)?.detail ?? 'Unable to change it', color: 'error' })
    }
}

// Who used a code.
const usesOf = ref<Row | null>(null)
const uses = ref<Use[]>([])
async function openUses(row: Row) {
    usesOf.value = row
    uses.value = []
    try {
        uses.value = (await api.get<{ data: Use[] }>(`/admin/referrals/${row.id}/uses`, { limit: 100 })).data
    } catch (e) {
        toast.add({ title: toProblem(e)?.detail ?? 'Unable to load the uses', color: 'error' })
    }
}

// Give a user a code.
// Staff from Global → Users, customers from Global → Customers.
type Person = { uuid: string; name: string; email: string | null }
const staff = useApiAll<Person>({ path: '/admin/users' })
const customers = useApiAll<Person>({ path: '/admin/customers', max: 500 })
const { form, fieldError, show, submit } = useFormModal(() => ({ user_uuid: undefined as string | undefined, kind: 'staff' }))
async function openCreate() {
    if (!staff.rows.value.length) await staff.load()
    show()
}
watch(() => form.data.kind, async (k) => {
    form.data.user_uuid = undefined
    if (k === 'customer' && !customers.rows.value.length) await customers.load()
})
async function save() {
    if (await submit((d) => api.post('/admin/referrals', d))) {
        toast.add({ title: 'Code created', color: 'success' })
        await list.load()
    }
}
const userItems = computed(() =>
    (form.data.kind === 'staff' ? staff : customers).rows.value.map((u) => ({ label: `${u.name}${u.email ? ` · ${u.email}` : ''}`, value: u.uuid })),
)

const columns: TableColumn<Row>[] = [
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'owner_name', header: 'Owner' },
    { accessorKey: 'kind', header: 'Kind', cell: ({ row }) => statusLabel(row.original.kind) },
    { accessorKey: 'uses_count', header: 'Uses (all time)' },
    { accessorKey: 'uses_in_range', header: 'Uses (dates)' },
    { accessorKey: 'paid_users', header: 'Paid users' },
    { accessorKey: 'paid_total_sen', header: 'Their orders (RM)', cell: ({ row }) => formatSen(row.original.paid_total_sen) },
    { accessorKey: 'status', header: 'Status' },
    actionsColumn<Row>((row) => [
        { label: 'Who used it', icon: 'i-bx-group', onSelect: () => openUses(row) },
        ...(can('global.referrals.write')
            ? [row.status === 'active'
                ? { label: 'Disable', icon: 'i-bx-block', color: 'error' as const, onSelect: () => setStatus(row, 'disabled') }
                : { label: 'Enable', icon: 'i-bx-check', onSelect: () => setStatus(row, 'active') }]
            : []),
    ]),
]
const useColumns: TableColumn<Use>[] = [
    { accessorKey: 'registered_at', header: 'Registered', cell: ({ row }) => formatDateTime(row.original.registered_at) },
    { accessorKey: 'user_name', header: 'New user' },
    { accessorKey: 'channel', header: 'Channel', cell: ({ row }) => statusLabel(row.original.channel) },
    { accessorKey: 'first_paid_at', header: 'First paid order', cell: ({ row }) => (row.original.first_paid_at ? formatDate(row.original.first_paid_at) : '—') },
    { accessorKey: 'status', header: 'Counted', cell: ({ row }) => (row.original.status === 'counted' ? 'Yes' : `No: ${row.original.reject_reason ?? ''}`) },
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Referrals"
        subject="referral codes"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        note="Waiting on: R3, R4 (doc 30)."
        @page="list.load"
    >
        <template #actions>
            <USelect v-model="kind" :items="[{ label: 'All codes', value: undefined }, { label: 'Staff', value: 'staff' }, { label: 'Customer', value: 'customer' }]" class="w-32" />
            <UInput v-model="from" type="date" class="w-40" aria-label="From" />
            <UInput v-model="to" type="date" class="w-40" aria-label="To" />
            <UButton v-if="can('global.referrals.write')" label="Create" icon="i-bx-plus" @click="openCreate" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" title="Give a Referral Code" :saving="form.saving" :error="form.error" submit-label="Create Code" @submit="save">
         <OpsFormField label="Person" required full :error="fieldError('user_id')">
            <USelectMenu v-model="form.data.user_uuid" :items="userItems" value-key="value" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Kind" required :error="fieldError('kind')">
            <USelect v-model="form.data.kind" :items="[{ label: 'Staff', value: 'staff' }, { label: 'Customer', value: 'customer' }]" class="w-full" />
        </OpsFormField>
    </OpsFormModal>

    <UModal :open="!!usesOf" :title="usesOf ? `Who used ${usesOf.code}` : ''" :ui="{ content: 'sm:max-w-3xl' }" @update:open="(v) => { if (!v) usesOf = null }">
        <template #body>
            <UTable :data="uses" :columns="useColumns" empty="Nobody has registered with this code yet" />
        </template>
    </UModal>
</template>
