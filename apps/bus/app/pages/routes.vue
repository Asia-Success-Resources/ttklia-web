<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { OpsListFilter } from '~/types/list'

// Routes, as ttklia-v2's admin/bus/routes index (BusRoute $indexFields): ID, Location(s), Code, Zone, Company,
// Platform, then APAD (doc 23) and Actions. Search: code, location. Filter: Company, Zone.
// TODO: v2's edit form and Duplicate action come with the form pages.
// Routes: departure and arrival routes (table `bus_routes`). Permission: bus.routes.read (doc 27).
// Each route shows whether APAD has verified it (doc 23). Staff with bus.routes.apad_verify record APAD's approval and
// permit number; until then, a ticket collected on the route is reported to APAD quietly.
// GET /api/ops/w/{workspace}/bus/routes, POST …/bus/routes/{id}/apad (ttklia-api).
useHead({ title: 'Routes' })

interface Row extends Record<string, unknown> {
    id: number
    code: string
    destination_name: string
    direction: string
    origin_name: string | null
    typical_travel_minutes: number | null
    operator_route_ref: string | null
    zone: string | null
    company: string | null
    platform: string | null
    apad_status: 'verified' | 'not_verified'
    apad_permit_no: string | null
    apad_permit_expires_on: string | null
}

const api = useApi()
const toast = useToast()
const { can } = useMe()
const { slug } = useWorkspace()
const path = (p: string) => api.workspacePath(slug.value ?? '', p)
const today = new Date().toISOString().slice(0, 10)

const apad = (r: Row) => {
    const expired = r.apad_permit_expires_on && r.apad_permit_expires_on < today
    const verified = r.apad_status === 'verified' && !expired
    return h('div', [
        h(resolveComponent('UBadge'), { color: verified ? 'success' : 'warning', variant: 'soft', size: 'sm' }, () => (verified ? 'Verified' : expired ? 'Permit expired' : 'Not verified')),
        r.apad_permit_no ? h('div', { class: 'text-xs text-gray-500' }, `${r.apad_permit_no}${r.apad_permit_expires_on ? ` · to ${formatDate(r.apad_permit_expires_on)}` : ''}`) : null,
    ])
}

const { form, fieldError, show, submit } = useFormModal(() => ({ id: 0, code: '', apad_status: 'verified', apad_permit_no: '', apad_permit_expires_on: '' }))
async function save() {
    const ok = await submit((d) => api.post(path(`/bus/routes/${d.id}/apad`), {
        apad_status: d.apad_status, apad_permit_no: d.apad_permit_no || null, apad_permit_expires_on: d.apad_permit_expires_on || null,
    }))
    if (ok) {
        toast.add({ title: 'APAD approval saved', color: 'success' })
        await list.load(list.pagination.value?.current_page ?? 1)
    }
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'destination_name', header: 'Location(s)' },
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'zone', header: 'Zone', cell: ({ row }) => row.original.zone ?? '-' },
    { accessorKey: 'company', header: 'Company', cell: ({ row }) => row.original.company ?? '-' },
    { accessorKey: 'platform', header: 'Platform', cell: ({ row }) => row.original.platform ?? '-' },
    { accessorKey: 'apad_status', header: 'APAD', cell: ({ row }) => apad(row.original) },
    actionsColumn<Row>((row) => (can('bus.routes.apad_verify') ? [{
        label: 'APAD approval', icon: 'i-bx-badge-check',
        onSelect: () => show({ id: row.id, code: row.code, apad_status: row.apad_status, apad_permit_no: row.apad_permit_no ?? '', apad_permit_expires_on: row.apad_permit_expires_on ?? '' }),
    }] : [])),
]

const options = useBusOptions()
const filters = computed<OpsListFilter[]>(() => [
    { key: 'company_id', label: 'Company', items: options.operators.value },
    { key: 'zone_id', label: 'Zone', items: options.zones.value },
])
const filterValues = ref<Record<string, string | undefined>>({})

const search = ref('')
const list = useApiList<Row>({ search, path: '/bus/routes', workspaceScoped: true, query: () => chosen(filterValues.value) })
onMounted(() => {
    list.load()
    options.load('operators', 'zones')
})
</script>

<template>
    <OpsListPage
        v-model:search="search"
        v-model:filter-values="filterValues"
        title="Routes"
        subject="route"
        :filters="filters"
        @filter="list.load()"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        @page="list.load"
    />
    <OpsFormModal v-model:open="form.open" :title="`APAD approval: ${form.data.code}`" :saving="form.saving" :error="form.error" submit-label="Save" @submit="save">
        <OpsFormField label="Status" required :error="fieldError('apad_status')">
            <USelect v-model="form.data.apad_status" :items="[{ label: 'Verified by APAD', value: 'verified' }, { label: 'Not verified', value: 'not_verified' }]" class="w-full" />
        </OpsFormField>
        <OpsFormField label="APAD approval or permit no." :required="form.data.apad_status === 'verified'" :error="fieldError('apad_permit_no')"><UInput v-model="form.data.apad_permit_no" class="w-full" /></OpsFormField>
        <OpsFormField label="Permit expires on" :error="fieldError('apad_permit_expires_on')"><UInput v-model="form.data.apad_permit_expires_on" type="date" class="w-full" /></OpsFormField>
    </OpsFormModal>
</template>
