<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Vendors: onboarding (organisations of type vendor, doc 32). Each vendor has outlets and vendor users.
// Permission: vendors.manage.read / write (doc 27, doc 32).
useHead({ title: 'Vendors' })

interface Row extends Record<string, unknown> {
    id: number
    name: string
    ssm_no: string | null
    tin: string | null
    sst_no: string | null
    contact_email: string | null
    contact_phone: string | null
    outlets_count: number
    status: string
}

const { can } = useMe()
const api = useApi()
const toast = useToast()

const search = ref('')
const list = useApiList<Row>({ search, path: '/admin/vendors' })
onMounted(() => list.load())

const editing = ref<Row | null>(null)
const { form, fieldError, show, submit } = useFormModal(() => ({ name: '', ssm_no: '', tin: '', sst_no: '', contact_email: '', contact_phone: '', status: 'active' }))
function open(row?: Row) {
    editing.value = row ?? null
    show(
        row
            ? {
                  name: row.name,
                  ssm_no: row.ssm_no ?? '',
                  tin: row.tin ?? '',
                  sst_no: row.sst_no ?? '',
                  contact_email: row.contact_email ?? '',
                  contact_phone: row.contact_phone ?? '',
                  status: row.status,
              }
            : {},
    )
}
async function save() {
    let created: number | null = null
    const saved = await submit(async (d) => {
        const body = { ...d, tin: d.tin || null, sst_no: d.sst_no || null, contact_phone: d.contact_phone || null }
        if (editing.value) await api.patch(`/admin/vendors/${editing.value.id}`, body)
        else created = (await api.post<{ data: { id: number } }>('/admin/vendors', body)).data.id
    })
    if (!saved) return
    toast.add({ title: `${form.data.name} saved`, color: 'success' })
    if (created) await navigateTo(`/global/vendors/${created}/outlets`)
    else await list.load(list.pagination.value?.current_page ?? 1)
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'name', header: 'Vendor' },
    { accessorKey: 'ssm_no', header: 'SSM no' },
    { accessorKey: 'contact_email', header: 'Contact' },
    { accessorKey: 'outlets_count', header: 'Outlets' },
    { accessorKey: 'status', header: 'Status' },
    actionsColumn<Row>((row) => [
        { label: 'Outlets', icon: 'i-bx-store', onSelect: () => navigateTo(`/global/vendors/${row.id}/outlets`) },
        { label: 'Vendor users', icon: 'i-bx-group', onSelect: () => navigateTo(`/global/vendors/${row.id}/users`) },
        ...(can('vendors.manage.write') ? [{ label: 'Edit', icon: 'i-bx-edit', onSelect: () => open(row) }] : []),
    ]),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Vendors"
        subject="vendors"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        @page="list.load"
    >
        <template #actions>
            <UButton v-if="can('vendors.manage.write')" label="Create" icon="i-bx-plus" @click="open()" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" :title="editing ? 'Edit Vendor' : 'New Vendor'" :saving="form.saving" :error="form.error" submit-label="Save Vendor" @submit="save">
        <OpsFormField label="Business name" required full :error="fieldError('name')"><UInput v-model="form.data.name" class="w-full" /></OpsFormField>
        <OpsFormField label="SSM no" required :error="fieldError('ssm_no')"><UInput v-model="form.data.ssm_no" class="w-full" /></OpsFormField>
        <OpsFormField label="TIN" :error="fieldError('tin')"><UInput v-model="form.data.tin" class="w-full" /></OpsFormField>
        <OpsFormField label="SST no" :error="fieldError('sst_no')"><UInput v-model="form.data.sst_no" class="w-full" /></OpsFormField>
        <OpsFormField label="Contact email" required :error="fieldError('contact_email')"><UInput v-model="form.data.contact_email" type="email" class="w-full" /></OpsFormField>
        <OpsFormField label="Contact phone" :error="fieldError('contact_phone')"><UInput v-model="form.data.contact_phone" class="w-full" /></OpsFormField>
        <OpsFormField v-if="editing" label="Status" :error="fieldError('status')">
            <OpsStatusToggle :model-value="form.data.status === 'active'" active-label="Active" inactive-label="Suspended" @update:model-value="(v) => (form.data.status = v ? 'active' : 'suspended')" />
        </OpsFormField>
    </OpsFormModal>
</template>
