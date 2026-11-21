<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Clients (doc 19): corporate clients (Genting and others) whose bookings go on a monthly statement, and the partners
// and fleet owners that take transferred jobs. Add and edit; open a client's monthly statement. GET/POST /clients,
// PATCH /clients/{id}, GET /clients/{id}/statement. Permission: fleet.clients.read / write (doc 27).
useHead({ title: 'Clients' })

interface Row extends Record<string, unknown> {
    id: number
    type: string
    name: string
    ssm_no: string | null
    tin: string | null
    contact_email: string | null
    contact_phone: string | null
    credit_limit_sen: number | null
    status: string
}

const TYPES = [{ label: 'Corporate clients', value: 'corporate_client' }, { label: 'Partners', value: 'partner' }, { label: 'Fleet owners', value: 'fleet_owner' }]
const api = useFleetApi()
const toast = useToast()
const { can } = useMe()
const canWrite = computed(() => can('fleet.clients.write'))

const search = ref('')
const type = ref('corporate_client')
const list = useApiList<Row>({ search, path: '/clients', workspaceScoped: true, query: () => ({ type: type.value }) })
onMounted(() => list.load())
watch(type, () => list.load())
const reload = () => list.load(list.pagination.value?.current_page ?? 1)

const editing = ref<Row | null>(null)
const { form, fieldError, show, submit } = useFormModal(() => ({ type: 'corporate_client', name: '', ssm_no: '', tin: '', contact_email: '', contact_phone: '', credit_rm: '', status: 'active' }))
function open(row?: Row) {
    editing.value = row ?? null
    show(row ? { type: row.type, name: row.name, ssm_no: row.ssm_no ?? '', tin: row.tin ?? '', contact_email: row.contact_email ?? '', contact_phone: row.contact_phone ?? '', credit_rm: toRm(row.credit_limit_sen), status: row.status } : { type: type.value })
}
async function save() {
    const saved = await submit(async (d) => {
        const body = { name: d.name, ssm_no: d.ssm_no || null, tin: d.tin || null, contact_email: d.contact_email || null, contact_phone: d.contact_phone || null, credit_limit_sen: toSen(d.credit_rm), status: d.status }
        if (editing.value) await api.patch(`/clients/${editing.value.id}`, body)
        else await api.post('/clients', { ...body, type: d.type })
    })
    if (saved) {
        toast.add({ title: `${form.data.name} saved`, color: 'success' })
        await reload()
    }
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'ssm_no', header: 'SSM' },
    { accessorKey: 'tin', header: 'TIN' },
    { id: 'contact', header: 'Contact', cell: ({ row }) => [row.original.contact_email, row.original.contact_phone].filter(Boolean).join(' · ') || '—' },
    { accessorKey: 'credit_limit_sen', header: 'Credit limit', cell: ({ row }) => (row.original.credit_limit_sen ? formatSen(row.original.credit_limit_sen) : '—') },
    { accessorKey: 'status', header: 'Status' },
    actionsColumn<Row>((row) => [
        ...(row.type === 'corporate_client' ? [{ label: 'Statement', icon: 'i-bx-file-detail', onSelect: () => navigateTo(`/clients/${row.id}/statement`) }] : []),
        ...(canWrite.value ? [{ label: 'Edit', icon: 'i-bx-edit', onSelect: () => open(row) }] : []),
    ]),
]
</script>

<template>
    <OpsListPage v-model:search="search" title="Clients" subject="clients" :rows="list.rows.value" :columns="columns" :loading="list.pending.value" :pagination="list.pagination.value" :can-export="false" @page="list.load">
        <template #actions>
            <USelect v-model="type" :items="TYPES" class="w-44" />
            <UButton v-if="canWrite" label="Add" icon="i-bx-plus" @click="open()" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" :title="editing ? `Edit ${editing.name}` : 'Add Client'" :saving="form.saving" :error="form.error" submit-label="Save" @submit="save">
        <OpsFormField v-if="!editing" label="Kind" required :error="fieldError('type')"><USelect v-model="form.data.type" :items="TYPES" class="w-full" /></OpsFormField>
        <OpsFormField label="Name" required :error="fieldError('name')"><UInput v-model="form.data.name" class="w-full" /></OpsFormField>
        <OpsFormField label="SSM no." :error="fieldError('ssm_no')"><UInput v-model="form.data.ssm_no" class="w-full" /></OpsFormField>
        <OpsFormField label="TIN (for e-invoices)" :error="fieldError('tin')"><UInput v-model="form.data.tin" class="w-full" /></OpsFormField>
        <OpsFormField label="Email" :error="fieldError('contact_email')"><UInput v-model="form.data.contact_email" type="email" class="w-full" /></OpsFormField>
        <OpsFormField label="Phone" :error="fieldError('contact_phone')"><UInput v-model="form.data.contact_phone" class="w-full" /></OpsFormField>
        <OpsFormField label="Credit limit (RM)" :error="fieldError('credit_limit_sen')"><UInput v-model="form.data.credit_rm" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
        <OpsFormField label="Status" :error="fieldError('status')"><USelect v-model="form.data.status" :items="[{ label: 'Active', value: 'active' }, { label: 'Suspended', value: 'suspended' }]" class="w-full" /></OpsFormField>
    </OpsFormModal>
</template>
