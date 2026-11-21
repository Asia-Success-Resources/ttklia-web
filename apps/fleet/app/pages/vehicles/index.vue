<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Vehicles (doc 19): the fleet's vans, MPVs (Alphard, Vellfire) and cars, with their class, seats, condition (for
// "must good condition" requests), toll class, open issues (red when one keeps it off the road), insurance and road
// tax expiry, and jobs in the last 30 days. Add, edit, retire. GET/POST /vehicles, PATCH /vehicles/{id}, DELETE
// (retire once used). Permission: fleet.vehicles.read / write (doc 27).
useHead({ title: 'Vehicles' })

interface Row extends Record<string, unknown> {
    id: number
    plate_no: string
    type: string
    vehicle_class: string
    make: string | null
    model: string | null
    year: number | null
    seats: number | null
    colour: string | null
    condition_grade: string | null
    toll_class: number | null
    status: string
    organisation_name: string | null
    open_issues: number
    blocked: boolean
    insurance_expires_on: string | null
    road_tax_expires_on: string | null
    jobs_30d: number
}

const api = useFleetApi()
const toast = useToast()
const { can } = useMe()
const canWrite = computed(() => can('fleet.vehicles.write'))

const search = ref('')
const type = ref<string | undefined>(undefined)
const status = ref<string | undefined>('active')
const list = useApiList<Row>({ search, path: '/vehicles', workspaceScoped: true, query: () => ({ type: type.value, status: status.value }) })
onMounted(() => list.load())
watch([type, status], () => list.load())
const reload = () => list.load(list.pagination.value?.current_page ?? 1)

const editing = ref<Row | null>(null)
const { form, fieldError, show, submit } = useFormModal(() => ({
    plate_no: '', type: 'mpv', vehicle_class: 'alphard', make: '', model: '', year: '', seats: '', colour: '', condition_grade: undefined as string | undefined, toll_class: '1', status: 'active',
}))
function open(row?: Row) {
    editing.value = row ?? null
    show(row ? {
        plate_no: row.plate_no, type: row.type, vehicle_class: row.vehicle_class, make: row.make ?? '', model: row.model ?? '', year: row.year ? String(row.year) : '',
        seats: row.seats ? String(row.seats) : '', colour: row.colour ?? '', condition_grade: row.condition_grade ?? undefined, toll_class: row.toll_class ? String(row.toll_class) : '', status: row.status,
    } : {})
}
async function save() {
    const saved = await submit(async (d) => {
        const n = (v: string) => (v ? Number(v) : null)
        const body = { plate_no: d.plate_no, type: d.type, vehicle_class: d.vehicle_class, make: d.make || null, model: d.model || null, year: n(d.year), seats: n(d.seats), colour: d.colour || null, condition_grade: d.condition_grade ?? null, toll_class: n(d.toll_class), status: d.status }
        if (editing.value) await api.patch(`/vehicles/${editing.value.id}`, body)
        else await api.post('/vehicles', body)
    })
    if (saved) {
        toast.add({ title: `${form.data.plate_no.toUpperCase()} saved`, color: 'success' })
        await reload()
    }
}
async function retire(row: Row) {
    if (!confirm(`Retire ${row.plate_no}? It is no longer offered for jobs.`)) return
    try {
        const res = await api.del<{ data: { result: string } }>(`/vehicles/${row.id}`)
        toast.add({ title: `${row.plate_no} ${res.data.result}`, color: 'success' })
        await reload()
    } catch (e) {
        toast.add({ title: fleetError(e), color: 'error' })
    }
}

