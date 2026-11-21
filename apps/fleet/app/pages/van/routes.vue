<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Van routes (doc 19, the PICK UP POINT sheet): an area's pickup point, to Genting (or another destination) and back,
// paid per trip by the client (Genting) or per seat for public routes; with trips in the last 30 days. A route that has
// run is disabled rather than deleted. GET/POST /fleet/van-routes, PATCH/DELETE …/{id}. Permission:
// fleet.van_routes.read / write (doc 27).
useHead({ title: 'Van routes' })

interface Row extends Record<string, unknown> {
    id: number
    code: string
    name: string
    region: string
    pickup_poi_id: number
    destination_poi_id: number
    client_organisation_id: number | null
    pickup_name: string | null
    destination_name: string | null
    destination_code: string | null
    client_name: string | null
    billing: string
    trip_price_sen: number | null
    seat_fare_sen: number | null
    seats: number
    status: string
    trips_30d: number
}

const api = useFleetApi()
const toast = useToast()
const { can } = useMe()
const canWrite = computed(() => can('fleet.van_routes.write'))
const options = useFleetOptions()

const search = ref('')
const region = ref<string | undefined>(undefined)
const status = ref<string | undefined>('active')
const list = useApiList<Row>({ search, path: '/fleet/van-routes', workspaceScoped: true, query: () => ({ region: region.value, status: status.value }) })
onMounted(() => list.load())
watch([region, status], () => list.load())
const reload = () => list.load(list.pagination.value?.current_page ?? 1)

