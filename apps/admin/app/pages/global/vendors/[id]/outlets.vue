<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Vendor outlets: unit, commission, collection mode, payout cycle (table `vendor_outlets`, doc 32).
// Permission: vendors.manage.read / write. Changes to commission, fee, collection or payout cycle go to audit_logs.
// Commission and fees are TODO(pending: M1); payout cycle TODO(pending: M3) doc 30.
useHead({ title: 'Vendor outlets' })

interface Row extends Record<string, unknown> {
    id: number
    workspace_id: number
    location_id: number
    code: string
    name: string
    unit_no: string | null
    category: string
    operated_by: string
    collection_mode: string
    commission_bp: number
    monthly_fee_sen: number
    payout_cycle: string
    sst_registered: boolean
    workspace_code: string | null
    status: string
}

const route = useRoute()
const vendorId = computed(() => Number(route.params.id))
const { can } = useMe()
const api = useApi()
const toast = useToast()

const vendor = ref<{ name: string } | null>(null)
onMounted(async () => {
    try {
        vendor.value = (await api.get<{ data: { name: string } }>(`/admin/vendors/${vendorId.value}`)).data
    } catch {
        vendor.value = null
    }
})

const search = ref('')
const list = useApiList<Row>({ search, path: '/admin/vendor-outlets', query: { vendor: '{id}' } })
onMounted(() => list.load())

// Where the outlet is: a workspace, then one of its locations.
const workspaces = useApiAll<{ id: number; slug: string; code: string; name: string }>({ path: '/admin/workspaces' })
const locations = ref<{ label: string; value: number }[]>([])
async function loadLocations(workspaceId?: number) {
    locations.value = []
    const ws = workspaces.rows.value.find((w) => w.id === workspaceId)
    if (!ws) return
    try {
        const res = await api.get<{ data: { id: number; name: string; code: string }[] }>(api.workspacePath(ws.slug, '/locations'), { limit: 100 })
        locations.value = res.data.map((l) => ({ label: `${l.code} · ${l.name}`, value: l.id }))
    } catch {
        locations.value = []
    }
}

const editing = ref<Row | null>(null)
const { form, fieldError, show, submit } = useFormModal(() => ({
    workspace_id: undefined as number | undefined,
    location_id: undefined as number | undefined,
    code: '',
    name: '',
    unit_no: '',
    category: 'food_beverage',
    operated_by: 'vendor',
    collection_mode: 'ttklia',
    commission_pct: '',
    monthly_fee_rm: '0',
    payout_cycle: 'monthly',
    sst_registered: false,
    status: 'onboarding',
}))
watch(() => form.data.workspace_id, (ws) => loadLocations(ws))
async function open(row?: Row) {
    if (!workspaces.rows.value.length) await workspaces.load()
    editing.value = row ?? null
    show(
        row
            ? {
                  workspace_id: row.workspace_id,
                  location_id: row.location_id,
                  code: row.code,
                  name: row.name,
                  unit_no: row.unit_no ?? '',
                  category: row.category,
                  operated_by: row.operated_by,
                  collection_mode: row.collection_mode,
                  commission_pct: String(row.commission_bp / 100),
                  monthly_fee_rm: String(row.monthly_fee_sen / 100),
                  payout_cycle: row.payout_cycle,
                  sst_registered: row.sst_registered,
                  status: row.status,
              }
            : {},
    )
    if (row) {
        await loadLocations(row.workspace_id)
        form.data.location_id = row.location_id
    }
}
async function save() {
    const saved = await submit(async (d) => {
        const body = {
            workspace_id: d.workspace_id,
            location_id: d.location_id,
            code: d.code,
            name: d.name,
            unit_no: d.unit_no || null,
            category: d.category,
            operated_by: d.operated_by,
            collection_mode: d.collection_mode,
            commission_bp: Math.round(Number(d.commission_pct || 0) * 100),
            monthly_fee_sen: Math.round(Number(d.monthly_fee_rm || 0) * 100),
            payout_cycle: d.payout_cycle,
            sst_registered: d.sst_registered,
            status: d.status,
        }
        if (editing.value) await api.patch(`/admin/vendor-outlets/${editing.value.id}`, body)
        else await api.post('/admin/vendor-outlets', { ...body, organisation_id: vendorId.value })
    })
    if (saved) {
        toast.add({ title: `${form.data.name} saved`, color: 'success' })
        await list.load()
    }
}