const today = todayYmd()
const expiry = (d: string | null) => (d ? h('span', { class: d < today ? 'text-error font-medium' : '' }, formatDate(d)) : '—')
const columns: TableColumn<Row>[] = [
    { accessorKey: 'plate_no', header: 'Plate', cell: ({ row }) => h(resolveComponent('NuxtLink'), { to: `/vehicles/${row.original.id}`, class: 'font-medium hover:underline' }, () => row.original.plate_no) },
    { accessorKey: 'vehicle_class', header: 'Class', cell: ({ row }) => `${statusLabel(row.original.vehicle_class)} · ${row.original.type}` },
    { id: 'model', header: 'Make and model', cell: ({ row }) => [row.original.make, row.original.model, row.original.year].filter(Boolean).join(' ') || '—' },
    { accessorKey: 'seats', header: 'Seats' },
    { accessorKey: 'condition_grade', header: 'Condition', cell: ({ row }) => statusLabel(row.original.condition_grade ?? '-') },
    { accessorKey: 'open_issues', header: 'Issues', cell: ({ row }) => (row.original.open_issues ? h('span', { class: row.original.blocked ? 'font-medium text-error' : 'text-warning' }, `${row.original.open_issues}${row.original.blocked ? ' · off the road' : ''}`) : '—') },
    { accessorKey: 'insurance_expires_on', header: 'Insurance', cell: ({ row }) => expiry(row.original.insurance_expires_on) },
    { accessorKey: 'road_tax_expires_on', header: 'Road tax', cell: ({ row }) => expiry(row.original.road_tax_expires_on) },
    { accessorKey: 'jobs_30d', header: 'Jobs (30 days)' },
    { accessorKey: 'status', header: 'Status' },
    actionsColumn<Row>((row) => [
        { label: 'View', icon: 'i-bx-eye', onSelect: () => navigateTo(`/vehicles/${row.id}`) },
        ...(canWrite.value ? [{ label: 'Edit', icon: 'i-bx-edit', onSelect: () => open(row) }] : []),
        ...(canWrite.value && row.status !== 'retired' ? [{ label: 'Retire', icon: 'i-bx-trash', color: 'error' as const, onSelect: () => retire(row) }] : []),
    ]),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Vehicles"
        subject="vehicles"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        :can-export="false"
        @page="list.load"
    >
        <template #actions>
            <USelect v-model="type" :items="[{ label: 'All types', value: undefined }, { label: 'MPV', value: 'mpv' }, { label: 'Van', value: 'van' }, { label: 'Car', value: 'car' }]" class="w-32" />
            <USelect v-model="status" :items="[{ label: 'Active', value: 'active' }, { label: 'In service', value: 'in_service' }, { label: 'Retired', value: 'retired' }, { label: 'All', value: undefined }]" class="w-32" />
            <UButton v-if="canWrite" label="Add vehicle" icon="i-bx-plus" @click="open()" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" :title="editing ? `Edit ${editing.plate_no}` : 'Add Vehicle'" :saving="form.saving" :error="form.error" submit-label="Save Vehicle" @submit="save">
        <OpsFormField label="Plate" required :error="fieldError('plate_no')"><UInput v-model="form.data.plate_no" class="w-full uppercase" /></OpsFormField>
        <OpsFormField label="Type" required :error="fieldError('type')"><USelect v-model="form.data.type" :items="[{ label: 'MPV', value: 'mpv' }, { label: 'Van', value: 'van' }, { label: 'Car', value: 'car' }]" class="w-full" /></OpsFormField>
        <OpsFormField label="Class" required :error="fieldError('vehicle_class')"><USelect v-model="form.data.vehicle_class" :items="VEHICLE_CLASSES" class="w-full" /></OpsFormField>
        <OpsFormField label="Seats" :error="fieldError('seats')"><UInput v-model="form.data.seats" type="number" min="1" class="w-full" /></OpsFormField>
        <OpsFormField label="Make" :error="fieldError('make')"><UInput v-model="form.data.make" class="w-full" /></OpsFormField>
        <OpsFormField label="Model" :error="fieldError('model')"><UInput v-model="form.data.model" class="w-full" /></OpsFormField>
        <OpsFormField label="Year" :error="fieldError('year')"><UInput v-model="form.data.year" type="number" class="w-full" /></OpsFormField>
        <OpsFormField label="Colour" :error="fieldError('colour')"><UInput v-model="form.data.colour" class="w-full" /></OpsFormField>
        <OpsFormField label="Condition" :error="fieldError('condition_grade')">
            <USelect v-model="form.data.condition_grade" :items="[{ label: '—', value: undefined }, { label: 'New', value: 'new' }, { label: 'Good', value: 'good' }, { label: 'Fair', value: 'fair' }]" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Toll class" :error="fieldError('toll_class')"><USelect v-model="form.data.toll_class" :items="['1', '2', '3', '4', '5']" class="w-full" /></OpsFormField>
        <OpsFormField label="Status" :error="fieldError('status')"><USelect v-model="form.data.status" :items="[{ label: 'Active', value: 'active' }, { label: 'In service', value: 'in_service' }, { label: 'Retired', value: 'retired' }]" class="w-full" /></OpsFormField>
    </OpsFormModal>
</template>