const REGIONS = [{ label: 'Klang Valley', value: 'klang_valley' }, { label: 'Outside Klang Valley', value: 'outside_klang_valley' }]
const editing = ref<Row | null>(null)
const { form, fieldError, show, submit } = useFormModal(() => ({
    code: '', name: '', region: 'klang_valley', pickup_poi_id: undefined as number | undefined, destination_poi_id: undefined as number | undefined,
    client_organisation_id: undefined as number | undefined, billing: 'per_trip', trip_rm: '', seat_rm: '', seats: '12', status: 'active',
}))
function open(row?: Row) {
    editing.value = row ?? null
    options.places.load()
    options.clients.load()
    show(row ? {
        code: row.code, name: row.name, region: row.region, pickup_poi_id: row.pickup_poi_id, destination_poi_id: row.destination_poi_id,
        client_organisation_id: row.client_organisation_id ?? undefined, billing: row.billing, trip_rm: toRm(row.trip_price_sen), seat_rm: toRm(row.seat_fare_sen), seats: String(row.seats), status: row.status,
    } : {})
}
async function save() {
    const saved = await submit(async (d) => {
        const body = {
            code: d.code, name: d.name, region: d.region, pickup_poi_id: d.pickup_poi_id, destination_poi_id: d.destination_poi_id,
            client_organisation_id: d.client_organisation_id ?? null, billing: d.billing, trip_price_sen: toSen(d.trip_rm), seat_fare_sen: toSen(d.seat_rm),
            seats: Number(d.seats), status: d.status,
        }
        if (editing.value) await api.patch(`/fleet/van-routes/${editing.value.id}`, body)
        else await api.post('/fleet/van-routes', body)
    })
    if (saved) {
        toast.add({ title: `${form.data.name} saved`, color: 'success' })
        await reload()
    }
}
async function remove(row: Row) {
    if (!confirm(`Remove ${row.name}? A route that has run is disabled instead.`)) return
    try {
        const res = await api.del<{ data: { result: string } }>(`/fleet/van-routes/${row.id}`)
        toast.add({ title: `${row.name} ${res.data.result}`, color: 'success' })
        await reload()
    } catch (e) {
        toast.add({ title: fleetError(e), color: 'error' })
    }
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'name', header: 'Area' },
    { accessorKey: 'pickup_name', header: 'Pickup point' },
    { accessorKey: 'destination_name', header: 'Destination', cell: ({ row }) => row.original.destination_code ?? row.original.destination_name ?? '—' },
    { accessorKey: 'region', header: 'Region', cell: ({ row }) => statusLabel(row.original.region) },
    { accessorKey: 'client_name', header: 'Client' },
    { id: 'price', header: 'Price', cell: ({ row }) => (row.original.billing === 'per_trip' ? `${formatSen(row.original.trip_price_sen ?? 0)} / trip` : `${formatSen(row.original.seat_fare_sen ?? 0)} / seat`) },
    { accessorKey: 'seats', header: 'Seats' },
    { accessorKey: 'trips_30d', header: 'Trips (30 days)' },
    { accessorKey: 'status', header: 'Status' },
    actionsColumn<Row>((row) => (canWrite.value ? [
        { label: 'Edit', icon: 'i-bx-edit', onSelect: () => open(row) },
        { label: 'Roster', icon: 'i-bx-calendar', onSelect: () => navigateTo(`/van/rosters?route=${row.id}`) },
        ...(row.status === 'active' ? [{ label: 'Remove', icon: 'i-bx-trash', color: 'error' as const, onSelect: () => remove(row) }] : []),
    ] : [])),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Van routes"
        subject="van routes"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        :can-export="false"
        @page="list.load"
    >
        <template #actions>
            <USelect v-model="region" :items="[{ label: 'All regions', value: undefined }, ...REGIONS]" class="w-48" />
            <USelect v-model="status" :items="[{ label: 'Active', value: 'active' }, { label: 'Disabled', value: 'disabled' }, { label: 'All', value: undefined }]" class="w-32" />
            <UButton v-if="canWrite" label="Add route" icon="i-bx-plus" @click="open()" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" :title="editing ? `Edit ${editing.name}` : 'Add Van Route'" :saving="form.saving" :error="form.error" submit-label="Save Route" @submit="save">
        <OpsFormField label="Code" required :error="fieldError('code')"><UInput v-model="form.data.code" class="w-full uppercase" /></OpsFormField>
        <OpsFormField label="Area (as staff say it)" required :error="fieldError('name')"><UInput v-model="form.data.name" placeholder="KEPONG" class="w-full" /></OpsFormField>
        <OpsFormField label="Pickup point" required full :error="fieldError('pickup_poi_id')">
            <USelectMenu v-model="form.data.pickup_poi_id" :items="options.items.places.value" value-key="value" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Destination" required full :error="fieldError('destination_poi_id')">
            <USelectMenu v-model="form.data.destination_poi_id" :items="options.items.places.value" value-key="value" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Region" required :error="fieldError('region')"><USelect v-model="form.data.region" :items="REGIONS" class="w-full" /></OpsFormField>
        <OpsFormField label="Client" :error="fieldError('client_organisation_id')">
            <USelectMenu v-model="form.data.client_organisation_id" :items="[{ label: 'Public (per seat)', value: undefined }, ...options.items.clients.value]" value-key="value" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Billing" required :error="fieldError('billing')"><USelect v-model="form.data.billing" :items="[{ label: 'Per trip (client pays)', value: 'per_trip' }, { label: 'Per seat (passengers pay)', value: 'per_seat' }]" class="w-full" /></OpsFormField>
        <OpsFormField v-if="form.data.billing === 'per_trip'" label="Trip price (RM)" required :error="fieldError('trip_price_sen')"><UInput v-model="form.data.trip_rm" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
        <OpsFormField v-else label="Seat fare (RM)" required :error="fieldError('seat_fare_sen')"><UInput v-model="form.data.seat_rm" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
        <OpsFormField label="Seats" required :error="fieldError('seats')"><UInput v-model="form.data.seats" type="number" min="1" class="w-full" /></OpsFormField>
        <OpsFormField label="Status" :error="fieldError('status')"><USelect v-model="form.data.status" :items="[{ label: 'Active', value: 'active' }, { label: 'Disabled', value: 'disabled' }]" class="w-full" /></OpsFormField>
    </OpsFormModal>
</template>
