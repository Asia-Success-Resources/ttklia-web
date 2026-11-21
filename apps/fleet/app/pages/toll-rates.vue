<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Toll rates (doc 19, today's zone location tolls): the toll for each leg of a trip between a pickup point and a
// destination, by toll class (1 cars, 4 taxis). Van fuel costs add up the four legs. GET/POST /fleet/toll-rates,
// PATCH/DELETE …/{id}. Permission: fleet.toll_rates.read / write (doc 27).
useHead({ title: 'Toll rates' })

interface Row extends Record<string, unknown> {
    id: number
    pickup_poi_id: number
    destination_poi_id: number
    pickup_name: string | null
    pickup_code: string | null
    destination_name: string | null
    destination_code: string | null
    toll_class: number
    leg: string
    amount_sen: number
}

const LEGS = ['base_to_pickup', 'pickup_to_destination', 'destination_to_dropoff', 'dropoff_to_base'].map((l) => ({ label: statusLabel(l).replace(/ to /g, ' → '), value: l }))
const api = useFleetApi()
const toast = useToast()
const { can } = useMe()
const canWrite = computed(() => can('fleet.toll_rates.write'))
const options = useFleetOptions()

const search = ref('')
const tollClass = ref<string | undefined>(undefined)
const list = useApiList<Row>({ search, path: '/fleet/toll-rates', workspaceScoped: true, query: () => ({ toll_class: tollClass.value }) })
onMounted(() => list.load())
watch(tollClass, () => list.load())
const reload = () => list.load(list.pagination.value?.current_page ?? 1)

const editing = ref<Row | null>(null)
const { form, fieldError, show, submit } = useFormModal(() => ({ pickup_poi_id: undefined as number | undefined, destination_poi_id: undefined as number | undefined, toll_class: '1', leg: 'pickup_to_destination', amount_rm: '' }))
function open(row?: Row) {
    editing.value = row ?? null
    options.places.load()
    show(row ? { pickup_poi_id: row.pickup_poi_id, destination_poi_id: row.destination_poi_id, toll_class: String(row.toll_class), leg: row.leg, amount_rm: toRm(row.amount_sen) } : {})
}
async function save() {
    const saved = await submit(async (d) => {
        const body = { pickup_poi_id: d.pickup_poi_id, destination_poi_id: d.destination_poi_id, toll_class: Number(d.toll_class), leg: d.leg, amount_sen: toSen(d.amount_rm) }
        if (editing.value) await api.patch(`/fleet/toll-rates/${editing.value.id}`, body)
        else await api.post('/fleet/toll-rates', body)
    })
    if (saved) {
        toast.add({ title: 'Toll saved', color: 'success' })
        await reload()
    }
}
async function remove(row: Row) {
    if (!confirm('Delete this toll?')) return
    try {
        await api.del(`/fleet/toll-rates/${row.id}`)
        toast.add({ title: 'Toll deleted', color: 'success' })
        await reload()
    } catch (e) {
        toast.add({ title: fleetError(e), color: 'error' })
    }
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'pickup_name', header: 'Pickup point', cell: ({ row }) => row.original.pickup_code ?? row.original.pickup_name ?? '—' },
    { accessorKey: 'destination_name', header: 'Destination', cell: ({ row }) => row.original.destination_code ?? row.original.destination_name ?? '—' },
    { accessorKey: 'leg', header: 'Leg', cell: ({ row }) => LEGS.find((l) => l.value === row.original.leg)?.label ?? row.original.leg },
    { accessorKey: 'toll_class', header: 'Class' },
    { accessorKey: 'amount_sen', header: 'Toll', cell: ({ row }) => formatSen(row.original.amount_sen) },
    actionsColumn<Row>((row) => (canWrite.value ? [
        { label: 'Edit', icon: 'i-bx-edit', onSelect: () => open(row) },
        { label: 'Delete', icon: 'i-bx-trash', color: 'error' as const, onSelect: () => remove(row) },
    ] : [])),
]
</script>

<template>
    <OpsListPage v-model:search="search" title="Toll rates" subject="tolls" :rows="list.rows.value" :columns="columns" :loading="list.pending.value" :pagination="list.pagination.value" :can-export="false" @page="list.load">
        <template #actions>
            <USelect v-model="tollClass" :items="[{ label: 'All classes', value: undefined }, { label: 'Class 1 (cars)', value: '1' }, { label: 'Class 2', value: '2' }, { label: 'Class 4 (taxis)', value: '4' }]" class="w-40" />
            <UButton v-if="canWrite" label="Add toll" icon="i-bx-plus" @click="open()" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" :title="editing ? 'Edit Toll' : 'Add Toll'" :saving="form.saving" :error="form.error" submit-label="Save Toll" @submit="save">
        <OpsFormField label="Pickup point" required full :error="fieldError('pickup_poi_id')"><USelectMenu v-model="form.data.pickup_poi_id" :items="options.items.places.value" value-key="value" class="w-full" /></OpsFormField>
        <OpsFormField label="Destination" required full :error="fieldError('destination_poi_id')"><USelectMenu v-model="form.data.destination_poi_id" :items="options.items.places.value" value-key="value" class="w-full" /></OpsFormField>
        <OpsFormField label="Leg" required :error="fieldError('leg')"><USelect v-model="form.data.leg" :items="LEGS" class="w-full" /></OpsFormField>
        <OpsFormField label="Toll class" required :error="fieldError('toll_class')"><USelect v-model="form.data.toll_class" :items="['1', '2', '3', '4', '5']" class="w-full" /></OpsFormField>
        <OpsFormField label="Toll (RM)" required :error="fieldError('amount_sen')"><UInput v-model="form.data.amount_rm" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
    </OpsFormModal>
</template>