const workspaceItems = computed(() => workspaces.rows.value.map((w) => ({ label: `${w.code} · ${w.name}`, value: w.id })))
const columns: TableColumn<Row>[] = [
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'workspace_code', header: 'Workspace' },
    { accessorKey: 'unit_no', header: 'Unit' },
    { accessorKey: 'commission_bp', header: 'Commission', cell: ({ row }) => `${row.original.commission_bp / 100}%` },
    { accessorKey: 'monthly_fee_sen', header: 'Monthly fee (RM)', cell: ({ row }) => formatSen(row.original.monthly_fee_sen) },
    { accessorKey: 'collection_mode', header: 'Money collected by', cell: ({ row }) => (row.original.collection_mode === 'ttklia' ? 'TTKLIA' : 'Vendor') },
    { accessorKey: 'payout_cycle', header: 'Payout', cell: ({ row }) => statusLabel(row.original.payout_cycle) },
    { accessorKey: 'status', header: 'Status' },
    actionsColumn<Row>((row) => (can('vendors.manage.write') ? [{ label: 'Edit', icon: 'i-bx-edit', onSelect: () => open(row) }] : [])),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        :title="vendor ? `${vendor.name}: outlets` : 'Vendor outlets'"
        subject="outlets"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        note="Waiting on: M1 (commission and fees), M3 (payout cycle) (doc 30)."
        @page="list.load"
    >
        <template #actions>
            <UButton label="Vendor users" icon="i-bx-group" color="neutral" variant="outline" :to="`/global/vendors/${vendorId}/users`" />
            <UButton v-if="can('vendors.manage.write')" label="Create" icon="i-bx-plus" @click="open()" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" :title="editing ? 'Edit Outlet' : 'New Outlet'" wide :saving="form.saving" :error="form.error" submit-label="Save Outlet" @submit="save">
        <OpsFormField label="Outlet name" required :error="fieldError('name')"><UInput v-model="form.data.name" class="w-full" /></OpsFormField>
        <OpsFormField label="Code (on receipts)" required :error="fieldError('code')"><UInput v-model="form.data.code" class="w-full" /></OpsFormField>
        <OpsFormField label="Workspace" required :error="fieldError('workspace_id')">
            <USelectMenu v-model="form.data.workspace_id" :items="workspaceItems" value-key="value" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Location" required :error="fieldError('location_id')">
            <USelectMenu v-model="form.data.location_id" :items="locations" value-key="value" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Unit no" :error="fieldError('unit_no')"><UInput v-model="form.data.unit_no" class="w-full" /></OpsFormField>
        <OpsFormField label="Category" required :error="fieldError('category')">
            <USelect v-model="form.data.category" :items="[{ label: 'Food and beverage', value: 'food_beverage' }, { label: 'Retail', value: 'retail' }, { label: 'Services', value: 'services' }]" class="w-full" />
        </OpsFormField>

        <p class="pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:col-span-2">Terms</p>
        <OpsFormField label="Commission (%)" required :error="fieldError('commission_bp')"><UInput v-model="form.data.commission_pct" type="number" min="0" max="100" step="0.01" class="w-full" /></OpsFormField>
        <OpsFormField label="Monthly fee (RM)" :error="fieldError('monthly_fee_sen')"><UInput v-model="form.data.monthly_fee_rm" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
        <OpsFormField label="Money collected by" :error="fieldError('collection_mode')">
            <USelect v-model="form.data.collection_mode" :items="[{ label: 'TTKLIA (our tills and terminals)', value: 'ttklia' }, { label: 'Vendor (their own terminal)', value: 'vendor' }]" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Payout cycle" required :error="fieldError('payout_cycle')">
            <USelect v-model="form.data.payout_cycle" :items="[{ label: 'Weekly', value: 'weekly' }, { label: 'Fortnightly', value: 'fortnightly' }, { label: 'Monthly', value: 'monthly' }]" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Run by" :error="fieldError('operated_by')">
            <USelect v-model="form.data.operated_by" :items="[{ label: 'Vendor', value: 'vendor' }, { label: 'TTKLIA', value: 'ttklia' }]" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Status" :error="fieldError('status')">
            <USelect v-model="form.data.status" :items="[{ label: 'Onboarding', value: 'onboarding' }, { label: 'Active', value: 'active' }, { label: 'Suspended', value: 'suspended' }, { label: 'Closed', value: 'closed' }]" class="w-full" />
        </OpsFormField>
        <OpsFormField label="SST registered" :error="fieldError('sst_registered')">
            <OpsStatusToggle v-model="form.data.sst_registered" active-label="Yes" inactive-label="No" />
        </OpsFormField>
    </OpsFormModal>
</template>
