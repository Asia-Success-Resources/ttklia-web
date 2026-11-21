<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Fuel rates (doc 19, "Fuel limit"): the diesel price and litres per km behind van fuel limits, from a date. A new row
// whenever the price or the rates change; one that van trips used is kept as it was. GET/POST /fleet/fuel-rates,
// PATCH/DELETE …/{id}. Permission: fleet.fuel_rates.read / write (doc 27).
useHead({ title: 'Fuel rates' })

interface Row extends Record<string, unknown> {
    id: number
    valid_from: string
    diesel_sen_per_litre: number
    flat_litres_per_km: string
    uphill_litres_per_km: string
    downhill_litres_per_km: string
    hill_km: string
    in_use: boolean
}

const api = useFleetApi()
const toast = useToast()
const { can } = useMe()
const canWrite = computed(() => can('fleet.fuel_rates.write'))

const search = ref('')
const list = useApiList<Row>({ search, path: '/fleet/fuel-rates', workspaceScoped: true })
onMounted(() => list.load())
const reload = () => list.load(list.pagination.value?.current_page ?? 1)

const editing = ref<Row | null>(null)
const { form, fieldError, show, submit } = useFormModal(() => ({ valid_from: todayYmd(), diesel_rm: '', flat: '0.100', uphill: '0.200', downhill: '0.070', hill_km: '35' }))
function open(row?: Row) {
    editing.value = row ?? null
    show(row ? { valid_from: row.valid_from.slice(0, 10), diesel_rm: toRm(row.diesel_sen_per_litre), flat: row.flat_litres_per_km, uphill: row.uphill_litres_per_km, downhill: row.downhill_litres_per_km, hill_km: row.hill_km } : {})
}
async function save() {
    const saved = await submit(async (d) => {
        const body = { valid_from: d.valid_from, diesel_sen_per_litre: toSen(d.diesel_rm), flat_litres_per_km: Number(d.flat), uphill_litres_per_km: Number(d.uphill), downhill_litres_per_km: Number(d.downhill), hill_km: Number(d.hill_km) }
        if (editing.value) await api.patch(`/fleet/fuel-rates/${editing.value.id}`, body)
        else await api.post('/fleet/fuel-rates', body)
    })
    if (saved) {
        toast.add({ title: 'Fuel rate saved', color: 'success' })
        await reload()
    }
}
async function remove(row: Row) {
    if (!confirm(`Delete the rate from ${formatDate(row.valid_from)}?`)) return
    try {
        await api.del(`/fleet/fuel-rates/${row.id}`)
        toast.add({ title: 'Rate deleted', color: 'success' })
        await reload()
    } catch (e) {
        toast.add({ title: fleetError(e), color: 'error' })
    }
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'valid_from', header: 'From', cell: ({ row }) => h('span', { class: row.original.in_use ? 'font-semibold' : '' }, `${formatDate(row.original.valid_from)}${row.original.in_use ? ' (in use)' : ''}`) },
    { accessorKey: 'diesel_sen_per_litre', header: 'Diesel / litre', cell: ({ row }) => formatSen(row.original.diesel_sen_per_litre) },
    { accessorKey: 'flat_litres_per_km', header: 'Flat L/km' },
    { accessorKey: 'uphill_litres_per_km', header: 'Uphill L/km' },
    { accessorKey: 'downhill_litres_per_km', header: 'Downhill L/km' },
    { accessorKey: 'hill_km', header: 'Hill km' },
    actionsColumn<Row>((row) => (canWrite.value ? [
        { label: 'Edit', icon: 'i-bx-edit', onSelect: () => open(row) },
        { label: 'Delete', icon: 'i-bx-trash', color: 'error' as const, onSelect: () => remove(row) },
    ] : [])),
]
</script>

<template>
    <OpsListPage v-model:search="search" title="Fuel rates" subject="fuel rates" :rows="list.rows.value" :columns="columns" :loading="list.pending.value" :pagination="list.pagination.value" :can-export="false" @page="list.load">
        <template #actions><UButton v-if="canWrite" label="New rate" icon="i-bx-plus" @click="open()" /></template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" :title="editing ? 'Edit Fuel Rate' : 'New Fuel Rate'" :saving="form.saving" :error="form.error" submit-label="Save Rate" @submit="save">
        <OpsFormField label="From" required :error="fieldError('valid_from')"><UInput v-model="form.data.valid_from" type="date" class="w-full" /></OpsFormField>
        <OpsFormField label="Diesel per litre (RM)" required :error="fieldError('diesel_sen_per_litre')"><UInput v-model="form.data.diesel_rm" type="number" min="0" step="0.01" placeholder="4.47" class="w-full" /></OpsFormField>
        <OpsFormField label="Flat roads, litres per km" required :error="fieldError('flat_litres_per_km')"><UInput v-model="form.data.flat" type="number" min="0" step="0.001" class="w-full" /></OpsFormField>
        <OpsFormField label="Uphill, litres per km" required :error="fieldError('uphill_litres_per_km')"><UInput v-model="form.data.uphill" type="number" min="0" step="0.001" class="w-full" /></OpsFormField>
        <OpsFormField label="Downhill, litres per km" required :error="fieldError('downhill_litres_per_km')"><UInput v-model="form.data.downhill" type="number" min="0" step="0.001" class="w-full" /></OpsFormField>
        <OpsFormField label="Hill distance (km)" required :error="fieldError('hill_km')"><UInput v-model="form.data.hill_km" type="number" min="0" step="0.1" class="w-full" /></OpsFormField>
    </OpsFormModal>
</template>
