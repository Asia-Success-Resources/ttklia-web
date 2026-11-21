<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Organisations: operators, companies, clients, partners, vendors (table `organisations`).
// Permission: finance.organisations.read / write (doc 27). Credit limit changes are recorded in audit_logs.
useHead({ title: 'Organisations' })

interface Row extends Record<string, unknown> {
    id: number
    type: string
    name: string
    ssm_no: string | null
    tin: string | null
    sst_no: string | null
    contact_email: string | null
    contact_phone: string | null
    credit_limit_sen: number | null
    wallet_balance_sen: number | null
    status: string
}

const TYPES = [
    { label: 'Bus operator', value: 'bus_operator' },
    { label: 'Taxi company', value: 'taxi_company' },
    { label: 'Fleet owner', value: 'fleet_owner' },
    { label: 'Corporate client', value: 'corporate_client' },
    { label: 'Partner', value: 'partner' },
    { label: 'Vendor', value: 'vendor' },
]

const { can } = useMe()
const api = useApi()
const toast = useToast()

const search = ref('')
const type = ref<string | undefined>(undefined)
const list = useApiList<Row>({ search, path: '/admin/finance/organisations', query: () => ({ type: type.value }) })
onMounted(() => list.load())
watch(type, () => list.load())

const editing = ref<Row | null>(null)
const { form, fieldError, show, submit } = useFormModal(() => ({
    type: 'corporate_client',
    name: '',
    ssm_no: '',
    tin: '',
    sst_no: '',
    contact_email: '',
    contact_phone: '',
    credit_limit_rm: '',
    status: 'active',
}))
function openCreate() {
    editing.value = null
    show()
}
function openEdit(row: Row) {
    editing.value = row
    show({
        type: row.type,
        name: row.name,
        ssm_no: row.ssm_no ?? '',
        tin: row.tin ?? '',
        sst_no: row.sst_no ?? '',
        contact_email: row.contact_email ?? '',
        contact_phone: row.contact_phone ?? '',
        credit_limit_rm: row.credit_limit_sen === null ? '' : String(row.credit_limit_sen / 100),
        status: row.status,
    })
}
async function save() {
    const saved = await submit(async (d) => {
        const body = {
            name: d.name,
            ssm_no: d.ssm_no || null,
            tin: d.tin || null,
            sst_no: d.sst_no || null,
            contact_email: d.contact_email || null,
            contact_phone: d.contact_phone || null,
            credit_limit_sen: d.credit_limit_rm === '' ? null : Math.round(Number(d.credit_limit_rm) * 100),
            status: d.status,
        }
        if (editing.value) await api.patch(`/admin/finance/organisations/${editing.value.id}`, body)
        else await api.post('/admin/finance/organisations', { ...body, type: d.type })
    })
    if (saved) {
        toast.add({ title: `${form.data.name} saved`, color: 'success' })
        await list.load(editing.value ? list.pagination.value?.current_page ?? 1 : 1)
    }
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'type', header: 'Type', cell: ({ row }) => statusLabel(row.original.type) },
    { accessorKey: 'ssm_no', header: 'SSM no' },
    { accessorKey: 'tin', header: 'TIN' },
    { accessorKey: 'contact_email', header: 'Contact email' },
    { accessorKey: 'credit_limit_sen', header: 'Credit limit (RM)', cell: ({ row }) => (row.original.credit_limit_sen === null ? '—' : formatSen(row.original.credit_limit_sen)) },
    { accessorKey: 'wallet_balance_sen', header: 'Credit held (RM)', cell: ({ row }) => (row.original.wallet_balance_sen === null ? '—' : formatSen(row.original.wallet_balance_sen)) },
    { accessorKey: 'status', header: 'Status' },
    actionsColumn<Row>((row) => (can('finance.organisations.write') ? [{ label: 'Edit', icon: 'i-bx-edit', onSelect: () => openEdit(row) }] : [])),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Organisations"
        subject="organisations"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        @page="list.load"
    >
        <template #actions>
            <USelect v-model="type" :items="[{ label: 'All types', value: undefined }, ...TYPES]" class="w-44" />
            <UButton v-if="can('finance.organisations.write')" label="Create" icon="i-bx-plus" @click="openCreate" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" :title="editing ? 'Edit Organisation' : 'New Organisation'" :saving="form.saving" :error="form.error" submit-label="Save Organisation" @submit="save">
        <OpsFormField label="Name" required full :error="fieldError('name')"><UInput v-model="form.data.name" class="w-full" /></OpsFormField>
        <OpsFormField label="Type" required :error="fieldError('type')">
            <USelect v-model="form.data.type" :items="TYPES" :disabled="!!editing" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Status" :error="fieldError('status')">
            <OpsStatusToggle :model-value="form.data.status === 'active'" active-label="Active" inactive-label="Suspended" @update:model-value="(v) => (form.data.status = v ? 'active' : 'suspended')" />
        </OpsFormField>
        <OpsFormField label="SSM no" :error="fieldError('ssm_no')"><UInput v-model="form.data.ssm_no" class="w-full" /></OpsFormField>
        <OpsFormField label="TIN" :error="fieldError('tin')"><UInput v-model="form.data.tin" class="w-full" /></OpsFormField>
        <OpsFormField label="SST no" :error="fieldError('sst_no')"><UInput v-model="form.data.sst_no" class="w-full" /></OpsFormField>
        <OpsFormField label="Credit limit (RM)" :error="fieldError('credit_limit_sen')"><UInput v-model="form.data.credit_limit_rm" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
        <OpsFormField label="Contact email" :error="fieldError('contact_email')"><UInput v-model="form.data.contact_email" type="email" class="w-full" /></OpsFormField>
        <OpsFormField label="Contact phone" :error="fieldError('contact_phone')"><UInput v-model="form.data.contact_phone" class="w-full" /></OpsFormField>
    </OpsFormModal>
</template>
