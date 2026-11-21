<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Maintenance: services done on the fleet's vehicles, newest first. A service's odometer reading moves the vehicle's
// odometer forward. GET/POST /fleet/maintenance, PATCH/DELETE …/{id}. Permission: fleet.vehicles_maintenance.read /
// write (doc 27).
useHead({ title: 'Maintenance' })

interface Row extends Record<string, unknown> {
    id: number
    vehicle_id: number
    plate_no: string
    done_on: string
    odometer_km: number
    vendor: string | null
    cost_sen: number | null
    notes: string | null
    task: string | null
}

const api = useFleetApi()
const toast = useToast()
const { can } = useMe()
const canWrite = computed(() => can('fleet.vehicles_maintenance.write'))
const options = useFleetOptions()

const search = ref('')
const from = ref('')
const to = ref('')
const list = useApiList<Row>({ search, path: '/fleet/maintenance', workspaceScoped: true, query: () => ({ from: from.value || undefined, to: to.value || undefined }) })
onMounted(() => list.load())
watch([from, to], () => list.load())
const reload = () => list.load(list.pagination.value?.current_page ?? 1)

const editing = ref<Row | null>(null)
const { form, fieldError, show, submit } = useFormModal(() => ({ vehicle_id: undefined as number | undefined, done_on: todayYmd(), odometer_km: '', vendor: '', cost_rm: '', notes: '' }))
function open(row?: Row) {
    editing.value = row ?? null
    options.vehicles.load()
    show(row ? { vehicle_id: row.vehicle_id, done_on: row.done_on, odometer_km: String(row.odometer_km), vendor: row.vendor ?? '', cost_rm: toRm(row.cost_sen), notes: row.notes ?? '' } : {})
}
async function save() {
    const saved = await submit(async (d) => {
        const body = { vehicle_id: d.vehicle_id, done_on: d.done_on, odometer_km: Number(d.odometer_km), vendor: d.vendor || null, cost_sen: toSen(d.cost_rm), notes: d.notes || null }
        if (editing.value) await api.patch(`/fleet/maintenance/${editing.value.id}`, body)
        else await api.post('/fleet/maintenance', body)
    })
    if (saved) {
        toast.add({ title: 'Service saved', color: 'success' })
        await reload()
    }
}
async function remove(row: Row) {
    if (!confirm(`Delete the service on ${row.plate_no} (${formatDate(row.done_on)})?`)) return
    try {
        await api.del(`/fleet/maintenance/${row.id}`)
        toast.add({ title: 'Service deleted', color: 'success' })
        await reload()
    } catch (e) {
        toast.add({ title: fleetError(e), color: 'error' })
    }
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'done_on', header: 'Date', cell: ({ row }) => formatDate(row.original.done_on) },
    { accessorKey: 'plate_no', header: 'Vehicle', cell: ({ row }) => h(resolveComponent('NuxtLink'), { to: `/vehicles/${row.original.vehicle_id}`, class: 'font-medium hover:underline' }, () => row.original.plate_no) },
    { accessorKey: 'odometer_km', header: 'Odometer', cell: ({ row }) => `${row.original.odometer_km.toLocaleString('en-MY')} km` },
    { accessorKey: 'vendor', header: 'Workshop' },
    { accessorKey: 'cost_sen', header: 'Cost', cell: ({ row }) => (row.original.cost_sen === null ? '—' : formatSen(row.original.cost_sen)) },
    { accessorKey: 'notes', header: 'Work done' },
    actionsColumn<Row>((row) => (canWrite.value ? [
        { label: 'Edit', icon: 'i-bx-edit', onSelect: () => open(row) },
        { label: 'Delete', icon: 'i-bx-trash', color: 'error' as const, onSelect: () => remove(row) },
    ] : [])),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Maintenance"
        subject="services"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        :can-export="false"
        @page="list.load"
    >
        <template #actions>
            <UInput v-model="from" type="date" class="w-40" />
            <UInput v-model="to" type="date" class="w-40" />
            <UButton v-if="canWrite" label="Add service" icon="i-bx-plus" @click="open()" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" :title="editing ? `Service on ${editing.plate_no}` : 'Add Service'" :saving="form.saving" :error="form.error" submit-label="Save Service" @submit="save">
        <OpsFormField label="Vehicle" required full :error="fieldError('vehicle_id')">
            <USelectMenu v-model="form.data.vehicle_id" :items="options.items.vehicles.value" value-key="value" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Date" required :error="fieldError('done_on')"><UInput v-model="form.data.done_on" type="date" class="w-full" /></OpsFormField>
        <OpsFormField label="Odometer (km)" required :error="fieldError('odometer_km')"><UInput v-model="form.data.odometer_km" type="number" min="0" class="w-full" /></OpsFormField>
        <OpsFormField label="Workshop" :error="fieldError('vendor')"><UInput v-model="form.data.vendor" class="w-full" /></OpsFormField>
        <OpsFormField label="Cost (RM)" :error="fieldError('cost_sen')"><UInput v-model="form.data.cost_rm" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
        <OpsFormField label="Work done" full :error="fieldError('notes')"><UTextarea v-model="form.data.notes" :rows="2" class="w-full" /></OpsFormField>
    </OpsFormModal>
</template>
